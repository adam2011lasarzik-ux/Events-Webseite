import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { CtaBand } from "@/components/CtaBand";
import { Platzhalter } from "@/components/Platzhalter";
import { texte } from "@/content";
import stil from "@/components/Textseite.module.css";

export const metadata: Metadata = { title: texte.schulen.ueberschrift };

export default function SchulenSeite() {
  const t = texte;

  return (
    <>
      <Abschnitt>
        <AbschnittKopf augenbraue={t.schulen.ueberschrift} titel={t.schulen.titel} haupt />
        <div className={stil.inhalt}>
          {t.schulen.absaetze.map((absatz, i) => (
            <p key={i}>{absatz}</p>
          ))}
        </div>
        <ul className={stil.punkte}>
          {t.schulen.punkte.map((punkt) => (
            <li key={punkt}>
              <span className={stil.haken} aria-hidden="true">✓</span>
              {punkt}
            </li>
          ))}
          <li>
            <span className={stil.haken} aria-hidden="true">✓</span>
            <span>
              <strong style={{ whiteSpace: "nowrap" }}>{t.kontakt.email}:</strong>{" "}
              <Platzhalter text={t.platzhalter.email} markierung={t.platzhalter.markierung} />
            </span>
          </li>
        </ul>
      </Abschnitt>

      <Abschnitt>
        <CtaBand t={t} />
      </Abschnitt>
    </>
  );
}
