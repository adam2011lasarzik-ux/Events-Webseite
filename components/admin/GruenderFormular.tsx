"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { gruenderSpeichern } from "@/app/admin/einstellungen/aktion";
import { GRUENDER_STARTZUSTAND, type Feldfehler } from "@/lib/gruenderFormular";
import stil from "@/app/admin/admin.module.css";
import bildStil from "./Titelbild.module.css";

export interface GruenderVorbelegung {
  name: string;
  rolle: string;
  text: string;
  bildUrl: string;
  aufStart: boolean;
}

/**
 * Das Formular für den Gründerbereich.
 *
 * Foto, Name, Bezeichnung und Text gelten für die ganze Seite, nicht
 * für eine einzelne Veranstaltung — deshalb ein eigener Punkt in der
 * Verwaltung und kein weiteres Feld im Event-Formular. Ob der Bereich
 * auf einer Eventseite erscheint, wird dort entschieden.
 */
export function GruenderFormular({ vorbelegung }: { vorbelegung: GruenderVorbelegung }) {
  const [ergebnis, aktion] = useActionState(gruenderSpeichern, GRUENDER_STARTZUSTAND);

  const fehlerZu = (feld: string) =>
    ergebnis.fehler.find((f: Feldfehler) => f.feld === feld)?.text;

  return (
    /* onReset: React leert ein Formular nach jedem Absendeversuch —
       auch nach einem abgelehnten. Ohne diese Sperre wäre ein
       ausgeschriebener Text nach einem Tippfehler weg.
       encType: Ohne diese Angabe schickt der Browser nur den
       Dateinamen statt der Datei — der Upload käme leer an. */
    <form action={aktion} onReset={(e) => e.preventDefault()} encType="multipart/form-data">
      {ergebnis.meldung && (
        <p className={`${stil.meldung} ${stil.meldungFehler}`} role="alert">
          {ergebnis.meldung}
        </p>
      )}
      {ergebnis.fehler.length > 0 && (
        <p className={`${stil.meldung} ${stil.meldungFehler}`} role="alert">
          Es fehlt noch etwas — die betroffenen Felder sind unten rot markiert.
        </p>
      )}

      {/* ── Foto ───────────────────────────────────────────────── */}
      <div className={stil.karte}>
        <p className={stil.formGruppenTitel}>Foto</p>

        <div className={stil.feld}>
          <label className={stil.feldLabel} htmlFor="f-gruenderBild">
            Gründerfoto
          </label>

          {vorbelegung.bildUrl && (
            <span className={bildStil.aktuell}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={vorbelegung.bildUrl} alt="" className={bildStil.probeHoch} />
              <span className={stil.feldHilfe}>Aktuell hinterlegt</span>
            </span>
          )}

          <input
            id="f-gruenderBild"
            className={stil.eingabe}
            type="file"
            name="gruenderBild"
            accept="image/jpeg,image/png,image/webp"
          />
          <span className={stil.feldHilfe}>
            Auf dem iPad öffnet sich damit direkt die Fotomediathek. JPEG, PNG oder WebP,
            bis 10 MB. Das Bild wird auf Web-Größe gerechnet; Aufnahmeort und andere
            versteckte Angaben werden dabei entfernt. Ein Hochformat wirkt hier am besten.
          </span>
          {fehlerZu("gruenderBild") && (
            <span className={stil.feldFehler}>{fehlerZu("gruenderBild")}</span>
          )}
        </div>

        {vorbelegung.bildUrl && (
          <label className={stil.haken} style={{ marginTop: "0.75rem" }}>
            <input type="checkbox" name="bildEntfernen" value="an" />
            <span>Foto entfernen</span>
          </label>
        )}
      </div>

      {/* ── Angaben ────────────────────────────────────────────── */}
      <div className={stil.karte}>
        <p className={stil.formGruppenTitel}>Angaben</p>
        <div className={stil.raster}>
          <div className={stil.feld}>
            <label className={stil.feldLabel} htmlFor="f-gruenderName">
              Name *
            </label>
            <input
              id="f-gruenderName"
              className={`${stil.eingabe} ${fehlerZu("gruenderName") ? stil.eingabeFehler : ""}`}
              type="text"
              name="gruenderName"
              defaultValue={vorbelegung.name}
            />
            {fehlerZu("gruenderName") && (
              <span className={stil.feldFehler}>{fehlerZu("gruenderName")}</span>
            )}
          </div>

          <div className={stil.feld}>
            <label className={stil.feldLabel} htmlFor="f-gruenderRolle">
              Bezeichnung *
            </label>
            <input
              id="f-gruenderRolle"
              className={`${stil.eingabe} ${fehlerZu("gruenderRolle") ? stil.eingabeFehler : ""}`}
              type="text"
              name="gruenderRolle"
              defaultValue={vorbelegung.rolle}
            />
            <span className={stil.feldHilfe}>Steht klein unter dem Namen.</span>
            {fehlerZu("gruenderRolle") && (
              <span className={stil.feldFehler}>{fehlerZu("gruenderRolle")}</span>
            )}
          </div>

          <div className={`${stil.feld} ${stil.breit}`}>
            <label className={stil.feldLabel} htmlFor="f-gruenderText">
              Beschreibung
            </label>
            <textarea
              id="f-gruenderText"
              className={`${stil.textfeld} ${fehlerZu("gruenderText") ? stil.eingabeFehler : ""}`}
              name="gruenderText"
              defaultValue={vorbelegung.text}
            />
            <span className={stil.feldHilfe}>
              Zwei bis drei Sätze. Eine Leerzeile trennt zwei Absätze. Solange hier nichts
              steht, erscheint auf der Webseite ein sichtbar markierter Platzhalter.
            </span>
            {fehlerZu("gruenderText") && (
              <span className={stil.feldFehler}>{fehlerZu("gruenderText")}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Sichtbarkeit ───────────────────────────────────────── */}
      <div className={stil.karte}>
        <p className={stil.formGruppenTitel}>Sichtbarkeit</p>
        <label className={stil.haken}>
          <input
            type="checkbox"
            name="gruenderAufStart"
            value="an"
            defaultChecked={vorbelegung.aufStart}
          />
          <span>Auf der VERA-Startseite anzeigen</span>
        </label>
        <p className={stil.feldHilfe} style={{ marginTop: "0.75rem" }}>
          Auf einzelnen Eventseiten wird der Bereich getrennt eingeschaltet — im
          jeweiligen Event unter „Design“.
        </p>
      </div>

      <div className={stil.knopfReihe}>
        <Speichern />
      </div>
    </form>
  );
}

function Speichern() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={stil.knopf} disabled={pending}>
      {pending ? "Wird gespeichert …" : "Änderungen speichern"}
    </button>
  );
}
