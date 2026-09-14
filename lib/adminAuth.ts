/* ---------------------------------------------------------------
   Zugang zum Adminbereich.

   Eine Sitzung besteht aus zwei Teilen:

     im Browser      ein zufälliger Schlüssel in einem httpOnly-Cookie
     in der Datenbank  nur der SHA-256-Hash dieses Schlüssels

   Warum der Hash: Aus derselben Überlegung wie bei Passwörtern. Wer
   die Datenbank in die Hände bekommt, kann sich mit den Zeilen darin
   nicht anmelden — er hält nur Prüfsummen.

   Warum SHA-256 hier genügt, bei Passwörtern aber nicht: Der
   Schlüssel besteht aus 32 zufälligen Bytes. Den kann man nicht
   erraten, auch nicht mit beliebig viel Rechenzeit. Ein Passwort, das
   sich ein Mensch merken kann, dagegen schon — deshalb braucht es
   dort ein absichtlich langsames Verfahren.

   Warum überhaupt eine Tabelle statt eines signierten Cookies: Nur so
   lässt sich eine Sitzung wirklich beenden. Ein signiertes Cookie
   gilt bis zum Ablaufdatum weiter, auch nach einem Passwortwechsel.
   --------------------------------------------------------------- */

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";

const COOKIE = "vera_admin";
/** Der Zwischenschritt "Passwort stimmt, Code fehlt noch" — eigenes, kürzeres Cookie. */
const PRUEFUNG_COOKIE = "vera_admin_2fa";
/**
 * Wie lange der Zwischenschritt gilt, bevor die Anmeldung neu
 * beginnen muss. Bewusst kurz: Es ist nur die Zeit, die jemand
 * braucht, um die App zu öffnen und den Code abzutippen — nicht die
 * Dauer einer ganzen Sitzung.
 */
const PRUEFUNG_MINUTEN = 5;
/**
 * Wie lange eine Anmeldung gilt, bevor sie erneut nötig wird.
 *
 * Zwei Tage statt der früheren sieben. Der Grund ist einfach: Ein
 * Cookie, das jemandem in die Hände fällt, funktioniert genau so
 * lange, wie diese Zahl sagt — eine Woche ist dafür zu großzügig.
 * Zwei Tage sind kurz genug, dass ein abhandengekommener Zugang
 * schnell wertlos wird, und lang genug, dass man sich nicht bei jedem
 * Blick in die Anmeldungen neu anmelden muss.
 */
export const SITZUNG_TAGE = 2;

const alsHash = (schluessel: string) =>
  createHash("sha256").update(schluessel).digest("hex");

export interface AngemeldeterAdmin {
  id: string;
  email: string;
}


/**
 * Legt eine Sitzung an und setzt das Cookie.
 *
 * Die Cookie-Einstellungen im Einzelnen:
 *   httpOnly  JavaScript im Browser kommt nicht heran. Damit hilft
 *             ein eingeschleustes Skript einem Angreifer nicht weiter.
 *   sameSite  Das Cookie wird bei Aufrufen von fremden Seiten aus
 *             nicht mitgeschickt — Grundschutz gegen fremde
 *             Formulare, die im Namen des Admins etwas auslösen.
 *   secure    Nur über HTTPS. In der Entwicklung läuft die Seite über
 *             http, dort würde das Cookie sonst nie ankommen.
 */
export async function sitzungStarten(adminId: string): Promise<void> {
  const schluessel = randomBytes(32).toString("base64url");
  const laeuftAbAm = new Date(Date.now() + SITZUNG_TAGE * 24 * 60 * 60_000);

  // Abgelaufene Sitzungen bei der Gelegenheit wegräumen, damit die
  // Tabelle nicht endlos wächst.
  await db.adminSession.deleteMany({ where: { laeuftAbAm: { lt: new Date() } } });

  await db.adminSession.create({
    data: { adminId, tokenHash: alsHash(schluessel), laeuftAbAm },
  });

  const keks = await cookies();
  keks.set(COOKIE, schluessel, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: laeuftAbAm,
  });
}

/** Beendet die aktuelle Sitzung — im Browser und in der Datenbank. */
export async function sitzungBeenden(): Promise<void> {
  const keks = await cookies();
  const schluessel = keks.get(COOKIE)?.value;
  if (schluessel) {
    await db.adminSession.deleteMany({ where: { tokenHash: alsHash(schluessel) } });
  }
  keks.delete(COOKIE);
}

