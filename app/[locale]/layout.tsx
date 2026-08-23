import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Archivo, Instrument_Sans } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { texte } from "@/content";
import { istSprache, sprachen, type Sprache } from "@/lib/i18n";
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

export function generateStaticParams() {
  return sprachen.map((locale) => ({ locale }));
}

/**
 * Nur die oben aufgezählten Sprachen sind gültig. Alles andere — etwa
 * /fr — beantwortet Next.js mit 404, ohne die Seite überhaupt zu
 * bauen. Ohne diese Zeile versucht die Seite, ein nicht vorhandenes
 * Wörterbuch zu benutzen, und antwortet mit einem Serverfehler.
 */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const sprache: Sprache = istSprache(locale) ? locale : "de";
  const t = texte(sprache);

  return {
    title: {
      default: `${t.meta.marke} — ${t.hero.augenbraue}`,
      template: `%s · ${t.meta.marke}`,
    },
    description: t.meta.beschreibung,
  };
}

export default async function SprachLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!istSprache(locale)) notFound();

  const sprache: Sprache = locale;
  const t = texte(sprache);

  return (
    <html lang={sprache} className={`${display.variable} ${text.variable}`}>
      <body>
        <a href="#inhalt" className="zumInhalt">
          {t.nav.sprungmarke}
        </a>
        <Header sprache={sprache} t={t} />
        <main id="inhalt">{children}</main>
        <Footer sprache={sprache} t={t} />
      </body>
    </html>
  );
}
