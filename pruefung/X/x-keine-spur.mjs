/* ---------------------------------------------------------------
   Prüfliste X4 · Nach einem Abbruch bleibt KEINE Spur

   Das ist die unmittelbare Prüfung der Anforderung vom 25.09.2026:

     „Vor erfolgreicher Zahlung darf in der VERA-Datenbank überhaupt
      nichts neu gespeichert werden — keine Anmeldung, kein
      Teilnehmer, keine Platzsperre, kein Zahlungsversuch, keine
      personenbezogenen Daten."

   Andere Listen prüfen einzelne Tabellen. Diese prüft ALLE — sie
   liest die Tabellennamen aus der Datenbank selbst und zählt jede
   Zeile. Das ist Absicht: Eine Prüfung, die eine Liste von Tabellen
   im Code führt, übersieht genau die Tabelle, die jemand später
   hinzufügt. Wer künftig irgendwo eine Zeile vor der Zahlung
   schreibt, lässt diese Liste rot werden, ohne dass jemand daran
   gedacht haben muss.

   Voraussetzungen: Datenbank, Attrappe des Zahlungsanbieters (4242)
   und der Server mit Zahlungs-Testwerten (3213).
   --------------------------------------------------------------- */
/* Riegel vor der echten Datenbank — siehe pruefung/schutz.mjs. */
import "../schutz.mjs";

import { db } from "../../lib/db.js";
import { absenden, personen, BASIS } from "../H/senden.mjs";
/* alsText entfernt Skript- und Stilblöcke MIT Inhalt. Ohne das fände
   eine Textsuche das komplette Wörterbuch wieder, das Next.js als
   Datenpaket in ein <script> legt — und damit Wörter, die auf der
   Seite nirgends stehen. */
import { alsText } from "../J/admin-senden.mjs";

let ok = 0;
let fehl = 0;
const pruefe = (name, bedingung, zusatz = "") => {
  if (bedingung) { ok++; console.log("  ✓", name); }
  else { fehl++; console.log("  ✗", name, zusatz); }
};

/**
 * Jede Zeile jeder Tabelle zählen.
 *
 * Die Tabellennamen kommen aus der Datenbank, nicht aus einer Liste
 * im Code — siehe oben.
 */
async function alleZeilen() {
  const tabellen = await db.$queryRaw`
    SELECT TABLE_NAME AS name FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'
     ORDER BY TABLE_NAME`;

  const stand = {};
  for (const { name } of tabellen) {
    /* Die Verwaltungstabelle von Prisma bleibt aussen vor: In ihr
       stehen die ausgeführten Migrationen, nicht Kundendaten. */
    if (name === "_prisma_migrations") continue;
    const [{ n }] = await db.$queryRawUnsafe(
      "SELECT COUNT(*) AS n FROM `" + name + "`",
    );
    stand[name] = Number(n);
  }
  return stand;
}

function unterschiede(vorher, nachher) {
  const raus = [];
  for (const name of Object.keys(nachher)) {
    if (vorher[name] !== nachher[name]) {
      raus.push(`${name}: ${vorher[name] ?? 0} → ${nachher[name]}`);
    }
  }
  return raus;
}

const event = await db.event.findFirstOrThrow({ where: { slug: "padel-falkensee" } });
const startVorher = event.startAt;
if (startVorher === null) {
  await db.event.update({
    where: { id: event.id },
    data: { startAt: new Date(Date.now() + 30 * 864e5) },
  });
}

const einzel = (email) => ({
  eventSlug: "padel-falkensee",
  weg: "selbst",
  selbstAls: "student",
  schueler: 1,
  erwachsene: 0,
  webseite: "",
  ...personen([{ vorname: "Spur", nachname: "Lose", email, telefon: "" }]),
});

/* ══ X4.1 · Der Regelfall: absenden, abbrechen ═══════════════════ */
console.log("\nX4.1 · Absenden und abbrechen hinterlässt nichts");

const vorher = await alleZeilen();
console.log(`     (${Object.keys(vorher).length} Tabellen gezählt)`);

const antwort = await absenden(einzel("keine.spur@pruef-x.example"), "203.0.113.77");

pruefe(
  "Das Absenden führt zur Bezahlseite des Anbieters",
  (antwort.ziel ?? "").includes("/bezahlseite/"),
  antwort.ziel ?? antwort.text.slice(0, 100),
);

