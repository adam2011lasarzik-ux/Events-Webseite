/* ---------------------------------------------------------------
   Zweiter Faktor (TOTP) für den Adminbereich.

   Warum die Bibliothek `otpauth` statt einer Eigenimplementierung
   von RFC 6238 mit node:crypto: Der HMAC-Kern selbst liesse sich mit
   node:crypto leicht nachbauen — die eigentlichen Fehlerquellen bei
   TOTP liegen aber nicht dort, sondern in der Zusammensetzung:

     - die richtige Zeitfenster-Toleranz gegen ungenaue Handy-Uhren,
       ohne das Zeitfenster unnötig weit zu öffnen
     - Base32-Sonderfälle bei Kodierung und Dekodierung des Geheimnisses
     - Zusammenarbeit mit echten Apps (Google Authenticator, Authy,
       1Password, …), die sich nur gegen echte Apps prüfen lässt

   `otpauth` deckt genau das ab, wird aktiv gepflegt, hat eine einzige,
   ebenfalls gepflegte Abhängigkeit (`@noble/hashes`) und trug zum
   Zeitpunkt der Prüfung (September 2026) keine offene
   Sicherheitsmeldung. Das war der Grund, die ursprünglich erwogene
   Eigenimplementierung zu verwerfen.

   `qrcode-generator` erzeugt aus der otpauth-URI ein Bild zum
   Abfotografieren — ohne Netzzugriff, ohne Abhängigkeit auf einen
   fremden Dienst.
   --------------------------------------------------------------- */

import { randomInt } from "node:crypto";
import * as OTPAuth from "otpauth";
import qrcode from "qrcode-generator";
import { db } from "./db";
import { hashen, passtPasswort } from "./passwort";

/** Erscheint in der Authenticator-App als Gruppenname. */
const AUSSTELLER = "VERA Verwaltung";

function totpFuer(base32Geheimnis: string, label: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: AUSSTELLER,
    label,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(base32Geheimnis),
  });
}

export interface NeueEinrichtung {
  /** Das Geheimnis als Base32 — wird erst nach der Bestätigung gespeichert. */
  geheimnis: string;
  /** Fertiges Bild zum Abfotografieren, als data:-URL. */
  qrDataUrl: string;
}

/**
 * Erzeugt ein neues, noch unbestätigtes Geheimnis samt QR-Code.
 *
 * Wird noch NICHT gespeichert — das geschieht erst, wenn ein damit
 * erzeugter Code tatsächlich eingegeben wurde (siehe `aktivieren()`
 * in app/admin/zweiter-faktor/aktion.ts). Sonst könnte sich ein
 * Administrator aus dem eigenen Konto aussperren, wenn der QR-Code
 * beim Abfotografieren danebengeht.
 */
export function neueEinrichtung(email: string): NeueEinrichtung {
  const geheimnis = new OTPAuth.Secret({ size: 20 }).base32;
  const totp = totpFuer(geheimnis, email);

  const qr = qrcode(0, "M");
  qr.addData(totp.toString());
  qr.make();

  return { geheimnis, qrDataUrl: qr.createDataURL(6, 4) };
}

/**
 * Prüft einen 6-stelligen App-Code gegen das gespeicherte Geheimnis.
 *
 * `window: 1` erlaubt eine Abweichung von einem Zeitschritt (±30
 * Sekunden) — genug gegen eine leicht ungenaue Handy-Uhr, ohne das
 * Zeitfenster unnötig weit zu öffnen.
 *
 * WICHTIG, und leicht zu übersehen: `validate()` liefert bei Erfolg
 * die Abweichung in Zeitschritten zurück (0 = genau richtig) und bei
 * Misserfolg `null`. Die Zahl 0 ist in JavaScript falsy — ein
 * `if (ergebnis)` würde einen exakt passenden Code fälschlich als
 * falsch behandeln. Deshalb hier ausdrücklich gegen `null` geprüft.
 */
export function totpCodeStimmt(base32Geheimnis: string, code: string): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const totp = totpFuer(base32Geheimnis, "");
  return totp.validate({ token: code, window: 1 }) !== null;
}

/** Wie viele Backup-Codes bei einer (Neu-)Einrichtung entstehen. */
const BACKUP_ANZAHL = 8;

/** Ein zehnstelliger Code, in zwei Fünfergruppen für die Lesbarkeit. */
function zufallsBackupCode(): string {
  let ziffern = "";
  for (let i = 0; i < 10; i++) ziffern += randomInt(10);
  return `${ziffern.slice(0, 5)}-${ziffern.slice(5)}`;
}

