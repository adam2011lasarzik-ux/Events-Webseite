import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { PreisRechner } from "@/components/PreisRechner";
import { events } from "@/content/events";
import { texte } from "@/content";
import type { Sprache } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Sprache }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: texte(locale).anmeldung.titel };
}

export default async function AnmeldeSeite({
  params,
}: {
  params: Promise<{ locale: Sprache }>;
}) {
  const { locale: sprache } = await params;
  const t = texte(sprache);
  const event = events[0];

  return (
    <Abschnitt>
      <AbschnittKopf
        augenbraue={event.texte[sprache].titel}
        titel={t.anmeldung.titel} haupt
        einleitung={t.anmeldung.einleitung}
      />
      <PreisRechner sprache={sprache} t={t} event={event} />
    </Abschnitt>
  );
}
