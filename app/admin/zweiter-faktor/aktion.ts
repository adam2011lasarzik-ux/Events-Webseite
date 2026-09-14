"use server";

/* ---------------------------------------------------------------
   Den zweiten Faktor selbst einrichten, die Backup-Codes erneuern
   oder ihn wieder abschalten.

   Jede sicherheitsrelevante Änderung verlangt den AKTUELLEN Code
   zur Bestätigung — auch das Abschalten und das Erneuern der
   Backup-Codes. Ohne das würde eine gestohlene, schon angemeldete
   Sitzung genügen, um den zweiten Faktor lautlos zu entfernen.
   --------------------------------------------------------------- */

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verlangeAdmin } from "@/lib/adminAuth";
import { protokolliere, PROTOKOLL_AKTIONEN } from "@/lib/adminProtokoll";
import {
  totpCodeStimmt,
  backupCodeStimmt,
  zweiterFaktorAktivieren,
  zweiterFaktorDeaktivieren,
} from "@/lib/zweiterFaktor";
import type { ZweiterFaktorErgebnis } from "@/lib/zweiterFaktorFormular";

function text(wert: FormDataEntryValue | null): string {
  return typeof wert === "string" ? wert : "";
}

/** Prüft eine Eingabe als App-Code (6 Ziffern) ODER Backup-Code (10 Ziffern). */
async function eingabeStimmt(adminId: string, geheimnis: string, eingabe: string): Promise<boolean> {
  const ziffern = eingabe.replace(/\D/g, "");
  if (ziffern.length === 6) return totpCodeStimmt(geheimnis, ziffern);
  if (ziffern.length === 10) return backupCodeStimmt(adminId, ziffern);
  return false;
}

/**
 * Schließt die Einrichtung ab: prüft den Code gegen das mitgeschickte,
 * noch nicht gespeicherte Geheimnis und aktiviert erst bei Erfolg.
 *
 * Das Geheimnis reist als verstecktes Feld durchs Formular, weil es
 * ohnehin schon im QR-Code auf derselben Seite steht — es erst nach
 * einem erfolgreichen Code in der Datenbank abzulegen, verhindert,
 * dass ein beim Abfotografieren misslungener Versuch zu einem
 * unbrauchbaren, aber bereits aktiven zweiten Faktor führt.
 */
export async function zweiterFaktorEinrichtenBestaetigen(
  _bisher: ZweiterFaktorErgebnis,
  formular: FormData,
): Promise<ZweiterFaktorErgebnis> {
  const admin = await verlangeAdmin();

  const geheimnis = text(formular.get("geheimnis"));
  const code = text(formular.get("code")).replace(/\D/g, "");

  if (!geheimnis || !/^\d{6}$/.test(code)) {
    return { meldung: "Bitte den sechsstelligen Code aus der App eingeben." };
  }
  if (!totpCodeStimmt(geheimnis, code)) {
    return {
      meldung:
        "Der Code stimmt nicht. Prüfe, ob die Uhrzeit auf dem Gerät mit der App stimmt, und versuche es erneut.",
    };
  }

  const backupCodes = await zweiterFaktorAktivieren(admin.id, geheimnis);

  await protokolliere({
    adminId: admin.id,
    aktion: PROTOKOLL_AKTIONEN.zweiterFaktorEingerichtet,
  });

  // Kein redirect: Die Backup-Codes müssen jetzt, im selben Aufruf,
  // angezeigt werden — ein Neuladen der Seite bekäme sie nicht mehr.
  return { backupCodes };
}

/** Ersetzt alle Backup-Codes durch acht neue, nach Bestätigung mit dem aktuellen Code. */
export async function backupCodesErneuern(
  _bisher: ZweiterFaktorErgebnis,
  formular: FormData,
): Promise<ZweiterFaktorErgebnis> {
  const admin = await verlangeAdmin();
  const voll = await db.adminUser.findUniqueOrThrow({ where: { id: admin.id } });

  if (!voll.zweiterFaktorAktiv || !voll.zweiterFaktorGeheimnis) {
    return { meldung: "Der zweite Faktor ist nicht aktiv." };
  }

  const eingabe = text(formular.get("code")).trim();
  if (!(await eingabeStimmt(admin.id, voll.zweiterFaktorGeheimnis, eingabe))) {
    return { meldung: "Der Code stimmt nicht. Die Backup-Codes bleiben unverändert." };
  }

  const backupCodes = await zweiterFaktorAktivieren(admin.id, voll.zweiterFaktorGeheimnis);

  await protokolliere({
    adminId: admin.id,
    aktion: PROTOKOLL_AKTIONEN.zweiterFaktorBackupCodesErneuert,
  });

  return { backupCodes };
}

/** Schaltet den zweiten Faktor aus, nach Bestätigung mit dem aktuellen Code. */
export async function zweiterFaktorDeaktivierenAktion(
  _bisher: ZweiterFaktorErgebnis,
  formular: FormData,
): Promise<ZweiterFaktorErgebnis> {
  const admin = await verlangeAdmin();
  const voll = await db.adminUser.findUniqueOrThrow({ where: { id: admin.id } });

  if (!voll.zweiterFaktorAktiv || !voll.zweiterFaktorGeheimnis) {
    redirect("/admin/zweiter-faktor");
  }

  const eingabe = text(formular.get("code")).trim();
  if (!(await eingabeStimmt(admin.id, voll.zweiterFaktorGeheimnis, eingabe))) {
    return { meldung: "Der Code stimmt nicht. Der zweite Faktor bleibt aktiv." };
  }

  await zweiterFaktorDeaktivieren(admin.id);

  await protokolliere({
    adminId: admin.id,
    aktion: PROTOKOLL_AKTIONEN.zweiterFaktorDeaktiviert,
  });

  redirect("/admin/zweiter-faktor?deaktiviert=1");
}
