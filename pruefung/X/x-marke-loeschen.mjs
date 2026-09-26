/* ---------------------------------------------------------------
   Die verschlüsselte Anmeldung wieder aus der Bezahlseite entfernen.

   Zwischen dem Absenden und der bestätigten Zahlung liegen die
   Anmeldedaten verschlüsselt beim Zahlungsanbieter. Danach werden sie
   dort nicht mehr gebraucht — und was nicht gebraucht wird, hat bei
   einem Dritten nichts zu suchen.

   ── Was am 26.09.2026 gegen die echte Schnittstelle gemessen wurde ──

   Zwei Dinge, beide belegt und beide hier nachgebaut:

     1. Ein LEERER Wert entfernt den Schlüssel vollständig. Zurück
        kommt nicht `""`, sondern gar kein Feld mehr.
     2. Auch eine VERFALLENE Bezahlseite lässt sich noch ändern.

   ── Die eigentliche Gefahr ──────────────────────────────────────

   Nicht das Löschen selbst, sondern zu FRÜH zu löschen. Die Marke ist
   zwischen Zahlungseingang und Anmeldung die einzige Kopie der
   Anmeldedaten. Wer sie entfernt, solange sie noch gebraucht wird,
   lässt Geld ohne jede Zuordnung stehen.

   Deshalb prüft diese Liste vor allem die Fälle, in denen NICHT
   gelöscht werden darf.

   Voraussetzungen: Datenbank, Attrappe auf 4242, Server auf 3213. */
/* Riegel vor der echten Datenbank — siehe pruefung/schutz.mjs. */
import "../schutz.mjs";

import { spawn } from "node:child_process";

import { absenden, personen, BASIS } from "../K/senden.mjs";
import { alsText } from "../K/admin-senden.mjs";
import * as zw from "../zahlweg.mjs";
import { neueAbsenderAdresse } from "../zahlweg.mjs";
import { db } from "../../lib/db.js";
import { markeDarfWeg, MARKE_SCHONFRIST_MS } from "../../lib/zahlungRegeln.ts";
import { markeFelder } from "../../lib/zahlung.ts";

let n = 0; const schief = [];
const pruefe = (name, ok, zusatz = "") => {
  n += 1;
  console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
};
/* Jede Adresse nur einmal — siehe pruefung/zahlweg.mjs,
   `neueAbsenderAdresse`. */
const neueIp = neueAbsenderAdresse;

/**
 * Den echten Abgleichlauf als eigenen Prozess starten.
 *
 * Bewusst das Skript selbst und keine nachgebaute Schleife: Geprüft
 * werden soll, was stündlich wirklich läuft — samt seiner Ausgabe,
 * seiner Zählweise und seiner Vorschau-Sperre.
 */
function abgleichLaufen(echt, erlaubt = [0, 2]) {
  return new Promise((fertig, schief) => {
    const lauf = spawn(
      "npx",
      ["tsx", "--env-file=.env", "prisma/zahlungAbgleich.ts", ...(echt ? ["--echt"] : [])],
      { env: process.env },
    );
    let ausgabe = "";
    lauf.stdout.on("data", (d) => (ausgabe += d));
    lauf.stderr.on("data", (d) => (ausgabe += d));
    /* Exitcode 2 heisst „etwas liegt zur Klärung" und ist kein
       Fehlschlag des Laufs. Nur ein Absturz (1) ist einer. */
    lauf.on("close", (code) =>
      erlaubt.includes(code) ? fertig(ausgabe) : schief(new Error(`Exitcode ${code}\n${ausgabe}`)),
    );
  });
}

const letzteZeilen = (t) =>
  t.trim().split("\n").filter((z) => z.includes("Marken")).join(" | ").slice(0, 90);

const rueckmeldung = (sitzung, art, kennung) => zw.rueckmeldung(BASIS, sitzung, art, kennung);
const ATTRAPPE = "http://127.0.0.1:4242";

