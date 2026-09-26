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

/**
 * Wie viele Zeichen ein einzelnes Metadaten-Feld des Anbieters fasst.
 *
 * Am 25.09.2026 auf dem Server gegen die echte Schnittstelle gemessen:
 * 20 Felder zu je 500 Zeichen gehen durch, gebraucht werden im
 * schlimmsten Fall 7. Die Zahl steht hier und nicht verstreut im Code,
 * damit sie an einer Stelle steht, wenn der Anbieter sie je ändert.
 */
export const METADATEN_ZEICHEN = 500;

/** Höchstens so viele Stücke werden erzeugt. Mehr wäre ein Fehler. */
export const METADATEN_STUECKE_MAX = 20;

export interface SitzungsAnfrage {
  email: string;
  /**
   * Die Kennung der Veranstaltung, im Klartext.
   *
   * Sie steht offen in der `metadata`, und das ist kein Versehen:
   * Beim Entschlüsseln der Marke muss sie von aussen mitgebracht
   * werden — sie geht als mitversiegelte Zusatzdaten in das Siegel
   * ein (lib/anmeldeNutzlast.ts). Stünde sie nur IN der Marke, wäre
   * die Bindung wertlos, weil man sie nicht prüfen könnte, ohne sie
   * schon zu kennen. Eine Veranstaltungskennung ist ausserdem kein
   * Personenbezug; sie steht ohnehin in jeder öffentlichen Adresse.
   */
  eventId: string;
  eventTitel: string;
  personen: number;
  gesamtCents: number;
  /**
   * Die verschlüsselte Anmeldung (lib/anmeldeNutzlast.ts).
   *
   * Sie reist in der `metadata` der Bezahlseite mit — das ist seit dem
   * Umbau vom 25.09.2026 der EINZIGE Ort, an dem die Anmeldedaten
   * zwischen dem Absenden des Formulars und der bestätigten Zahlung
   * liegen. In der VERA-Datenbank steht bis dahin nichts.
   */
  marke: string;
}

/**
 * Die Marke in Stücke schneiden, die in je ein Metadaten-Feld passen.
 *
 * Die Stückzahl steht als eigenes Feld dabei. Ohne sie müsste die
 * Gegenseite raten, wie viele Felder zusammengehören — und ein
 * fehlendes Stück fiele erst beim Entschlüsseln auf, also zu spät für
 * eine verständliche Meldung.
 */
export function markeZerlegen(marke: string): Record<string, string> {
  const stuecke: string[] = [];
  for (let i = 0; i < marke.length; i += METADATEN_ZEICHEN) {
    stuecke.push(marke.slice(i, i + METADATEN_ZEICHEN));
  }
  if (stuecke.length > METADATEN_STUECKE_MAX) {
    throw new Error(
      `Die Marke ist ${marke.length} Zeichen lang und braucht ${stuecke.length} Felder — ` +
        `erlaubt sind ${METADATEN_STUECKE_MAX}.`,
    );
  }
  const felder: Record<string, string> = { marke_teile: String(stuecke.length) };
  stuecke.forEach((teil, i) => {
    felder[`marke_${i + 1}`] = teil;
  });
  return felder;
}

/**
 * Die Marke aus den Metadaten wieder zusammensetzen.
 *
 * Gibt null zurück, wenn keine da ist oder ein Stück fehlt. Der
 * Aufrufer entscheidet, was das bedeutet — ein fehlendes Stück ist
 * etwas anderes als eine Rückmeldung zu einer Buchung aus der Zeit
 * vor dem Umbau, und beides soll unterscheidbar bleiben.
 */
