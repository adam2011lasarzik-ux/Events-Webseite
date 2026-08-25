import { Abschnitt, AbschnittKopf } from "./Abschnitt";
import { Platzhalter } from "./Platzhalter";
import { VeraWortmarke } from "./VeraWortmarke";
import { kleineFassung } from "@/lib/bilder";
import { oeffentlich } from "@/lib/pfade";
import type { Gruender } from "@/lib/einstellungen";
import type { Woerterbuch } from "@/content";
import stil from "./GruenderBereich.module.css";

/**
 * Der Gründerbereich — Foto, Name, Bezeichnung und ein paar Sätze.
 *
 * Als eigener Baustein, weil ihn ZWEI Stellen brauchen: die zentrale
 * VERA-Seite und (je Event einschaltbar) die Eventseite. Nur so kann
 * er nicht an einer Stelle anders aussehen als an der anderen.
 *
 * Das Aussehen kommt ausschließlich aus den Design-Variablen. Dadurch
 * passt sich der Bereich in Standard und Business von selbst an; nur
 * Premium bekommt in styles/themes.css einen kleinen eigenen Block.
 */
export function GruenderBereich({
  t,
  gruender,
  ton = "hell",
}: {
  t: Woerterbuch;
  gruender: Gruender;
  /**
   * Fläche, auf der der Bereich steht. Entscheidet die Seite, nicht
   * dieser Baustein — dieselbe Aufteilung wie beim CtaBand: Nur die
   * Seite kennt die Abfolge ihrer Abschnitte.
   */
  ton?: "hell" | "warm" | "dunkel";
}) {
  const alt = t.gruender.fotoAlt
    .replace("{name}", gruender.name)
    .replace("{rolle}", gruender.rolle);

  const absaetze = gruender.text
    ? gruender.text.split("\n\n").map((a) => a.trim()).filter(Boolean)
    : [];

  const dunkel = ton === "dunkel";

  return (
    <Abschnitt id="gruender" ton={ton}>
      {/* data-block: der Haken, an dem die Themes greifen. Bewusst ein
          Attribut und kein Klassenname — CSS-Module benennen
          Klassennamen beim Bauen um. */}
      <div data-block="gruender" className={`${stil.raster} ${dunkel ? stil.aufDunkel : ""}`}>
        <div className={stil.bild} data-teil="foto">
          {gruender.bildUrl ? (
            /* Zwei Größen: sonst lädt ein Handy das Desktop-Bild.
               Die kleine Fassung entsteht beim Hochladen mit. */
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={oeffentlich(gruender.bildUrl)}
              srcSet={`${oeffentlich(kleineFassung(gruender.bildUrl))} 900w, ${oeffentlich(gruender.bildUrl)} 1800w`}
              sizes="(min-width: 48rem) 20rem, 100vw"
              alt={alt}
            />
          ) : (
            <div className={stil.ohneBild}>
              <VeraWortmarke groesse="mittel" />
            </div>
          )}
        </div>

        <div className={stil.text}>
          <AbschnittKopf augenbraue={t.gruender.augenbraue} titel={t.gruender.ueberschrift} />

          {/* Kein <h3>: Der Name ist keine Gliederungsebene, sondern
              eine Angabe. Screenreader hangeln sich an Überschriften
              entlang — ein Name mittendrin führte sie in die Irre. */}
          <p className={stil.name}>{gruender.name}</p>
          <span className={stil.rolle} data-teil="rolle">{gruender.rolle}</span>

          <div className={stil.beschreibung}>
            {absaetze.length > 0 ? (
              absaetze.map((absatz, i) => <p key={i}>{absatz}</p>)
            ) : (
              /* Sichtbar markiert: Ein Platzhalter, den man für echten
                 Inhalt halten kann, geht irgendwann versehentlich
                 online. Erfunden wird hier nichts. */
              <p>
                <Platzhalter
                  markierung={t.platzhalter.markierung}
                  text={t.gruender.platzhalterText.replace("{name}", gruender.name)}
                />
              </p>
            )}
          </div>
        </div>
      </div>
    </Abschnitt>
  );
}
