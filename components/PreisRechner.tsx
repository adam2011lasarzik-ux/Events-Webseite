"use client";

import { useMemo, useState } from "react";
import { Knopf } from "./Knopf";
import { FormularVorschau, feldnamen, type VorschauFeldGruppe } from "./FormularVorschau";
import { alsEuro, berechnePreis, type Auswahl } from "@/lib/preise";
import { brauchtKontaktdaten, vorschauRollen, type Anmeldeweg } from "@/lib/vorschau";
import { fuelle } from "@/lib/formate";
import type { VeraEvent } from "@/content/events";
import type { Woerterbuch } from "@/content";
import stil from "./PreisRechner.module.css";

/** Derselbe Typ, den lib/vorschau.ts erwartet — so können die drei
 *  Anmeldewege hier und dort nicht auseinanderlaufen. */
type FuerWen = Anmeldeweg;
type SelbstAls = "student" | "adult";

/**
 * Zwei Ebenen: erst „wen melde ich an", dann die Einzelheiten.
 *
 * Die Trennung bildet ab, wie es rechtlich läuft — bei Teilnehmern
 * unter 18 ist ein Elternteil der Vertragspartner. Erwachsene ohne
 * Kind brauchen trotzdem einen eigenen Weg, sonst landen sie im
 * falschen Zweig.
 *
 * Gerechnet wird ausschließlich mit lib/preise.ts. Diese Anzeige ist
 * eine Vorschau; sobald es ein Backend gibt, rechnet der Server mit
 * derselben Funktion noch einmal nach.
 */