/**
 * Beendet ALLE Sitzungen dieses Zugangs — auf jedem Gerät.
 *
 * Der Notausgang für den Fall, dass ein Gerät verloren geht oder der
 * Verdacht besteht, dass jemand mitliest. Bisher ging das nur über
 * einen Passwortwechsel auf der Kommandozeile des Servers — also
 * ausgerechnet dann nicht, wenn man unterwegs ist und kein Terminal
 * zur Hand hat.
 *
 * Weil die Sitzungen in der Datenbank stehen und im Cookie nur ein
 * Schlüssel, genügt dafür ein Löschen: Jedes andere Gerät fällt beim
 * nächsten Klick auf das Anmeldeformular zurück. Bei einem bloß
 * signierten Cookie ginge das nicht — es gälte bis zum Ablaufdatum
 * weiter, ganz gleich, was der Server davon hält.
 */
export async function alleSitzungenBeenden(adminId: string): Promise<number> {
  const weg = await db.adminSession.deleteMany({ where: { adminId } });
  // Auch das Cookie dieses Geräts wegnehmen — es zeigt jetzt ins Leere.
  (await cookies()).delete(COOKIE);
  return weg.count;
}

/**
 * Wer ist gerade angemeldet? null, wenn niemand.
 *
 * Wird bei JEDER geschützten Seite und JEDER Admin-Aktion aufgerufen.
 * Bewusst nicht nur im Layout: Ein Layout wird bei manchen Navigationen
 * nicht erneut ausgeführt, und eine Server-Aktion läuft ohnehin an
 * jedem Layout vorbei. Die Prüfung gehört an die Stelle, die etwas
 * herausgibt oder verändert.
 */
export async function aktuellerAdmin(): Promise<AngemeldeterAdmin | null> {
  const keks = await cookies();
  const schluessel = keks.get(COOKIE)?.value;
  if (!schluessel) return null;

  const sitzung = await db.adminSession.findUnique({
    where: { tokenHash: alsHash(schluessel) },
    include: { admin: { select: { id: true, email: true } } },
  });

  if (!sitzung) return null;
  if (sitzung.laeuftAbAm.getTime() < Date.now()) {
    await db.adminSession.delete({ where: { id: sitzung.id } }).catch(() => {});
    return null;
  }
  return sitzung.admin;
}

/** Wie aktuellerAdmin(), leitet aber zum Anmeldeformular, wenn niemand angemeldet ist. */
export async function verlangeAdmin(): Promise<AngemeldeterAdmin> {
  const admin = await aktuellerAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/* ---------------------------------------------------------------
   Der Zwischenschritt für den zweiten Faktor.

   Dasselbe Muster wie die eigentliche Sitzung oben: im Browser ein
   zufälliger Schlüssel, in der Datenbank nur dessen Hash. Der
   Unterschied ist die Bedeutung: Diese "Sitzung" berechtigt zu NICHTS
   außer der Eingabe des zweiten Faktors. Erst wenn der stimmt,
   entsteht über sitzungStarten() die richtige Sitzung.
   --------------------------------------------------------------- */

export interface LaufendePruefung {
  id: string;
  adminId: string;
}

/** Beginnt den Zwischenschritt und setzt das eigene Cookie dafür. */
export async function zweiterFaktorPruefungStarten(adminId: string): Promise<void> {
  const schluessel = randomBytes(32).toString("base64url");
  const laeuftAbAm = new Date(Date.now() + PRUEFUNG_MINUTEN * 60_000);

  await db.adminZweiterFaktorPruefung.deleteMany({ where: { laeuftAbAm: { lt: new Date() } } });
  await db.adminZweiterFaktorPruefung.create({
    data: { adminId, tokenHash: alsHash(schluessel), laeuftAbAm },
  });

  const keks = await cookies();
  keks.set(PRUEFUNG_COOKIE, schluessel, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: laeuftAbAm,
  });
}

/** Der laufende Zwischenschritt, falls es einen gibt und er noch gilt. */
export async function zweiterFaktorPruefungAktuell(): Promise<LaufendePruefung | null> {
  const keks = await cookies();
  const schluessel = keks.get(PRUEFUNG_COOKIE)?.value;
  if (!schluessel) return null;

  const eintrag = await db.adminZweiterFaktorPruefung.findUnique({
    where: { tokenHash: alsHash(schluessel) },
  });
  if (!eintrag) return null;
  if (eintrag.laeuftAbAm.getTime() < Date.now()) {
    await db.adminZweiterFaktorPruefung.delete({ where: { id: eintrag.id } }).catch(() => {});
    return null;
  }
  return { id: eintrag.id, adminId: eintrag.adminId };
}

/** Beendet den Zwischenschritt — nach Erfolg, Abbruch oder Fehlschlag gleichermaßen. */
export async function zweiterFaktorPruefungBeenden(): Promise<void> {
  const keks = await cookies();
  const schluessel = keks.get(PRUEFUNG_COOKIE)?.value;
  if (schluessel) {
    await db.adminZweiterFaktorPruefung.deleteMany({ where: { tokenHash: alsHash(schluessel) } });
  }
  keks.delete(PRUEFUNG_COOKIE);
}
