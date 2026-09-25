/* ---------------------------------------------------------------
   Bremse gegen Massen-Einsendungen, OHNE Datenbank.

   Hintergrund (Entscheidung vom 25.09.2026): Vor einer erfolgreichen
   Zahlung darf in der VERA-Datenbank nichts gespeichert werden — auch
   keine Zeile der Bremse. Die bisherige Bremse (lib/ratelimit.ts →
   Tabelle AnmeldeVersuch) schrieb bei jedem Absenden die IP-Adresse
   weg. Für den Anmeldeweg tritt diese Datei an ihre Stelle.

   Die Zähler stehen im Arbeitsspeicher und sind nach einem Neustart
   weg. Das ist ausdrücklich gewollt und kein Versehen: Nichts landet
   auf der Festplatte, nichts muss aufgeräumt werden, nichts gehört in
   ein Löschkonzept.

   ── Was das kostet, und was davor steht ─────────────────────────

   Ein Zähler im Arbeitsspeicher hat zwei bekannte Schwächen: Er
   vergisst bei jedem Neustart, und er gilt JE PROZESS. Am 25.09.2026
   wurde auf dem Server geprüft, dass vera.service mit genau EINEM
   Node-Prozess läuft — die zweite Schwäche greift heute also nicht.
   Käme je ein zweiter Arbeiter dazu (ein Prozessmanager, ein
   Cluster-Betrieb, eine zweite Instanz hinter demselben Nginx), würde
   sich das erlaubte Maß stillschweigend vervielfachen, ohne dass
   irgendwo etwas rot wird. WER DEN DIENST UMSTELLT, MUSS HIER
   NACHSEHEN.

   Beide Schwächen fängt die Schicht davor ab: Nginx bremst nach
   IP-Adresse, bevor eine Anfrage die Anwendung überhaupt erreicht
   (server/vera-bremse.conf). Diese Datei deckt ab, was Nginx nicht
   sehen kann — etwa eine Zählung je E-Mail-Adresse und Veranstaltung.

   ── Warum kein Aufräumlauf ──────────────────────────────────────

   Es gibt keinen. Bei jedem Zugriff werden die Zeitpunkte des
   betroffenen Schlüssels auf das Zeitfenster gekürzt, und wenn die
   Karte zu groß wird, fliegen die ältesten Schlüssel heraus. Ein
   Zeitplan, der aufräumt, wäre eine zweite bewegliche Sache, die
   ausfallen kann.
   --------------------------------------------------------------- */

/** Wie viele Versuche je Schlüssel im Zeitfenster erlaubt sind. */
export const MAX_VERSUCHE = 5;

/** Länge des Zeitfensters in Minuten. */
export const FENSTER_MINUTEN = 60;

/**
 * Wie viele verschiedene Schlüssel die Karte höchstens hält.
 *
 * Die Obergrenze ist der Schutz der Bremse vor sich selbst: Ohne sie
 * könnte jemand mit vielen verschiedenen Adressen den Speicher
 * volllaufen lassen — die Bremse wäre dann selbst der Angriffsweg.
 * 10.000 Einträge sind wenige hundert Kilobyte und um Größenordnungen
 * mehr, als ein ehrlicher Betrieb je gleichzeitig braucht.
 */
export const MAX_SCHLUESSEL = 10_000;

/** Die Karte: Schlüssel → Zeitpunkte der zugelassenen Versuche. */
const karte = new Map<string, number[]>();

/**
 * Zählt einen Versuch und meldet, ob er noch erlaubt ist.
 *
 * Gezählt werden NUR ZUGELASSENE Versuche — genauso wie in
 * lib/ratelimit.ts. Würde ein abgewiesener Versuch mitzählen,
 * verlängerte jeder weitere Klick die Sperre, und wer einmal zu oft
 * getippt hat, käme eine Stunde lang nicht mehr hinein.
 */
export function versuchErlaubt(
  schluessel: string,
  max: number = MAX_VERSUCHE,
  fensterMinuten: number = FENSTER_MINUTEN,
  jetzt: number = Date.now(),
): boolean {
  const grenze = jetzt - fensterMinuten * 60_000;

  const bisher = (karte.get(schluessel) ?? []).filter((t) => t > grenze);

  if (bisher.length >= max) {
    /* Auch im abgewiesenen Fall den gekürzten Stand zurückschreiben:
       Sonst wüchse die Liste eines hartnäckigen Absenders unbegrenzt,
       obwohl alle alten Einträge längst aus dem Fenster gefallen
       sind. */
    karte.set(schluessel, bisher);
    return false;
  }

  bisher.push(jetzt);
  karte.set(schluessel, bisher);

  if (karte.size > MAX_SCHLUESSEL) aeltesteEntfernen(jetzt);

  return true;
}

/**
 * Platz schaffen, wenn die Karte zu groß wird.
 *
 * Zuerst fliegt heraus, was ohnehin abgelaufen ist. Reicht das nicht,
 * fliegen die Schlüssel mit dem ältesten letzten Versuch heraus — wer
 * gerade aktiv ist, bleibt also stehen. Ein Angreifer könnte dadurch
 * fremde Zähler verdrängen; das ist der bewusst gewählte kleinere
 * Schaden gegenüber einem Speicher, der vollläuft. Nginx bremst ihn
 * ohnehin schon davor.
 */
function aeltesteEntfernen(jetzt: number): void {
  const grenze = jetzt - FENSTER_MINUTEN * 60_000;

  for (const [schluessel, zeiten] of karte) {
    const uebrig = zeiten.filter((t) => t > grenze);
    if (uebrig.length === 0) karte.delete(schluessel);
    else karte.set(schluessel, uebrig);
  }
  if (karte.size <= MAX_SCHLUESSEL) return;

  const nachAlter = [...karte.entries()].sort(
    (a, b) => Math.max(...a[1]) - Math.max(...b[1]),
  );
  const zuViel = karte.size - MAX_SCHLUESSEL;
  for (let i = 0; i < zuViel; i++) karte.delete(nachAlter[i][0]);
}

/**
 * Alles vergessen.
 *
 * Nur für Prüflisten. Im Betrieb gibt es keinen Grund dafür — ein
 * Neustart erledigt dasselbe.
 */
export function bremseLeeren(): void {
  karte.clear();
}

/** Wie viele Schlüssel die Karte gerade hält. Nur für Prüflisten. */
export function bremseGroesse(): number {
  return karte.size;
}
