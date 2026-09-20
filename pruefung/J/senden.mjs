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
/* ── Die beiden Pflichthaken als Voreinstellung ─────────────────
   Seit Bauauftrag B-29 (AGB, § 305 Abs. 2 BGB) und B-17
   (Kenntnisnahme zu Aufnahmen, Art. 7 Abs. 4 DS-GVO) lehnt der Server
   jede Anmeldung ohne diese beiden Häkchen ab — und zwar zu Recht.

   Sie stehen hier als VOREINSTELLUNG, damit die Listen, die etwas
   ganz anderes prüfen (Preise, Plätze, Zahlung, Storno), nicht alle
   an derselben Stelle scheitern. Das ist eine Anpassung der Prüfung
   an die neue Regel, KEINE Abschwächung: Die Haken selbst prüft
   Liste V eigens, samt der Fälle, in denen sie fehlen — und ein
   Aufruf kann sie hier jederzeit mit `agbAkzeptiert: ""`
   überschreiben. */
const PFLICHTHAKEN = { agbAkzeptiert: "an", kenntnisAufnahmen: "an" };

export async function absenden(werte, ip = "203.0.113.1") {
  const felder = await actionFelder();
  const daten = new FormData();
  for (const [k, v] of Object.entries(felder)) daten.append(k, v);
  for (const [k, v] of Object.entries({ ...PFLICHTHAKEN, ...werte })) {
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
