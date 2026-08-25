import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventSeite } from "@/components/EventSeite";
import { findeEvent } from "@/lib/events";
import { texte } from "@/content";

/**
 * Bei jedem Aufruf frisch aus der Datenbank.
 *
 * Ein Event kann im Adminbereich veröffentlicht oder geändert werden —
 * dann muss es sofort sichtbar sein, nicht erst nach dem nächsten
 * Bauen.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await findeEvent(slug);
  if (!event) return {};
  return { title: event.texte.titel, description: event.texte.kurz };
}

export default async function EventVollseite({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await findeEvent(slug);
  if (!event) notFound();

  return <EventSeite t={texte} event={event} />;
}
