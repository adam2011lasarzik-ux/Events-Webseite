"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { eventSpeichern } from "@/app/admin/events/aktion";
import {
  EVENT_STARTZUSTAND,
  KATEGORIEN,
  STATUS,
  type Feldfehler,
} from "@/lib/eventFormular";
import { BLOCK_ARTEN, type BlockArt } from "@/lib/eventInhalte";
import { type Theme } from "@/lib/themes";
import { ThemeWahl } from "./ThemeWahl";
import { texte } from "@/content";
import stil from "@/app/admin/admin.module.css";

export interface EventVorbelegung {
  id: string;
  slug: string;
  status: string;
  kategorie: string;
  titel: string;
  untertitel: string;
  karteTitel: string;
  karteKurz: string;
  karteZielgruppe: string;
  kurz: string;
  beschreibung: string;
  hinweise: string;
  heroAugenbraue: string;
  heroTitel: string;
  heroText: string;
  ctaTitel: string;
  ctaText: string;
  theme: Theme;
  bloecke: Record<string, { titel: string; inhalt: string }>;
  startAt: string;
  endAt: string;
  ortName: string;
  strasse: string;
  plz: string;
  stadt: string;
  bildUrl: string;
  videoUrl: string;
  maxPersonen: string;
  schwelleWenigPlaetze: string;
  preisSchueler: string;
  preisErwachsener: string;
  familieAktiv: boolean;
  familieBasis: string;
  familieEnthaltenErwachsene: string;
  familieEnthaltenSchueler: string;
  familieWeitererSchueler: string;
  familieMaxSchueler: string;
  anmeldungAb: string;
  anmeldungBis: string;
  dabei: string;
  mitbringen: string;
}

const STATUS_TEXT: Record<string, string> = {
  ENTWURF: "Entwurf — nur du siehst es",
  VEROEFFENTLICHT: "Veröffentlicht — steht auf der Webseite",
  ARCHIVIERT: "Archiviert — vorbei, nicht mehr sichtbar",
};

/**
 * Die Kategorienamen kommen aus demselben Wörterbuch wie die
 * öffentliche Übersichtskarte. Zwei getrennte Listen liefen früher
 * oder später auseinander — dann hiesse dieselbe Veranstaltung vorne
 * „Netzwerken“ und hinten „Networking“.
 */
const KATEGORIE_TEXT = (k: string) => texte.kategorie[k.toLowerCase()] ?? k;

/**
 * Das Formular für eine Veranstaltung — zum Anlegen und zum Ändern.
 *
 * Eine Komponente für beides: Beim Anlegen ist nur `vorbelegung.id`
 * leer. Zwei fast gleiche Formulare nebeneinander würden früher oder
 * später auseinanderlaufen, und dann fehlte im einen ein Feld, das im
 * anderen längst da ist.
 */
