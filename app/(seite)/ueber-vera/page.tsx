import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { CtaBand } from "@/components/CtaBand";
import { VeraWortmarke } from "@/components/VeraWortmarke";
import { texte } from "@/content";
import stil from "@/components/Textseite.module.css";

export const metadata: Metadata = { title: texte.ueber.ueberschrift };

export default function UeberSeite() {
  const t = texte;

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
        <CtaBand t={t} />
      </Abschnitt>
    </>
  );
}
