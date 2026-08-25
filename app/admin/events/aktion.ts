"use server";

/* ---------------------------------------------------------------
   Events anlegen, ändern und entfernen.

   Jede Aktion prüft selbst, ob jemand angemeldet ist. Eine
   Server-Aktion ist über das Netz erreichbar wie jede andere Adresse
   auch — sie läuft an jedem Layout vorbei. Wer die Prüfung nur im
   Layout hätte, hätte gar keine.
   --------------------------------------------------------------- */

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verlangeAdmin } from "@/lib/adminAuth";
import { pruefeEvent, type EventErgebnis } from "@/lib/eventFormular";
import { bildAblegen, bildLoeschen } from "@/lib/bilder";

function text(wert: FormDataEntryValue | null): string {
  return typeof wert === "string" ? wert : "";
}

/** Die hochgeladene Datei, falls überhaupt eine gewählt wurde. */
function dateiOderNichts(wert: FormDataEntryValue | null): File | null {
  // Ein leeres Dateifeld schickt der Browser als File mit 0 Bytes mit.
  return wert instanceof File && wert.size > 0 ? wert : null;
}

/** Alle Formularwerte als einfache Zeichenketten einsammeln. */
function alsRoh(formular: FormData): Record<string, string> {
  const raus: Record<string, string> = {};
  for (const [schluessel, wert] of formular.entries()) {
    if (typeof wert === "string") raus[schluessel] = wert;
  }
  return raus;
}

export async function eventSpeichern(
  _bisher: EventErgebnis,
  formular: FormData,
): Promise<EventErgebnis> {
  await verlangeAdmin();

  const id = text(formular.get("eventId"));
  const geprueft = pruefeEvent(alsRoh(formular));
  if (geprueft.fehler) return { fehler: geprueft.fehler };

  // ── Titelbild ────────────────────────────────────────────────
  // Vor allem anderen, damit ein abgelehntes Bild nicht dazu führt,
  // dass die Textfelder schon gespeichert sind und das Bild nicht.
  const bisher = id
    ? (await db.event.findUnique({ where: { id }, select: { bildUrl: true } }))?.bildUrl ?? null
    : null;

  const neueDatei = dateiOderNichts(formular.get("titelbild"));
  const sollEntfernen = text(formular.get("bildEntfernen")) === "an";

  let bildUrl: string | null = bisher;
  let altesLoeschen: string | null = null;

  if (neueDatei) {
    const abgelegt = await bildAblegen(neueDatei);
    if (abgelegt.fehler) {
      return { fehler: [{ feld: "titelbild", text: abgelegt.fehler.text }] };
    }
    bildUrl = abgelegt.bild.url;
    altesLoeschen = bisher;
  } else if (sollEntfernen) {
    bildUrl = null;
    altesLoeschen = bisher;
  }

  const { dabei, mitbringen, bloecke, ...felder } = geprueft.daten;
  const daten = { ...felder, bildUrl };

  // Adresse muss eindeutig bleiben — sie steht in der URL.
  const belegt = await db.event.findUnique({ where: { slug: daten.slug } });
  if (belegt && belegt.id !== id) {
    return {
      fehler: [
        {
          feld: "slug",
          text: `Die Adresse „${daten.slug}" gehört schon zu „${belegt.titel}". Bitte eine andere wählen.`,
        },
      ],
    };
  }

  let eventId = id;

  try {
    if (id) {
      const vorhanden = await db.event.findUnique({ where: { id } });
      if (!vorhanden) return { fehler: [], meldung: "Diese Veranstaltung gibt es nicht (mehr)." };
      await db.event.update({ where: { id }, data: daten });
    } else {
      const neu = await db.event.create({ data: daten });
      eventId = neu.id;
    }

    // Alle Inhaltsblöcke ersetzen statt ändern: So bleibt kein alter
    // Block zurück, wenn ein Feld geleert wurde.
    await db.eventAbschnitt.deleteMany({ where: { eventId } });

    const zuSpeichern = [
      { art: "dabei", titel: "Was dabei ist", inhalt: dabei, reihenfolge: 1 },
      { art: "mitbringen", titel: "Was mitzubringen ist", inhalt: mitbringen, reihenfolge: 2 },
      // Die Blöcke der Event-Seite. Ohne Text wird ein Block gar nicht
      // erst angelegt — eine leere Überschrift auf der Seite wäre
      // schlimmer als ein fehlender Abschnitt.
      ...bloecke.map((b, i) => ({
        art: b.art,
        titel: b.titel,
        inhalt: b.inhalt,
        reihenfolge: 10 + i * 10,
      })),
    ].filter((b) => b.inhalt !== "");

    if (zuSpeichern.length > 0) {
      await db.eventAbschnitt.createMany({
        data: zuSpeichern.map((b) => ({ ...b, eventId })),
      });
    }
  } catch (e) {
    // Ein gerade abgelegtes Bild wieder wegräumen — sonst bliebe eine
    // Datei liegen, auf die kein Event mehr zeigt.
    if (neueDatei && bildUrl) await bildLoeschen(bildUrl);
    // Besuchern und Bedienern niemals interne Einzelheiten zeigen.
    console.error("Event speichern fehlgeschlagen:", e);
    return { fehler: [], meldung: "Das Speichern hat nicht geklappt. Bitte noch einmal versuchen." };
  }

  // Erst jetzt, wo alles sicher gespeichert ist: die vorherige Fassung
  // vom Datenträger nehmen.
  if (altesLoeschen && altesLoeschen !== bildUrl) await bildLoeschen(altesLoeschen);

  redirect(`/admin/events/${eventId}?gespeichert=1`);
}

/**
 * Ein Event entfernen.
 *
 * Bewusst nur, solange es keine Anmeldungen gibt. Ein Event mit
 * Anmeldungen zu löschen würde Personendaten mitreißen, die für
 * Zahlungsabgleich und Nachweise noch gebraucht werden — dafür ist
 * „Archiviert" der richtige Weg.
 */
export async function eventEntfernen(formular: FormData): Promise<void> {
  await verlangeAdmin();
  const id = text(formular.get("eventId"));
  if (!id) redirect("/admin");

  const anzahl = await db.registration.count({ where: { eventId: id } });
  if (anzahl > 0) {
    redirect(`/admin/events/${id}?fehler=anmeldungen`);
  }

  // Das Titelbild mit entfernen, sonst bleibt es als verwaiste Datei
  // liegen und niemand weiss später, wozu es gehörte.
  const event = await db.event.findUnique({ where: { id }, select: { bildUrl: true } });
  await db.eventAbschnitt.deleteMany({ where: { eventId: id } });
  await db.event.delete({ where: { id } });
  await bildLoeschen(event?.bildUrl ?? null);
  redirect("/admin");
}