export function EventFormular({ vorbelegung }: { vorbelegung: EventVorbelegung }) {
  const [ergebnis, aktion] = useActionState(eventSpeichern, EVENT_STARTZUSTAND);
  const [familieAktiv, setzeFamilieAktiv] = useState(vorbelegung.familieAktiv);
  const [theme, setzeTheme] = useState<Theme>(vorbelegung.theme);

  const fehlerZu = (feld: string) =>
    ergebnis.fehler.find((f: Feldfehler) => f.feld === feld)?.text;

  const feld = (
    name: keyof EventVorbelegung,
    label: string,
    extra: { typ?: string; hilfe?: string; breit?: boolean; pflicht?: boolean } = {},
  ) => (
    <Feld
      name={name}
      label={label}
      standard={String(vorbelegung[name] ?? "")}
      fehler={fehlerZu(name)}
      {...extra}
    />
  );

  return (
    /* onReset: React leert ein Formular nach jedem Absendeversuch —
       auch nach einem abgelehnten. Ohne diese Sperre wäre ein komplett
       ausgefülltes Event nach einem einzigen Tippfehler weg. */
    <form action={aktion} onReset={(e) => e.preventDefault()}>
      <input type="hidden" name="eventId" value={vorbelegung.id} />

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

      {/* ── Grunddaten ─────────────────────────────────────────── */}
      <div className={stil.karte}>
        <p className={stil.formGruppenTitel}>Grunddaten</p>
        <div className={stil.raster}>
          {feld("titel", "Titel", { breit: true, pflicht: true, hilfe: "So heißt die Veranstaltung auf ihrer eigenen Seite." })}
          {feld("untertitel", "Untertitel", { breit: true })}
          {feld("slug", "Adresse auf der Webseite", {
            hilfe: "Leer lassen, dann wird sie aus dem Titel gebildet. Beispiel: padel-falkensee → /events/padel-falkensee",
          })}

          <Auswahl
            name="status"
            label="Sichtbarkeit"
            standard={vorbelegung.status}
            werte={STATUS.map((s) => [s, STATUS_TEXT[s]])}
          />
          <Auswahl
            name="kategorie"
            label="Kategorie"
            standard={vorbelegung.kategorie}
            werte={KATEGORIEN.map((k) => [k, KATEGORIE_TEXT(k)])}
          />
        </div>
      </div>

      {/* ── Karte auf der Startseite ───────────────────────────── */}
      <div className={stil.karte}>
        <p className={stil.formGruppenTitel}>Karte auf der Startseite</p>
        <div className={stil.raster}>
          {feld("karteTitel", "Titel auf der Karte", { pflicht: true, hilfe: "Kurz, z. B. „Padel Event“." })}
          {feld("karteZielgruppe", "Für wen", { hilfe: "z. B. „Für Schüler, Lehrer und Eltern“" })}
          <Textfeld
            name="karteKurz"
            label="Kurztext auf der Karte"
            standard={vorbelegung.karteKurz}
            fehler={fehlerZu("karteKurz")}
            breit
            pflicht
            hilfe="Ein bis zwei Sätze. Das ist das Erste, was Besucher sehen."
          />
        </div>
      </div>

      {/* ── Kopfbereich ────────────────────────────────────────── */}
      <div className={stil.karte}>
        <p className={stil.formGruppenTitel}>Kopfbereich der Event-Seite</p>
        <div className={stil.raster}>
          {feld("heroAugenbraue", "Kleine Zeile ganz oben", {
            hilfe: "z. B. „Padel · Falkensee“. Leer lassen: dann stehen dort Kategorie und Stadt.",
          })}
          {feld("heroTitel", "Große Überschrift", {
            hilfe: "Leer lassen, dann wird der Titel genommen. Ein Punkt oder Fragezeichen in der Mitte setzt den zweiten Teil abgesetzt darunter.",
          })}
          <Textfeld
            name="heroText"
            label="Text unter der Überschrift"
            standard={vorbelegung.heroText}
            fehler={fehlerZu("heroText")}
            breit
            hilfe="Leer lassen, dann wird die Kurzbeschreibung genommen."
          />
          {feld("ctaTitel", "Abschluss-Aufruf — Überschrift", {
            breit: true,
            hilfe: "Der letzte Block der Seite. Leer lassen für den allgemeinen Text.",
          })}
          <Textfeld
            name="ctaText"
            label="Abschluss-Aufruf — Text"
            standard={vorbelegung.ctaText}
            fehler={fehlerZu("ctaText")}
            breit
          />
        </div>
      </div>

      {/* ── Texte ──────────────────────────────────────────────── */}
      <div className={stil.karte}>
        <p className={stil.formGruppenTitel}>Texte auf der Event-Seite</p>
        <div className={stil.raster}>
          <Textfeld
            name="kurz"
            label="Kurzbeschreibung"
            standard={vorbelegung.kurz}
            fehler={fehlerZu("kurz")}
            breit
            pflicht
          />
          <Textfeld
            name="beschreibung"
            label="Ausführliche Beschreibung"
            standard={vorbelegung.beschreibung}
            fehler={fehlerZu("beschreibung")}
            breit
            pflicht
            hilfe="Eine Leerzeile trennt zwei Absätze."
          />
          <Textfeld
            name="dabei"
            label="Was dabei ist"
            standard={vorbelegung.dabei}
            fehler={fehlerZu("dabei")}
            hilfe="Ein Punkt je Zeile."
          />
          <Textfeld
            name="mitbringen"
            label="Was mitzubringen ist"
            standard={vorbelegung.mitbringen}
            fehler={fehlerZu("mitbringen")}
            hilfe="Ein Punkt je Zeile."
          />
          <Textfeld
            name="hinweise"
            label="Zusätzliche Hinweise"
            standard={vorbelegung.hinweise}
            fehler={fehlerZu("hinweise")}
            breit
          />
        </div>
      </div>

      {/* ── Zeit und Ort ───────────────────────────────────────── */}
      <div className={stil.karte}>
        <p className={stil.formGruppenTitel}>Zeit und Ort</p>
        <div className={stil.raster}>
          {feld("startAt", "Beginn", { typ: "datetime-local", hilfe: "Deutsche Zeit. Leer lassen, solange der Termin nicht feststeht." })}
          {feld("endAt", "Ende", { typ: "datetime-local" })}
          {feld("ortName", "Name der Anlage")}
          {feld("stadt", "Stadt", { pflicht: true })}
          {feld("strasse", "Straße und Hausnummer")}
          {feld("plz", "Postleitzahl")}
        </div>
      </div>

      {/* ── Plätze ─────────────────────────────────────────────── */}
      <div className={stil.karte}>
        <p className={stil.formGruppenTitel}>Plätze</p>
        <div className={stil.raster}>
          {feld("maxPersonen", "Höchstzahl Personen", {
            hilfe: "Zählt PERSONEN, nicht Anmeldungen. Eine Familie mit sechs Leuten belegt sechs Plätze. Leer = unbegrenzt.",
          })}
          {feld("schwelleWenigPlaetze", "Restplätze anzeigen ab", {
            hilfe: "Ab so wenigen freien Plätzen steht die genaue Zahl auf der Seite.",
          })}
          {feld("anmeldungAb", "Anmeldung ab", { typ: "datetime-local" })}
          {feld("anmeldungBis", "Anmeldung bis", { typ: "datetime-local" })}
        </div>
      </div>

      {/* ── Preise ─────────────────────────────────────────────── */}
      <div className={stil.karte}>
        <p className={stil.formGruppenTitel}>Preise (inkl. MwSt.)</p>
        <div className={stil.raster}>
          {feld("preisSchueler", "Schüler", { pflicht: true, hilfe: "In Euro, z. B. 7,00" })}
          {feld("preisErwachsener", "Erwachsener", { pflicht: true, hilfe: "In Euro, z. B. 14,00" })}

          <div className={stil.breit}>
            <label className={stil.haken}>
              <input
                type="checkbox"
                name="familieAktiv"
                value="an"
                checked={familieAktiv}
                onChange={(e) => setzeFamilieAktiv(e.target.checked)}
              />
              <span>Familienpaket anbieten</span>
            </label>
          </div>

          {familieAktiv && (
            <>
              {feld("familieBasis", "Grundpreis Familienpaket", { hilfe: "z. B. 30,00" })}
              {feld("familieWeitererSchueler", "Preis je weiterem Schüler", { hilfe: "z. B. 6,00" })}
              {feld("familieEnthaltenErwachsene", "Enthaltene Erwachsene", { hilfe: "z. B. 2" })}
              {feld("familieEnthaltenSchueler", "Enthaltene Schüler", { hilfe: "z. B. 1" })}
              {feld("familieMaxSchueler", "Höchstzahl Schüler", { hilfe: "z. B. 6" })}
            </>
          )}
        </div>
      </div>

      {/* ── Inhaltsblöcke ──────────────────────────────────────── */}
      <div className={stil.karte}>
        <p className={stil.formGruppenTitel}>Abschnitte auf der Event-Seite</p>
        <p className={stil.feldHilfe} style={{ marginBottom: "1rem" }}>
          Jeder Abschnitt erscheint nur, wenn Text darin steht. Die Reihenfolge auf
          der Seite ist fest: Vorstellung, dann die Preise, dann Ablauf, Hinweise
          und Fragen.
        </p>
        <div className={stil.raster}>
          {BLOCK_ARTEN.map((art) => (
            <BlockFelder
              key={art}
              art={art}
              werte={vorbelegung.bloecke[art] ?? { titel: "", inhalt: "" }}
              fehler={fehlerZu(`block.${art}.inhalt`)}
            />
          ))}
        </div>
      </div>

      {/* ── Design ─────────────────────────────────────────────── */}
      <div className={stil.karte}>
        <ThemeWahl standard={vorbelegung.theme} gewaehlt={theme} setzeGewaehlt={setzeTheme} />
      </div>

      {/* ── Medien ─────────────────────────────────────────────── */}
      <div className={stil.karte}>
        <p className={stil.formGruppenTitel}>Bild und Video</p>
        <div className={stil.raster}>
          {feld("bildUrl", "Bild", { hilfe: "Pfad im Ordner public, z. B. /images/event-padel.jpg" })}
          {feld("videoUrl", "Video im Kopfbereich", { hilfe: "z. B. /videos/padel-hero.mp4" })}
        </div>
      </div>

      <div className={stil.knopfReihe}>
        <Speichern neu={!vorbelegung.id} />
      </div>
    </form>
  );
}

