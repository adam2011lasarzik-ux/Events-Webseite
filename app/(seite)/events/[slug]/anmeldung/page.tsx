import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { ThemeRahmen } from "@/components/ThemeRahmen";
import { PreisRechner } from "@/components/PreisRechner";
import { findeEvent } from "@/lib/events";
import { texte } from "@/content";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await findeEvent(slug);
  return { title: event ? `${texte.anmeldung.titel} — ${event.texte.titel}` : texte.anmeldung.titel };
}

/**
 * Die Anmeldung zu GENAU DIESER Veranstaltung.
 *
 * Vorher lag die Anmeldung unter /anmeldung und nahm immer das erste
 * veröffentlichte Event. Sobald zwei Veranstaltungen liefen, meldete
 * sich also jeder für dieselbe an — auch wer auf die andere geklickt
 * hatte. Über die Adresse ist eindeutig, worum es geht.
 *
 * Dass sie unter /events/[slug]/ liegt, hat einen zweiten Vorteil: Sie
 * erbt das Theme der Veranstaltung. Ein Premium-Event bekommt damit
 * auch ein Premium-Anmeldeformular, statt mitten im Ablauf das
 * Aussehen zu wechseln.
 */
export default async function EventAnmeldung({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await findeEvent(slug);
  if (!event) notFound();

  return (
    <ThemeRahmen theme={event.theme}>
      <Abschnitt>
        <AbschnittKopf
          augenbraue={event.texte.titel}
          titel={texte.anmeldung.titel}
          haupt
          einleitung={texte.anmeldung.einleitung}
        />
        <PreisRechner t={texte} event={event} />
      </Abschnitt>
    </ThemeRahmen>
  );
}
