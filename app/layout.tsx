import type { Metadata } from "next";
import { Archivo, Instrument_Sans } from "next/font/google";
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

export const metadata: Metadata = {
  title: {
    default: `${texte.meta.marke} — ${texte.hero.augenbraue}`,
    template: `%s · ${texte.meta.marke}`,
  },
  description: texte.meta.beschreibung,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${display.variable} ${text.variable}`}>
      <body>{children}</body>
    </html>
  );
}