export function PreisRechner({
  t,
  event,
}: {
  t: Woerterbuch;
  event: VeraEvent;
}) {
  const familie = event.preise.familie;
  const minFamilie = familie?.enthalteneSchueler ?? 1;
  const maxFamilie = familie?.maxSchueler ?? 6;

  const [fuerWen, setzeFuerWen] = useState<FuerWen>("selbst");
  const [selbstAls, setzeSelbstAls] = useState<SelbstAls>("student");
  const [kinder, setzeKinder] = useState(1);
  const [kommeMit, setzeKommeMit] = useState(false);
  const [familienKinder, setzeFamilienKinder] = useState(minFamilie);

  const auswahl: Auswahl = useMemo(() => {
    if (fuerWen === "familie") {
      return { art: "family", schueler: familienKinder, erwachsene: 2 };
    }
    if (fuerWen === "kind") {
      return { art: "single", schueler: kinder, erwachsene: kommeMit ? 1 : 0 };
    }
    return {
      art: "single",
      schueler: selbstAls === "student" ? 1 : 0,
      erwachsene: selbstAls === "adult" ? 1 : 0,
    };
  }, [fuerWen, selbstAls, kinder, kommeMit, familienKinder]);

  const ergebnis = useMemo(() => berechnePreis(event.preise, auswahl), [event.preise, auswahl]);

  /**
   * Welche Personen-Bereiche die spätere Anmeldung abfragen wird.
   *
   * Die Aufteilung kommt aus lib/vorschau.ts und stützt sich auf
   * dieselbe `auswahl`, aus der auch der Preis berechnet wird —
   * dadurch zeigen Zusammenfassung und Vorschau immer denselben
   * Stand. Hier wird nur noch übersetzt.
   */
  const vorschauGruppen: VorschauFeldGruppe[] = useMemo(() => {
    const namen = feldnamen(t);
    const kontaktFelder = [namen.vorname, namen.nachname, namen.email, namen.telefon];
    const nameFelder = [namen.vorname, namen.nachname];
    const v = t.anmeldung.vorschau;

    return vorschauRollen(fuerWen, auswahl).map((rolle) => ({
      titel:
        rolle.rolle === "selbst"
          ? v.gruppeMeineAngaben
          : rolle.rolle === "elternteil"
            ? v.gruppeEltern
            : rolle.rolle === "erwachsener"
              ? fuelle(v.gruppeErwachsenerN, { n: rolle.nummer })
              : fuelle(v.gruppeSchuelerN, { n: rolle.nummer }),
      felder: brauchtKontaktdaten(rolle) ? kontaktFelder : nameFelder,
    }));
  }, [fuerWen, auswahl, t]);

  const postenName: Record<string, string> = {
    schueler: t.preise.schueler,
    erwachsener: t.preise.erwachsener,
    familieBasis: t.preise.familieHinweis,
    familieWeitererSchueler: t.preise.schueler,
  };

  return (
    <div className={stil.rechner}>
      <div className={stil.oben}>
        <fieldset className={stil.wahlRaster}>
          <legend className={stil.frage}>{t.anmeldung.frageWen}</legend>

          <label className={stil.wahlKarte}>
            <input
              type="radio"
              name="fuerWen"
              checked={fuerWen === "selbst"}
              onChange={() => setzeFuerWen("selbst")}
            />
            <span className={stil.wahlName}>{t.anmeldung.wahlSelbst}</span>
            <span className={stil.wahlHinweis}>{t.anmeldung.wahlSelbstHinweis}</span>
          </label>

          <label className={stil.wahlKarte}>
            <input
              type="radio"
              name="fuerWen"
              checked={fuerWen === "kind"}
              onChange={() => setzeFuerWen("kind")}
            />
            <span className={stil.wahlName}>{t.anmeldung.wahlKind}</span>
            <span className={stil.wahlHinweis}>{t.anmeldung.wahlKindHinweis}</span>
          </label>

          {familie && (
            <label className={stil.wahlKarte}>
              <input
                type="radio"
                name="fuerWen"
                checked={fuerWen === "familie"}
                onChange={() => setzeFuerWen("familie")}
              />
              <span className={stil.wahlName}>{t.anmeldung.wahlFamilie}</span>
              <span className={stil.wahlHinweis}>{t.anmeldung.wahlFamilieHinweis}</span>
            </label>
          )}
        </fieldset>
      </div>

      <div>
        <div className={stil.ebene2}>
          {fuerWen === "selbst" && (
            <fieldset className={stil.reihen}>
              <legend className={stil.frage}>{t.anmeldung.selbstFrage}</legend>
              <label className={stil.optionZeile}>
                <input
                  type="radio"
                  name="selbstAls"
                  checked={selbstAls === "student"}
                  onChange={() => setzeSelbstAls("student")}
                />
                <span className={stil.optionName}>{t.anmeldung.selbstSchueler}</span>
                <span className={stil.optionPreis}>
                  {alsEuro(event.preise.schuelerCents)}
                </span>
              </label>
              <label className={stil.optionZeile}>
                <input
                  type="radio"
                  name="selbstAls"
                  checked={selbstAls === "adult"}
                  onChange={() => setzeSelbstAls("adult")}
                />
                <span className={stil.optionName}>{t.anmeldung.selbstErwachsener}</span>
                <span className={stil.optionPreis}>
                  {alsEuro(event.preise.erwachsenerCents)}
                </span>
              </label>
            </fieldset>
          )}

          {fuerWen === "kind" && (
            <div>
              <p className={stil.frage}>{t.anmeldung.kindFrage}</p>
              <Zaehler
                wert={kinder}
                min={1}
                max={6}
                setzeWert={setzeKinder}
                t={t}
                text={`× ${alsEuro(event.preise.schuelerCents)}`}
              />
              <label className={stil.optionZeile} style={{ marginTop: "1rem" }}>
                <input
                  type="checkbox"
                  checked={kommeMit}
                  onChange={(e) => setzeKommeMit(e.target.checked)}
                />
                <span className={stil.optionName}>{t.anmeldung.kindMitkommen}</span>
                <span className={stil.optionPreis}>
                  + {alsEuro(event.preise.erwachsenerCents)}
                </span>
              </label>
            </div>
          )}

          {fuerWen === "familie" && familie && (
            <div>
              <p className={stil.frage}>{t.anmeldung.familieFrage}</p>
              <Zaehler
                wert={familienKinder}
                min={minFamilie}
                max={maxFamilie}
                setzeWert={setzeFamilienKinder}
                t={t}
                text={`${t.preise.schueler} (max. ${maxFamilie})`}
              />
              <p className={stil.enthalten}>{t.anmeldung.familieEnthalten}</p>
            </div>
          )}
        </div>

        <FormularVorschau t={t} gruppen={vorschauGruppen} />

        <div className={stil.merker} style={{ marginTop: "1.5rem" }}>
          <h3 className={stil.merkerTitel}>{t.anmeldung.minderjaehrigTitel}</h3>
          <p className={stil.merkerText}>{t.anmeldung.minderjaehrigText}</p>
        </div>
      </div>

      <div className={`${stil.summe} aufDunkel`}>
        <div className={stil.posten}>
          {ergebnis.posten.map((p) => (
            <div key={p.bezeichnung} className={stil.postenZeile}>
              <span>
                {p.anzahl} × {postenName[p.bezeichnung] ?? p.bezeichnung}
              </span>
              <span className={stil.postenBetrag}>{alsEuro(p.summeCents)}</span>
            </div>
          ))}
        </div>

        <div className={stil.summeZeile}>
          <span className={stil.summeName}>{t.anmeldung.summe}</span>
          {/* Wird der Betrag geändert, liest ein Screenreader ihn vor. */}
          <span className={stil.summeBetrag} aria-live="polite">
            {alsEuro(ergebnis.gesamtCents)}
          </span>
        </div>

        <div className={stil.summeUnten}>
          <span>
            {ergebnis.personen === 1
              ? t.anmeldung.personEiner
              : fuelle(t.anmeldung.personMehrere, { n: ergebnis.personen })}
          </span>
          <span>{t.anmeldung.inklMwst}</span>
        </div>

        <div style={{ marginTop: "1.5rem" }}>
          <h3 className={stil.merkerTitel}>{t.anmeldung.nochNichtTitel}</h3>
          <p className={stil.merkerText} style={{ color: "rgba(234,241,248,0.75)" }}>
            {t.anmeldung.nochNichtText}
          </p>
          <Knopf href={"/kontakt"} pfeil>
            {t.anmeldung.nochNichtAktion}
          </Knopf>
        </div>
      </div>
    </div>
  );
}

function Zaehler({
  wert,
  min,
  max,
  setzeWert,
  text,
  t,
}: {
  wert: number;
  min: number;
  max: number;
  setzeWert: (n: number) => void;
  text: string;
  t: Woerterbuch;
}) {
  return (
    <div className={stil.zaehler}>
      <button
        type="button"
        className={stil.zaehlerKnopf}
        onClick={() => setzeWert(Math.max(min, wert - 1))}
        disabled={wert <= min}
      >
        <span aria-hidden="true">−</span>
        <span className="nurVorlesen">{t.anmeldung.anzahlVerringern}</span>
      </button>

      <output className={stil.zaehlerWert} aria-label={t.anmeldung.anzahlSchueler}>
        {wert}
      </output>

      <button
        type="button"
        className={stil.zaehlerKnopf}
        onClick={() => setzeWert(Math.min(max, wert + 1))}
        disabled={wert >= max}
      >
        <span aria-hidden="true">+</span>
        <span className="nurVorlesen">{t.anmeldung.anzahlErhoehen}</span>
      </button>

      <span className={stil.zaehlerText}>{text}</span>
    </div>
  );
}
