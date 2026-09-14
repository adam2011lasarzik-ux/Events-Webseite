/* Zweiter Faktor (TOTP) für den Adminbereich: Einrichtung, Anmeldung
   mit Code, Backup-Codes, Bremse, Deaktivieren, Notausgang über die
   Kommandozeile — und dass alles davon protokolliert wird, ohne dass
   dabei ein Geheimnis oder ein Code im Protokoll landet. */
/* Riegel vor der echten Datenbank — siehe pruefung/schutz.mjs. */
import "../schutz.mjs";

import * as OTPAuth from "otpauth";
import { anmelden, hole, sende, actionFelder } from "./admin-senden.mjs";
import { db } from "../../lib/db.js";
import { hashen } from "../../lib/passwort.js";

let n = 0;
const schief = [];
function pruefe(name, ok, zusatz = "") {
  n += 1;
  console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
}

/** Erzeugt aus einem Base32-Geheimnis einen aktuell gültigen TOTP-Code — genau
 * das, was eine Authenticator-App auf dem Bildschirm anzeigen würde. */
function codeFuer(geheimnisBase32) {
  const totp = new OTPAuth.TOTP({
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(geheimnisBase32),
  });
  return totp.generate();
}

function keksWert(setCookie, name) {
  const zeile = setCookie.find((c) => c.startsWith(`${name}=`));
  return zeile ? zeile.split(";")[0] : null;
}

/** Liest das versteckte Feld `geheimnis` aus dem Einrichtungsformular. */
function geheimnisAusSeite(html) {
  const treffer = html.match(/name="geheimnis" value="([^"]+)"/);
  if (!treffer) throw new Error("Kein Einrichtungsformular mit Geheimnis gefunden");
  return treffer[1];
}

const EMAIL = "zweiter-faktor-test@vera.example";
const PASSWORT = "Sonnenblume-Kaffee-Regen";

/* Eigener Wegwerf-Zugang statt des gemeinsamen Test-Zugangs: Dieser
   Test schaltet den zweiten Faktor scharf — das dürfte keine andere
   Liste im Sammellauf treffen, die sich weiterhin mit einem einzigen
   Anmeldeschritt anmeldet. */
/* Auch VOR dem Lauf aufräumen, nicht nur danach — sonst scheitert ein
   erneuter Lauf nach einem abgebrochenen Versuch an vorhandenen
   Resten, ohne dass der Grund im Ergebnis zu sehen wäre. */
await db.adminZweiterFaktorPruefung.deleteMany({ where: { admin: { email: EMAIL } } });
await db.adminZweiterFaktorCode.deleteMany({ where: { admin: { email: EMAIL } } });
await db.adminSession.deleteMany({ where: { admin: { email: EMAIL } } });
await db.adminUser.deleteMany({ where: { email: EMAIL } });
await db.adminProtokoll.deleteMany({ where: { zielArt: "Zweiter-Faktor-Test" } });

const zugang = await db.adminUser.create({
  data: { email: EMAIL, passwortHash: await hashen(PASSWORT) },
});

await db.anmeldeVersuch.deleteMany({});

// ── 1. Vor der Einrichtung: normale Anmeldung mit nur einem Schritt ─
const vorEinrichtung = await anmelden(EMAIL, PASSWORT, "192.0.2.40");
pruefe("Ohne aktivierten zweiten Faktor meldet das Passwort allein an",
  vorEinrichtung.cookie !== null);
await sende("/admin", actionFelder((await hole("/admin", vorEinrichtung.cookie)).html, "Abmelden"),
  {}, vorEinrichtung.cookie);

// ── 2. Einrichtungsseite: Geheimnis und QR-Code ────────────────────
const eingerichtetAls = await anmelden(EMAIL, PASSWORT, "192.0.2.41");
const einrichtenSeite = await hole("/admin/zweiter-faktor", eingerichtetAls.cookie);
pruefe("Die Einrichtungsseite zeigt einen QR-Code zum Abfotografieren",
  einrichtenSeite.html.includes("data:image/gif;base64,"));
const geheimnis = geheimnisAusSeite(einrichtenSeite.html);
pruefe("… und ein Geheimnis, aus dem sich Codes erzeugen lassen",
  typeof geheimnis === "string" && geheimnis.length >= 16);

// ── 3. Ein FALSCHER Code aktiviert NICHTS ──────────────────────────
/* actionFelder() liefert nur die versteckten $ACTION-Felder — das
   eigene, versteckte Feld "geheimnis" muss deshalb wie ein normales
   Formularfeld mitgeschickt werden, genau wie ein Browser es täte. */
