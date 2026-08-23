"use client";

import { useEffect, useState, type FormEvent } from "react";
import { VeraWortmarke } from "./VeraWortmarke";
import stil from "./VorschauSperre.module.css";

/**
 * Eine einfache Hürde für die öffentliche GitHub-Pages-Vorschau —
 * KEIN echter Schutz.
 *
 * GitHub Pages liefert nur fertige Dateien aus, es gibt keinen Server,
 * der ein Passwort prüfen könnte. Diese Sperre läuft komplett im
 * Browser: Wer im Quellcode nachschaut, findet das Passwort. Sie hält
 * zufällige Besucher ab, die den Link nicht kennen sollten — mehr
 * nicht. Auf der echten, späteren Webseite taucht sie nie auf: Sie
 * wird nur aktiv, wenn NEXT_PUBLIC_VORSCHAU_PASSWORT beim Bauen
 * gesetzt ist, und das setzt ausschließlich der Vorschau-Workflow.
 */

const SPEICHER_SCHLUESSEL = "vera-vorschau-freigeschaltet";

export function VorschauSperre({ children }: { children: React.ReactNode }) {
  const passwort = process.env.NEXT_PUBLIC_VORSCHAU_PASSWORT;

  // Kein Passwort gesetzt → normale Webseite, keine Sperre. Das ist
  // bei jedem anderen Bau als der GitHub-Pages-Vorschau immer der Fall.
  if (!passwort) return <>{children}</>;

  return <SperreAktiv passwort={passwort}>{children}</SperreAktiv>;
}

function SperreAktiv({
  passwort,
  children,
}: {
  passwort: string;
  children: React.ReactNode;
}) {
  const [freigeschaltet, setzeFreigeschaltet] = useState(false);
  const [bereitGeprueft, setzeBereitGeprueft] = useState(false);
  const [eingabe, setzeEingabe] = useState("");
  const [fehler, setzeFehler] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(SPEICHER_SCHLUESSEL) === "ja") {
        setzeFreigeschaltet(true);
      }
    } catch {
      // Privater Modus o. Ä. blockiert localStorage — dann eben jedes
      // Mal neu eingeben, das ist kein Beinbruch.
    }
    setzeBereitGeprueft(true);
  }, []);

  const absenden = (e: FormEvent) => {
    e.preventDefault();
    if (eingabe === passwort) {
      setzeFreigeschaltet(true);
      setzeFehler(false);
      try {
        window.localStorage.setItem(SPEICHER_SCHLUESSEL, "ja");
      } catch {
        // Kein Speicher verfügbar — dann bleibt es für diesen Aufruf
        // trotzdem freigeschaltet, nur nicht dauerhaft gemerkt.
      }
    } else {
      setzeFehler(true);
    }
  };

  // Vor der ersten Prüfung nichts anzeigen, damit auf einem bereits
  // entsperrten Gerät nicht kurz die Sperre aufblitzt.
  if (!bereitGeprueft) return null;
  if (freigeschaltet) return <>{children}</>;

  return (
    <div className={stil.buehne}>
      <div className={stil.karte}>
        <div className={stil.marke}>
          <VeraWortmarke groesse="klein" />
        </div>
        <h1 className={stil.titel}>Vorschau — nicht öffentlich gedacht</h1>
        <p className={stil.text}>
          Diese Adresse ist eine Arbeitsvorschau von VERA. Bitte gib das Passwort ein, das du
          von uns bekommen hast.
        </p>
        <form onSubmit={absenden}>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            className={stil.feld}
            value={eingabe}
            onChange={(e) => {
              setzeEingabe(e.target.value);
              setzeFehler(false);
            }}
            aria-label="Passwort"
            aria-invalid={fehler}
          />
          {fehler && <p className={stil.fehler}>Das war nicht das richtige Passwort.</p>}
          <button type="submit" className={stil.knopf}>
            Ansehen
          </button>
        </form>
        <p className={stil.hinweis}>
          Das ist kein echter Zugriffsschutz, nur eine Hürde gegen zufällige Besucher. Auf der
          echten Webseite gibt es diese Abfrage nicht.
        </p>
      </div>
    </div>
  );
}
