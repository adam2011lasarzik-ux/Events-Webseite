"use server";

/* ---------------------------------------------------------------
   K5 — Veranstaltungs- und Sicherheitscheckliste je Event.

   Dokumentiert wird, wozu docs/loeschkonzept-betrieb.md diese Klasse
   vorsieht: Einweisung durch die Halle, Sicherheits-/Organisations-
   prüfung, zuständige Person und Prüfdatum. Ohne neue Felder — das
   Modell (prisma/schema.prisma, Checkliste) deckt das bereits ab:

     Prüfdatum              → durchgefuehrtAm
     zuständige Person      → einweisungKuerzel (Kürzel, kein Name)
     Einweisung durch Halle → einweisungErfolgt
     Sicherheits-/Organi-
     sationsprüfung         → notiz (Freitext)

   faelligAm wird HIER berechnet, aus dem Veranstaltungstermin des
   Events — nicht aus einem von Hand eingetragenen Datum. Ändert sich
   der Termin später, zieht lib/loeschlauf.ts → faelligkeitenAuffrischen()
   automatisch nach, dieselbe Systematik wie bei Anmeldungen. */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verlangeAdmin } from "@/lib/adminAuth";
import { protokolliere, PROTOKOLL_AKTIONEN } from "@/lib/adminProtokoll";
import { db } from "@/lib/db";
import { faelligCheckliste } from "@/lib/loeschfristen";

const KUERZEL_MAX = 50;
const NOTIZ_MAX = 4000;

function text(wert: FormDataEntryValue | null): string {
  return typeof wert === "string" ? wert.trim() : "";
}

function zahlOderUndefined(wert: FormDataEntryValue | null): number | undefined {
  const roh = text(wert);
  if (!roh) return undefined;
  const n = Number(roh);
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : undefined;
}

/** Eine neue Checkliste für ein Event anlegen. */
export async function checklisteAnlegen(formular: FormData): Promise<void> {
  const admin = await verlangeAdmin();

  const eventId = text(formular.get("eventId"));
  if (!eventId) {
    redirect("/admin/checklisten?hinweis=angaben-fehlen");
  }

  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { startAt: true, endAt: true },
  });
  const termin = event?.endAt ?? event?.startAt;
  if (!termin) {
    // Dieselbe vorsichtige Regel wie beim Zustimmungsnachweis (K3) und
    // beim Löschlauf selbst: ohne Termin keine berechenbare Frist.
    redirect("/admin/checklisten?hinweis=kein-termin");
  }

  const einweisungKuerzel = text(formular.get("einweisungKuerzel")).slice(0, KUERZEL_MAX);
  const notiz = text(formular.get("notiz")).slice(0, NOTIZ_MAX);
  const einweisungErfolgt = text(formular.get("einweisungErfolgt")) === "an";
  const teilnehmerAnzahl = zahlOderUndefined(formular.get("teilnehmerAnzahl"));
  const durchgefuehrtAmRoh = text(formular.get("durchgefuehrtAm"));
  const durchgefuehrtAm = durchgefuehrtAmRoh ? new Date(durchgefuehrtAmRoh) : new Date();

  const checkliste = await db.checkliste.create({
    data: {
      eventId,
      durchgefuehrtAm,
      einweisungKuerzel: einweisungKuerzel || null,
      notiz: notiz || null,
      einweisungErfolgt,
      teilnehmerAnzahl: teilnehmerAnzahl ?? null,
      faelligAm: faelligCheckliste(termin),
    },
    select: { id: true },
  });

  await protokolliere({
    adminId: admin.id,
    aktion: PROTOKOLL_AKTIONEN.checklisteAngelegt,
    zielArt: "Checkliste",
    zielId: checkliste.id,
  });

  revalidatePath("/admin/checklisten");
  revalidatePath("/admin/loeschen");
  redirect("/admin/checklisten?hinweis=angelegt");
}

/** Eine vorhandene, noch nicht anonymisierte Checkliste bearbeiten. */
export async function checklisteAktualisieren(formular: FormData): Promise<void> {
  const admin = await verlangeAdmin();

  const checklisteId = text(formular.get("checklisteId"));
  if (!checklisteId) {
    redirect("/admin/checklisten?hinweis=angaben-fehlen");
  }

  const vorhanden = await db.checkliste.findUnique({
    where: { id: checklisteId },
    select: { anonymisiertAm: true },
  });
  if (!vorhanden || vorhanden.anonymisiertAm) {
    // Bereits anonymisiert (oder unbekannt) — Personenbezug wurde
    // absichtlich entfernt, hier gibt es nichts mehr zu bearbeiten.
    redirect("/admin/checklisten?hinweis=nicht-bearbeitbar");
  }

  const einweisungKuerzel = text(formular.get("einweisungKuerzel")).slice(0, KUERZEL_MAX);
  const notiz = text(formular.get("notiz")).slice(0, NOTIZ_MAX);
  const einweisungErfolgt = text(formular.get("einweisungErfolgt")) === "an";
  const teilnehmerAnzahl = zahlOderUndefined(formular.get("teilnehmerAnzahl"));

  await db.checkliste.update({
    where: { id: checklisteId },
    data: {
      einweisungKuerzel: einweisungKuerzel || null,
      notiz: notiz || null,
      einweisungErfolgt,
      teilnehmerAnzahl: teilnehmerAnzahl ?? null,
    },
  });

  await protokolliere({
    adminId: admin.id,
    aktion: PROTOKOLL_AKTIONEN.checklisteGeaendert,
    zielArt: "Checkliste",
    zielId: checklisteId,
  });

  revalidatePath("/admin/checklisten");
  redirect("/admin/checklisten?hinweis=geaendert");
}
