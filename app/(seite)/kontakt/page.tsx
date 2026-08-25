import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { Platzhalter } from "@/components/Platzhalter";
import { texte } from "@/content";
import { kommendeEvents } from "@/lib/events";
import stil from "@/components/Textseite.module.css";

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

export const metadata: Metadata = { title: texte.kontakt.ueberschrift };

export default async function KontaktSeite() {
  const t = texte;
  const ort = (await kommendeEvents())[0]?.ort ?? null;

  return (
    <Abschnitt>
      <AbschnittKopf titel={t.kontakt.ueberschrift} haupt einleitung={t.kontakt.einleitung} />
      <ul className={stil.punkte}>
        <li>
          <strong>{t.kontakt.email}:</strong>{" "}
          <Platzhalter text={t.platzhalter.email} markierung={t.platzhalter.markierung} />
        </li>
        <li>
          <strong>{t.kontakt.telefon}:</strong>{" "}
          <Platzhalter text={t.platzhalter.telefon} markierung={t.platzhalter.markierung} />
        </li>
        <li>
          <strong>{t.kontakt.ort}:</strong> {ort?.stadt ?? "Falkensee"}
        </li>
      </ul>
    </Abschnitt>
  );
}
