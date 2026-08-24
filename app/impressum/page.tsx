import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { Platzhalter } from "@/components/Platzhalter";
import { texte } from "@/content";
import stil from "@/components/Textseite.module.css";

export const metadata: Metadata = { title: texte.recht.impressumTitel };

export default function Seite() {
  const t = texte;

  return (
    <Abschnitt>
      <AbschnittKopf titel={t.recht.impressumTitel} haupt />
      <p style={{ marginBottom: "1.5rem" }}>
        <Platzhalter text={t.recht.platzhalterTitel} markierung={t.platzhalter.markierung} />
      </p>
      <div className={stil.inhalt}>
        <p>{t.recht.impressumText}</p>
        <p>{t.recht.hinweisJurist}</p>
        <p>{t.recht.keineCookies}</p>
      </div>
    </Abschnitt>
  );
}
