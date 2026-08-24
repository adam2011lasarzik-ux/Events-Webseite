import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { FaqListe } from "@/components/FaqListe";
import { CtaBand } from "@/components/CtaBand";
import { texte } from "@/content";

export const metadata: Metadata = { title: texte.faq.ueberschrift };

export default function FaqSeite() {
  const t = texte;

  return (
    <>
      <Abschnitt>
        <AbschnittKopf titel={t.faq.ueberschrift} haupt />
        <FaqListe t={t} mitKopf={false} />
      </Abschnitt>
      <Abschnitt>
        <CtaBand t={t} />
      </Abschnitt>
    </>
  );
}