const einrichtenFelder = actionFelder(einrichtenSeite.html, "geheimnis");
const falscheEinrichtung = await sende("/admin/zweiter-faktor", einrichtenFelder,
  { geheimnis, code: "000000" }, eingerichtetAls.cookie);
const nachFalschemVersuch = await db.adminUser.findUniqueOrThrow({ where: { id: zugang.id } });
pruefe("Ein falscher Code bei der Einrichtung aktiviert den zweiten Faktor NICHT",
  nachFalschemVersuch.zweiterFaktorAktiv === false,
  falscheEinrichtung.text.includes("stimmt nicht") ? "verständliche Meldung" : "unerwartete Antwort");

// ── 4. Ein RICHTIGER Code aktiviert und zeigt Backup-Codes ─────────
const richtigeEinrichtung = await sende("/admin/zweiter-faktor", einrichtenFelder,
  { geheimnis, code: codeFuer(geheimnis) }, eingerichtetAls.cookie);
const nachEinrichtung = await db.adminUser.findUniqueOrThrow({ where: { id: zugang.id } });
pruefe("Ein richtiger Code aktiviert den zweiten Faktor",
  nachEinrichtung.zweiterFaktorAktiv === true && nachEinrichtung.zweiterFaktorGeheimnis === geheimnis);

const backupTreffer = [...richtigeEinrichtung.text.matchAll(/\b(\d{5}-\d{5})\b/g)].map((m) => m[1]);
pruefe("… und liefert acht Backup-Codes im Klartext, GENAU JETZT",
  backupTreffer.length === 8, `${backupTreffer.length} gefunden`);

const gespeicherteCodes = await db.adminZweiterFaktorCode.findMany({ where: { adminId: zugang.id } });
pruefe("In der Datenbank steht dabei nur der HASH der Backup-Codes, nie der Code selbst",
  gespeicherteCodes.length === 8 &&
  gespeicherteCodes.every((c) => c.codeHash.startsWith("scrypt$") &&
    !backupTreffer.some((klartext) => c.codeHash.includes(klartext))));

await sende("/admin", actionFelder((await hole("/admin", eingerichtetAls.cookie)).html, "Abmelden"),
  {}, eingerichtetAls.cookie);

// ── 5. Anmeldung: Passwort allein genügt jetzt NICHT mehr ──────────
await db.anmeldeVersuch.deleteMany({});
const nurPasswort = await anmelden(EMAIL, PASSWORT, "192.0.2.42");
pruefe("Mit aktivem zweiten Faktor legt das Passwort allein KEINE Sitzung an",
  nurPasswort.cookie === null && (await db.adminSession.count({ where: { adminId: zugang.id } })) === 0);
pruefe("… und verlangt sichtbar den zweiten Schritt",
  nurPasswort.antwort.text.includes("Code aus der App"));

const pruefungKeks = keksWert(nurPasswort.antwort.setCookie, "vera_admin_2fa");
pruefe("… über ein EIGENES, kurzlebiges Cookie — nicht das normale Sitzungscookie",
  pruefungKeks !== null);

// ── 6. Ein FALSCHER Code meldet NICHT an ───────────────────────────
const codeSeite = await hole("/admin/login", pruefungKeks);
const codeFelder = actionFelder(codeSeite.html, 'name="code"');
const falscherCode = await sende("/admin/login", codeFelder, { code: "111111" }, pruefungKeks);
pruefe("Ein falscher Code lehnt ab, OHNE eine Sitzung anzulegen",
  (await db.adminSession.count({ where: { adminId: zugang.id } })) === 0 &&
  falscherCode.text.includes("Der Code stimmt nicht"));

// ── 7. Der RICHTIGE Code meldet an ─────────────────────────────────
const richtigerCode = await sende("/admin/login", codeFelder, { code: codeFuer(geheimnis) }, pruefungKeks);
const sitzungKeks = keksWert(richtigerCode.setCookie, "vera_admin");
pruefe("Der richtige Code aus der App schließt die Anmeldung ab",
  sitzungKeks !== null && (await db.adminSession.count({ where: { adminId: zugang.id } })) === 1);

const nachAbschluss = await hole("/admin/login");
pruefe("… der Zwischenschritt ist danach beendet, nicht wiederverwendbar",
  (await db.adminZweiterFaktorPruefung.count({ where: { adminId: zugang.id } })) === 0);

