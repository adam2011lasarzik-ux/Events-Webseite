import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { CtaBand } from "@/components/CtaBand";
import { VeraWortmarke } from "@/components/VeraWortmarke";
import { texte } from "@/content";
import type { Sprache } from "@/lib/i18n";
import stil from "@/components/Textseite.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Sprache }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: texte(locale).ueber.ueberschrift };
}

export default async function UeberSeite({
  params,
}: {
  params: Promise<{ locale: Sprache }>;
}) {
  const { locale: sprache } = await params;
  const t = texte(sprache);

  return (
    <>
      <Abschnitt>
        <AbschnittKopf titel={t.ueber.ueberschrift} haupt />
        <div style={{ marginBottom: "2rem" }}>
          <VeraWortmarke groesse="mittel" />
        </div>
        <div className={stil.inhalt}>
          {t.ueber.absaetze.map((absatz, i) => (
            <p key={i}>{absatz}</p>
          ))}
        </div>
      </Abschnitt>

      <Abschnitt>
        <CtaBand sprache={sprache} t={t} />
      </Abschnitt>
    </>
  );
}
