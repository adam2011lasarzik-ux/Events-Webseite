"use server";

/* ---------------------------------------------------------------
   Den Gründerbereich speichern.

   Prüft selbst, ob jemand angemeldet ist. Eine Server-Aktion ist über
   das Netz erreichbar wie jede andere Adresse auch — sie läuft an
   jedem Layout vorbei. Wer die Prüfung nur im Layout hätte, hätte gar
   keine.

   Die Bildbehandlung ist bewusst dieselbe wie beim Titelbild einer
   Veranstaltung (app/admin/events/aktion.ts): erst das Bild, bei
   Fehler nichts speichern, bei fehlgeschlagenem Speichern die frisch
   abgelegte Datei wieder wegräumen, die alte Fassung erst löschen,
   wenn alles durch ist.
   --------------------------------------------------------------- */

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verlangeAdmin } from "@/lib/adminAuth";
import { pruefeGruender, type GruenderErgebnis } from "@/lib/gruenderFormular";
import { EINSTELLUNGEN_ID } from "@/lib/einstellungen";
import { bildAblegen, bildLoeschen } from "@/lib/bilder";

function text(wert: FormDataEntryValue | null): string {
  return typeof wert === "string" ? wert : "";
}

/** Die hochgeladene Datei, falls überhaupt eine gewählt wurde. */
function dateiOderNichts(wert: FormDataEntryValue | null): File | null {
  // Ein leeres Dateifeld schickt der Browser als File mit 0 Bytes mit.
  return wert instanceof File && wert.size > 0 ? wert : null;
}

function alsRoh(formular: FormData): Record<string, string> {
  const raus: Record<string, string> = {};
  for (const [schluessel, wert] of formular.entries()) {
    if (typeof wert === "string") raus[schluessel] = wert;
  }
  return raus;
}

export async function gruenderSpeichern(
  _bisher: GruenderErgebnis,
  formular: FormData,
): Promise<GruenderErgebnis> {
  await verlangeAdmin();

  const geprueft = pruefeGruender(alsRoh(formular));
  if (geprueft.fehler) return { fehler: geprueft.fehler };

  // ── Foto ─────────────────────────────────────────────────────
  // Vor allem anderen, damit ein abgelehntes Bild nicht dazu führt,
  // dass die Textfelder schon gespeichert sind und das Foto nicht.
  const bisher =
    (await db.einstellungen.findUnique({
      where: { id: EINSTELLUNGEN_ID },
      select: { gruenderBildUrl: true },
    }))?.gruenderBildUrl ?? null;

  const neueDatei = dateiOderNichts(formular.get("gruenderBild"));
  const sollEntfernen = text(formular.get("bildEntfernen")) === "an";

  let gruenderBildUrl: string | null = bisher;
  let altesLoeschen: string | null = null;

  if (neueDatei) {
    const abgelegt = await bildAblegen(neueDatei);
    if (abgelegt.fehler) {
      return { fehler: [{ feld: "gruenderBild", text: abgelegt.fehler.text }] };
    }
    gruenderBildUrl = abgelegt.bild.url;
    altesLoeschen = bisher;
  } else if (sollEntfernen) {
    gruenderBildUrl = null;
    altesLoeschen = bisher;
  }

  const daten = { ...geprueft.daten, gruenderBildUrl };

  try {
    // upsert statt update: Beim ersten Speichern gibt es die Zeile
    // noch nicht. So braucht es keinen eigenen Anlege-Schritt und es
    // kann keine zweite Zeile entstehen.
    await db.einstellungen.upsert({
      where: { id: EINSTELLUNGEN_ID },
      create: { id: EINSTELLUNGEN_ID, ...daten },
      update: daten,
    });
  } catch (e) {
    // Ein gerade abgelegtes Bild wieder wegräumen — sonst bliebe eine
    // Datei liegen, auf die niemand mehr zeigt.
    if (neueDatei && gruenderBildUrl) await bildLoeschen(gruenderBildUrl);
    // Besuchern und Bedienern niemals interne Einzelheiten zeigen.
    console.error("Gründerbereich speichern fehlgeschlagen:", e);
    return { fehler: [], meldung: "Das Speichern hat nicht geklappt. Bitte noch einmal versuchen." };
  }

  // Erst jetzt, wo alles sicher gespeichert ist: die vorherige Fassung
  // vom Datenträger nehmen.
  if (altesLoeschen && altesLoeschen !== gruenderBildUrl) await bildLoeschen(altesLoeschen);

  redirect("/admin/einstellungen?gespeichert=1");
}
