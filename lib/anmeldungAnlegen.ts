/* ---------------------------------------------------------------
   Aus einer bezahlten Zahlung eine Anmeldung machen — der EINE Weg.

   Ab dem Umbau vom 25.09.2026 entsteht eine Anmeldung ausschliesslich
   hier, und ausschliesslich dann, wenn der Zahlungsanbieter die
   Zahlung serverseitig bestätigt hat.

   ── Warum eine Funktion und nicht drei ──────────────────────────

   Drei Wege dürfen anlegen, und sie können sich überholen:

     1. die Rückmeldung des Anbieters   (der Normalfall, Sekunden)
     2. die Rückfrage der Abschluss-Seite (schliesst die Lücke von
        wenigen Sekunden, wenn der Besucher schneller da ist)
     3. der nächtliche Abgleich          (wenn die Rückmeldung ausblieb)

   Drei Stellen mit derselben Logik wären drei Stellen, die
   auseinanderlaufen können. Deshalb eine Funktion, die alle drei
   aufrufen — und die es aushält, mehrfach für dieselbe Zahlung
   aufgerufen zu werden.

   ── Wie Doppelanlage verhindert wird ────────────────────────────

   NICHT durch eine Prüfung „gibt es das schon?" — zwei gleichzeitige
   Aufrufe würden beide „nein" lesen und beide anlegen. Sondern durch
   den eindeutigen Index auf `zahlungsReferenz`: Der zweite Versuch
   scheitert an der Datenbank. Das ist der Unterschied zwischen einer
   Absichtserklärung und einer Eigenschaft.

   ── Warum die Veranstaltungszeile gesperrt wird ─────────────────

   Es wird kein Platz mehr freigehalten, während jemand bezahlt. Die
   Platzprüfung findet deshalb erst hier statt — und zwei gleichzeitig
   eintreffende Rückmeldungen dürfen nicht beide denselben letzten
   Platz sehen. `SELECT … FOR UPDATE` auf die Veranstaltung sorgt
   dafür, dass sie nacheinander drankommen.

   ── Wenn der Platz weg ist ──────────────────────────────────────

   Dann entsteht KEINE Anmeldung, sondern eine Zeile in `Fehlbuchung`,
   und der Aufrufer erstattet. Diese Datei erstattet NICHT selbst: Ein
   Netzaufruf gehört nicht in eine offene Datenbanktransaktion, er
   hielte Sperren über eine fremde Laufzeit hinweg. Die Zeile wird
   aber vorher geschrieben — stürzt der Dienst dazwischen ab, findet
   der Abgleichlauf sie und holt die Erstattung nach.
   --------------------------------------------------------------- */

import { db } from "./db";
import { belegtFilter } from "./plaetze";
import { neuerStornoSchluessel } from "./storno";
import { terminSteht } from "./termin";
import type { Nutzlast } from "./anmeldeNutzlast";

/** Warum keine Anmeldung entstehen konnte. Die vier Fälle vom 25.09.2026. */
export type Fehlbuchungsgrund =
  | "keine-plaetze"
  | "doppelte-adresse"
  | "kein-termin"
  | "betrag-abweichend"
  /**
   * Eine bezahlte Bezahlseite ohne verschlüsselte Anmeldung.
   *
   * Der fünfte Fall, nachgetragen am 26.09.2026 beim Bauen von
   * Stufe 2. Er entsteht, wenn beim Ausrollen noch eine Bezahlseite
   * aus der Zeit davor offen war — oder bei etwas, das niemand
   * vorhergesehen hat. Wie `betrag-abweichend` wird er NICHT
   * automatisch erstattet: Bei einem Vorgang, den das Programm nicht
   * versteht, eigenmächtig Geld zurückzubuchen wäre die falsche
   * Antwort.
   */
  | "ohne-marke";

/**
 * Gründe, bei denen sofort und vollständig erstattet wird.
 *
 * `betrag-abweichend` fehlt hier mit Absicht: Ein abweichender Betrag
 * ist entweder ein Fehler oder ein Angriff, und beides gehört
 * angesehen statt stillschweigend zurückgebucht. Diese Zeilen bleiben
 * offen und werden im Adminbereich als Warnung ausgewiesen
 * (Entscheidung vom 25.09.2026).
 */
export const SOFORT_ERSTATTEN: readonly Fehlbuchungsgrund[] = [
  "keine-plaetze",
  "doppelte-adresse",
  "kein-termin",
];

