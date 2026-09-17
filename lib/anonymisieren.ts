/* ---------------------------------------------------------------
   Personenbezug aus einer Anmeldung entfernen.

   Stand bis heute in app/admin/anmeldungen/aktion.ts. Seit der
   Löschlauf dasselbe tun muss, liegt die Logik hier — sonst gäbe es
   zwei Fassungen, die früher oder später auseinanderlaufen.

   Was überschrieben wird: Vorname, Nachname, E-Mail und Telefon der
   anmeldenden Person sowie die Namen aller Teilnehmer.

   Was ausdrücklich STEHEN BLEIBT: gesamtpreisCents,
   bezahlterBetragCents, bezahltAm, angemeldetAm, zahlungsReferenz und
   zahlungsAbsicht. Das sind die steuerrelevanten Angaben — sie
   unterliegen § 147 AO und laufen ihre eigenen acht Jahre, unabhängig
   von jeder Anonymisierung.
   --------------------------------------------------------------- */

import { db } from "./db";

/**
 * Die Felder, die diese Funktion NIEMALS anfasst.
 *
 * Steht als Liste da, damit die Prüfung sie gegenlesen kann — eine
 * Zusicherung im Fließtext lässt sich nicht testen, diese Liste schon.
 */
export const STEUERRELEVANTE_FELDER = [
  "gesamtpreisCents",
  "bezahlterBetragCents",
  "bezahltAm",
  "angemeldetAm",
  "zahlungsReferenz",
  "zahlungsAbsicht",
  "zahlungsStatus",
] as const;

/**
 * Überschreibt den Personenbezug einer Anmeldung.
 *
 * Gibt `false` zurück, wenn es nichts zu tun gab — die Anmeldung
 * existiert nicht oder ist bereits anonymisiert. Kein Fehler, damit
 * ein zweiter Lauf über denselben Datensatz stillschweigend richtig
 * ist.
 */
export async function anmeldungAnonymisieren(id: string): Promise<boolean> {
  const vorhanden = await db.registration.findUnique({
    where: { id },
    select: { id: true, anonymisiertAm: true },
  });
  if (!vorhanden || vorhanden.anonymisiertAm) return false;

  await db.$transaction(async (tx) => {
    const teilnehmer = await tx.participant.findMany({
      where: { registrationId: id },
      select: { id: true },
    });

    for (const [i, t] of teilnehmer.entries()) {
      await tx.participant.update({
        where: { id: t.id },
        data: { vorname: "Gelöscht", nachname: `Teilnehmer ${i + 1}`, geburtsjahr: null },
      });
    }

    await tx.registration.update({
      where: { id },
      data: {
        kontaktVorname: "Gelöscht",
        kontaktNachname: "Anmeldung",
        /* Die E-Mail-Adresse muss je Event eindeutig bleiben, sonst
           scheitert eine zweite Anonymisierung an der Eindeutigkeit.
           Die Anmeldenummer ist bereits eindeutig und enthält keine
           Personendaten. */
        kontaktEmail: `geloescht+${id}@invalid`,
        kontaktTelefon: null,
        anonymisiertAm: new Date(),
      },
    });
  });

  return true;
}

/**
 * Personenbezug aus einer Checkliste entfernen.
 *
 * Das Mitarbeiterkürzel ist ein personenbezogenes Datum von
 * Beschäftigten — ein Kürzel, das der Betreiber zuordnen kann, ist
 * kein anonymer Wert. Es wird zusammen mit dem Freitext geleert.
 *
 * Was bleibt: dass eine Einweisung stattgefunden hat, wann, und für
 * wie viele Personen. Das ist die anonyme Sicherheitsdokumentation,
 * und sie darf dauerhaft erhalten bleiben.
 */
export async function checklisteAnonymisieren(id: string): Promise<boolean> {
  const vorhanden = await db.checkliste.findUnique({
    where: { id },
    select: { id: true, anonymisiertAm: true },
  });
  if (!vorhanden || vorhanden.anonymisiertAm) return false;

  await db.checkliste.update({
    where: { id },
    data: {
      einweisungKuerzel: null,
      notiz: null,
      anonymisiertAm: new Date(),
    },
  });

  return true;
}
