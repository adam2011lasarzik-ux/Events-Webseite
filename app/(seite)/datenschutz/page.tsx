import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { Platzhalter } from "@/components/Platzhalter";
import { texte } from "@/content";
import { ohneTrennstellen } from "@/lib/formate";
import stil from "@/components/Textseite.module.css";

export const metadata: Metadata = { title: ohneTrennstellen(texte.recht.datenschutzTitel) };

export default function Seite() {
  const t = texte;

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
