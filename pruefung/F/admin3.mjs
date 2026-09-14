/* Anmeldung: falsches Passwort, unbekannte Adresse, Bremse, Abmelden. */
/* Riegel vor der echten Datenbank — siehe pruefung/schutz.mjs. */
import "../schutz.mjs";

import { anmelden, hole, sende, actionFelder } from "./admin-senden.mjs";
import { db } from "../../lib/db.js";

let n = 0;
const schief = [];
function pruefe(name, ok, zusatz = "") {
  n += 1;
  console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
}

const RICHTIG = "Sonnenblume-Kaffee-Regen";
await db.anmeldeVersuch.deleteMany({});

// ── Falsches Passwort ──────────────────────────────────────────
const falsch = await anmelden("test-admin@vera.example", "falsch-aber-lang-genug", "192.0.2.10");
pruefe("Falsches Passwort wird abgewiesen", falsch.cookie === null);
const meldungFalsch = falsch.antwort.text.includes("E-Mail-Adresse oder Passwort stimmt nicht");
pruefe("… mit einer verständlichen Meldung", meldungFalsch);

// ── Unbekannte Adresse ─────────────────────────────────────────
const t0 = Date.now();
const unbekannt = await anmelden("gibt-es-nicht@example.org", RICHTIG, "192.0.2.11");
const dauerUnbekannt = Date.now() - t0;
pruefe("Unbekannte Adresse wird abgewiesen", unbekannt.cookie === null);
pruefe("… mit DERSELBEN Meldung wie beim falschen Passwort",
  unbekannt.antwort.text.includes("E-Mail-Adresse oder Passwort stimmt nicht"));

const t1 = Date.now();
await anmelden("test-admin@vera.example", "auch-falsch-lang-genug", "192.0.2.12");
const dauerBekannt = Date.now() - t1;
const aehnlich = Math.abs(dauerUnbekannt - dauerBekannt) < 150;
pruefe("… und in ähnlicher Zeit (verrät nicht, welche Adressen es gibt)", aehnlich,
  `unbekannt ${dauerUnbekannt} ms, bekannt ${dauerBekannt} ms`);

// ── Bremse ─────────────────────────────────────────────────────
await db.anmeldeVersuch.deleteMany({});
let gebremst = 0;
for (let i = 0; i < 13; i += 1) {
  const r = await anmelden("test-admin@vera.example", "immer-falsch-lang", "192.0.2.99");
  if (r.antwort.text.includes("Zu viele Anmeldeversuche")) gebremst += 1;
}
pruefe("Nach 10 Fehlversuchen greift die Bremse", gebremst === 3,
  `${gebremst} von 13 abgewiesen`);

// Die Bremse des Adminbereichs darf die des Anmeldeformulars nicht leeren.
const kennungen = await db.anmeldeVersuch.groupBy({ by: ["kennung"], _count: true });
pruefe("Die Bremsen zählen unter eigenen Kennungen (admin:… / admin-konto:…)",
  kennungen.every(
    (k) => k.kennung.startsWith("admin:") || k.kennung.startsWith("admin-konto:"),
  ),
  kennungen.map((k) => `${k.kennung}=${k._count}`).join(", "));

// ── Bremse je KONTO, über viele Adressen hinweg ────────────────
/* Die Bremse oben zählt je Absender-Adresse. Wer über viele Adressen
   verteilt probiert, umgeht sie vollständig: Jede Adresse bringt ihr
   eigenes Kontingent mit. Genau dieser Fall wird hier nachgestellt —
   23 Versuche von 23 VERSCHIEDENEN Adressen, alle auf dasselbe Konto.
   Ohne die Konto-Bremse käme kein einziger davon durch die Sperre. */
await db.anmeldeVersuch.deleteMany({});
const KONTO_MAX = 20;
let kontoGebremst = 0;
for (let i = 1; i <= KONTO_MAX + 3; i += 1) {
  const r = await anmelden(
    "test-admin@vera.example",
    "immer-falsch-lang",
    `198.51.100.${i}`,
  );
  if (r.antwort.text.includes("Zu viele Anmeldeversuche")) kontoGebremst += 1;
}
pruefe(
  `Nach ${KONTO_MAX} Versuchen greift die Bremse auch über verschiedene IP-Adressen`,
  kontoGebremst === 3,
  `${kontoGebremst} von ${KONTO_MAX + 3} abgewiesen`,
);

