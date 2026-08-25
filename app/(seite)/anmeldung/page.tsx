import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { PreisRechner } from "@/components/PreisRechner";
import { kommendeEvents } from "@/lib/events";
import { notFound } from "next/navigation";
import { texte } from "@/content";

/**
 * Bei jedem Aufruf frisch aus der Datenbank.
 *
 * Bis zum Adminbereich wurden diese Seiten beim Bauen erzeugt. Das
 * ging, solange Events nur über den Seed entstanden. Jetzt kann ein
 * Event im Adminbereich veröffentlicht oder geändert werden — und
 * dann muss es sofort sichtbar sein, nicht erst nach dem nächsten
 * Bauen.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: texte.anmeldung.titel };

export default async function AnmeldeSeite() {
  const t = texte;
  // Vorerst das erste veröffentlichte Event. Sobald mehrere Events
  // gleichzeitig laufen, bekommt die Anmeldung das Event über die Adresse.
  const event = (await kommendeEvents())[0];
  if (!event) notFound();

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