export function markeZusammensetzen(
  metadata: Record<string, string> | null | undefined,
): string | null {
  const anzahl = Number(metadata?.marke_teile ?? "0");
  if (!Number.isInteger(anzahl) || anzahl <= 0) return null;

  const teile: string[] = [];
  for (let i = 1; i <= anzahl; i++) {
    const teil = metadata?.[`marke_${i}`];
    if (typeof teil !== "string") return null;
    teile.push(teil);
  }
  return teile.join("");
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
    /* Die verschlüsselte Anmeldung, in Stücke zerlegt.
       Es gibt keine Anmeldenummer mehr, die hier stehen könnte — die
       Anmeldung entsteht erst mit der bestätigten Zahlung. Was die
       Rückmeldung zusammenhält, ist die Sitzungskennung, die der
       Anbieter selbst vergibt. */
    metadata: { event: anfrage.eventId, ...markeZerlegen(anfrage.marke) },
    /* Die Bezahlseite läuft nach 30 Minuten ab statt nach 24 Stunden.
       Gehalten wird dadurch nichts — es wird kein Platz reserviert.
       Aber eine Bezahlseite, die einen Tag lang bezahlbar bleibt,
       lädt dazu ein, sie am Abend noch zu öffnen, wenn die
       Veranstaltung längst ausgebucht ist. Dann käme das Geld an und
       müsste wieder zurück. Dreissig Minuten ist das Kürzeste, was
       der Anbieter zulässt. */
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    /* Die Rückkehr trägt die Sitzungskennung. Die Abschluss-Seite
       fragt damit SELBST beim Anbieter nach, ob bezahlt wurde — der
       Browser liefert nur die Kennung, geglaubt wird ihm nichts. */
    success_url: `${basis()}/anmeldung/danke?sitzung={CHECKOUT_SESSION_ID}&zahlung=zurueck`,
    cancel_url: `${basis()}/anmeldung/danke?zahlung=abgebrochen`,
  });

  if (!sitzung.url) {
    throw new ZahlungNichtEingerichtet("Der Anbieter hat keine Bezahlseite geliefert.");
  }
  return { id: sitzung.id, url: sitzung.url };
}

export interface Sitzungsstand {
  bezahlt: boolean;
  betragCents: number | null;
  /**
   * Die verschlüsselte Anmeldung, falls die Sitzung eine trägt.
   *
   * Null bei Sitzungen aus der Zeit vor dem Umbau vom 25.09.2026 —
   * die trugen eine Anmeldenummer statt einer Marke.
   */
  marke: string | null;
  /** Die Veranstaltungskennung aus der Metadata — für das Aufschliessen nötig. */
  eventId: string | null;
  /** „open" = noch bezahlbar, „complete" = bezahlt, „expired" = verfallen. */
  lage: string | null;
  /** Die Adresse der Bezahlseite, solange sie noch offen ist. */
  url: string | null;
  /** Die eigentliche Zahlung hinter der Bezahlseite („pi_…"). */
  zahlungId: string | null;
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
    marke: markeZusammensetzen(sitzung.metadata),
    eventId: sitzung.metadata?.event ?? null,
    lage: sitzung.status ?? null,
    url: sitzung.url ?? null,
    zahlungId:
      typeof sitzung.payment_intent === "string"
        ? sitzung.payment_intent
        : (sitzung.payment_intent?.id ?? null),
  };
}

/** Was der Anbieter über eine Bezahlseite weiß — vollständig, nur lesend. */
export interface Zahlungsspur {
  /** Die Lage der Bezahlseite: "open", "complete", "expired". */
  lage: string | null;
  /** "paid", "unpaid" oder "no_payment_required". */
  zahlungslage: string | null;
  betragCents: number | null;
  zahlungId: string | null;
  /** Die einzelnen Abbuchungen zu dieser Zahlung — leer heißt: keine. */
  buchungen: { id: string; betragCents: number; erfolgreich: boolean; erstattet: number }[];
}

/**
 * Ist für diese Bezahlseite jemals Geld geflossen?
 *
 * Rein lesend — es wird nichts angelegt, nichts geschlossen, nichts
 * erstattet. Gedacht für die Frage, ob eine Anmeldung gefahrlos
 * entfernt werden darf (prisma/anmeldungPruefen.ts).
 *
 * Warum nicht `sitzungPruefen()` genügt: Die liefert nur ein Ja/Nein
 * zum Bezahltstatus. Vor dem endgültigen Entfernen eines Datensatzes
 * ist das zu wenig — dort will man die Abbuchungen selbst sehen, auch
 * eine fehlgeschlagene. Eine fehlgeschlagene Abbuchung bedeutet zwar
 * kein Geld, aber sie bedeutet, dass jemand es versucht hat, und das
 * gehört im Protokoll gezeigt statt verschwiegen.
 */
export async function zahlungsspurPruefen(sitzungId: string): Promise<Zahlungsspur> {
  const s = stripe();
  const sitzung = await s.checkout.sessions.retrieve(sitzungId);

  const zahlungId =
    typeof sitzung.payment_intent === "string"
      ? sitzung.payment_intent
      : (sitzung.payment_intent?.id ?? null);

  const buchungen: Zahlungsspur["buchungen"] = [];
  if (zahlungId) {
    /* Die Abbuchungen hängen an der Zahlung, nicht an der Bezahlseite.
       Schlägt der Abruf fehl, wird das NICHT als "keine Abbuchung"
       ausgegeben — der Aufrufer bekommt den Fehler und meldet
       "unklar". Ein Fehler, der wie Entwarnung aussieht, wäre hier der
       teuerste Fehler überhaupt. */
    const zahlung = await s.paymentIntents.retrieve(zahlungId, { expand: ["latest_charge"] });
    const letzte = zahlung.latest_charge;
    if (letzte && typeof letzte !== "string") {
      buchungen.push({
        id: letzte.id,
        betragCents: letzte.amount,
        erfolgreich: letzte.status === "succeeded",
        erstattet: letzte.amount_refunded,
      });
    }
  }

  return {
    lage: sitzung.status ?? null,
    zahlungslage: sitzung.payment_status ?? null,
    betragCents: sitzung.amount_total ?? null,
    zahlungId,
    buchungen,
  };
}

