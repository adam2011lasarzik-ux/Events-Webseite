/* Alle Spuren der Prüfungen entfernen — vor dem Livegang.

   Aufruf:  npx tsx --env-file=.env pruefung/aufraeumen.mjs

   Weg kommen: Testevents samt ihren Inhaltsblöcken und hochgeladenen
   Bildern, alle Anmeldungen, Bremsen, Zahlungsereignisse und die
   Adminzugänge, die die Prüfungen angelegt haben.

   Bleiben: die echte Veranstaltung und die Einstellungen.

   Bewusst eine feste Liste statt „alles ausser padel-falkensee": Ein
   versehentlich gelöschtes echtes Event wäre ein teurer Fehler für ein
   bisschen Bequemlichkeit. Kommt eine neue Prüfliste mit einem neuen
   Testevent dazu, gehört sein Kürzel hierher. */
import { db } from "../lib/db.js";
import { bildLoeschen } from "../lib/bilder.js";

const TESTEVENTS = {
  OR: [{ slug: { startsWith: "probe-" } }, { slug: "sommerfest-am-kanal" }],
};
const TESTZUGAENGE = { email: { endsWith: "@vera.example" } };

const weg = await db.event.findMany({
  where: TESTEVENTS,
  select: { id: true, slug: true, bildUrl: true },
});

for (const e of weg) {
  // Erst die Datei, dann der Datensatz — sonst bliebe ein Bild liegen,
  // auf das nichts mehr zeigt.
  if (e.bildUrl?.startsWith("/bilder/")) await bildLoeschen(e.bildUrl);
  // Teilnehmer hängen per onDelete: Cascade an der Anmeldung.
  await db.registration.deleteMany({ where: { eventId: e.id } });
  await db.eventAbschnitt.deleteMany({ where: { eventId: e.id } });
  await db.event.delete({ where: { id: e.id } });
}

await db.participant.deleteMany({});
await db.registration.deleteMany({});
await db.anmeldeVersuch.deleteMany({});
await db.zahlungsEreignis.deleteMany({});
await db.adminSession.deleteMany({});
const zugaenge = await db.adminUser.deleteMany({ where: TESTZUGAENGE });

/* Der Gründerbereich.

   `I/i-gruender.mjs` lädt ein Testfoto hoch und schreibt Name, Rolle
   und Text um. Bliebe das stehen, ginge ein Prüfbild als Porträt des
   Gründers online — genau der Fehler, den man erst bemerkt, wenn ihn
   jemand anderes sieht. Deshalb wird die Zeile zurückgesetzt; sie
   entsteht beim nächsten Lesen mit den Vorgabewerten neu.

   ACHTUNG: Damit sind auch echte Angaben weg, falls welche eingetragen
   waren. Nach einem Prüflauf gehört der Gründerbereich im Adminbereich
   neu ausgefüllt. */
const einstellungen = await db.einstellungen.findUnique({ where: { id: "global" } });
if (einstellungen?.gruenderBildUrl?.startsWith("/bilder/")) {
  await bildLoeschen(einstellungen.gruenderBildUrl);
}
const gruenderWeg = await db.einstellungen.deleteMany({});

const uebrig = await db.event.findMany({ select: { slug: true } });
console.log(`Testevents entfernt:   ${weg.length ? weg.map((e) => e.slug).join(", ") : "keine"}`);
console.log(`Testzugänge entfernt:  ${zugaenge.count}`);
console.log(`Gründerbereich:        ${gruenderWeg.count ? "zurückgesetzt — bitte im Adminbereich neu ausfüllen" : "war leer"}`);
console.log(`Anmeldungen jetzt:     ${await db.registration.count()}`);
console.log(`Adminzugänge jetzt:    ${await db.adminUser.count()}`);
console.log(`Events jetzt:          ${uebrig.map((e) => e.slug).join(", ") || "keine"}`);
process.exit(0);
