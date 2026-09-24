/* ---------------------------------------------------------------
   Abfragen für den Adminbereich.

   Getrennt von lib/events.ts, weil es hier um etwas anderes geht:
   lib/events.ts liefert, was BESUCHER sehen dürfen — nur
   veröffentlichte Events und ausschließlich Zahlen, niemals Namen.
   Hier stehen Entwürfe, Teilnehmerlisten und Zahlungsstände. Zwei
   Zwecke, zwei Dateien, damit sich nie versehentlich eine
   Teilnehmerliste in eine öffentliche Seite verirrt.
   --------------------------------------------------------------- */

import { db } from "./db";

export interface EventUeberblick {
  id: string;
  slug: string;
  titel: string;
  status: string;
  startAt: Date | null;
  stadt: string;
  maxPersonen: number | null;
  /** Gezählt in PERSONEN, nicht in Anmeldungen. */
  /** Feste Teilnehmer: bezahlt bzw. bestätigt. Nur die zählen. */
  belegtePersonen: number;
  /**
   * Personen in offenen Zahlungsversuchen.
   *
   * Sie zählen seit dem 24.09.2026 NICHT gegen die Plätze und NICHT
   * als Anmeldung — sie stehen hier nur, damit sichtbar bleibt, dass
   * es sie gibt.
   */
  offenePersonen: number;
  /** Anmeldungen mit offenem Zahlungsversuch. Ebenfalls nur Anzeige. */
  offeneVersuche: number;
  wartelistePersonen: number;
  /** Verbindliche Anmeldungen: bestätigt oder auf der Warteliste. */
  anzahlAnmeldungen: number;
  offenCents: number;
  bezahltCents: number;
}

/**
 * Alle Events mit ihren Kennzahlen.
 *
 * Zwei Abfragen für die ganze Liste, nicht zwei je Event: Sonst würde
 * die Übersicht mit jedem weiteren Event langsamer. Gezählt wird in
 * Personen — eine Familie mit sechs Leuten belegt sechs Plätze.
 */
export async function eventUeberblick(): Promise<EventUeberblick[]> {
  const events = await db.event.findMany({
    orderBy: [{ startAt: "asc" }, { erstelltAm: "desc" }],
    select: {
      id: true, slug: true, titel: true, status: true,
      startAt: true, stadt: true, maxPersonen: true,
    },
  });

  const anmeldungen = await db.registration.findMany({
    select: {
      eventId: true,
      status: true,
      zahlungsStatus: true,
      gesamtpreisCents: true,
      _count: { select: { teilnehmer: true } },
    },
  });

  const leer = () => ({
    belegtePersonen: 0, wartelistePersonen: 0, offenePersonen: 0, offeneVersuche: 0,
    anzahlAnmeldungen: 0, offenCents: 0, bezahltCents: 0,
  });
  const stand = new Map(events.map((e) => [e.id, leer()]));

  for (const a of anmeldungen) {
    const s = stand.get(a.eventId);
    if (!s) continue;
    if (a.status === "STORNIERT") continue;

    /* Getrennt gezählt, weil beides etwas anderes bedeutet:
         belegtePersonen = feste Teilnehmer, bezahlt bzw. bestätigt
         offenePersonen  = Personen in einem Zahlungsversuch, für den
                           noch nicht bezahlt ist

       Seit dem 24.09.2026 (Entscheidung von Adam) zählt für die
       KAPAZITÄT nur noch die erste Zahl. Vorher zählte die Summe, und
       ein bloßes Öffnen der Bezahlseite erschien hier als
       „1 Anmeldung · 1 Platz reserviert", obwohl niemand bezahlt
       hatte. Die Kehrseite steht in lib/plaetze.ts: Ein Platz wird
       nicht mehr gehalten, eine Überbuchung ist dadurch möglich und
       wird unten ausgewiesen.

       Aus demselben Grund zählt ein offener Versuch nicht als
       Anmeldung. Verbindlich ist, wer bezahlt hat oder wartet. */
    const offen = a.status === "RESERVIERT";
    if (a.status === "BESTAETIGT" || a.status === "WARTELISTE") s.anzahlAnmeldungen += 1;
    if (a.status === "BESTAETIGT") s.belegtePersonen += a._count.teilnehmer;
    if (offen) {
      s.offenePersonen += a._count.teilnehmer;
      s.offeneVersuche += 1;
    }
    if (a.status === "WARTELISTE") s.wartelistePersonen += a._count.teilnehmer;
    if (a.zahlungsStatus === "BEZAHLT") s.bezahltCents += a.gesamtpreisCents;
    else s.offenCents += a.gesamtpreisCents;
  }

  return events.map((e) => ({ ...e, ...(stand.get(e.id) ?? leer()) }));
}

/** Eine Anmeldung mit ihren Teilnehmern, wie sie die Liste anzeigt. */
export type AnmeldungMitTeilnehmern = Awaited<ReturnType<typeof anmeldungenZuEvent>>[number];

export function anmeldungenZuEvent(eventId: string) {
  return db.registration.findMany({
    where: { eventId },
    orderBy: { angemeldetAm: "asc" },
    include: { teilnehmer: { orderBy: { id: "asc" } } },
  });
}
