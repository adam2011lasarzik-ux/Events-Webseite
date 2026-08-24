import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { PreisRechner } from "@/components/PreisRechner";
import { events } from "@/content/events";
import { texte } from "@/content";

export const metadata: Metadata = { title: texte.anmeldung.titel };

export default function AnmeldeSeite() {
  const t = texte;
  const event = events[0];

  return (
    <Abschnitt>
      <AbschnittKopf
        augenbraue={event.texte.titel}
        titel={t.anmeldung.titel} haupt
        einleitung={t.anmeldung.einleitung}
      />
      <PreisRechner t={t} event={event} />
    </Abschnitt>
  );
}