/** Beschriftung und Zeilenregel je Blockart — an einer Stelle. */
const BLOCK_TEXT: Record<BlockArt, { name: string; titelHilfe: string; hilfe: string }> = {
  vorstellung: {
    name: "Vorstellung",
    titelHilfe: "z. B. „Was ist Padel überhaupt?“",
    hilfe:
      "Fließtext; eine Leerzeile trennt zwei Absätze. " +
      "Eine Zeile wie „* 20 × 10 | Meter Platz“ wird zu einer Zahlenkachel daneben.",
  },
  ablauf: {
    name: "Ablauf",
    titelHilfe: "z. B. „So läuft der Tag ab“",
    hilfe:
      "Ein Schritt je Zeile: „Titel | Text“. " +
      "Mit Uhrzeit: „19:00 | Titel | Text“ — im Business-Design wird daraus eine Zeitschiene.",
  },
  hinweise: {
    name: "Hinweise",
    titelHilfe: "z. B. „Für Schulen“",
    hilfe:
      "Erst der Einleitungstext. Zeilen mit „- “ werden zu Häkchen-Punkten. " +
      "Eine Zeile „> Mehr erfahren | /fuer-schulen“ wird zu einem Knopf.",
  },
  faq: {
    name: "Häufige Fragen",
    titelHilfe: "z. B. „Häufige Fragen“",
    hilfe: "Eine Frage je Zeile: „Frage | Antwort“.",
  },
};

