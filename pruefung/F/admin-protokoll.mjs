/* Protokoll der Admin-Aktionen: Wird jeder Zugriff festgehalten —
   und steht darin wirklich keine Personendaten?

   Der zweite Teil ist der wichtigere. Ein Protokoll, das Namen und
   E-Mail-Adressen mitschreibt, macht aus einem Sicherheitsgewinn eine
   zweite Datensammlung, die ihrerseits gelöscht werden müsste. */
/* Riegel vor der echten Datenbank — siehe pruefung/schutz.mjs. */
import "../schutz.mjs";

import { anmelden, hole, sende, actionFelder, BASIS } from "./admin-senden.mjs";
import { db } from "../../lib/db.js";

let n = 0;
const schief = [];
function pruefe(name, ok, zusatz = "") {
  n += 1;
  console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
}

await db.anmeldeVersuch.deleteMany({});
await db.adminProtokoll.deleteMany({});
/* Auch VOR dem Lauf aufräumen, nicht nur danach: Bricht die Liste
   einmal mittendrin ab, bliebe das Test-Event liegen und der nächste
   Lauf scheiterte am doppelten Slug — ohne dass der Grund im Ergebnis
   zu sehen wäre. */
await db.event.deleteMany({ where: { slug: "probe-protokoll" } });

const s = await anmelden("test-admin@vera.example", "Sonnenblume-Kaffee-Regen", "192.0.2.60");
if (!s.cookie) throw new Error("Anmeldung fehlgeschlagen");
const K = s.cookie;
const ADMIN = await db.adminUser.findUniqueOrThrow({ where: { email: "test-admin@vera.example" } });
const EVENT = await db.event.findFirstOrThrow({ where: { slug: "padel-falkensee" } });

/* Eine Anmeldung mit auffälligen Personendaten. Die Zeichenketten sind
   absichtlich so gewählt, dass sie sich später eindeutig wiederfinden
   ließen, falls sie doch ins Protokoll gerieten. */
const NAME = "Zeugnisname";
const MAIL = "protokolltest@example.org";
const TELEFON = "030 999888777";
const anmeldung = await db.registration.create({
  data: {
    eventId: EVENT.id,
    kontaktVorname: NAME,
    kontaktNachname: "Merkwürdig",
    kontaktEmail: MAIL,
    kontaktTelefon: TELEFON,
    gesamtpreisCents: 700,
    status: "BESTAETIGT",
    teilnehmer: { create: [{ vorname: NAME, nachname: "Merkwürdig", typ: "SCHUELER" }] },
  },
});

const liste = await hole(`/admin/events/${EVENT.id}/anmeldungen`, K);

// ── 1. Statusänderung ──────────────────────────────────────────
const statusFelder = actionFelder(liste.html, 'name="status"');
await sende(`/admin/events/${EVENT.id}/anmeldungen`, statusFelder,
  { anmeldungId: anmeldung.id, status: "STORNIERT" }, K);

let eintraege = await db.adminProtokoll.findMany({ orderBy: { zeitpunkt: "asc" } });
pruefe("Eine Statusänderung wird protokolliert", eintraege.length === 1,
  `${eintraege.length} Eintrag/Einträge`);
pruefe("… mit der richtigen Aktion, dem Ziel und dem Übergang",
  eintraege[0]?.aktion === "anmeldung.status" &&
  eintraege[0]?.zielArt === "Registration" &&
  eintraege[0]?.zielId === anmeldung.id &&
  eintraege[0]?.detail === "BESTAETIGT → STORNIERT",
  `${eintraege[0]?.aktion} / ${eintraege[0]?.detail}`);
pruefe("… und mit der Kennung des handelnden Zugangs",
  eintraege[0]?.adminId === ADMIN.id);

// ── 2. Zahlungsstatus ──────────────────────────────────────────
const zahlFelder = actionFelder(liste.html, 'name="zahlungsStatus"');
await sende(`/admin/events/${EVENT.id}/anmeldungen`, zahlFelder,
  { anmeldungId: anmeldung.id, zahlungsStatus: "BEZAHLT" }, K);

eintraege = await db.adminProtokoll.findMany({ orderBy: { zeitpunkt: "asc" } });
const zahlung = eintraege.find((e) => e.aktion === "anmeldung.zahlung");
pruefe("Eine Zahlungsänderung wird protokolliert", zahlung !== undefined);
pruefe("… mit dem Übergang des Zahlungsstatus",
  zahlung?.detail === "OFFEN → BEZAHLT", zahlung?.detail ?? "—");

// ── 3. CSV-Export ──────────────────────────────────────────────
const csv = await fetch(`${BASIS}/admin/events/${EVENT.id}/anmeldungen/csv`, {
  headers: { cookie: K },
  redirect: "manual",
});
await csv.arrayBuffer();
eintraege = await db.adminProtokoll.findMany();
const export1 = eintraege.find((e) => e.aktion === "csv.export");
pruefe("Der CSV-Export wird protokolliert", export1 !== undefined,
  `Antwort ${csv.status}`);
pruefe("… mit dem Umfang, aber ohne die Inhalte",
  typeof export1?.detail === "string" &&
  /\d+ Anmeldungen, \d+ Zeilen/.test(export1.detail),
  export1?.detail ?? "—");
pruefe("… und mit dem Event als Ziel",
  export1?.zielArt === "Event" && export1?.zielId === EVENT.id);

// ── 4. Anonymisieren ───────────────────────────────────────────
/* Hier ist das Protokoll der einzige verbleibende Nachweis: Nach dem
   Anonymisieren steht in der Anmeldung selbst nicht mehr, wer sie
   entfernt hat. */
