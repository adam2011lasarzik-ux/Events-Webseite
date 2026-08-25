/* ---------------------------------------------------------------
   Seitenweite Angaben aus der Datenbank.

   Die einzige Stelle, an der die Einstellungen gelesen werden —
   dasselbe Prinzip wie bei lib/events.ts für Veranstaltungen.

   Es gibt genau EINE Zeile mit der festen Kennung "global". Solange
   sie noch nicht angelegt wurde, liefert ladeGruender() trotzdem ein
   vollständiges Objekt mit den Vorgaben. Damit muss keine Seite den
   Fall „noch nichts gespeichert“ kennen.
   --------------------------------------------------------------- */

import { db } from "@/lib/db";
import {
  GRUENDER_NAME_STANDARD,
  GRUENDER_ROLLE_STANDARD,
} from "@/lib/gruenderFormular";

/** Die feste Kennung der einen Einstellungs-Zeile. */
export const EINSTELLUNGEN_ID = "global";

export interface Gruender {
  name: string;
  /** Zeile unter dem Namen, z. B. „Gründer von VERA“. */
  rolle: string;
  /** null = es erscheint ein sichtbar markierter Platzhalter. */
  text: string | null;
  /** Adresse des hochgeladenen Fotos. null = Ersatzdarstellung. */
  bildUrl: string | null;
  /** Soll der Bereich auf der zentralen VERA-Seite erscheinen? */
  aufStart: boolean;
}

export async function ladeGruender(): Promise<Gruender> {
  const zeile = await db.einstellungen.findUnique({ where: { id: EINSTELLUNGEN_ID } });

  return {
    name: zeile?.gruenderName?.trim() || GRUENDER_NAME_STANDARD,
    rolle: zeile?.gruenderRolle?.trim() || GRUENDER_ROLLE_STANDARD,
    text: zeile?.gruenderText?.trim() || null,
    bildUrl: zeile?.gruenderBildUrl ?? null,
    // Ohne gespeicherte Zeile ist der Bereich auf der Startseite
    // sichtbar — so wie es der Standardwert in der Datenbank vorgibt.
    aufStart: zeile?.gruenderAufStart ?? true,
  };
}