const nachher = await alleZeilen();
const geaendert = unterschiede(vorher, nachher);

pruefe(
  "In KEINER Tabelle ist eine Zeile hinzugekommen",
  geaendert.length === 0,
  geaendert.join(" · "),
);

/* Zusätzlich beim Namen genannt, damit im Fehlerfall sofort klar ist,
   worum es geht — eine Liste von Tabellennamen liest sich schlechter
   als der Satz, der die Zusage wiederholt. */
pruefe(
  "Keine Anmeldung",
  (await db.registration.count({ where: { kontaktEmail: { contains: "@pruef-x.example" } } })) === 0,
);
pruefe(
  "Kein Teilnehmer",
  (await db.participant.count({
    where: { anmeldung: { kontaktEmail: { contains: "@pruef-x.example" } } },
  })) === 0,
);
pruefe("Keine Fehlbuchung — es ist ja kein Geld geflossen",
  (await db.fehlbuchung.count()) === 0);
pruefe(
  "Und keine Zeile der Bremse — die zählt im Arbeitsspeicher",
  (await db.anmeldeVersuch.count()) === (vorher.AnmeldeVersuch ?? 0),
  `${await db.anmeldeVersuch.count()} statt ${vorher.AnmeldeVersuch ?? 0}`,
);

/* ══ X4.2 · Auch bei mehreren Anläufen ══════════════════════════ */
console.log("\nX4.2 · Auch nach mehreren Versuchen bleibt es dabei");

const vorMehreren = await alleZeilen();
for (let i = 0; i < 3; i++) {
  await absenden(einzel(`mehrfach${i}@pruef-x.example`), `203.0.113.${80 + i}`);
}
const nachMehreren = await alleZeilen();
pruefe(
  "Drei weitere Anläufe, drei Bezahlseiten, keine einzige neue Zeile",
  unterschiede(vorMehreren, nachMehreren).length === 0,
  unterschiede(vorMehreren, nachMehreren).join(" · "),
);

/* ══ X4.3 · Und wenn die Anmeldung abgelehnt wird ═══════════════ */
console.log("\nX4.3 · Auch eine abgelehnte Anmeldung hinterlässt nichts");

const vorAblehnung = await alleZeilen();
const zuViele = await absenden(
  {
    eventSlug: "padel-falkensee",
    weg: "selbst",
    selbstAls: "student",
    schueler: 1,
    erwachsene: 0,
    webseite: "ich-bin-ein-bot",
    ...personen([{ vorname: "Bot", nachname: "Falle", email: "bot@pruef-x.example", telefon: "" }]),
  },
  "203.0.113.90",
);
pruefe("Die Bot-Falle greift", !(zuViele.ziel ?? "").includes("/bezahlseite/"));
pruefe(
  "… und hinterlässt ebenfalls keine Zeile",
  unterschiede(vorAblehnung, await alleZeilen()).length === 0,
  unterschiede(vorAblehnung, await alleZeilen()).join(" · "),
);

/* ══ X4.4 · Die Abschluss-Seite ohne Kennung ════════════════════ */
console.log("\nX4.4 · Die Abschluss-Seite nach einem Abbruch");

const text = alsText(await (await fetch(`${BASIS}/anmeldung/danke?zahlung=abgebrochen`)).text());

pruefe("Sie sagt, dass nichts gespeichert wurde", text.includes("nichts gespeichert"));
pruefe("… und dass nichts abgebucht wurde", text.includes("nichts abgebucht"));
pruefe(
  "… und lädt NICHT dazu ein, die Zahlung fortzusetzen",
  !/Jetzt bezahlen|Zahlung abschließen|Zahlung jederzeit/i.test(text),
  (text.match(/[^.]*bezahl[^.]*/i) ?? ["—"])[0].slice(0, 90),
);
pruefe("… und meldet nicht „nicht gefunden“", !text.includes("konnten wir nicht finden"));

/* ── Aufräumen ─────────────────────────────────────────────────── */
await db.event.update({
  where: { id: event.id },
  data: { startAt: startVorher ?? new Date(Date.now() + 30 * 864e5) },
});

console.log(`\nErgebnis: ${ok} bestanden, ${fehl} durchgefallen`);
await db.$disconnect();
process.exit(fehl === 0 ? 0 : 1);
