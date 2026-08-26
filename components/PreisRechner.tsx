"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AnmeldeFelder, type FeldGruppe } from "./AnmeldeFelder";
import { anmeldungAbsenden } from "@/app/(seite)/anmeldung/aktion";
import { brauchtVormundEinwilligung, ANMELDE_STARTZUSTAND } from "@/lib/anmeldung";
import { alsEuro, berechnePreis, type Auswahl } from "@/lib/preise";
import { brauchtKontaktdaten, vorschauRollen, type Anmeldeweg } from "@/lib/vorschau";
import { fuelle } from "@/lib/formate";
import type { VeraEvent } from "@/lib/events";
import type { Woerterbuch } from "@/content";
import stil from "./PreisRechner.module.css";
import feldStil from "./AnmeldeFelder.module.css";

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
  const gruppen: FeldGruppe[] = useMemo(() => {
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
      mitKontakt: brauchtKontaktdaten(rolle),
    }));
  }, [fuerWen, auswahl, t]);

  const [ergebnisAktion, formAktion] = useActionState(anmeldungAbsenden, ANMELDE_STARTZUSTAND);

  /**
   * Die eingetippten Werte liegen hier, nicht im Browser.
   *
   * React leert ein Formular nach jedem Absendeversuch — auch nach
   * einem abgelehnten. Ohne diesen Zustand stünde jemand, dem nur das
   * Einwilligungs-Häkchen fehlte, vor einem komplett leeren Formular
   * und müsste alle Namen erneut eintippen.
   */
  const [werte, setzeWerte] = useState<Record<string, string>>({});
  const [haken, setzeHakenZustand] = useState<Record<string, boolean>>({});
  const setzeWert = (name: string, wert: string) =>
    setzeWerte((alt) => ({ ...alt, [name]: wert }));
  const setzeHaken = (name: string, gesetzt: boolean) =>
    setzeHakenZustand((alt) => ({ ...alt, [name]: gesetzt }));

  const postenName: Record<string, string> = {
    schueler: t.preise.schueler,
    erwachsener: t.preise.erwachsener,
    familieBasis: t.preise.familieHinweis,
    familieWeitererSchueler: t.preise.schueler,
  };

  const vormundNoetig = brauchtVormundEinwilligung(fuerWen);

  return (
    /* onReset: React setzt ein Formular nach jedem Absendeversuch
       zurueck — auch nach einem abgelehnten. Fuer die Auswahlknoepfe
       oben hiesse das: Die Anzeige springt auf „Mich selbst", waehrend
       in Wahrheit weiter das Familienpaket gebucht wird. Hier steuert
       React jedes Feld selbst, ein Zuruecksetzen ist also nie
       erwuenscht — deshalb wird es unterbunden. */
    <form action={formAktion} onReset={(e) => e.preventDefault()} className={stil.rechner}>
      {/* Der Server liest ausschliesslich diese Werte — der angezeigte
          Preis wird bewusst NICHT mitgeschickt, sondern dort neu
          berechnet. Ein manipulierter Betrag hat damit keine Wirkung.

          Die sichtbaren Auswahlknöpfe heissen bewusst anders
          (wahlFuerWen, wahlSelbstAls): Traegen zwei Felder denselben
          Namen, entscheidet die Reihenfolge im Dokument, welches der
          Server sieht — eine Falle, die beim naechsten Umbau zuschlaegt. */}
      <input type="hidden" name="eventSlug" value={event.slug} />
      <input type="hidden" name="weg" value={fuerWen} />
      <input type="hidden" name="selbstAls" value={selbstAls} />
      <input type="hidden" name="schueler" value={auswahl.schueler} />
      <input type="hidden" name="erwachsene" value={auswahl.erwachsene} />

      {/* Bot-Falle: fuer Menschen nicht erreichbar. */}
      <div className={feldStil.honigtopf} aria-hidden="true">
        <label>
          Webseite
          <input type="text" name="webseite" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className={stil.oben}>
        <fieldset className={stil.wahlRaster}>
          <legend className={stil.frage}>{t.anmeldung.frageWen}</legend>

          <label className={stil.wahlKarte}>
            <input
              type="radio"
              name="wahlFuerWen"
              checked={fuerWen === "selbst"}
              onChange={() => setzeFuerWen("selbst")}
            />
            <span className={stil.wahlName}>{t.anmeldung.wahlSelbst}</span>
            <span className={stil.wahlHinweis}>{t.anmeldung.wahlSelbstHinweis}</span>
          </label>

          <label className={stil.wahlKarte}>
            <input
              type="radio"
              name="wahlFuerWen"
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
                name="wahlFuerWen"
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
                  name="wahlSelbstAls"
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
                  name="wahlSelbstAls"
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

        <AnmeldeFelder
          t={t}
          gruppen={gruppen}
          fehler={ergebnisAktion.fehler}
          vormundNoetig={vormundNoetig}
          werte={werte}
          setzeWert={setzeWert}
          haken={haken}
          setzeHaken={setzeHaken}
        />

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

        <div className={feldStil.absendeBereich}>
          {ergebnisAktion.meldung && (
            <p className={feldStil.meldung} role="alert">
              {ergebnisAktion.meldung}
            </p>
          )}
          {/* Der Betrag steht IM Knopf. Anmeldung und Bezahlung sind
              ein Vorgang — niemand soll klicken und erst danach
              merken, dass jetzt bezahlt wird. Der Betrag hier ist
              eine Vorschau; verbindlich rechnet der Server erneut. */}
          <AbsendeKnopf
            text={
              ergebnis.gesamtCents > 0
                ? fuelle(t.anmeldung.formular.absenden, {
                    betrag: alsEuro(ergebnis.gesamtCents),
                  })
                : t.anmeldung.formular.absendenKostenlos
            }
            laeuft={t.anmeldung.formular.laeuft}
          />
          <p className={stil.merkerText} style={{ color: "rgba(234,241,248,0.75)" }}>
            {t.anmeldung.formular.zahlungHinweis}
          </p>
        </div>
      </div>
    </form>
  );
}

/**
 * Eigene Komponente, weil useFormStatus nur INNERHALB des Formulars
 * funktioniert. Verhindert doppeltes Absenden durch mehrfaches Tippen.
 */
function AbsendeKnopf({ text, laeuft }: { text: string; laeuft: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={feldStil.absendeKnopf} disabled={pending}>
      {pending ? laeuft : text}
    </button>
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
