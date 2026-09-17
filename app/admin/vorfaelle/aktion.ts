"use server";

/* ---------------------------------------------------------------
   Vorfall-, Beschwerde- und Versicherungsakten verwalten.

   Ein offener Vorfall hält die zugehörige Anmeldung von der
   Löschung ab — automatisch, über eine Sperre, die der Löschlauf
   selbst setzt. Deshalb ist das Anlegen eines Vorfalls hier die
   eigentliche Schutzhandlung, nicht nur eine Notiz.

   Die EINSTUFUNG (leicht/schwer) bestimmt die Aufbewahrungsdauer
   nach Abschluss: 10 Jahre bzw. bis zu 30 Jahre. Sie ist bewusst
   von Hand änderbar — ob ein Schaden ein Personenschaden ist, kann
   keine Software entscheiden.
   --------------------------------------------------------------- */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verlangeAdmin } from "@/lib/adminAuth";
import { protokolliere, PROTOKOLL_AKTIONEN } from "@/lib/adminProtokoll";
import { db } from "@/lib/db";
import { faelligVorfall } from "@/lib/loeschfristen";

const EINSTUFUNGEN = ["LEICHT", "SCHWER"] as const;
type Einstufung = (typeof EINSTUFUNGEN)[number];

const TITEL_MAX = 180;
const TEXT_MAX = 4000;

function text(wert: FormDataEntryValue | null): string {
  return typeof wert === "string" ? wert.trim() : "";
}

function ausListe<T extends string>(erlaubt: readonly T[], wert: string): T | null {
  return (erlaubt as readonly string[]).includes(wert) ? (wert as T) : null;
}

/** Einen Vorfall eröffnen. */
export async function vorfallAnlegen(formular: FormData): Promise<void> {
  const admin = await verlangeAdmin();

  const titel = text(formular.get("titel")).slice(0, TITEL_MAX);
  if (!titel) {
    redirect("/admin/vorfaelle?hinweis=titel-fehlt");
  }

  const einstufung: Einstufung =
    ausListe(EINSTUFUNGEN, text(formular.get("einstufung"))) ?? "LEICHT";
  const beschreibung = text(formular.get("beschreibung")).slice(0, TEXT_MAX);
  const eventId = text(formular.get("eventId"));
  const registrationId = text(formular.get("registrationId"));

  const vorfall = await db.vorfall.create({
    data: {
      titel,
      beschreibung: beschreibung || null,
      einstufung,
      // Ein neuer Vorfall ist offen — und solange er offen ist,
      // wird nichts gelöscht, was mit ihm zusammenhängt.
      status: "OFFEN",
      eventId: eventId || null,
      registrationId: registrationId || null,
      erstelltVon: admin.id,
    },
    select: { id: true },
  });

  await protokolliere({
    adminId: admin.id,
    aktion: PROTOKOLL_AKTIONEN.vorfallAngelegt,
    zielArt: "Vorfall",
    zielId: vorfall.id,
    detail: einstufung,
  });

  revalidatePath("/admin/vorfaelle");
  revalidatePath("/admin/loeschen");
  redirect("/admin/vorfaelle?hinweis=angelegt");
}

/**
 * Einstufung ändern.
 *
 * Bei einem bereits abgeschlossenen Vorfall wandert die Fälligkeit
 * sofort mit: Aus 10 Jahren werden 30 oder umgekehrt. Ohne diese
 * Nachberechnung stünde in der Datenbank eine Frist, die zur
 * Einstufung nicht mehr passt — und der Löschlauf richtete sich
 * nach der alten.
 */
export async function einstufungSetzen(formular: FormData): Promise<void> {
  const admin = await verlangeAdmin();

  const id = text(formular.get("vorfallId"));
  const neu = ausListe(EINSTUFUNGEN, text(formular.get("einstufung")));
  if (!id || !neu) return;

  const vorhanden = await db.vorfall.findUnique({
    where: { id },
    select: { id: true, einstufung: true, abgeschlossenAm: true },
  });
  if (!vorhanden) return;

  await db.vorfall.update({
    where: { id },
    data: {
      einstufung: neu,
      faelligAm: faelligVorfall(vorhanden.abgeschlossenAm, neu),
    },
  });

  await protokolliere({
    adminId: admin.id,
    aktion: PROTOKOLL_AKTIONEN.vorfallGeaendert,
    zielArt: "Vorfall",
    zielId: id,
    detail: `${vorhanden.einstufung} → ${neu}`,
  });

  revalidatePath("/admin/vorfaelle");
  revalidatePath("/admin/loeschen");
  redirect("/admin/vorfaelle?hinweis=eingestuft");
}

/**
 * Einen Vorfall abschließen oder wieder öffnen.
 *
 * Mit dem Abschluss beginnt die Aufbewahrungsfrist überhaupt erst zu
 * laufen — vorher gibt es kein Fälligkeitsdatum, und genau deshalb
 * wird ein offener Vorfall nie gelöscht.
 */
export async function statusUmstellen(formular: FormData): Promise<void> {
  const admin = await verlangeAdmin();

  const id = text(formular.get("vorfallId"));
  const wunsch = text(formular.get("status"));
  if (!id || (wunsch !== "ABGESCHLOSSEN" && wunsch !== "OFFEN")) return;

  const vorhanden = await db.vorfall.findUnique({
    where: { id },
    select: { id: true, status: true, einstufung: true, abgeschlossenAm: true },
  });
  if (!vorhanden || vorhanden.status === wunsch) return;

  const abgeschlossenAm = wunsch === "ABGESCHLOSSEN" ? (vorhanden.abgeschlossenAm ?? new Date()) : null;

  await db.vorfall.update({
    where: { id },
    data: {
      status: wunsch,
      abgeschlossenAm,
      faelligAm: faelligVorfall(abgeschlossenAm, vorhanden.einstufung),
    },
  });

  await protokolliere({
    adminId: admin.id,
    aktion: PROTOKOLL_AKTIONEN.vorfallGeaendert,
    zielArt: "Vorfall",
    zielId: id,
    detail: `${vorhanden.status} → ${wunsch}`,
  });

  revalidatePath("/admin/vorfaelle");
  revalidatePath("/admin/loeschen");
  redirect("/admin/vorfaelle?hinweis=status");
}