const kontoKennungen = await db.anmeldeVersuch.groupBy({ by: ["kennung"], _count: true });
const kontoZaehler = kontoKennungen.filter((k) => k.kennung.startsWith("admin-konto:"));
pruefe("… unter genau EINER Konto-Kennung, unabhängig von der Adresse",
  kontoZaehler.length === 1 && kontoZaehler[0]._count === KONTO_MAX,
  kontoZaehler.map((k) => `${k.kennung}=${k._count}`).join(", ") || "keine");

/* Datenschutz: Der Spam-Schutz braucht keine E-Mail-Adressen. In der
   Tabelle darf deshalb nur ein Hash stehen, nicht die Adresse selbst. */
const alleKennungen = (await db.anmeldeVersuch.findMany({ select: { kennung: true } }))
  .map((k) => k.kennung);
pruefe("Die E-Mail-Adresse steht NICHT im Klartext in der Bremsen-Tabelle",
  alleKennungen.every((k) => !k.includes("test-admin") && !k.includes("@")));

/* Eine Sperre darf immer nur das eine Konto treffen. Sonst könnte
   jemand mit einer erfundenen Adresse den echten Zugang mitsperren. */
const anderes = await anmelden("zweiter-admin@vera.example", "immer-falsch-lang", "203.0.113.7");
pruefe("Ein anderes Konto ist von der Sperre NICHT betroffen",
  !anderes.antwort.text.includes("Zu viele Anmeldeversuche"),
  anderes.antwort.text.includes("stimmt nicht") ? "normale Absage" : "unerwartete Antwort");

// ── Abmelden ───────────────────────────────────────────────────
await db.anmeldeVersuch.deleteMany({});
const sitzung = await anmelden("test-admin@vera.example", RICHTIG, "192.0.2.20");
pruefe("Richtiges Passwort meldet an", sitzung.cookie !== null);

const vorAbmelden = await db.adminSession.count();
const seite = await hole("/admin", sitzung.cookie);
const felder = actionFelder(seite.html, "Abmelden");
await sende("/admin", felder, {}, sitzung.cookie);
pruefe("Abmelden entfernt die Sitzung aus der Datenbank",
  (await db.adminSession.count()) === vorAbmelden - 1);

const danach = await hole("/admin", sitzung.cookie);
pruefe("… und das alte Cookie wirkt nicht mehr", danach.ziel === "/admin/login",
  `Ziel ${danach.ziel ?? "—"}`);

// ── Passwortwechsel beendet offene Sitzungen ───────────────────
const s2 = await anmelden("test-admin@vera.example", RICHTIG, "192.0.2.21");
pruefe("Neue Sitzung angelegt", s2.cookie !== null);

const { execSync } = await import("node:child_process");
execSync(`npm run admin -- test-admin@vera.example "${RICHTIG}"`, { stdio: "pipe" });

const nachWechsel = await hole("/admin", s2.cookie);
pruefe("Passwortwechsel beendet offene Sitzungen", nachWechsel.ziel === "/admin/login",
  `Ziel ${nachWechsel.ziel ?? "—"}`);

// ── Sitzungsdauer ──────────────────────────────────────────────
/* Eine zu lange Sitzung ist der Grund, warum ein einmal abgegriffenes
   Cookie tagelang weiterwirkt. Geprüft wird die tatsächlich in der
   Datenbank hinterlegte Frist, nicht die Konstante im Code. */
await db.adminSession.deleteMany({});
const sDauer = await anmelden("test-admin@vera.example", RICHTIG, "192.0.2.30");
const frisch = await db.adminSession.findFirstOrThrow({ orderBy: { id: "desc" } });
const tage = (frisch.laeuftAbAm.getTime() - Date.now()) / 86_400_000;
pruefe("Eine neue Sitzung läuft nach höchstens zwei Tagen ab",
  tage > 1.9 && tage < 2.1, `${tage.toFixed(2)} Tage`);
/* Bewusst eine Grenze, die 2 von 7 wirklich unterscheidet: „< 7"
   wäre auch bei sieben Tagen erfüllt, weil zwischen dem Anlegen der
   Sitzung und dieser Messung Zeit vergeht. */
pruefe("… und nicht mehr eine ganze Woche wie früher", tage < 3,
  `${tage.toFixed(2)} Tage, früher 7`);

// ── Überall abmelden ───────────────────────────────────────────
/* Der Notausgang bei einem verlorenen Gerät. Nachgestellt mit zwei
   Anmeldungen von zwei Adressen — also zwei „Geräten". */
