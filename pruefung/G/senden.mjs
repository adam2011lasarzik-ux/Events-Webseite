/* Hilfsmittel: sendet ein echtes Formular an die Server Action,
   genau wie ein Browser ohne JavaScript es täte. */
export const BASIS = "http://127.0.0.1:3213";
/* Die Anmeldung liegt seit dem Theme-Umbau unter der Veranstaltung.
   /anmeldung ohne Slug leitet nur noch weiter. */
export const ANMELDEPFAD = "/events/padel-falkensee/anmeldung";

let refs = null;

/** Holt die versteckten Felder frisch aus der ausgelieferten Seite. */
export async function actionFelder() {
  if (refs) return refs;
  const html = await (await fetch(`${BASIS}${ANMELDEPFAD}`)).text();
  const feld = (name) => {
    const m = html.match(
      new RegExp(`<input type="hidden" name="\\${name}"(?: value="([^"]*)")?/>`),
    );
    if (!m) throw new Error(`Feld ${name} nicht gefunden`);
    return (m[1] ?? "").replace(/&quot;/g, '"');
  };
  refs = {
    "$ACTION_REF_1": feld("$ACTION_REF_1"),
    "$ACTION_1:0": feld("$ACTION_1:0"),
    "$ACTION_1:1": feld("$ACTION_1:1"),
    "$ACTION_KEY": feld("$ACTION_KEY"),
  };
  return refs;
}

/**
 * @param {object} werte  Formularfelder
 * @param {string} ip     vorgetäuschte Absender-Adresse (für die Bremse)
 */
/**
 * Voreinstellung: bei JEDEM Absenden eine andere Adresse.
 *
 * Bis zum 26.09.2026 stand hier fest `203.0.113.1`. Das ging, solange
 * die Bremse gegen Massen-Einsendungen in der Datenbank zählte —
 * `leeren.mjs` setzte sie vor jeder Liste zurück. Seit sie im
 * Arbeitsspeicher des Servers zählt (fünf Versuche je Stunde und
 * Adresse, Entscheidung: kein Datenbankeintrag vor der Zahlung),
 * erreicht `leeren.mjs` sie nicht mehr.
 *
 * Damit schickten im Sammellauf ein Dutzend Listen nacheinander von
 * derselben Adresse — und irgendwann war der Zähler voll. Welche
 * Liste dann scheiterte, hing vom Zufall ab: mal eine Zahlungsliste,
 * mal der Bild-Upload, mal der Adminzugang. Ein Prüfwerkzeug, das bei
 * jedem Lauf woanders umfällt, kostet mehr Zeit, als es einbringt.
 *
 * 198.18.0.0/15 ist für Messungen reserviert und gehört niemandem.
 */
const zufaelligeAdresse = () =>
  `198.18.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 254) + 1}`;

export async function absenden(werte, ip = zufaelligeAdresse()) {
  const felder = await actionFelder();
  const daten = new FormData();
  for (const [k, v] of Object.entries(felder)) daten.append(k, v);
  /* Die beiden Pflichthaken als Voreinstellung — siehe die
     ausführliche Begründung in pruefung/E/senden.mjs. Kurz: Seit
     B-29 und B-17 lehnt der Server ohne sie ab; das ist eine
     Anpassung der Prüfung an die neue Regel, keine Abschwächung.
     Liste V prüft die Haken eigens, auch ihr Fehlen. */
  for (const [k, v] of Object.entries({
    agbAkzeptiert: "an",
    kenntnisAufnahmen: "an",
    ...werte,
  })) {
    daten.append(k, String(v));
  }

  const antwort = await fetch(`${BASIS}${ANMELDEPFAD}`, {
    method: "POST",
    body: daten,
    redirect: "manual",
    headers: { "x-forwarded-for": ip },
  });

  const text = await antwort.text();
  const ziel = antwort.headers.get("x-action-redirect") ?? antwort.headers.get("location");
  return { status: antwort.status, ziel, text };
}

/** Baut die Personen-Felder für n Gruppen. */
export function personen(liste) {
  const raus = {};
  liste.forEach((p, i) => {
    raus[`person.${i}.vorname`] = p.vorname ?? "";
    raus[`person.${i}.nachname`] = p.nachname ?? "";
    if (p.email !== undefined) raus[`person.${i}.email`] = p.email;
    if (p.telefon !== undefined) raus[`person.${i}.telefon`] = p.telefon;
  });
  return raus;
}