const anonFelder = actionFelder(liste.html, "Personendaten löschen");
await sende(`/admin/events/${EVENT.id}/anmeldungen`, anonFelder,
  { anmeldungId: anmeldung.id }, K);

eintraege = await db.adminProtokoll.findMany();
const anon = eintraege.find((e) => e.aktion === "anmeldung.anonymisiert");
pruefe("Das Anonymisieren wird protokolliert", anon !== undefined);
pruefe("… mit der Kennung der Anmeldung, die es betraf",
  anon?.zielId === anmeldung.id);

// ── 5. Der Kern: kein Personenbezug im Protokoll ───────────────
const alleFelder = (await db.adminProtokoll.findMany())
  .map((e) => [e.aktion, e.zielArt, e.zielId, e.detail].join(" | "))
  .join("\n");

pruefe("Im Protokoll steht KEIN Name",
  !alleFelder.includes(NAME) && !alleFelder.includes("Merkwürdig"));
pruefe("Im Protokoll steht KEINE E-Mail-Adresse",
  !alleFelder.includes(MAIL) && !alleFelder.includes("@"));
pruefe("Im Protokoll steht KEINE Telefonnummer",
  !alleFelder.includes(TELEFON) && !alleFelder.includes("999888"));

// ── 6. Ohne Sitzung wird auch nichts protokolliert ─────────────
/* Sonst könnte jemand ohne Zugang das Protokoll mit erfundenen
   Einträgen zumüllen — und die echten darin unauffindbar machen. */
const vorherZahl = (await db.adminProtokoll.count());
await sende(`/admin/events/${EVENT.id}/anmeldungen`, statusFelder,
  { anmeldungId: anmeldung.id, status: "BESTAETIGT" }, null);
const nachherZahl = await db.adminProtokoll.count();
pruefe("Eine abgewiesene Aktion ohne Sitzung erzeugt KEINEN Eintrag",
  nachherZahl === vorherZahl, `${vorherZahl} → ${nachherZahl}`);

// ── 7. Event anlegen und wieder entfernen ──────────────────────
const neuSeite = await hole("/admin/events/neu", K);
const neuFelder = actionFelder(neuSeite.html, 'name="titel"');
await sende("/admin/events/neu", neuFelder, {
  eventId: "", titel: "Protokoll-Probe", slug: "probe-protokoll", stadt: "Nirgendwo",
  karteTitel: "X", karteKurz: "X", kurz: "X", beschreibung: "X",
  preisSchueler: "1,00", preisErwachsener: "1,00", schuelerAktiv: "an",
  status: "ENTWURF", kategorie: "SPORT", schwelleWenigPlaetze: "10",
}, K);

const angelegt = await db.event.findUnique({ where: { slug: "probe-protokoll" } });
const eventEintrag = (await db.adminProtokoll.findMany())
  .find((e) => e.aktion === "event.gespeichert" && e.zielId === angelegt?.id);
pruefe("Ein angelegtes Event wird protokolliert", eventEintrag !== undefined);
pruefe("… und als neu angelegt gekennzeichnet",
  eventEintrag?.detail === "neu angelegt", eventEintrag?.detail ?? "—");

if (angelegt) {
  const bearbeiten = await hole(`/admin/events/${angelegt.id}`, K);
  const loeschFelder = actionFelder(bearbeiten.html, "endgültig löschen");
  await sende(`/admin/events/${angelegt.id}`, loeschFelder, { eventId: angelegt.id }, K);
  const weg = (await db.event.findUnique({ where: { id: angelegt.id } })) === null;
  const entferntEintrag = (await db.adminProtokoll.findMany())
    .find((e) => e.aktion === "event.entfernt" && e.zielId === angelegt.id);
  pruefe("Ein entferntes Event wird protokolliert", weg && entferntEintrag !== undefined,
    weg ? "" : "Event wurde nicht entfernt");
}

// ── 8. Die Einträge bleiben, wenn der Zugang verschwindet ──────
/* Ein Protokoll, das sich mit dem Handelnden zusammen löschen lässt,
   ist keines. Deshalb hat AdminProtokoll bewusst KEINEN
   Fremdschlüssel auf AdminUser. */
/* Bewusst ein EIGENER Wegwerf-Zugang statt des gemeinsamen
   Test-Zugangs: Den zu löschen würde jede Liste zerstören, die im
   Sammellauf danach kommt. */
const wegwerf = await db.adminUser.create({
  data: { email: "wegwerf-protokoll@vera.example", passwortHash: "scrypt$0$0$0$x$x" },
});
await db.adminProtokoll.create({
  data: { adminId: wegwerf.id, aktion: "anmeldung.status", zielArt: "Registration", zielId: "x" },
});
const zahlVorher = await db.adminProtokoll.count();
await db.adminUser.delete({ where: { id: wegwerf.id } });
const zahlNachher = await db.adminProtokoll.count();
pruefe("Das Protokoll überlebt das Löschen des handelnden Zugangs",
  zahlNachher === zahlVorher, `${zahlVorher} → ${zahlNachher}`);

// ── Aufräumen ──────────────────────────────────────────────────
await db.adminProtokoll.deleteMany({});
await db.event.deleteMany({ where: { slug: "probe-protokoll" } });

console.log(
  schief.length === 0
    ? `\nAlle ${n} Prüfungen bestanden.`
    : `\n${schief.length} fehlgeschlagen:\n- ${schief.join("\n- ")}`,
);
process.exit(schief.length === 0 ? 0 : 1);
