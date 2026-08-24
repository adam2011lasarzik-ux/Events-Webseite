import type { Metadata } from "next";
import { Archivo, Instrument_Sans } from "next/font/google";
import { Header } from "@/components/Header";
import { VorschauSperre } from "@/components/VorschauSperre";
import { Footer } from "@/components/Footer";
import { texte } from "@/content";
import "@/styles/global.css";

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
      <body>
        <VorschauSperre>
          <a href="#inhalt" className="zumInhalt">
            {texte.nav.sprungmarke}
          </a>
          <Header t={texte} />
          <main id="inhalt">{children}</main>
          <Footer t={texte} />
        </VorschauSperre>
      </body>
    </html>
  );
}