// ── 8. Ein Backup-Code meldet an — und dann kein zweites Mal ───────
await sende("/admin", actionFelder((await hole("/admin", sitzungKeks)).html, "Abmelden"), {}, sitzungKeks);
await db.anmeldeVersuch.deleteMany({});
const backupVersuch1 = await anmelden(EMAIL, PASSWORT, "192.0.2.43");
const backupCode = backupTreffer[0];
const backupKeks = keksWert(backupVersuch1.antwort.setCookie, "vera_admin_2fa");
const backupSeite = await hole("/admin/login", backupKeks);
const backupFelder = actionFelder(backupSeite.html, 'name="code"');
const ersterBackup = await sende("/admin/login", backupFelder, { code: backupCode }, backupKeks);
pruefe("Ein Backup-Code meldet ebenfalls an",
  keksWert(ersterBackup.setCookie, "vera_admin") !== null);

await sende("/admin", actionFelder((await hole("/admin", keksWert(ersterBackup.setCookie, "vera_admin"))).html, "Abmelden"),
  {}, keksWert(ersterBackup.setCookie, "vera_admin"));
await db.anmeldeVersuch.deleteMany({});
const backupVersuch2 = await anmelden(EMAIL, PASSWORT, "192.0.2.44");
const backupKeks2 = keksWert(backupVersuch2.antwort.setCookie, "vera_admin_2fa");
const backupSeite2 = await hole("/admin/login", backupKeks2);
const backupFelder2 = actionFelder(backupSeite2.html, 'name="code"');
const zweiterBackup = await sende("/admin/login", backupFelder2, { code: backupCode }, backupKeks2);
pruefe("… derselbe Backup-Code funktioniert danach NICHT noch einmal",
  keksWert(zweiterBackup.setCookie, "vera_admin") === null);

// ── 9. Bremse gegen das Durchprobieren von Codes ───────────────────
await db.anmeldeVersuch.deleteMany({});
const bremsVersuch = await anmelden(EMAIL, PASSWORT, "192.0.2.45");
const bremsKeks = keksWert(bremsVersuch.antwort.setCookie, "vera_admin_2fa");
const bremsSeite = await hole("/admin/login", bremsKeks);
const bremsFelder = actionFelder(bremsSeite.html, 'name="code"');
let bremseGegriffen = 0;
for (let i = 0; i < 11; i += 1) {
  const r = await sende("/admin/login", bremsFelder, { code: "222222" }, bremsKeks);
  if (r.text.includes("Zu viele Anmeldeversuche")) bremseGegriffen += 1;
}
/* ZWEITER_FAKTOR_MAX = 8 (lib/ratelimit.ts): die ersten 8 Versuche
   werden noch geprüft (und als falsch abgelehnt), erst danach greift
   die Bremse — bei 11 Versuchen also genau 3 abgewiesene. */
pruefe("Nach 8 Fehlversuchen greift eine eigene Bremse für den zweiten Faktor",
  bremseGegriffen === 3, `${bremseGegriffen} von 11 abgewiesen`);

// ── 10. Deaktivieren verlangt selbst einen gültigen Code ───────────
await db.anmeldeVersuch.deleteMany({});
const letzterZugang = await anmelden(EMAIL, PASSWORT, "192.0.2.50");
const letzteSeite = await hole("/admin/login", keksWert(letzterZugang.antwort.setCookie, "vera_admin_2fa"));
const letzteFelder = actionFelder(letzteSeite.html, 'name="code"');
const angemeldet = await sende("/admin/login", letzteFelder,
  { code: codeFuer(geheimnis) }, keksWert(letzterZugang.antwort.setCookie, "vera_admin_2fa"));
const sitzung3 = keksWert(angemeldet.setCookie, "vera_admin");

const einstellungsSeite = await hole("/admin/zweiter-faktor", sitzung3);
const deaktivierenFelder = actionFelder(einstellungsSeite.html, "Deaktivieren");
const falschesDeaktivieren = await sende("/admin/zweiter-faktor", deaktivierenFelder,
  { code: "333333" }, sitzung3);
pruefe("Deaktivieren mit einem FALSCHEN Code lässt den zweiten Faktor aktiv",
  (await db.adminUser.findUniqueOrThrow({ where: { id: zugang.id } })).zweiterFaktorAktiv === true,
  falschesDeaktivieren.text.includes("stimmt nicht") ? "verständliche Meldung" : "unerwartete Antwort");

await sende("/admin/zweiter-faktor", deaktivierenFelder, { code: codeFuer(geheimnis) }, sitzung3);
const nachDeaktivierung = await db.adminUser.findUniqueOrThrow({ where: { id: zugang.id } });
pruefe("… ein RICHTIGER Code deaktiviert ihn, samt Geheimnis",
  nachDeaktivierung.zweiterFaktorAktiv === false && nachDeaktivierung.zweiterFaktorGeheimnis === null);