async function aufraeumen() {
  await db.participant.deleteMany({});
  await db.registration.deleteMany({});
  await db.anmeldeVersuch.deleteMany({});
  await db.zahlungsEreignis.deleteMany({});
  await db.fehlbuchung.deleteMany({});
}

const einzel = (email) => ({
  eventSlug: "padel-falkensee", weg: "selbst", selbstAls: "student",
  schueler: 1, erwachsene: 0, webseite: "",
  ...personen([{ vorname: "Marke", nachname: "Weg", email, telefon: "" }]),
});

/* ══ X4.1 · Die reine Regel ══════════════════════════════════════ */
console.log("\nX4.1 · Wann eine Marke weg darf — die Regel allein");

const lage = (zusatz) => ({
  hatMarke: true, status: "complete", bezahlt: true, verbucht: true,
  alterMs: MARKE_SCHONFRIST_MS, ...zusatz,
});

pruefe("Ohne Marke gibt es nichts zu löschen",
  markeDarfWeg(lage({ hatMarke: false })) === false);

/* Der wichtigste Fall: Eine offene Bezahlseite behält ihre Marke.
   Ohne sie könnte aus der gleich eintreffenden Zahlung keine
   Anmeldung mehr werden. */
pruefe("Eine OFFENE Bezahlseite behält ihre Marke — immer",
  markeDarfWeg(lage({ status: "open", bezahlt: false, verbucht: false })) === false);
pruefe("… auch wenn sie uralt ist",
  markeDarfWeg(lage({ status: "open", alterMs: 99 * MARKE_SCHONFRIST_MS })) === false);

/* Der zweitwichtigste: bezahlt, aber bei uns noch nicht verbucht.
   Genau daraus legt der Abgleichlauf die Anmeldung noch an. */
pruefe("Bezahlt, aber NICHT verbucht: die Marke bleibt",
  markeDarfWeg(lage({ verbucht: false })) === false);
pruefe("… auch nach Tagen", markeDarfWeg(lage({ verbucht: false, alterMs: 9e9 })) === false);

pruefe("Bezahlt und verbucht, aber noch keine 24 Stunden alt: die Marke bleibt",
  markeDarfWeg(lage({ alterMs: MARKE_SCHONFRIST_MS - 1000 })) === false);
pruefe("Bezahlt, verbucht und älter als 24 Stunden: die Marke darf weg",
  markeDarfWeg(lage({ alterMs: MARKE_SCHONFRIST_MS })) === true);

pruefe("Nicht bezahlt und nicht mehr offen: die Marke darf sofort weg",
  markeDarfWeg(lage({ status: "expired", bezahlt: false, verbucht: false, alterMs: 0 })) === true);

pruefe("Die Schonfrist ist genau die Haltbarkeit der Marke",
  MARKE_SCHONFRIST_MS === 24 * 60 * 60 * 1000, `${MARKE_SCHONFRIST_MS} ms`);

/* ══ X4.2 · Welche Felder angefasst werden ═══════════════════════ */
console.log("\nX4.2 · Nur die Marke, nichts sonst");

pruefe("Erkannt werden marke_teile und die nummerierten Stücke",
  JSON.stringify(markeFelder({ event: "e", marke_teile: "2", marke_1: "a", marke_2: "b" }).sort())
    === JSON.stringify(["marke_1", "marke_2", "marke_teile"]));
pruefe("Die Veranstaltungskennung gehört NICHT dazu",
  !markeFelder({ event: "e", marke_1: "a" }).includes("event"));
pruefe("Ein Rest ohne marke_teile wird trotzdem erkannt",
  JSON.stringify(markeFelder({ event: "e", marke_3: "c" })) === JSON.stringify(["marke_3"]));
pruefe("Ohne Metadaten: nichts", markeFelder(null).length === 0);

