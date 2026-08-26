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
  belegtePersonen: number;
  /** Anmeldungen, deren Platz gerade für die Zahlung gehalten wird. */
  reservierungen: number;
  wartelistePersonen: number;
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
      reserviertBis: true,
      zahlungsStatus: true,
      gesamtpreisCents: true,
      _count: { select: { teilnehmer: true } },
    },
  });

  const jetzt = new Date();
  const leer = () => ({
    belegtePersonen: 0, wartelistePersonen: 0, reservierungen: 0,
    anzahlAnmeldungen: 0, offenCents: 0, bezahltCents: 0,
  });
  const stand = new Map(events.map((e) => [e.id, leer()]));

  for (const a of anmeldungen) {
    const s = stand.get(a.eventId);
    if (!s) continue;
    if (a.status === "STORNIERT") continue;

    s.anzahlAnmeldungen += 1;
    // Eine laufende Reservierung belegt den Platz genauso wie eine
    // bestätigte Anmeldung — sonst zeigte der Adminbereich mehr freie
    // Plätze an, als die öffentliche Seite.
    const laeuft = a.status === "RESERVIERT" && a.reserviertBis !== null && a.reserviertBis > jetzt;
    if (a.status === "BESTAETIGT" || laeuft) s.belegtePersonen += a._count.teilnehmer;
    if (laeuft) s.reservierungen += 1;
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