pruefe("… und entfernt die Backup-Codes",
  (await db.adminZweiterFaktorCode.count({ where: { adminId: zugang.id } })) === 0);

await sende("/admin", actionFelder((await hole("/admin", sitzung3)).html, "Abmelden"), {}, sitzung3);

// ── 11. Danach meldet das Passwort wieder allein an ────────────────
await db.anmeldeVersuch.deleteMany({});
const wiederNurPasswort = await anmelden(EMAIL, PASSWORT, "192.0.2.51");
pruefe("Nach dem Deaktivieren meldet das Passwort allein wieder an",
  wiederNurPasswort.cookie !== null);
await sende("/admin", actionFelder((await hole("/admin", wiederNurPasswort.cookie)).html, "Abmelden"),
  {}, wiederNurPasswort.cookie);

// ── 12. Notausgang: npm run admin schaltet den zweiten Faktor ab ──
/* Erneut einrichten, dann simulieren, dass Gerät UND Backup-Codes
   verloren sind — der einzige verbleibende Weg ist die Kommandozeile
   auf dem Server. */
await db.anmeldeVersuch.deleteMany({});
const erneutAn = await anmelden(EMAIL, PASSWORT, "192.0.2.52");
const erneuteSeite = await hole("/admin/zweiter-faktor", erneutAn.cookie);
const zweitesGeheimnis = geheimnisAusSeite(erneuteSeite.html);
await sende("/admin/zweiter-faktor", actionFelder(erneuteSeite.html, "geheimnis"),
  { geheimnis: zweitesGeheimnis, code: codeFuer(zweitesGeheimnis) }, erneutAn.cookie);
pruefe("Zweiter Faktor zur Vorbereitung des Notausgang-Tests erneut aktiv",
  (await db.adminUser.findUniqueOrThrow({ where: { id: zugang.id } })).zweiterFaktorAktiv === true);

const { execSync } = await import("node:child_process");
execSync(`npm run admin -- ${EMAIL} "${PASSWORT}-neu-lang-genug"`, { stdio: "pipe" });
const nachNotausgang = await db.adminUser.findUniqueOrThrow({ where: { id: zugang.id } });
pruefe("„npm run admin“ (Passwort setzen) deaktiviert dabei den zweiten Faktor",
  nachNotausgang.zweiterFaktorAktiv === false && nachNotausgang.zweiterFaktorGeheimnis === null,
  "— der Notausgang, wenn Gerät UND Backup-Codes verloren sind");
pruefe("… und räumt die Backup-Codes mit weg",
  (await db.adminZweiterFaktorCode.count({ where: { adminId: zugang.id } })) === 0);

// ── 13. Protokoll: Einrichten/Deaktivieren stehen drin, ohne Codes ─
const protokollEintraege = await db.adminProtokoll.findMany({
  where: { adminId: zugang.id },
});
const aktionen = protokollEintraege.map((e) => e.aktion);
pruefe("Einrichten und Deaktivieren stehen im Protokoll",
  aktionen.includes("zugang.zweiter-faktor-eingerichtet") &&
  aktionen.includes("zugang.zweiter-faktor-deaktiviert"),
  aktionen.join(", "));

const protokollText = protokollEintraege.map((e) => [e.aktion, e.zielArt, e.zielId, e.detail].join("|")).join("\n");
pruefe("… OHNE dass darin ein Geheimnis, ein Code oder ein Backup-Code steht",
  !protokollText.includes(geheimnis) &&
  !protokollText.includes(zweitesGeheimnis) &&
  !backupTreffer.some((c) => protokollText.includes(c)));

// ── Aufräumen ───────────────────────────────────────────────────────
await db.adminZweiterFaktorPruefung.deleteMany({ where: { adminId: zugang.id } });
await db.adminZweiterFaktorCode.deleteMany({ where: { adminId: zugang.id } });
await db.adminSession.deleteMany({ where: { adminId: zugang.id } });
await db.adminProtokoll.deleteMany({ where: { adminId: zugang.id } });
await db.adminUser.delete({ where: { id: zugang.id } });
await db.anmeldeVersuch.deleteMany({});

console.log(
  schief.length === 0
    ? `\nAlle ${n} Prüfungen bestanden.`
    : `\n${schief.length} fehlgeschlagen:\n- ${schief.join("\n- ")}`,
);
await db.$disconnect();
process.exitCode = schief.length === 0 ? 0 : 1;