/** Die Gründe, die von Hand angesehen werden müssen. */
export const ZUR_KLAERUNG: readonly Fehlbuchungsgrund[] = ["betrag-abweichend", "ohne-marke"];

export type Anlageergebnis =
  /** Die Anmeldung ist neu entstanden. */
  | { lage: "angelegt"; anmeldungId: string; stornoSchluessel: string }
  /** Es gab sie schon — ein zweiter Weg war schneller. Kein Fehler. */
  | { lage: "schon-da"; anmeldungId: string }
  /** Keine Anmeldung möglich; das Geld muss zurück. */
  | { lage: "fehlbuchung"; grund: Fehlbuchungsgrund; erstatten: boolean };

export interface Zahlungsangaben {
  /** Die Bezahlseite („cs_…"). Trägt die Eindeutigkeit. */
  sitzungId: string;
  /** Die Zahlung dahinter („pi_…"). Ohne sie ist keine Erstattung möglich. */
  zahlungId: string | null;
  /** Was der Anbieter als bezahlt meldet. */
  bezahlterBetragCents: number;
}

/**
 * Die Anmeldung anlegen — oder begründet nicht.
 *
 * Erwartet eine bereits entschlüsselte und geprüfte Nutzlast und eine
 * bereits BESTÄTIGTE Zahlung. Diese Funktion prüft weder Signatur noch
 * Betrag; das gehört an die Stelle, die den Anbieter kennt.
 */
export async function anmeldungAusZahlung(
  nutzlast: Nutzlast,
  zahlung: Zahlungsangaben,
  jetzt: Date = new Date(),
): Promise<Anlageergebnis> {
  return db.$transaction(async (tx) => {
    /* Zuerst nachsehen, ob diese Zahlung schon verbucht ist. Der
       eindeutige Index fängt den Wettlauf ab; diese Abfrage fängt den
       häufigen, harmlosen Fall ab, dass zwei Wege nacheinander kommen
       — dann soll niemand einen Fehler sehen. */
    const schonDa = await tx.registration.findUnique({
      where: { zahlungsReferenz: zahlung.sitzungId },
      select: { id: true },
    });
    if (schonDa) return { lage: "schon-da", anmeldungId: schonDa.id };

    /* Die Veranstaltungszeile sperren, BEVOR gezählt wird. Ohne diese
       Zeile könnten zwei gleichzeitige Rückmeldungen beide denselben
       letzten Platz sehen und beide anlegen. */
    await tx.$queryRaw`SELECT id FROM Event WHERE id = ${nutzlast.eventId} FOR UPDATE`;

    const event = await tx.event.findUnique({
      where: { id: nutzlast.eventId },
      select: { id: true, maxPersonen: true, startAt: true },
    });
    if (!event) return { lage: "fehlbuchung", grund: "kein-termin", erstatten: true };

    /* Der Termin kann entfernt worden sein, während jemand bezahlt hat.
       Ohne feststehenden Termin darf kein Vertrag entstehen — dieselbe
       Regel wie beim Absenden (Entscheidung 2.5). */
    if (!terminSteht(event)) {
      return { lage: "fehlbuchung", grund: "kein-termin", erstatten: true };
    }

    /* Für dieselbe Adresse gibt es je Veranstaltung genau eine
       Anmeldung. Beim Absenden wird das schon gelesen, aber ohne
       Verbindlichkeit: Zwischen Absenden und Zahlung kann dieselbe
       Person ein zweites Mal durchgelaufen sein. Hier entscheidet es
       sich. */
    const doppelt = await tx.registration.findUnique({
      where: {
        eventId_kontaktEmail: {
          eventId: nutzlast.eventId,
          kontaktEmail: nutzlast.kontaktEmail,
        },
      },
      select: { id: true, status: true },
    });
    if (doppelt && doppelt.status !== "STORNIERT") {
      return { lage: "fehlbuchung", grund: "doppelte-adresse", erstatten: true };
    }

    /* Reichen die Plätze? Belegt ist nur, wofür bezahlt wurde
       (lib/plaetze.ts). Eine stornierte eigene Altbuchung zählt nicht
       mit und wird gleich überschrieben. */
    if (event.maxPersonen !== null) {
      const bestaetigte = await tx.registration.findMany({
        where: {
          eventId: event.id,
          ...belegtFilter(),
          ...(doppelt ? { id: { not: doppelt.id } } : {}),
        },
        select: { _count: { select: { teilnehmer: true } } },
      });
      const belegt = bestaetigte.reduce((s, a) => s + a._count.teilnehmer, 0);
      if (belegt + nutzlast.teilnehmer.length > event.maxPersonen) {
        return { lage: "fehlbuchung", grund: "keine-plaetze", erstatten: true };
      }
    }

    const stornoSchluessel = neuerStornoSchluessel();
    const felder = {
      eventId: nutzlast.eventId,
      kontaktVorname: nutzlast.kontaktVorname,
      kontaktNachname: nutzlast.kontaktNachname,
      kontaktEmail: nutzlast.kontaktEmail,
      kontaktTelefon: nutzlast.kontaktTelefon,
      buchungsart: nutzlast.buchungsart,
      istVormundBuchung: nutzlast.istVormundBuchung,
      einwilligungVormund: nutzlast.einwilligungVormund,
      agbAkzeptiert: nutzlast.agbAkzeptiert,
      kenntnisAufnahmen: nutzlast.kenntnisAufnahmen,
      gesamtpreisCents: nutzlast.gesamtpreisCents,
      /* Die Fassungen, die beim ABSENDEN galten — sie reisen in der
         Nutzlast mit. Hier frisch nachzuschlagen wäre falsch: Nach
         einer Textänderung stünde die Fassung von heute an einer
         Buchung, die unter der von gestern zustande kam. */
      agbFassungId: nutzlast.agbFassungId,
      datenschutzFassungId: nutzlast.datenschutzFassungId,
      status: "BESTAETIGT" as const,
      zahlungsStatus: "BEZAHLT" as const,
      zahlungsWeg: "ONLINE" as const,
      zahlungsReferenz: zahlung.sitzungId,
      zahlungsAbsicht: zahlung.zahlungId,
      bezahlterBetragCents: zahlung.bezahlterBetragCents,
      bezahltAm: jetzt,
      stornoSchluessel,
      teilnehmer: {
        create: nutzlast.teilnehmer.map((t) => ({
          vorname: t.vorname,
          nachname: t.nachname,
          typ: (t.typ === "S" ? "SCHUELER" : "ERWACHSENER") as "SCHUELER" | "ERWACHSENER",
          geburtsjahr: t.geburtsjahr ?? null,
        })),
      },
    };

    /* Eine stornierte Altbuchung derselben Adresse wird ersetzt, nicht
       verdoppelt — der eindeutige Index über Veranstaltung und Adresse
       liesse eine zweite Zeile ohnehin nicht zu. */
    if (doppelt) {
      await tx.participant.deleteMany({ where: { registrationId: doppelt.id } });
      const neu = await tx.registration.update({
        where: { id: doppelt.id },
        data: { ...felder, storniertAm: null, reaktiviertAm: jetzt },
        select: { id: true },
      });
      return { lage: "angelegt", anmeldungId: neu.id, stornoSchluessel };
    }

    const neu = await tx.registration.create({ data: felder, select: { id: true } });
    return { lage: "angelegt", anmeldungId: neu.id, stornoSchluessel };
  });
}

