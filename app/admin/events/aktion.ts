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

function text(wert: FormDataEntryValue | null): string {
  return typeof wert === "string" ? wert : "";
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

  const { dabei, mitbringen, ...daten } = geprueft.daten;

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

    // „Was dabei ist" und „Was mitzubringen ist" liegen als eigene
    // Inhaltsblöcke. Ersetzen statt ändern: So bleibt kein alter Block
    // zurück, wenn das Feld geleert wurde.
    await db.eventAbschnitt.deleteMany({
      where: { eventId, art: { in: ["dabei", "mitbringen"] } },
    });
    const bloecke = [
      { art: "dabei", titel: "Was dabei ist", inhalt: dabei, reihenfolge: 1 },
      { art: "mitbringen", titel: "Was mitzubringen ist", inhalt: mitbringen, reihenfolge: 2 },
    ].filter((b) => b.inhalt !== "");
    if (bloecke.length > 0) {
      await db.eventAbschnitt.createMany({
        data: bloecke.map((b) => ({ ...b, eventId })),
      });
    }
  } catch (e) {
    // Besuchern und Bedienern niemals interne Einzelheiten zeigen.
    console.error("Event speichern fehlgeschlagen:", e);
    return { fehler: [], meldung: "Das Speichern hat nicht geklappt. Bitte noch einmal versuchen." };
  }

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

  await db.eventAbschnitt.deleteMany({ where: { eventId: id } });
  await db.event.delete({ where: { id } });
  redirect("/admin");
}