function BlockFelder({
  art,
  werte,
  fehler,
}: {
  art: BlockArt;
  werte: { titel: string; inhalt: string };
  fehler?: string;
}) {
  const b = BLOCK_TEXT[art];
  return (
    <div className={stil.breit}>
      <Feld
        name={`block.${art}.titel`}
        label={`${b.name} — Überschrift`}
        standard={werte.titel}
        hilfe={b.titelHilfe}
      />
      <div style={{ marginTop: "0.75rem" }}>
        <Textfeld
          name={`block.${art}.inhalt`}
          label={`${b.name} — Inhalt`}
          standard={werte.inhalt}
          fehler={fehler}
          breit
          hilfe={b.hilfe}
        />
      </div>
    </div>
  );
}

function Speichern({ neu }: { neu: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={stil.knopf} disabled={pending}>
      {pending ? "Wird gespeichert …" : neu ? "Veranstaltung anlegen" : "Änderungen speichern"}
    </button>
  );
}

/* ── Bausteine ───────────────────────────────────────────────── */

function Huelle({
  name, label, hilfe, fehler, breit, pflicht, children,
}: {
  name: string; label: string; hilfe?: string; fehler?: string;
  breit?: boolean; pflicht?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={`${stil.feld} ${breit ? stil.breit : ""}`}>
      <label className={stil.feldLabel} htmlFor={`f-${name}`}>
        {label}
        {pflicht && " *"}
      </label>
      {children}
      {hilfe && <span className={stil.feldHilfe}>{hilfe}</span>}
      {fehler && <span className={stil.feldFehler}>{fehler}</span>}
    </div>
  );
}

function Feld({
  name, label, standard, typ = "text", hilfe, fehler, breit, pflicht,
}: {
  name: string; label: string; standard: string; typ?: string;
  hilfe?: string; fehler?: string; breit?: boolean; pflicht?: boolean;
}) {
  return (
    <Huelle name={name} label={label} hilfe={hilfe} fehler={fehler} breit={breit} pflicht={pflicht}>
      <input
        id={`f-${name}`}
        className={`${stil.eingabe} ${fehler ? stil.eingabeFehler : ""}`}
        type={typ}
        name={name}
        defaultValue={standard}
      />
    </Huelle>
  );
}

function Textfeld({
  name, label, standard, hilfe, fehler, breit, pflicht,
}: {
  name: string; label: string; standard: string;
  hilfe?: string; fehler?: string; breit?: boolean; pflicht?: boolean;
}) {
  return (
    <Huelle name={name} label={label} hilfe={hilfe} fehler={fehler} breit={breit} pflicht={pflicht}>
      <textarea
        id={`f-${name}`}
        className={`${stil.textfeld} ${fehler ? stil.eingabeFehler : ""}`}
        name={name}
        defaultValue={standard}
      />
    </Huelle>
  );
}

function Auswahl({
  name, label, standard, werte, hilfe,
}: {
  name: string; label: string; standard: string;
  werte: (readonly [string, string])[]; hilfe?: string;
}) {
  return (
    <Huelle name={name} label={label} hilfe={hilfe}>
      <select id={`f-${name}`} className={stil.auswahl} name={name} defaultValue={standard}>
        {werte.map(([wert, text]) => (
          <option key={wert} value={wert}>
            {text}
          </option>
        ))}
      </select>
    </Huelle>
  );
}
