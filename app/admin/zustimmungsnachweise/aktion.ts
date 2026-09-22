"use server";

/* ---------------------------------------------------------------
   K3 — reduzierten Zustimmungsnachweis anlegen.

   Bisher konnte niemand einen solchen Datensatz anlegen: Der
   Löschlauf löscht fällige Nachweise automatisch (lib/loeschlauf.ts),
   aber der Erfassungsweg dafür fehlte im Adminbereich vollständig
   (docs/loeschkonzept-betrieb.md, "Was bewusst offen bleibt").

   Gedacht für genau einen Vorgang: Das vollständige Einwilligungs-
   formular (K2) wird nach drei Jahren vernichtet; wer das tut, legt
   hier VORHER den reduzierten Nachweis an, den Dokument 12/13 dafür
   vorsieht — Name, Veranstaltung und der Vermerk "Zustimmung lag
   vor", nichts sonst. Kein Geburtsdatum, keine Mobilnummer, keine
   Gesundheitsangaben — diese Felder gibt es im Modell absichtlich
   nicht (prisma/schema.prisma, Zustimmungsnachweis).

   Am 22.09.2026 entfallen: der Vermerk "selbstständiges Verlassen
   gestattet". Minderjährige dürfen die Veranstaltung seither
   ausnahmslos selbstständig verlassen — es gibt keine Erlaubnis mehr,
   die je Fall erteilt oder verweigert würde, und damit nichts zu
   dokumentieren.

   Die Fälligkeit wird HIER berechnet, nicht vom Formular übernommen:
   faelligZustimmungsnachweis() rechnet ab dem Ende des Kalenderjahres
   der VERANSTALTUNG (nicht der Anlage des Nachweises) — ein von Hand
   eingetragenes Datum könnte versehentlich vom tatsächlichen
   Veranstaltungstermin abweichen und die Frist verfälschen. */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verlangeAdmin } from "@/lib/adminAuth";
import { protokolliere, PROTOKOLL_AKTIONEN } from "@/lib/adminProtokoll";
import { db } from "@/lib/db";
import { faelligZustimmungsnachweis } from "@/lib/loeschfristen";

const NAME_MAX = 200;

function text(wert: FormDataEntryValue | null): string {
  return typeof wert === "string" ? wert.trim() : "";
}

/** Einen reduzierten Zustimmungsnachweis (K3) anlegen. */
export async function zustimmungsnachweisAnlegen(formular: FormData): Promise<void> {
  const admin = await verlangeAdmin();

  const eventId = text(formular.get("eventId"));
  const teilnehmerName = text(formular.get("teilnehmerName")).slice(0, NAME_MAX);
  const zustimmungLagVor = text(formular.get("zustimmungLagVor")) === "an";

  if (!eventId || !teilnehmerName) {
    redirect("/admin/zustimmungsnachweise?hinweis=angaben-fehlen");
  }

  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { startAt: true, endAt: true },
  });
  const termin = event?.endAt ?? event?.startAt;
  if (!termin) {
    // Ohne Termin gibt es keinen Startzeitpunkt für die Frist — genau
    // dieselbe vorsichtige Regel wie beim Löschlauf selbst
    // (lib/loeschfristen.ts → entscheide(), "kein-termin").
    redirect("/admin/zustimmungsnachweise?hinweis=kein-termin");
  }

  const nachweis = await db.zustimmungsnachweis.create({
    data: {
      eventId,
      veranstaltungAm: termin,
      teilnehmerName,
      zustimmungLagVor,
      faelligAm: faelligZustimmungsnachweis(termin),
    },
    select: { id: true },
  });

  await protokolliere({
    adminId: admin.id,
    aktion: PROTOKOLL_AKTIONEN.zustimmungsnachweisAngelegt,
    zielArt: "Zustimmungsnachweis",
    zielId: nachweis.id,
  });

  revalidatePath("/admin/zustimmungsnachweise");
  revalidatePath("/admin/loeschen");
  redirect("/admin/zustimmungsnachweise?hinweis=angelegt");
}
