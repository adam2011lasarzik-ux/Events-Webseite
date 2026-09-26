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
    belegtePersonen: 0, wartelistePersonen: 0,
    anzahlAnmeldungen: 0, offenCents: 0, bezahltCents: 0,
  });
  const stand = new Map(events.map((e) => [e.id, leer()]));

  for (const a of anmeldungen) {
    const s = stand.get(a.eventId);
    if (!s) continue;
    if (a.status === "STORNIERT") continue;

    /* Seit Stufe 2 (25.09.2026) gibt es nur noch zwei Zustände, die
       zählen: bestätigt und Warteliste. Eine unbezahlte Anmeldung
       existiert nicht mehr — sie entsteht erst mit der bestätigten
       Zahlung. Die früheren Felder `offenePersonen` und
       `offeneVersuche` sind damit ersatzlos entfallen. */
    if (a.status === "BESTAETIGT" || a.status === "WARTELISTE") s.anzahlAnmeldungen += 1;
    if (a.status === "BESTAETIGT") s.belegtePersonen += a._count.teilnehmer;
    if (a.status === "WARTELISTE") s.wartelistePersonen += a._count.teilnehmer;
    if (a.zahlungsStatus === "BEZAHLT") s.bezahltCents += a.gesamtpreisCents;
    else s.offenCents += a.gesamtpreisCents;
  }

  return events.map((e) => ({ ...e, ...(stand.get(e.id) ?? leer()) }));
}

/**
 * Zahlungen, die eingegangen sind, aber zu keiner Anmeldung geführt
 * haben und noch offen sind.
 *
 * „Offen" heisst: noch nicht erstattet. Zwei Sorten landen hier, und
 * sie bedeuten Verschiedenes:
 *
 *   - `keine-plaetze`, `doppelte-adresse`, `kein-termin` — diese
 *     werden automatisch erstattet. Stehen sie hier, ist die
 *     Erstattung steckengeblieben; der Abgleichlauf holt sie nach.
 *     Bleiben sie über Stunden stehen, stimmt etwas nicht.
 *   - `betrag-abweichend`, `ohne-marke` — diese werden ABSICHTLICH
 *     nicht automatisch erstattet (Entscheidung vom 25.09.2026). Sie
 *     gehören angesehen, und zwar von einem Menschen.
 *
 * Deshalb steht hier keine Zahl, sondern die Zeilen selbst: Eine Zahl
 * lässt sich wegsehen, eine Liste mit Betrag und Grund nicht.
 */
export async function offeneFehlbuchungen() {
  return db.fehlbuchung.findMany({
    where: { erstattetAm: null },
    orderBy: { angelegtAm: "desc" },
    select: { id: true, sitzungId: true, betragCents: true, grund: true, angelegtAm: true },
  });
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
