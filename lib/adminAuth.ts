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
/** Wie lange eine Anmeldung gilt, bevor sie erneut nötig wird. */
export const SITZUNG_TAGE = 7;

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
