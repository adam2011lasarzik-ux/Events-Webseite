import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { FaqListe } from "@/components/FaqListe";
import { CtaBand } from "@/components/CtaBand";
import { texte } from "@/content";
import type { Sprache } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Sprache }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: texte(locale).faq.ueberschrift };
}

export default async function FaqSeite({
  params,
}: {
  params: Promise<{ locale: Sprache }>;
}) {
  const { locale: sprache } = await params;
  const t = texte(sprache);

  return (
    <>
      <Abschnitt>
        <AbschnittKopf titel={t.faq.ueberschrift} haupt />
        <FaqListe t={t} mitKopf={false} />
      </Abschnitt>
      <Abschnitt>
        <CtaBand sprache={sprache} t={t} />
      </Abschnitt>
    </>
  );
}
