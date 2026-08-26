/* ---------------------------------------------------------------
   Die einzige Stelle, die den Zahlungsanbieter kennt.

   Alles andere im Projekt spricht nur mit dieser Datei. Ein späterer
   Wechsel des Anbieters bleibt dadurch auf diese eine Datei begrenzt.

   Zwei Grundsätze, die hier nicht verhandelbar sind:

   1. ZAHLUNGSDATEN BERÜHREN DIESE SEITE NIEMALS. Bezahlt wird
      ausschließlich auf der gehosteten Seite des Anbieters. Es werden
      keine Kartennummern, Prüfziffern oder Bankdaten entgegengenommen,
      weitergeleitet, protokolliert oder gespeichert.
   2. NUR TESTBETRIEB. Ein echter Schlüssel wird abgewiesen. Der
      Echtbetrieb ist damit keine vergessene Einstellung, sondern eine
      bewusste spätere Änderung.
   --------------------------------------------------------------- */

import Stripe from "stripe";
import { istTestschluessel, posten } from "./zahlungRegeln";

/** Fehler, die der Aufrufer verständlich behandeln kann. */
export class ZahlungNichtEingerichtet extends Error {
  constructor(readonly grund: string) {
    super(grund);
  }
}

let zugang: Stripe | null = null;

/**
 * Den Zugang erst beim ersten Gebrauch aufbauen.
 *
 * Nicht beim Laden der Datei: Sonst bräche schon das Bauen der Seite
 * ab, solange kein Schlüssel hinterlegt ist — und bis zum Livegang ist
 * genau das der Normalfall.
 */
export function stripe(): Stripe {
  if (zugang) return zugang;

  const schluessel = (process.env.ZAHLUNG_GEHEIMSCHLUESSEL ?? "").trim();
  if (!schluessel) {
    throw new ZahlungNichtEingerichtet("Es ist kein Zahlungsschlüssel hinterlegt.");
  }
  if (!istTestschluessel(schluessel)) {
    // Der Riegel. Absichtlich hart: lieber gar keine Zahlung als
    // versehentlich eine echte.
    throw new ZahlungNichtEingerichtet(
      "Es ist kein Testschlüssel hinterlegt. Echte Zahlungen sind bewusst gesperrt.",
    );
  }

  zugang = new Stripe(schluessel, {
    // Für die automatischen Prüfungen lässt sich der Zugang auf einen
    // örtlichen Testserver zeigen. Im Betrieb sind diese Variablen
    // nicht gesetzt und es gilt die Voreinstellung von Stripe.
    ...(process.env.ZAHLUNG_TEST_HOST
      ? {
          host: process.env.ZAHLUNG_TEST_HOST,
          port: process.env.ZAHLUNG_TEST_PORT,
          protocol: "http" as const,
        }
      : {}),
  });
  return zugang;
}

/** Nur für die Prüfungen: den zwischengespeicherten Zugang verwerfen. */
export function zugangVergessen(): void {
  zugang = null;
}

/** Die öffentliche Adresse dieser Seite, für Rücksprung und Abbruch. */
function basis(): string {
  const wert = (process.env.OEFFENTLICHE_ADRESSE ?? "").trim().replace(/\/+$/, "");
  if (!wert) {
    throw new ZahlungNichtEingerichtet("Die öffentliche Adresse der Seite fehlt.");
  }
  return wert;
}

export interface SitzungsAnfrage {
  anmeldungId: string;
  email: string;
  eventTitel: string;
  personen: number;
  gesamtCents: number;
}

/**
 * Eine Bezahlseite beim Anbieter erzeugen und ihre Adresse liefern.
 *
 * Der Betrag kommt vom Aufrufer aus der DATENBANK, niemals aus dem
 * Browser. Ein mitgeschickter Betrag wird an keiner Stelle gelesen.
 */
export async function sitzungErstellen(
  anfrage: SitzungsAnfrage,
): Promise<{ id: string; url: string }> {
  const s = stripe();

  const sitzung = await s.checkout.sessions.create({
    mode: "payment",
    // Genau die gewünschten Wege. „card" bringt Apple Pay und Google
    // Pay von selbst mit — sie sind bei Stripe keine eigenen Zahlarten,
    // sondern die Kartenzahlung, auf dem passenden Gerät als
    // Wallet-Knopf dargestellt.
    payment_method_types: ["card", "paypal"],
    line_items: [posten(anfrage.eventTitel, anfrage.personen, anfrage.gesamtCents)],
    customer_email: anfrage.email,
    locale: "de",
    // Beide Angaben, weil beide später beim Abgleich helfen: die eine
    // steht in der Stripe-Oberfläche gut sichtbar, die andere kommt in
    // der Rückmeldung zuverlässig mit.
    client_reference_id: anfrage.anmeldungId,
    metadata: { anmeldungId: anfrage.anmeldungId },
    success_url: `${basis()}/anmeldung/danke?nr=${anfrage.anmeldungId}&zahlung=zurueck`,
    cancel_url: `${basis()}/anmeldung/danke?nr=${anfrage.anmeldungId}&zahlung=abgebrochen`,
  });

  if (!sitzung.url) {
    throw new ZahlungNichtEingerichtet("Der Anbieter hat keine Bezahlseite geliefert.");
  }
  return { id: sitzung.id, url: sitzung.url };
}

export interface Sitzungsstand {
  bezahlt: boolean;
  betragCents: number | null;
  anmeldungId: string | null;
}

/**
 * Beim Anbieter NACHFRAGEN, ob bezahlt wurde.
 *
 * Wichtig: Das ist eine Frage vom Server an den Anbieter, keine
 * Behauptung aus dem Browser. Eine Rückleitung in der Adresszeile
 * („…?bezahlt=1") lässt sich von jedem selbst eintippen und ist als
 * Nachweis wertlos.
 */
export async function sitzungPruefen(sitzungId: string): Promise<Sitzungsstand> {
  const sitzung = await stripe().checkout.sessions.retrieve(sitzungId);
  return {
    bezahlt: sitzung.payment_status === "paid",
    betragCents: sitzung.amount_total ?? null,
    anmeldungId: sitzung.metadata?.anmeldungId ?? sitzung.client_reference_id ?? null,
  };
}

/**
 * Eine Rückmeldung des Anbieters auf Echtheit prüfen.
 *
 * Ohne gültige Unterschrift wird nichts verarbeitet. Sonst könnte
 * jeder, der die Adresse kennt, beliebige Anmeldungen als bezahlt
 * melden.
 */
export function rueckmeldungPruefen(rohtext: string, unterschrift: string | null): Stripe.Event {
  const geheimnis = (process.env.ZAHLUNG_WEBHOOK_GEHEIMNIS ?? "").trim();
  if (!geheimnis) {
    throw new ZahlungNichtEingerichtet("Es ist kein Webhook-Geheimnis hinterlegt.");
  }
  if (!unterschrift) {
    throw new Error("Die Rückmeldung trägt keine Unterschrift.");
  }
  return stripe().webhooks.constructEvent(rohtext, unterschrift, geheimnis);
}
