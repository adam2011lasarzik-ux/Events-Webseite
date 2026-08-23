import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { Platzhalter } from "@/components/Platzhalter";
import { texte } from "@/content";
import type { Sprache } from "@/lib/i18n";
import stil from "@/components/Textseite.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Sprache }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: texte(locale).recht.datenschutzTitel };
}

export default async function Seite({
  params,
}: {
  params: Promise<{ locale: Sprache }>;
}) {
  const { locale: sprache } = await params;
  const t = texte(sprache);

  return (
    <Abschnitt>
      <AbschnittKopf titel={t.recht.datenschutzTitel} haupt />
      <p style={{ marginBottom: "1.5rem" }}>
        <Platzhalter text={t.recht.platzhalterTitel} markierung={t.platzhalter.markierung} />
      </p>
      <div className={stil.inhalt}>
        <p>{t.recht.datenschutzText}</p>
        <p>{t.recht.hinweisJurist}</p>
        <p>{t.recht.keineCookies}</p>
      </div>
    </Abschnitt>
  );
}
