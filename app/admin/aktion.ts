"use server";

/* ---------------------------------------------------------------
   Anmelden und Abmelden am Adminbereich.
   --------------------------------------------------------------- */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { passtPasswort, hashen } from "@/lib/passwort";
import {
  sitzungStarten,
  sitzungBeenden,
  alleSitzungenBeenden,
  verlangeAdmin,
  zweiterFaktorPruefungStarten,
  zweiterFaktorPruefungAktuell,
  zweiterFaktorPruefungBeenden,
  type LaufendePruefung,
} from "@/lib/adminAuth";
import { protokolliere, PROTOKOLL_AKTIONEN } from "@/lib/adminProtokoll";
import type { LoginErgebnis } from "@/lib/adminLogin";
import {
  loginKontoVersuchErlaubt,
  loginVersuchErlaubt,
  zweiterFaktorVersuchErlaubt,
} from "@/lib/ratelimit";
import { totpCodeStimmt, backupCodeStimmt } from "@/lib/zweiterFaktor";

/**
 * Ein Blindwert, gegen den geprüft wird, wenn es die E-Mail-Adresse
 * gar nicht gibt.
 *
 * Klingt umständlich, hat aber einen Grund: Bricht man bei einer
 * unbekannten Adresse sofort ab, antwortet der Server in wenigen
 * Millisekunden — bei einer bekannten Adresse dauert die
 * Passwortprüfung deutlich länger. Aus diesem Unterschied liesse sich
 * ablesen, welche Adressen existieren. Deshalb wird immer gerechnet.
 */
let blindHash: string | null = null;
async function blindPruefen(passwort: string): Promise<void> {
  blindHash ??= await hashen("kein-konto-mit-dieser-adresse");
  await passtPasswort(passwort, blindHash);
}

function text(wert: FormDataEntryValue | null): string {
  return typeof wert === "string" ? wert : "";
}

/* Dieselbe Meldung für BEIDE Bremsen. Welche von ihnen gegriffen hat,
   geht den Absender nichts an — und als Konstante können die beiden
   Texte nicht auseinanderlaufen. */
const ZU_VIELE = "Zu viele Anmeldeversuche. Bitte in einigen Minuten noch einmal versuchen.";

export async function anmelden(
  _bisher: LoginErgebnis,
  formular: FormData,
): Promise<LoginErgebnis> {
  /* Welcher Schritt gemeint ist, entscheidet sich AUSSCHLIESSLICH an
     serverseitigem Zustand (dem Zwischenschritt-Cookie) — nicht an
     einem Client-Zustand. So funktioniert der zweite Schritt auch
     ohne JavaScript: Ein erneutes Absenden nach einem Seitenneuaufbau
     landet wieder an derselben Stelle, weil das Formular selbst
     (siehe LoginFormular.tsx) ebenfalls aus dem servergelieferten
     Zustand ableitet, welche Felder es zeigt. */
  const laufendePruefung = await zweiterFaktorPruefungAktuell();
  if (laufendePruefung && formular.get("code") !== null) {
    return zweitenFaktorPruefen(laufendePruefung, formular);
  }

  const email = text(formular.get("email")).trim().toLowerCase();
  const passwort = text(formular.get("passwort"));

  const kopf = await headers();
  const ip =
    kopf.get("x-forwarded-for")?.split(",")[0]?.trim() || kopf.get("x-real-ip") || "unbekannt";

  if (!(await loginVersuchErlaubt(ip))) {
    return { meldung: ZU_VIELE };
  }

  if (!email || !passwort) {
    return { meldung: "Bitte E-Mail-Adresse und Passwort angeben." };
  }

  /* Zweite Bremse, diesmal je Konto statt je Adresse. Sie fängt genau
     den Fall, den die erste nicht sieht: Versuche, die über viele
     verschiedene Adressen verteilt kommen.

     Bewusst AUCH für unbekannte Adressen und bewusst VOR dem Blick in
     die Datenbank: Würde nur bei vorhandenen Konten gezählt, verriete
     die Sperre, welche Adressen es gibt — genau das, was die
     einheitliche Fehlermeldung weiter unten verhindern soll. */
  if (!(await loginKontoVersuchErlaubt(email))) {
    return { meldung: ZU_VIELE };
  }

  const admin = await db.adminUser.findUnique({ where: { email } });

  if (!admin) {
    await blindPruefen(passwort);
    // Bewusst dieselbe Meldung wie beim falschen Passwort: Wer sie
    // unterscheidet, verrät, welche Adressen es gibt.
    return { meldung: "E-Mail-Adresse oder Passwort stimmt nicht." };
  }

  if (!(await passtPasswort(passwort, admin.passwortHash))) {
    return { meldung: "E-Mail-Adresse oder Passwort stimmt nicht." };
  }

  if (admin.zweiterFaktorAktiv) {
    // Bewusst NOCH KEINE Sitzung und noch kein „letzterLogin" — beides
    // erst, wenn auch der zweite Faktor stimmt. Bis dahin berechtigt
    // dieses Cookie zu nichts außer der Eingabe des Codes.
    await zweiterFaktorPruefungStarten(admin.id);
    return { zweiterFaktorNoetig: true };
  }

  await db.adminUser.update({
    where: { id: admin.id },
    data: { letzterLogin: new Date() },
  });
  await sitzungStarten(admin.id);

  redirect("/admin");
}

