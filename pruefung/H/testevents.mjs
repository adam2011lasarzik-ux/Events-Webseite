/* Legt die Prüf-Events an: je eins mit Business und Premium.
   Idempotent — mehrfaches Ausführen ändert nichts. */
import { db } from "../../lib/db.js";

const gemeinsam = {
  stadt: "Falkensee",
  ortName: "Waldorf Astoria",
  strasse: "Am Kanal 3",
  plz: "14612",
  status: "VEROEFFENTLICHT",
  maxPersonen: 60,
  schwelleWenigPlaetze: 10,
  preisSchuelerCents: 0,
  preisErwachsenerCents: 8900,
  familieAktiv: false,
  startAt: new Date("2026-08-27T16:00:00Z"), // 18:00 deutscher Zeit
  endAt: new Date("2026-08-27T22:00:00Z"),
};

const events = [
  {
    ...gemeinsam,
    slug: "probe-business",
    theme: "BUSINESS",
    kategorie: "NETWORKING",
    titel: "Unternehmerabend Falkensee",
    untertitel: "Ein Abend für Leute, die etwas vorhaben",
    karteTitel: "Unternehmerabend",
    karteKurz: "Kurzvorträge, Gespräche und ein offener Ausklang.",
    karteZielgruppe: "Für Unternehmerinnen und Unternehmer",
    kurz: "Drei Beiträge, viel Zeit zum Reden.",
    beschreibung: "Erster Absatz.\n\nZweiter Absatz.",
    heroAugenbraue: "Netzwerken · Falkensee",
    heroTitel: "Wer kommt, bleibt hängen. Im besten Sinn.",
    heroText: "Ein Abend für Leute, die etwas vorhaben.",
  },
  {
    ...gemeinsam,
    slug: "probe-premium",
    theme: "PREMIUM",
    kategorie: "BUSINESS",
    titel: "Rooftop Nights",
    untertitel: "Sommerabend über den Dächern",
    karteTitel: "Rooftop Nights",
    karteKurz: "Sonnenuntergang, Drinks und Gespräche über den Dächern.",
    karteZielgruppe: "Für geladene Gäste",
    kurz: "Ein Abend auf dem Dach, solange die Sonne steht.",
    beschreibung:
      "Wenn die Sonne hinter den Häusern verschwindet, fängt der Abend erst an.\n\n" +
      "Ein Ort für Gespräche, die man am nächsten Tag noch im Kopf hat.",
    heroAugenbraue: "Rooftop · Falkensee",
    heroTitel: "Rooftop Nights",
    heroText: "Sonnenuntergang, Drinks und Gespräche über den Dächern.",
    ctaTitel: "Wir halten Ihnen einen Platz frei.",
    ctaText: "Die Plätze sind begrenzt — melden Sie sich rechtzeitig an.",
  },
];

const bloecke = {
  "probe-business": [
    { art: "vorstellung", titel: "Worum es geht", reihenfolge: 10,
      inhalt: "Drei kurze Beiträge, danach offener Austausch.\n\nKein Vortragsabend — ein Arbeitsabend.\n* 60 | Plätze\n* 3 | Beiträge" },
    { art: "ablauf", titel: "Der Abend", reihenfolge: 20,
      inhalt: "18:00 | Ankommen | Getränk und erste Gespräche.\n19:00 | Kurzvorträge | Drei Beiträge, je zehn Minuten.\n20:00 | Offener Teil | Reden, wen man treffen will." },
    { art: "faq", titel: "Häufige Fragen", reihenfolge: 40,
      inhalt: "Was ziehe ich an? | Was Sie möchten.\nGibt es Essen? | Fingerfood ist dabei." },
  ],
  "probe-premium": [
    { art: "vorstellung", titel: "Der Abend", reihenfolge: 10,
      inhalt: "Sechs Stockwerke über der Stadt, wenn das Licht weich wird.\n\nEine kleine Runde, gute Getränke und Zeit, sich wirklich zu unterhalten.\n* 60 | Gäste\n* 6. | Etage" },
    { art: "ablauf", titel: "Ablauf", reihenfolge: 20,
      inhalt: "18:00 | Empfang | Aperitif auf der Dachterrasse.\n19:30 | Dinner | Drei Gänge, offen gedeckt.\n21:00 | Ausklang | Musik und Gespräche bis spät." },
    { art: "hinweise", titel: "Gut zu wissen", reihenfolge: 30,
      inhalt: "Der Abend findet bei jedem Wetter statt.\n- Anmeldung erforderlich\n- Getränke im Preis enthalten\n- Zugang über den Haupteingang, 6. Etage" },
    { art: "faq", titel: "Häufige Fragen", reihenfolge: 40,
      inhalt: "Gibt es eine Kleiderordnung? | Smart casual genügt.\nKann ich jemanden mitbringen? | Ja, bitte bei der Anmeldung angeben." },
  ],
};

async function main() {
  for (const daten of events) {
    const e = await db.event.upsert({
      where: { slug: daten.slug }, create: daten, update: daten,
    });
    await db.eventAbschnitt.deleteMany({ where: { eventId: e.id } });
    await db.eventAbschnitt.createMany({
      data: bloecke[daten.slug].map((b) => ({ ...b, eventId: e.id })),
    });
    console.log(`${daten.slug} (${daten.theme}) — ${bloecke[daten.slug].length} Blöcke`);
  }
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => db.$disconnect());