/**
 * Aktiviert den zweiten Faktor endgültig und legt neue Backup-Codes
 * an. Ersetzt dabei IMMER alle bisherigen Backup-Codes — ein
 * Neustart der Einrichtung soll nicht dazu führen, dass alte,
 * vielleicht schon einmal gezeigte Codes weiter gültig bleiben.
 *
 * Gibt die Backup-Codes im KLARTEXT zurück — das einzige Mal, dass
 * sie das tun. Danach ist nur noch ihr Hash gespeichert.
 */
export async function zweiterFaktorAktivieren(
  adminId: string,
  geheimnis: string,
): Promise<string[]> {
  const klartext = Array.from({ length: BACKUP_ANZAHL }, zufallsBackupCode);
  // Gehasht wird die reine Ziffernfolge OHNE den Bindestrich — er ist
  // nur eine Lesehilfe bei der Anzeige. So passt der Hash unabhängig
  // davon, ob die Eingabe später mit oder ohne Bindestrich ankommt;
  // backupCodeStimmt() unten prüft ebenfalls gegen die reine Ziffernfolge.
  const hashes = await Promise.all(klartext.map((code) => hashen(code.replace(/-/g, ""))));

  await db.$transaction([
    db.adminUser.update({
      where: { id: adminId },
      data: { zweiterFaktorGeheimnis: geheimnis, zweiterFaktorAktiv: true },
    }),
    db.adminZweiterFaktorCode.deleteMany({ where: { adminId } }),
    db.adminZweiterFaktorCode.createMany({
      data: hashes.map((codeHash) => ({ adminId, codeHash })),
    }),
  ]);

  return klartext;
}

/**
 * Schaltet den zweiten Faktor wieder aus und entfernt Geheimnis und
 * Backup-Codes vollständig — kein „aktiv: false" mit liegen
 * gebliebenem Geheimnis, das bei einem Fehler wieder auflebt.
 */
export async function zweiterFaktorDeaktivieren(adminId: string): Promise<void> {
  await db.$transaction([
    db.adminUser.update({
      where: { id: adminId },
      data: { zweiterFaktorGeheimnis: null, zweiterFaktorAktiv: false },
    }),
    db.adminZweiterFaktorCode.deleteMany({ where: { adminId } }),
  ]);
}

/**
 * Prüft einen Backup-Code und verbraucht ihn bei Erfolg — sofort und
 * so, dass ein zweiter, gleichzeitiger Versuch mit demselben Code
 * nicht ebenfalls durchkäme.
 *
 * `eingabe` wird als reine Ziffernfolge OHNE Bindestrich erwartet —
 * die Aufrufer entfernen ihn vorher (siehe app/admin/aktion.ts und
 * app/admin/zweiter-faktor/aktion.ts). Genau das ist auch die Form,
 * gegen die zweiterFaktorAktivieren() weiter oben hasht.
 *
 * Die Codes sind gehasht gespeichert (wie Passwörter), es muss also
 * gegen jeden unbenutzten Hash einzeln geprüft werden. Bei acht
 * Codes ist das auch mit dem absichtlich langsamen scrypt vertretbar
 * — geprüft wird nur, wenn jemand tatsächlich einen Backup-Code statt
 * eines App-Codes eingibt, nicht bei jedem Anmeldeversuch.
 */
export async function backupCodeStimmt(adminId: string, eingabe: string): Promise<boolean> {
  const unbenutzt = await db.adminZweiterFaktorCode.findMany({
    where: { adminId, benutztAm: null },
  });

  for (const eintrag of unbenutzt) {
    if (await passtPasswort(eingabe, eintrag.codeHash)) {
      // Bedingtes Update: Nur wenn die Zeile JETZT noch unbenutzt ist,
      // wird sie es. Träfen zwei Versuche gleichzeitig auf denselben
      // Code, gewinnt nur einer — kein doppeltes Verbrauchen.
      const verbraucht = await db.adminZweiterFaktorCode.updateMany({
        where: { id: eintrag.id, benutztAm: null },
        data: { benutztAm: new Date() },
      });
      return verbraucht.count === 1;
    }
  }
  return false;
}

/** Wie viele unbenutzte Backup-Codes noch übrig sind — für die Anzeige. */
export function unbenutzteBackupCodes(adminId: string): Promise<number> {
  return db.adminZweiterFaktorCode.count({ where: { adminId, benutztAm: null } });
}
