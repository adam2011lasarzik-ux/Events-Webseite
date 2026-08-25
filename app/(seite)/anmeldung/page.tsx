import { redirect, notFound } from "next/navigation";
import { kommendeEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

/**
 * Die Anmeldung ohne Angabe einer Veranstaltung.
 *
 * Leitet auf die nächste Veranstaltung weiter. Bewusst eine
 * Weiterleitung und keine eigene Seite: Die Anmeldung braucht ein
 * Event, und die Kopfzeile sowie ältere Verweise zeigen weiterhin
 * hierher. Eine Fehlerseite wäre für den Besucher eine Sackgasse.
 */
export default async function AnmeldungOhneEvent() {
  const events = await kommendeEvents();
  if (events.length === 0) notFound();
  redirect(`/events/${events[0].slug}/anmeldung`);
}
