import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { CtaBand } from "@/components/CtaBand";
import { texte } from "@/content";
import stil from "@/components/Textseite.module.css";

export const metadata: Metadata = { title: texte.unternehmen.ueberschrift };

export default function UnternehmenSeite() {
  const t = texte;

  return (
    <>
      <Abschnitt>
        <AbschnittKopf
          augenbraue={t.unternehmen.ueberschrift}
          titel={t.unternehmen.titel}
          haupt
        />
        <div className={stil.inhalt}>
          {t.unternehmen.absaetze.map((absatz, i) => (
            <p key={i}>{absatz}</p>
          ))}
        </div>
        <ul className={stil.punkte}>
          {t.unternehmen.punkte.map((punkt) => (
            <li key={punkt}>
              <span className={stil.haken} aria-hidden="true">✓</span>
              {punkt}
            </li>
          ))}
          <li>
            <span className={stil.haken} aria-hidden="true">✓</span>
            <span>
              <strong style={{ whiteSpace: "nowrap" }}>{t.kontakt.email}:</strong>{" "}
              {t.anbieter.email}
            </span>
          </li>
        </ul>
        <div className={stil.inhalt} style={{ marginTop: "var(--a-4)" }}>
          <p>{t.unternehmen.hinweis}</p>
        </div>
      </Abschnitt>

      <Abschnitt>
        <CtaBand t={t} />
      </Abschnitt>
    </>
  );
}
