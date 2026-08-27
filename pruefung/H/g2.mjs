/* Vorschau, Entwürfe, Anmeldung je Event, Zugangsschutz. */
import { anmelden, hole, sende, actionFelder, alsText, BASIS } from "./admin-senden.mjs";
import { db } from "../../lib/db.js";

let n = 0; const schief = [];
const pruefe = (name, ok, zusatz = "") => {
  n += 1;
  console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
};

await db.anmeldeVersuch.deleteMany({});
const s = await anmelden("test-admin@vera.example", "Sonnenblume-Kaffee-Regen", "198.51.100.2");
const K = s.cookie;

const business = await db.event.findUniqueOrThrow({ where: { slug: "probe-business" } });
const premium = await db.event.findUniqueOrThrow({ where: { slug: "probe-premium" } });

// ── Vorschau ───────────────────────────────────────────────────
const ohne = await hole(`/admin/events/${business.id}/vorschau`);
pruefe("Vorschau ohne Anmeldung führt zum Anmeldeformular",
  ohne.ziel === "/admin/login", `Antwort ${ohne.status}, Ziel ${ohne.ziel ?? "—"}`);

const mit = await hole(`/admin/events/${business.id}/vorschau`, K);
pruefe("Vorschau mit Anmeldung wird ausgeliefert", mit.status === 200);
const mText = alsText(mit.html);
pruefe("… zeigt die Vorschau-Leiste", mText.includes("So sehen Besucher die Seite"));
pruefe("… nennt das gewählte Design", mText.includes("Business"));
pruefe("… zeigt denselben Inhalt wie die öffentliche Seite",
  mText.includes("Kurzvorträge") && mText.includes("Worum es geht"));
pruefe("… mit Kopfzeile und Fußbereich der Marke",
  mText.includes("Über VERA") && mText.includes("Impressum"));
pruefe("… und im richtigen Design", mit.html.includes('data-theme="business"'));

// ── Entwurf ────────────────────────────────────────────────────
await db.event.update({ where: { id: premium.id }, data: { status: "ENTWURF" } });

const oeffentlich = await hole("/events/probe-premium");
pruefe("Ein Entwurf ist öffentlich NICHT erreichbar", oeffentlich.status === 404,
  `Antwort ${oeffentlich.status}`);
const vorschauEntwurf = await hole(`/admin/events/${premium.id}/vorschau`, K);
pruefe("… die Vorschau zeigt ihn trotzdem", vorschauEntwurf.status === 200);
pruefe("… und weist darauf hin, dass er nicht veröffentlicht ist",
  alsText(vorschauEntwurf.html).includes("noch nicht veröffentlicht"));
await db.event.update({ where: { id: premium.id }, data: { status: "VEROEFFENTLICHT" } });

// ── Anmeldung je Event ─────────────────────────────────────────
for (const slug of ["padel-falkensee", "probe-business", "probe-premium"]) {
  const seite = await hole(`/events/${slug}/anmeldung`);
  const e = await db.event.findUniqueOrThrow({ where: { slug } });
  pruefe(`/events/${slug}/anmeldung zeigt DIESES Event`,
    seite.status === 200 && seite.html.includes(`value="${slug}"`) &&
    alsText(seite.html).includes(e.titel),
    `Antwort ${seite.status}`);
}

const bAnmeldung = await hole("/events/probe-business/anmeldung");
pruefe("Die Anmeldung erbt das Theme der Veranstaltung",
  bAnmeldung.html.includes('data-theme="business"'));
pruefe("… und zeigt deren Preis", alsText(bAnmeldung.html).includes("20,00 €"));

// ── /anmeldung ohne Event leitet weiter ────────────────────────
const alt = await hole("/anmeldung");
pruefe("/anmeldung leitet auf die nächste Veranstaltung",
  alt.status === 307 && (alt.ziel ?? "").startsWith("/events/"),
  `Antwort ${alt.status}, Ziel ${alt.ziel ?? "—"}`);

// ── Eine echte Anmeldung landet beim RICHTIGEN Event ───────────
const anmeldeSeite = await hole("/events/probe-business/anmeldung");
const AF = actionFelder(anmeldeSeite.html, 'name="eventSlug"');
await sende("/events/probe-business/anmeldung", AF, {
  eventSlug: "probe-business", weg: "selbst", selbstAls: "adult",
  schueler: 0, erwachsene: 1, webseite: "",
  "person.0.vorname": "Theme", "person.0.nachname": "Prüfer",
  "person.0.email": "theme@example.org", "person.0.telefon": "",
}, null, "198.51.100.77");

const gespeichert = await db.registration.findFirst({
  where: { kontaktEmail: "theme@example.org" }, include: { event: true, teilnehmer: true },
});
pruefe("Die Anmeldung landet beim Business-Event, nicht beim Padel-Event",
  gespeichert?.event.slug === "probe-business", `gespeichert bei: ${gespeichert?.event.slug}`);
pruefe("… mit dem Preis DIESES Events (20,00 €)",
  gespeichert?.gesamtpreisCents === 2000, `${gespeichert?.gesamtpreisCents} Cent`);
pruefe("… und einem Teilnehmer", gespeichert?.teilnehmer.length === 1);

// ── Belegte Plätze wirken sich auf DIESES Event aus ────────────
const padel = await db.event.findUniqueOrThrow({ where: { slug: "padel-falkensee" } });
const beimPadel = await db.registration.count({ where: { eventId: padel.id } });
pruefe("Das Padel-Event hat dadurch KEINE Anmeldung bekommen", beimPadel === 0,
  `${beimPadel} Anmeldungen`);

console.log(schief.length === 0 ? `\nAlle ${n} Prüfungen bestanden.` : `\n${schief.length} fehlgeschlagen:\n- ${schief.join("\n- ")}`);
await db.$disconnect();
process.exitCode = schief.length === 0 ? 0 : 1;