const geraetA = sDauer;
const geraetB = await anmelden("test-admin@vera.example", RICHTIG, "192.0.2.31");
pruefe("Zwei Geräte sind gleichzeitig angemeldet",
  geraetA.cookie !== null && geraetB.cookie !== null &&
  (await db.adminSession.count()) === 2,
  `${await db.adminSession.count()} Sitzungen`);

/* Ein zweiter Zugang, der NICHT betroffen sein darf. Sonst wäre der
   Knopf eine bequeme Art, andere auszusperren. */
/* Erst wegräumen, falls ein abgebrochener Lauf ihn stehen ließ —
   sonst scheitert der nächste Lauf an der doppelten Adresse, und der
   Grund wäre im Ergebnis nicht zu sehen. */
await db.adminSession.deleteMany({ where: { admin: { email: "fremd-sitzung@vera.example" } } });
await db.adminUser.deleteMany({ where: { email: "fremd-sitzung@vera.example" } });
const fremd = await db.adminUser.create({
  data: { email: "fremd-sitzung@vera.example", passwortHash: "scrypt$0$0$0$x$x" },
});
await db.adminSession.create({
  data: {
    adminId: fremd.id,
    tokenHash: "nur-zum-mitzaehlen-kein-echter-hash",
    laeuftAbAm: new Date(Date.now() + 86_400_000),
  },
});

const adminSeite = await hole("/admin", geraetA.cookie);
const alleFelder = actionFelder(adminSeite.html, "Überall abmelden");
const antwort = await sende("/admin", alleFelder, {}, geraetA.cookie);

const eigene = await db.adminSession.count({ where: { admin: { email: "test-admin@vera.example" } } });
pruefe("„Überall abmelden“ entfernt ALLE eigenen Sitzungen", eigene === 0,
  `${eigene} übrig`);
pruefe("… und bestätigt es auf der Anmeldeseite",
  antwort.ziel === "/admin/login?abgemeldet=alle", `Ziel ${antwort.ziel ?? "—"}`);

const aWeg = await hole("/admin", geraetA.cookie);
const bWeg = await hole("/admin", geraetB.cookie);
pruefe("… beide Geräte sind ausgesperrt, nicht nur das eine",
  aWeg.ziel === "/admin/login" && bWeg.ziel === "/admin/login",
  `A ${aWeg.ziel ?? "—"}, B ${bWeg.ziel ?? "—"}`);

pruefe("… die Sitzung eines ANDEREN Zugangs bleibt bestehen",
  (await db.adminSession.count({ where: { adminId: fremd.id } })) === 1);

const protokoll = await db.adminProtokoll.findMany({
  where: { aktion: "zugang.ueberall-abgemeldet" },
});
pruefe("… und der Vorgang steht im Protokoll", protokoll.length === 1,
  protokoll[0]?.detail ?? "kein Eintrag");

/* Ohne Sitzung darf niemand fremde Sitzungen beenden. */
await db.adminSession.deleteMany({ where: { adminId: fremd.id } });
await db.adminSession.create({
  data: {
    adminId: fremd.id,
    tokenHash: "zweiter-zaehler-kein-echter-hash",
    laeuftAbAm: new Date(Date.now() + 86_400_000),
  },
});
await sende("/admin", alleFelder, {}, null);
pruefe("Ohne Sitzung beendet der Aufruf gar nichts",
  (await db.adminSession.count({ where: { adminId: fremd.id } })) === 1);

await db.adminSession.deleteMany({ where: { adminId: fremd.id } });
await db.adminUser.delete({ where: { id: fremd.id } });
await db.adminProtokoll.deleteMany({});

// ── Kein Klartext-Passwort in der Datenbank ────────────────────
const admin = await db.adminUser.findFirstOrThrow();
pruefe("In der Datenbank steht nur ein scrypt-Hash",
  admin.passwortHash.startsWith("scrypt$") && !admin.passwortHash.includes(RICHTIG),
  admin.passwortHash.slice(0, 28) + "…");

await db.anmeldeVersuch.deleteMany({});
console.log(schief.length === 0 ? `\nAlle ${n} Prüfungen bestanden.` : `\n${schief.length} fehlgeschlagen:\n- ${schief.join("\n- ")}`);
await db.$disconnect();
process.exitCode = schief.length === 0 ? 0 : 1;