/* ══ X4.3 · Abbruch räumt sofort auf ═════════════════════════════ */
console.log("\nX4.3 · Nach dem Abbruch ist die Marke fort");
await aufraeumen();
{
  const antwort = await absenden(einzel("abbruch-marke@example.org"), neueIp());
  const sitzungId = zw.sitzungAusZiel(antwort.ziel);
  if (!sitzungId) throw new Error("keine Bezahlseite");

  const vorher = await zw.holeSitzung(sitzungId);
  pruefe("Vor dem Abbruch trägt die Bezahlseite die Marke",
    markeFelder(vorher.metadata).length > 0,
    `${markeFelder(vorher.metadata).length} Felder`);

  /* Erst wirklich verfallen lassen, dann melden — in dieser
     Reihenfolge tut es der echte Anbieter auch. Nur die Meldung zu
     schicken, ohne die Sitzung zu schliessen, prüfte einen Zustand,
     den es nicht gibt: Der Server holt sie frisch und sähe sie
     weiterhin als offen. */
  const verfallene = await zw.verfallen(sitzungId);
  await rueckmeldung(verfallene, "checkout.session.expired");

  const nachher = await zw.holeSitzung(sitzungId);
  pruefe("Nach dem Verfall ist sie fort", markeFelder(nachher.metadata).length === 0,
    JSON.stringify(nachher.metadata));
  pruefe("… die Veranstaltungskennung steht aber noch da",
    nachher.metadata.event !== undefined, JSON.stringify(nachher.metadata));
  pruefe("… und es ist weiterhin keine Anmeldung entstanden",
    (await db.registration.count()) === 0);

  /* Wiederholbar: dieselbe Meldung noch einmal ändert nichts und
     wirft nichts. */
  const nochmal = await rueckmeldung(nachher, "checkout.session.expired");
  pruefe("Ein zweites Aufräumen wird freundlich quittiert", nochmal.status === 200);
  pruefe("… und ändert nichts",
    markeFelder((await zw.holeSitzung(sitzungId)).metadata).length === 0);
}

/* ══ X4.4 · Die bezahlte Sitzung wird NICHT sofort geleert ═══════ */
console.log("\nX4.4 · Nach der Zahlung bleibt die Marke zunächst stehen");
await aufraeumen();
{
  const antwort = await absenden(einzel("bezahlt-marke@example.org"), neueIp());
  const sitzungId = zw.sitzungAusZiel(antwort.ziel);
  await rueckmeldung(await zw.bezahlen(sitzungId));

  pruefe("Die Anmeldung ist entstanden",
    (await db.registration.count({ where: { kontaktEmail: "bezahlt-marke@example.org" } })) === 1);

  /* Das ist Absicht und keine Nachlässigkeit: Solange die Marke
     brauchbar ist, ist sie der einzige Weg, diese Buchung nach dem
     Einspielen einer Sicherung wiederherzustellen. Der stündliche
     Lauf entfernt sie, sobald sie 24 Stunden alt ist. */
  const nach = await zw.holeSitzung(sitzungId);
  pruefe("Die Marke steht noch da — sie ist der Wiederherstellungsweg",
    markeFelder(nach.metadata).length > 0);

  /* Und jetzt der Beweis, dass die Frist das Einzige ist, was sie
     hält: dieselbe Lage, nur älter. */
  pruefe("Dieselbe Lage, 24 Stunden später: sie darf weg",
    markeDarfWeg({
      hatMarke: true, status: nach.status, bezahlt: nach.payment_status === "paid",
      verbucht: true, alterMs: MARKE_SCHONFRIST_MS,
    }) === true);
}

