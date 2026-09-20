"use client";

import type { Feldfehler } from "@/lib/anmeldung";
import type { Woerterbuch } from "@/content";
import stil from "./AnmeldeFelder.module.css";
import type { ReactNode } from "react";

export interface FeldGruppe {
  titel: string;
  /** Zeigt zusätzlich E-Mail und Telefon — die Person, über die wir die Anmeldung erreichen. */
  mitKontakt: boolean;
}

/**
 * Die echten Eingabefelder der Anmeldung.
 *
 * Welche Gruppen erscheinen, entscheidet nicht diese Komponente,
 * sondern lib/vorschau.ts — dieselbe Regel, aus der auch der Server
 * die Teilnehmerliste aufbaut. Der Browser schickt nur Werte, die
 * Struktur kommt vom Server.
 *
 * Die Feldnamen (`person.0.vorname`) sind bewusst nummeriert und
 * entsprechen der Reihenfolge der Gruppen. Damit weiß der Server
 * genau, welcher Name zu welcher Rolle gehört.
 *
 * Alle Felder sind bewusst KONTROLLIERT (Wert kommt aus React,
 * nicht aus dem Browser): React leert ein Formular nach jedem
 * Absendeversuch, auch nach einem abgelehnten. Uneingetragene Felder
 * wären danach leer — wer eine Familie mit fünf Personen anmeldet,
 * müsste zwölf Felder neu eintippen, nur weil ein Häkchen fehlte.
 */
