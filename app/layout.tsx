import type { Metadata } from "next";
import {
  Archivo,
  Instrument_Sans,
  IBM_Plex_Sans,
  IBM_Plex_Mono,
  Instrument_Serif,
} from "next/font/google";
import { texte } from "@/content";
import "@/styles/global.css";

/**
 * Das äußerste Layout — bewusst schlank.
 *
 * Hier steht nur, was für JEDE Seite gilt: die Schriften, das
 * Grundgerüst der Seite und die Grundangaben für Suchmaschinen.
 * Kopfleiste, Fußbereich und die Vorschau-Sperre gehören NICHT
 * hierher: Der Adminbereich soll weder die öffentliche Navigation
 * noch die Vorschau-Passwortabfrage bekommen. Beides liegt deshalb in
 * app/(seite)/layout.tsx, das nur für den öffentlichen Teil gilt.
 *
 * Die Klammern in „(seite)" machen einen Ordner zu einer reinen
 * Gruppierung: Er taucht in keiner Adresse auf. /anmeldung bleibt
 * /anmeldung, bekommt aber ein anderes Layout als /admin.
 */

/**
 * Die Schriften werden beim Bauen heruntergeladen und von der eigenen
 * Domain ausgeliefert. Würden sie zur Laufzeit von Google geladen,
 * ginge die IP-Adresse jedes Besuchers dorthin — das wäre
 * einwilligungspflichtig. So bleibt die Seite ohne Zustimmungsfenster.
 */
const display = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-display",
  display: "swap",
});

const text = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-text",
  display: "swap",
});

/* ── Schriften der Event-Themes ───────────────────────────────────

   Der Fließtext bleibt in ALLEN Themes Instrument Sans — das ist der
   durchgehende Faden der Marke. Unterschiedlich ist nur die
   Auszeichnungsschrift.

   `preload: false` ist hier wichtig: Ohne das würde jede Seite alle
   Schriften vorab laden, auch die zwei, die sie gar nicht braucht.
   So holt der Browser nur, was auf der jeweiligen Seite wirklich
   vorkommt.

   Wie bisher werden sie beim Bauen heruntergeladen und von der
   eigenen Domain ausgeliefert. Es geht kein Aufruf an Google — sonst
   wäre die Seite einwilligungspflichtig. */

/** Business: für IBM gezeichnet — technisch, sachlich, eigenständig. */
const business = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-business",
  display: "swap",
  preload: false,
});

/** Business-Nutzschrift: Uhrzeiten und Datenbeschriftungen. */
const daten = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-daten",
  display: "swap",
  preload: false,
});

/** Premium: die Serifen-Schwester der Instrument Sans aus dem Fließtext. */
const premium = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-premium",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    // Der Seitentitel gehört zur Marke, nicht zu einer einzelnen
    // Veranstaltung. Vorher stand hier „Padel · Falkensee" — das wäre
    // spätestens beim zweiten Event falsch gewesen.
    default: `${texte.meta.marke} — ${texte.meta.markeLang}`,
    template: `%s · ${texte.meta.marke}`,
  },
  description: texte.meta.beschreibung,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="de"
      className={[
        display.variable,
        text.variable,
        business.variable,
        daten.variable,
        premium.variable,
      ].join(" ")}
    >
      <body>{children}</body>
    </html>
  );
}