/**
 * Der zweite Schritt: Passwort stand schon fest, jetzt der TOTP- oder
 * Backup-Code.
 *
 * Nicht exportiert — erreichbar ausschließlich über `anmelden()`
 * oben, das anhand des Zwischenschritt-Cookies entscheidet, ob dieser
 * Zweig gemeint ist. Ein einziger exportierter Einstiegspunkt hält
 * die Formular-Anbindung (LoginFormular.tsx) einfach: ein Formular,
 * eine Aktion.
 */
async function zweitenFaktorPruefen(
  pruefung: LaufendePruefung,
  formular: FormData,
): Promise<LoginErgebnis> {
  if (!(await zweiterFaktorVersuchErlaubt(pruefung.id))) {
    return { meldung: ZU_VIELE, zweiterFaktorNoetig: true };
  }

  const eingabe = text(formular.get("code")).trim();
  if (!eingabe) {
    return { meldung: "Bitte den Code eingeben.", zweiterFaktorNoetig: true };
  }

  const admin = await db.adminUser.findUnique({ where: { id: pruefung.adminId } });

  // Zwischen den beiden Schritten könnte der zweite Faktor
  // deaktiviert worden sein (an einem anderen Gerät, oder über die
  // Kommandozeile bei einem verlorenen Zugang) — dann ist der
  // Zwischenschritt hinfällig, ganz gleich, was hier eingegeben wird.
  if (!admin || !admin.zweiterFaktorAktiv || !admin.zweiterFaktorGeheimnis) {
    await zweiterFaktorPruefungBeenden();
    return { meldung: "E-Mail-Adresse oder Passwort stimmt nicht." };
  }

  const ziffern = eingabe.replace(/\D/g, "");
  const stimmt =
    ziffern.length === 6
      ? totpCodeStimmt(admin.zweiterFaktorGeheimnis, ziffern)
      : ziffern.length === 10
        ? await backupCodeStimmt(admin.id, ziffern)
        : false;

  if (!stimmt) {
    return { meldung: "Der Code stimmt nicht.", zweiterFaktorNoetig: true };
  }

  await zweiterFaktorPruefungBeenden();
  await db.adminUser.update({
    where: { id: admin.id },
    data: { letzterLogin: new Date() },
  });
  await sitzungStarten(admin.id);

  redirect("/admin");
}

export async function abmelden(): Promise<void> {
  await sitzungBeenden();
  redirect("/admin/login");
}

/**
 * Auf allen Geräten abmelden.
 *
 * Beendet jede offene Sitzung dieses Zugangs, nicht nur die des
 * eigenen Browsers. Gedacht für den Fall, dass ein Gerät verloren
 * geht — oder einfach für das gute Gefühl, nach der Arbeit an einem
 * fremden Rechner alles hinter sich zuzumachen.
 *
 * Die Zugangsprüfung steht auch hier am Anfang: Ohne Sitzung soll
 * niemand fremde Sitzungen beenden können. Das wäre zwar kein
 * Datendiebstahl, aber eine bequeme Art, den Betreiber aus seinem
 * eigenen Bereich auszusperren.
 */
export async function ueberallAbmelden(): Promise<void> {
  const admin = await verlangeAdmin();
  const anzahl = await alleSitzungenBeenden(admin.id);

  await protokolliere({
    adminId: admin.id,
    aktion: PROTOKOLL_AKTIONEN.zugangUeberallAbgemeldet,
    detail: `${anzahl} Sitzung(en) beendet`,
  });

  redirect("/admin/login?abgemeldet=alle");
}
