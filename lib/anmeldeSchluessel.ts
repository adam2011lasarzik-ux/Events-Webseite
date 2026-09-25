/* ---------------------------------------------------------------
   Den Schlüsselbund aus der Umgebung holen.

   Getrennt von lib/anmeldeNutzlast.ts, damit die Ver- und
   Entschlüsselung eine reine Funktion bleibt: Sie bekommt einen
   Schlüsselbund gereicht und liest ihn nicht selbst. Nur so lässt sie
   sich ohne gesetzte Umgebung prüfen — und nur so kann eine Prüfliste
   den Schlüsselwechsel nachstellen, ohne Umgebungsvariablen zu
   verbiegen.

   ── Warum zwei Variablen ────────────────────────────────────────

     ANMELDUNG_SCHLUESSEL       verschlüsselt und schliesst auf
     ANMELDUNG_SCHLUESSEL_ALT   schliesst nur noch auf

   Ein Wechsel läuft damit ohne Ausfall: Der bisherige Wert wandert
   nach …_ALT, der neue kommt nach ANMELDUNG_SCHLUESSEL, der Dienst
   wird neu gestartet. Marken, die noch mit dem alten Schlüssel
   unterwegs sind, lassen sich weiter öffnen; neue entstehen nur mit
   dem neuen. Nach 24 Stunden — der längsten Lebensdauer einer
   Bezahlseite beim Anbieter — kann …_ALT entfernt werden.

   ⚠️ DIESER SCHLÜSSEL DARF NICHT VERLOREN GEHEN. Zwischen dem
   Absenden des Formulars und der bestätigten Zahlung liegen die
   Anmeldedaten ausschliesslich verschlüsselt beim Zahlungsanbieter.
   Geht der Schlüssel in dieser Zeit verloren, ist das Geld da und die
   Anmeldung unlesbar. Er gehört deshalb in die verschlüsselte
   Sicherung, und `npm run zahlung:pruefen` prüft, dass er gesetzt und
   brauchbar ist.
   --------------------------------------------------------------- */

import { alsSchluessel, type Schluesselbund } from "./anmeldeNutzlast";

/** Wird geworfen, wenn die Umgebung keinen brauchbaren Schlüssel hergibt. */
export class SchluesselFehlt extends Error {
  constructor(hinweis: string) {
    super(hinweis);
    this.name = "SchluesselFehlt";
  }
}

/** Wie lang ein Schlüssel sein muss — AES-256 braucht 32 Byte. */
export const SCHLUESSEL_BYTES = 32;

/**
 * Einen Wert aus der Umgebung in Schlüsselbytes verwandeln.
 *
 * Erwartet wird base64. Ein Schlüssel als lesbarer Satz wäre
 * verlockend und falsch: 32 Byte Zufall haben 256 Bit Stärke, ein
 * Merksatz vielleicht 40. Deshalb wird die Länge geprüft und nicht
 * etwa aus dem Text ein Schlüssel „abgeleitet" — das würde ein
 * schwaches Geheimnis stark aussehen lassen.
 */
export function bytesAusText(wert: string, name: string) {
  const roh = Buffer.from(wert.trim(), "base64");
  if (roh.length !== SCHLUESSEL_BYTES) {
    throw new SchluesselFehlt(
      `${name} muss ${SCHLUESSEL_BYTES} Byte als base64 enthalten (also 44 Zeichen), ` +
        `gefunden sind ${roh.length} Byte. Neu erzeugen mit: ` +
        `openssl rand -base64 ${SCHLUESSEL_BYTES}`,
    );
  }
  return alsSchluessel(roh);
}

/**
 * Der Schlüsselbund, wie ihn die Umgebung vorgibt.
 *
 * Wird bei jedem Aufruf neu gelesen und NICHT zwischengespeichert.
 * Das kostet nichts (zwei kurze base64-Umwandlungen) und erspart die
 * Falle, dass ein Dienst nach einem Wechsel noch den alten Bund im
 * Speicher hält, obwohl die Umgebung längst einen neuen nennt.
 */
export function schluesselbund(): Schluesselbund {
  const aktuellRoh = process.env.ANMELDUNG_SCHLUESSEL;
  if (!aktuellRoh || aktuellRoh.trim() === "") {
    throw new SchluesselFehlt(
      "ANMELDUNG_SCHLUESSEL ist nicht gesetzt. In der Entwicklung steht der Wert in .env, " +
        "im Livebetrieb in den Umgebungsvariablen des Servers. Vorlage: .env.example",
    );
  }
  const aktuell = bytesAusText(aktuellRoh, "ANMELDUNG_SCHLUESSEL");

  const altRoh = process.env.ANMELDUNG_SCHLUESSEL_ALT;
  const weitere = [];
  if (altRoh && altRoh.trim() !== "") {
    const alt = bytesAusText(altRoh, "ANMELDUNG_SCHLUESSEL_ALT");
    /* Derselbe Schlüssel zweimal ist kein Fehler, aber auch kein
       Wechsel — er würde nur die Kennungsliste verdoppeln. Still
       überspringen und nicht abbrechen: Es passiert genau dann, wenn
       jemand den Wechsel zur Hälfte gemacht hat, und dann soll die
       Seite laufen und nicht stehen. */
    if (alt.kennung !== aktuell.kennung) weitere.push(alt);
  }

  return { aktuell, weitere };
}