/* ══ X4.5 · Eine geleerte Marke löst KEINE Erstattung aus ════════ */
console.log("\nX4.5 · Nach dem Leeren kommt keine zweite Meldung durcheinander");
await aufraeumen();
{
  const antwort = await absenden(einzel("spaet-marke@example.org"), neueIp());
  const sitzungId = zw.sitzungAusZiel(antwort.ziel);
  const bezahlt = await zw.bezahlen(sitzungId);
  await rueckmeldung(bezahlt);

  const anmeldung = await db.registration.findFirstOrThrow({
    where: { kontaktEmail: "spaet-marke@example.org" },
  });

  /* Die Marke von Hand entfernen — so, wie es der stündliche Lauf
     nach 24 Stunden täte. */
  await fetch(`${ATTRAPPE}/v1/checkout/sessions/${sitzungId}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(
      Object.fromEntries(markeFelder(bezahlt.metadata).map((f) => [`metadata[${f}]`, ""])),
    ),
  });
  const geleert = await zw.holeSitzung(sitzungId);
  pruefe("Vorbedingung: die Marke ist entfernt", markeFelder(geleert.metadata).length === 0);

  const erstattungenVorher =
    (await (await fetch(`${ATTRAPPE}/steuerung/erstattungen`)).json()).length;

  /* Und jetzt die zweite Meldung zur selben Sitzung — bei PayPal der
     Normalfall. Ohne die Prüfung „kennen wir diese Sitzung schon?"
     hätte sie hier eine gültige Buchung zurückerstattet. */
  const spaet = await rueckmeldung(geleert, "checkout.session.async_payment_succeeded");
  pruefe("Die zweite Meldung wird angenommen", spaet.status === 200);
  pruefe("… legt keine zweite Anmeldung an",
    (await db.registration.count({ where: { kontaktEmail: "spaet-marke@example.org" } })) === 1);
  pruefe("… und erzeugt KEINE Fehlbuchung", (await db.fehlbuchung.count()) === 0);
  pruefe("… vor allem: KEINE Erstattung",
    (await (await fetch(`${ATTRAPPE}/steuerung/erstattungen`)).json()).length
      === erstattungenVorher,
    `${erstattungenVorher} vorher`);

  const unveraendert = await db.registration.findUniqueOrThrow({ where: { id: anmeldung.id } });
  pruefe("… und die Buchung bleibt bestätigt und bezahlt",
    unveraendert.status === "BESTAETIGT" && unveraendert.zahlungsStatus === "BEZAHLT");
}

/* ══ X4.6 · Die Abschluss-Seite kommt ohne Marke aus ═════════════ */
console.log("\nX4.6 · Der alte Link funktioniert auch ohne Marke");
{
  const anmeldung = await db.registration.findFirstOrThrow({
    where: { kontaktEmail: "spaet-marke@example.org" },
  });
  const seite = await fetch(
    `${BASIS}/anmeldung/danke?sitzung=${anmeldung.zahlungsReferenz}&zahlung=zurueck`);
  const roh = await seite.text();
  const text = alsText(roh);
  pruefe("Die Abschluss-Seite ist erreichbar", seite.status === 200);
  /* Ohne die Abfrage über die Zahlungsreferenz stünde hier dauerhaft
     „Zahlung wird geprüft" — für eine Buchung, die längst steht. */
  pruefe("… und zeigt die Buchung, nicht „wird geprüft“",
    text.includes("Zahlung erfolgreich") && !text.includes("steht noch aus"),
    text.split("\n").find((z) => z.includes("Zahlung")) ?? "—");
  /* Und der Reiter im Browser sagt dasselbe. Er las früher nur `nr`
     und behauptete bei jeder über die Sitzung gefundenen Buchung das
     Gegenteil der Seite. */
  const titel = (roh.match(/<title>([^<]*)<\/title>/) ?? ["", "—"])[1];
  pruefe("… und der Reiter im Browser widerspricht ihr nicht",
    titel.includes("Zahlung erfolgreich"), titel);
}

/* ══ X4.7 · Der ausgefallene Webhook ════════════════════════════
   
   Bleibt `checkout.session.expired` aus — Netzstörung, Dienst gerade
   neu gestartet, Stripe hat es nach mehreren Versuchen aufgegeben —,
   dann räumt niemand auf, und die verschlüsselte Anmeldung läge
   unbegrenzt beim Anbieter.

   Der stündliche Abgleichlauf holt es nach. Er sieht sich ALLE
   Bezahlseiten der letzten Tage an, nicht nur die bezahlten — genau
   dafür steht das Aufräumen in seiner Schleife vor dem ersten
   `continue`. */
console.log("\nX4.7 · Bleibt die Rückmeldung aus, räumt der stündliche Lauf auf");
await aufraeumen();
{
  const antwort = await absenden(einzel("verloren@example.org"), neueIp());
  const sitzungId = zw.sitzungAusZiel(antwort.ziel);

  /* Verfallen lassen — und die Rückmeldung ABSICHTLICH nicht
     schicken. Genau das ist der Ausfall. */
  await zw.verfallen(sitzungId);
  const liegengeblieben = await zw.holeSitzung(sitzungId);
  pruefe("Vorbedingung: die Marke liegt noch beim Anbieter",
    markeFelder(liegengeblieben.metadata).length > 0,
    `${markeFelder(liegengeblieben.metadata).length} Felder`);

  /* Erst die Vorschau: Der Lauf ohne --echt darf nichts anfassen. */
  const vorschau = await abgleichLaufen(false);
  pruefe("Die Vorschau meldet, dass sie aufräumen würde",
    /Marken zu entfernen:\s*[1-9]/.test(vorschau), letzteZeilen(vorschau));
  pruefe("… ändert dabei aber nichts",
    markeFelder((await zw.holeSitzung(sitzungId)).metadata).length > 0);

  const echt = await abgleichLaufen(true);
  pruefe("Der echte Lauf entfernt die Marke",
    markeFelder((await zw.holeSitzung(sitzungId)).metadata).length === 0,
    letzteZeilen(echt));
  pruefe("… und lässt die Veranstaltungskennung stehen",
    (await zw.holeSitzung(sitzungId)).metadata.event !== undefined);
  /* Auf DIESE Sitzung bezogen geprüft, nicht auf die ganze
     Datenbank: Die Attrappe behält die Sitzungen der vorigen
     Abschnitte, und der Abgleichlauf sieht sie alle. Für ihn ist das
     richtig — hier interessiert nur, was aus der verlorenen
     Rückmeldung geworden ist. */
  pruefe("… und legt zu dieser Sitzung keine Anmeldung an — es war ja nichts bezahlt",
    (await db.registration.count({ where: { zahlungsReferenz: sitzungId } })) === 0);
  pruefe("… und keine Fehlbuchung",
    (await db.fehlbuchung.count({ where: { sitzungId } })) === 0);
  pruefe("… und die Person ist weiterhin nirgends gespeichert",
    (await db.registration.count({ where: { kontaktEmail: "verloren@example.org" } })) === 0);

  /* Wiederholbar: Ein zweiter Lauf findet nichts mehr zu tun und
     stolpert nicht über die bereits geleerte Sitzung. */
  const nochmal = await abgleichLaufen(true);
  pruefe("Ein zweiter Lauf findet nichts mehr",
    /Marken entfernt:\s*0/.test(nochmal), letzteZeilen(nochmal));
}

/* ══ X4.8 · Das getrennte Räumfenster ═══════════════════════════
   
   Nachbuchen sieht zwei Tage zurück, Räumen dreissig. Der Grund ist
   ein Loch, das beim Formulieren des Datenschutztextes auffiel: Steht
   der Server länger als einen Tag still, rutscht eine fällige
   Bezahlseite aus einem Zwei-Tage-Fenster und wird nie wieder
   angesehen.

   Geprüft wird beides — dass eine alte Sitzung noch geräumt, und
   dass sie NICHT mehr nachgebucht wird. */
console.log("\nX4.8 · Räumen sieht weiter zurück als Nachbuchen");
await aufraeumen();
{
  const antwort = await absenden(einzel("alt@example.org"), neueIp());
  const sitzungId = zw.sitzungAusZiel(antwort.ziel);
  await zw.verfallen(sitzungId);

  /* Fünf Tage alt: ausserhalb des Nachbuch-Fensters (2 Tage),
     innerhalb des Räumfensters (30 Tage). */
  await zw.altern(sitzungId, 5);
  pruefe("Vorbedingung: die Sitzung ist fünf Tage alt und trägt noch die Marke",
    markeFelder((await zw.holeSitzung(sitzungId)).metadata).length > 0);

  const lauf = await abgleichLaufen(true);
  pruefe("Der Lauf räumt sie trotzdem",
    markeFelder((await zw.holeSitzung(sitzungId)).metadata).length === 0,
    letzteZeilen(lauf));
  pruefe("… und bucht nichts nach — dafür ist sie zu alt",
    (await db.registration.count({ where: { zahlungsReferenz: sitzungId } })) === 0);

  /* Und die Gegenprobe: ausserhalb BEIDER Fenster passiert nichts
     mehr. Das ist kein Mangel, sondern die Grenze des Verfahrens —
     sie gehört festgehalten, damit sie niemand später für einen
     Fehler hält. */
  const zweite = await absenden(einzel("uralt@example.org"), neueIp());
  const alteId = zw.sitzungAusZiel(zweite.ziel);
  await zw.verfallen(alteId);
  await zw.altern(alteId, 40);
  await abgleichLaufen(true);
  pruefe("Jenseits von dreissig Tagen sieht der Lauf sie nicht mehr an",
    markeFelder((await zw.holeSitzung(alteId)).metadata).length > 0,
    "Grenze des Verfahrens, kein Fehler");
}

/* ══ X4.9 · Wenn das Räumen fehlschlägt ═════════════════════════ */
console.log("\nX4.9 · Ein fehlgeschlagenes Räumen reisst den Lauf nicht ab");
await aufraeumen();
{
  const kaputt = await absenden(einzel("stoerung@example.org"), neueIp());
  const kaputtId = zw.sitzungAusZiel(kaputt.ziel);
  await zw.verfallen(kaputtId);

  const heil = await absenden(einzel("danach@example.org"), neueIp());
  const heilId = zw.sitzungAusZiel(heil.ziel);
  await zw.verfallen(heilId);

  await zw.updateStoeren(kaputtId, true);
  const lauf = await abgleichLaufen(true, [0, 2]);

  pruefe("Die gestörte Sitzung behält ihre Marke",
    markeFelder((await zw.holeSitzung(kaputtId)).metadata).length > 0);
  pruefe("Der Fehlschlag steht deutlich im Protokoll",
    /RÄUMEN FEHLGESCHLAGEN/.test(lauf) && lauf.includes(kaputtId),
    (lauf.split("\n").find((z) => z.includes("FEHLGESCHLAGEN")) ?? "—").slice(0, 60));
  pruefe("… mit Grund und dem Hinweis, dass es erneut versucht wird",
    /Grund:/.test(lauf) && /erneut versucht/.test(lauf));
  pruefe("… und wird in der Bilanz gezählt",
    /RÄUMEN FEHLGESCHLAGEN:\s*1/.test(lauf),
    (lauf.split("\n").find((z) => /RÄUMEN FEHLGESCHLAGEN:\s*\d/.test(z)) ?? "—").trim());

  /* Der Kern: Die ANDERE Sitzung wurde trotzdem geräumt. Ein Lauf,
     den ein einzelner Sonderfall lahmlegt, ist keiner. */
  pruefe("Die übrigen Sitzungen werden trotzdem geräumt",
    markeFelder((await zw.holeSitzung(heilId)).metadata).length === 0);

  /* Und beim nächsten Lauf klappt es, sobald die Störung weg ist. */
  await zw.updateStoeren(kaputtId, false);
  await abgleichLaufen(true);
  pruefe("Nach Wegfall der Störung räumt der nächste Lauf sie nach",
    markeFelder((await zw.holeSitzung(kaputtId)).metadata).length === 0);
}

await aufraeumen();

console.log(`\n${n - schief.length} von ${n} in Ordnung.`);
if (schief.length) { console.log("Nicht in Ordnung:", schief.join(" · ")); process.exit(1); }
process.exit(0);