export function AnmeldeFelder({
  t,
  gruppen,
  fehler,
  vormundNoetig,
  werte,
  setzeWert,
  haken,
  setzeHaken,
}: {
  t: Woerterbuch;
  gruppen: FeldGruppe[];
  fehler: Feldfehler[];
  vormundNoetig: boolean;
  /** Eingetippte Werte, nach Feldnamen abgelegt. */
  werte: Record<string, string>;
  setzeWert: (name: string, wert: string) => void;
  haken: Record<string, boolean>;
  setzeHaken: (name: string, gesetzt: boolean) => void;
}) {
  const f = t.anmeldung.formular;
  const v = t.anmeldung.vorschau;
  const fehlerZu = (feld: string) => fehler.find((x) => x.feld === feld)?.text;

  return (
    <div className={stil.box}>
      <div className={stil.kopf}>
        <span className={stil.titel}>{f.ueberschrift}</span>
      </div>
      <p className={stil.hinweis}>{f.hinweis}</p>

      <div className={stil.gruppen}>
        {gruppen.map((gruppe, i) => (
          <div key={`${gruppe.titel}-${i}`} className={stil.gruppe}>
            <span className={stil.gruppenTitel}>{gruppe.titel}</span>
            <div className={stil.felder}>
              <Feld
                name={`person.${i}.vorname`}
                label={v.labelVorname}
                autoComplete="given-name"
                fehler={fehlerZu(`person.${i}.vorname`)}
                wert={werte[`person.${i}.vorname`] ?? ""}
                setzeWert={setzeWert}
              />
              <Feld
                name={`person.${i}.nachname`}
                label={v.labelNachname}
                autoComplete="family-name"
                fehler={fehlerZu(`person.${i}.nachname`)}
                wert={werte[`person.${i}.nachname`] ?? ""}
                setzeWert={setzeWert}
              />
              {gruppe.mitKontakt && (
                <>
                  <Feld
                    name={`person.${i}.email`}
                    label={v.labelEmail}
                    typ="email"
                    autoComplete="email"
                    fehler={fehlerZu(`person.${i}.email`)}
                    wert={werte[`person.${i}.email`] ?? ""}
                    setzeWert={setzeWert}
                  />
                  <Feld
                    name={`person.${i}.telefon`}
                    label={`${v.labelTelefon} ${f.freiwillig}`}
                    typ="tel"
                    autoComplete="tel"
                    pflicht={false}
                    fehler={fehlerZu(`person.${i}.telefon`)}
                    wert={werte[`person.${i}.telefon`] ?? ""}
                    setzeWert={setzeWert}
                  />
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={stil.einwilligungen}>
        {vormundNoetig && (
          <Haken
            name="einwilligungVormund"
            text={f.einwilligungVormund}
            fehler={fehlerZu("einwilligungVormund")}
            gesetzt={haken.einwilligungVormund ?? false}
            setzeHaken={setzeHaken}
          />
        )}
        {/* Pflicht, und zwar zu Recht: Ohne diesen Haken werden die
            Teilnahmebedingungen nach § 305 Abs. 2 BGB nicht
            Vertragsbestandteil. Nicht vorbelegt — eine vorbelegte
            Annahme ist keine. */}
        <Haken
          name="agbAkzeptiert"
          text={
            <>
              {f.agbTeil1}{" "}
              <a href="/agb" target="_blank" rel="noreferrer">
                {f.agbLinktext}
              </a>{" "}
              {f.agbTeil2}
            </>
          }
          fehler={fehlerZu("agbAkzeptiert")}
          gesetzt={haken.agbAkzeptiert ?? false}
          setzeHaken={setzeHaken}
        />

        {/* Eine KENNTNISNAHME, keine Einwilligung — nur deshalb darf
            sie Pflicht sein (Art. 7 Abs. 4 DS-GVO). */}
        <Haken
          name="kenntnisAufnahmen"
          text={
            <>
              {f.aufnahmenTeil1}{" "}
              <a href="/aufnahmen" target="_blank" rel="noreferrer">
                {f.aufnahmenLinktext}
              </a>
              {f.aufnahmenTeil2}
            </>
          }
          fehler={fehlerZu("kenntnisAufnahmen")}
          gesetzt={haken.kenntnisAufnahmen ?? false}
          setzeHaken={setzeHaken}
        />
      </div>

      {/* ── Der Widerspruchshinweis steht BEWUSST ausserhalb ────────
          Art. 21 Abs. 4 DS-GVO verlangt, dass auf das
          Widerspruchsrecht „getrennt von anderen Informationen"
          hingewiesen wird. Ein weiterer Punkt im selben Block würde
          das nicht erfüllen — deshalb eigener Kasten mit eigener
          Überschrift, ausserhalb der Häkchen. */}
      <aside className={stil.widerspruch} aria-labelledby="widerspruch-titel">
        <h3 id="widerspruch-titel">{f.widerspruchTitel}</h3>
        <p>{f.widerspruchText}</p>
      </aside>
    </div>
  );
}

function Feld({
  name,
  label,
  typ = "text",
  autoComplete,
  pflicht = true,
  fehler,
  wert,
  setzeWert,
}: {
  name: string;
  label: string;
  typ?: string;
  autoComplete?: string;
  pflicht?: boolean;
  fehler?: string;
  wert: string;
  setzeWert: (name: string, wert: string) => void;
}) {
  const fehlerId = `${name}-fehler`;
  return (
    <label className={stil.feld}>
      <span className={stil.label}>{label}</span>
      <input
        className={`${stil.eingabe} ${fehler ? stil.eingabeFehler : ""}`}
        type={typ}
        name={name}
        autoComplete={autoComplete}
        required={pflicht}
        value={wert}
        onChange={(e) => setzeWert(name, e.target.value)}
        aria-invalid={fehler ? true : undefined}
        aria-describedby={fehler ? fehlerId : undefined}
      />
      {fehler && (
        <span id={fehlerId} className={stil.feldFehler}>
          {fehler}
        </span>
      )}
    </label>
  );
}

function Haken({
  name,
  text,
  fehler,
  gesetzt,
  setzeHaken,
}: {
  name: string;
  /* ReactNode statt string: Der AGB-Haken enthält einen Link auf die
     vollständigen Bedingungen — ohne ihn wäre die „zumutbare
     Möglichkeit der Kenntnisnahme" nach § 305 Abs. 2 Nr. 2 BGB nicht
     gegeben. */
  text: ReactNode;
  fehler?: string;
  gesetzt: boolean;
  setzeHaken: (name: string, gesetzt: boolean) => void;
}) {
  return (
    <label className={stil.haken}>
      <input
        type="checkbox"
        name={name}
        value="an"
        checked={gesetzt}
        onChange={(e) => setzeHaken(name, e.target.checked)}
      />
      <span>
        {text}
        {fehler && <span className={stil.feldFehler}>{fehler}</span>}
      </span>
    </label>
  );
}