/**
 * Eine Fehlbuchung festhalten — bevor erstattet wird.
 *
 * Die Reihenfolge ist wichtig und nicht umkehrbar: erst der Beleg,
 * dann das Geld. Stürzt der Dienst zwischen beidem ab, steht eine
 * offene Zeile da, die der Abgleichlauf findet. Umgekehrt wäre das
 * Geld zurück und niemand wüsste davon.
 *
 * Mehrfach aufrufbar: Die zweite Meldung derselben Bezahlseite legt
 * keine zweite Zeile an.
 */
export async function fehlbuchungFesthalten(
  sitzungId: string,
  betragCents: number,
  grund: Fehlbuchungsgrund,
): Promise<{ id: string; schonDa: boolean }> {
  const vorhanden = await db.fehlbuchung.findUnique({
    where: { sitzungId },
    select: { id: true },
  });
  if (vorhanden) return { id: vorhanden.id, schonDa: true };

  const neu = await db.fehlbuchung.create({
    data: { sitzungId, betragCents, grund },
    select: { id: true },
  });
  return { id: neu.id, schonDa: false };
}

/** Festhalten, dass erstattet wurde. */
export async function erstattungVermerken(
  sitzungId: string,
  erstattungId: string,
  jetzt: Date = new Date(),
): Promise<void> {
  await db.fehlbuchung.update({
    where: { sitzungId },
    data: { erstattetAm: jetzt, erstattungId },
  });
}
