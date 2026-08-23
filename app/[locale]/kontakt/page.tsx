import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { Platzhalter } from "@/components/Platzhalter";
import { texte } from "@/content";
import { events } from "@/content/events";
import type { Sprache } from "@/lib/i18n";
import stil from "@/components/Textseite.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Sprache }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: texte(locale).kontakt.ueberschrift };
}

export default async function KontaktSeite({
  params,
}: {
  params: Promise<{ locale: Sprache }>;
}) {
  const { locale: sprache } = await params;
  const t = texte(sprache);
  const ort = events[0].ort;

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
          <strong>{t.kontakt.ort}:</strong> {ort.stadt}
        </li>
      </ul>
    </Abschnitt>
  );
}