/**
 * Eine noch offene Bezahlseite schließen.
 *
 * Der eigentliche Schutz vor einer doppelten Abbuchung. Entsteht für
 * dieselbe Anmeldung eine neue Bezahlseite, darf die alte nicht
 * weiterhin bezahlbar bleiben — sonst kann jemand zweimal zahlen,
 * einmal über den alten Link im Verlauf und einmal über den neuen.
 *
 * Schlägt das Schließen fehl (die Sitzung ist ohnehin verfallen oder
 * schon bezahlt), ist das kein Grund, den Vorgang abzubrechen.
 */
export async function sitzungSchliessen(sitzungId: string): Promise<void> {
  try {
    await stripe().checkout.sessions.expire(sitzungId);
  } catch (e) {
    console.warn("Alte Bezahlseite liess sich nicht schliessen:", sitzungId, e);
  }
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

export interface Erstattungsergebnis {
  id: string;
  betragCents: number;
  /** „succeeded", „pending", „failed" oder „canceled" beim Anbieter. */
  lage: string | null;
}

/**
 * Den vollen Betrag einer Zahlung erstatten.
 *
 * Ohne Betragsangabe erstattet der Anbieter die gesamte Zahlung —
 * genau das ist die Regel: bei rechtzeitiger Stornierung der volle
 * Betrag, ohne Abzug. Ein Teilbetrag wird hier bewusst nicht
 * angeboten; Kulanz in anderer Höhe bleibt Handarbeit im Dashboard.
 *
 * Der WIEDERHOLUNGSSCHLÜSSEL ist der Kern dieser Funktion. Kommt
 * derselbe Aufruf ein zweites Mal an — Doppelklick, doppelt
 * abgeschickt, erneut geladen —, liefert der Anbieter dieselbe
 * Erstattung zurück, statt ein zweites Mal Geld zu bewegen. Er hält
 * beim Anbieter rund einen Tag; der dauerhafte Schutz bleibt die
 * Statusprüfung in der Datenbank, die vor jedem Aufruf steht.
 *
 * In den Schlüssel gehört die ZAHLUNG, nicht nur die Buchung. Vorher
 * stand dort allein die Anmeldenummer — und das ging im Betrieb schief:
 * Eine Buchungszeile wird bei einer erneuten Anmeldung nach einer
 * Stornierung wiederverwendet. Die zweite Stornierung wollte dann eine
 * ANDERE Zahlung erstatten, schickte aber denselben Schlüssel. Der
 * Anbieter weist das ab — gleicher Schlüssel, andere Angaben —, und
 * zwar einen ganzen Tag lang. Für den Kunden sah es aus, als täte der
 * Knopf gar nichts.
 *
 * Mit der Zahlungskennung im Schlüssel bleibt der Doppelklick-Schutz
 * genau dort, wo er hingehört (dieselbe Erstattung derselben Zahlung),
 * und eine echte zweite Erstattung wird nicht mehr blockiert.
 *
 * Der Testmodus-Riegel gilt hier wie überall: stripe() weist jeden
 * Schlüssel ab, der kein Testschlüssel ist. Eine echte Erstattung ist
 * damit vor der bewussten Freischaltung nicht möglich.
 */
export async function erstattungAusloesen(
  zahlungId: string,
  /**
   * Wofür erstattet wird — eine Anmeldenummer beim Storno, eine
   * Sitzungskennung bei einer Fehlbuchung. Der Wert geht als
   * Wiedererkennung an den Anbieter und in den Schlüssel gegen
   * doppelte Erstattungen.
   */
  vorgang: string,
): Promise<Erstattungsergebnis> {
  const erstattung = await stripe().refunds.create(
    {
      payment_intent: zahlungId,
      metadata: { vorgang },
    },
    { idempotencyKey: `erstattung-${vorgang}-${zahlungId}` },
  );

  return {
    id: erstattung.id,
    betragCents: erstattung.amount ?? 0,
    lage: erstattung.status ?? null,
  };
}
