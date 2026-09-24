/* ---------------------------------------------------------------
   Die Ausführung einer Selbstbedienungs-Stornierung.

   Getrennt von der Server-Aktion, weil eine "use server"-Datei
   ausschließlich async-Funktionen ausgeben darf — ein dort
   ausgegebener Typ oder Wert käme als `undefined` an. Dasselbe Muster
   wie bei lib/zahlungStart.ts.

   Die REIHENFOLGE ist der eigentliche Inhalt dieser Datei:

     1. Buchung frisch laden  — nie dem Formular glauben
     2. Schlüssel prüfen      — zeitkonstant
     3. Regeln anwenden       — lib/storno.ts
     4. Erstattung auslösen   — VOR der Statusänderung
     5. Erst danach speichern

   Punkt 4 vor Punkt 5 ist Absicht. Scheitert die Erstattung, bleibt
   die Buchung unangetastet und der Mensch kann es erneut versuchen.
   Andersherum stünde die Buchung auf "storniert und erstattet",
   während das Geld nie geflossen wäre — ein Fehler, der erst
   auffällt, wenn sich jemand beschwert.
   --------------------------------------------------------------- */

import { db } from "./db";
import { erstattungAusloesen } from "./zahlung";
import {
  schluesselStimmt,
  stornoEntscheidung,
  adminStornoEntscheidung,
  type Stornogrund,
} from "./storno";
import { mailSendenOhneAbbruch, adminEmpfaenger } from "./mail";
import { stornoBestaetigungsMail, stornoAdminMail } from "./mailVorlagen";

export type Stornofehler =
  /** Buchung gibt es nicht, oder der Schlüssel passt nicht. Bewusst
      EIN gemeinsamer Fall: Wer raten will, soll nicht erfahren, ob
      eine Buchung existiert. */
  | "unbekannt"
  /** Zu viele Versuche in kurzer Zeit. */
  | "gebremst"
  /** Der Anbieter hat die Erstattung nicht angenommen. */
  | "anbieter"
  /** Eine der Regeln aus lib/storno.ts greift. */
  | Stornogrund;

export type Stornoergebnis =
  | { erfolg: true; erstattet: boolean; betragCents: number }
  | { erfolg: false; fehler: Stornofehler };

/**
 * Was die Storno-Seite anzeigen darf — bewusst wenig.
 *
 * Nach §8 des Backend-Skills zeigt eine Seite, die ohne Anmeldung
 * erreichbar ist, nur das Nötigste. Nachname und Telefonnummer sind
 * hier nicht nötig: Wer den Schlüssel hat, weiß ohnehin, um wessen
 * Buchung es geht.
 */
export interface Stornoansicht {
  id: string;
  eventTitel: string;
  startAt: Date | null;
  personen: number;
  gesamtpreisCents: number;
  bezahlt: boolean;
  entscheidung: ReturnType<typeof stornoEntscheidung>;
}

/**
 * Buchung für die Anzeige laden — nur mit gültigem Schlüssel.
 *
 * Gibt null zurück, wenn die Buchung nicht existiert ODER der
 * Schlüssel nicht passt. Der Aufrufer kann die beiden Fälle nicht
 * unterscheiden, und das ist so gewollt.
 */
export async function stornoansichtFuer(
  anmeldungId: string,
  schluessel: string,
  jetzt: Date = new Date(),
): Promise<Stornoansicht | null> {
  if (!anmeldungId || !schluessel) return null;

  const anmeldung = await db.registration.findUnique({
    where: { id: anmeldungId },
    include: { event: true, _count: { select: { teilnehmer: true } } },
  });
  if (!anmeldung) return null;
  if (!schluesselStimmt(anmeldung.stornoSchluessel, schluessel)) return null;

  return {
    id: anmeldung.id,
    eventTitel: anmeldung.event.titel,
    startAt: anmeldung.event.startAt,
    personen: anmeldung._count.teilnehmer,
    gesamtpreisCents: anmeldung.gesamtpreisCents,
    bezahlt: anmeldung.zahlungsStatus === "BEZAHLT",
    entscheidung: stornoEntscheidung(
      {
        status: anmeldung.status,
        zahlungsStatus: anmeldung.zahlungsStatus,
        gesamtpreisCents: anmeldung.gesamtpreisCents,
        startAt: anmeldung.event.startAt,
      },
      jetzt,
    ),
  };
}

/**
 * Die Stornierung wirklich ausführen.
 *
 * Prüft alles ein zweites Mal. Zwischen dem Aufruf der Seite und dem
 * Druck auf den Knopf können Minuten liegen — in denen die Frist
 * ablaufen oder jemand anderes bereits storniert haben kann.
 */
export async function stornoAusfuehren(
  anmeldungId: string,
  schluessel: string,
  jetzt: Date = new Date(),
): Promise<Stornoergebnis> {
  if (!anmeldungId || !schluessel) return { erfolg: false, fehler: "unbekannt" };

  const anmeldung = await buchungLaden(anmeldungId);
  if (!anmeldung) return { erfolg: false, fehler: "unbekannt" };
  if (!schluesselStimmt(anmeldung.stornoSchluessel, schluessel)) {
    return { erfolg: false, fehler: "unbekannt" };
  }

  const entscheidung = stornoEntscheidung(
    {
      status: anmeldung.status,
      zahlungsStatus: anmeldung.zahlungsStatus,
      gesamtpreisCents: anmeldung.gesamtpreisCents,
      startAt: anmeldung.event.startAt,
    },
    jetzt,
  );
  if (!entscheidung.erlaubt) return { erfolg: false, fehler: entscheidung.grund };

  return vollziehen(anmeldung, entscheidung.erstatten, jetzt, false);
}

/* ---------------------------------------------------------------
   Ab hier: was sich beide Wege teilen.

   Die Selbstbedienung und die Stornierung durch den Veranstalter
   unterscheiden sich NUR darin, wer fragen darf und ob eine Frist
   gilt. Was danach passiert — erstatten, speichern, benachrichtigen —
   ist identisch und steht deshalb genau einmal hier.

   Eine zweite Umsetzung daneben waere der sichere Weg zu zwei
   Verhalten: Es genuegt, eine davon spaeter zu aendern und die andere
   zu vergessen, und schon storniert der eine Weg mit Erstattung und
   der andere ohne.
   --------------------------------------------------------------- */

/** Buchung mit allem laden, was fuer Erstattung und Mails noetig ist. */
async function buchungLaden(anmeldungId: string) {
  return db.registration.findUnique({
    where: { id: anmeldungId },
    include: { event: true, teilnehmer: true },
  });
}

type GeladeneBuchung = NonNullable<Awaited<ReturnType<typeof buchungLaden>>>;

/**
 * Die Stornierung wirklich vollziehen.
 *
 * Die Reihenfolge ist der Kern: erst das Geld, dann der Status, dann
 * die Mails. Scheitert die Erstattung, bleibt die Buchung bestehen —
 * andersherum stuende sie auf "storniert und erstattet", waehrend das
 * Geld noch da ist.
 */
async function vollziehen(
  anmeldung: GeladeneBuchung,
  sollErstatten: boolean,
  jetzt: Date,
  durchVeranstalter: boolean,
): Promise<Stornoergebnis> {
  /* ── Erstatten, BEVOR etwas gespeichert wird ─────────────────── */
  let erstattet = false;
  if (sollErstatten) {
    if (!anmeldung.zahlungsAbsicht) {
      /* Bezahlt, aber ohne festgehaltene Zahlung — das kann nur eine
         Buchung von vor dieser Änderung sein. Automatisch erstatten
         lässt sich da nichts; der Veranstalter erledigt es von Hand. */
      console.error(`Storno ohne Zahlungskennung (Anmeldung ${anmeldung.id})`);
      return { erfolg: false, fehler: "anbieter" };
    }
    try {
      const ergebnis = await erstattungAusloesen(anmeldung.zahlungsAbsicht, anmeldung.id);
      /* „pending" kommt bei manchen Zahlarten vor und wird später
         bestätigt. Beides gilt als angenommen; „failed" nicht. */
      if (ergebnis.lage !== "succeeded" && ergebnis.lage !== "pending") {
        console.error(`Erstattung nicht angenommen (Anmeldung ${anmeldung.id}): ${ergebnis.lage}`);
        return { erfolg: false, fehler: "anbieter" };
      }
      erstattet = true;
    } catch (e) {
      // Besuchern niemals interne Einzelheiten zeigen (Skill §7/§15).
      console.error(`Erstattung fehlgeschlagen (Anmeldung ${anmeldung.id}):`, e);
      return { erfolg: false, fehler: "anbieter" };
    }
  }

  /* ── Erst jetzt speichern ────────────────────────────────────── */
  await db.registration.update({
    where: { id: anmeldung.id },
    data: {
      status: "STORNIERT",
      storniertAm: jetzt,
      /* Aus der Platzzählung fällt die Buchung schon durch den
         Status „STORNIERT" (lib/plaetze.ts → belegtFilter zählt nur
         „BESTAETIGT"). Die Frist des Zahlungsversuchs wird trotzdem
         gelöscht: Sonst stünde im Adminbereich weiter, dass eine
         Zahlung läuft, obwohl storniert ist. */
      reserviertBis: null,
      ...(erstattet ? { zahlungsStatus: "ERSTATTET" as const } : {}),
    },
  });

  /* Die Mails sind eine Zugabe, kein Teil des Vorgangs: Die
     Stornierung ist gespeichert und das Geld ist angewiesen — ein
     Mail-Ausfall darf daran nichts mehr ändern. Deshalb wie überall
     die schluckende Variante. */
  const fuerMail = {
    id: anmeldung.id,
    kontaktVorname: anmeldung.kontaktVorname,
    kontaktNachname: anmeldung.kontaktNachname,
    kontaktEmail: anmeldung.kontaktEmail,
    kontaktTelefon: anmeldung.kontaktTelefon,
    gesamtpreisCents: anmeldung.gesamtpreisCents,
    teilnehmer: anmeldung.teilnehmer,
  };
  const fuerMailEvent = {
    titel: anmeldung.event.titel,
    startAt: anmeldung.event.startAt,
    ortName: anmeldung.event.ortName,
    stadt: anmeldung.event.stadt,
  };

  await mailSendenOhneAbbruch({
    an: anmeldung.kontaktEmail,
    ...stornoBestaetigungsMail(fuerMail, fuerMailEvent, erstattet, durchVeranstalter),
  });

  const empfaenger = adminEmpfaenger();
  if (empfaenger) {
    await mailSendenOhneAbbruch({
      an: empfaenger,
      ...stornoAdminMail(fuerMail, fuerMailEvent, erstattet),
    });
  }

  return { erfolg: true, erstattet, betragCents: anmeldung.gesamtpreisCents };
}

/**
 * Stornierung durch den Veranstalter — aus dem Adminbereich heraus.
 *
 * Kein Storno-Schluessel und keine 24-Stunden-Frist: Der Zugang ist in
 * der aufrufenden Aktion mit verlangeAdmin() geprueft, und wer die
 * Veranstaltung durchfuehrt, darf ueber seine eigenen Plaetze auch aus
 * Kulanz noch entscheiden.
 *
 * Erstattet wird ohne Rueckfrage, wenn bezahlt wurde. Das ist bewusst
 * nicht waehlbar: Ein Knopf "stornieren ohne zu erstatten" wuerde im
 * Alltag genau dann gedrueckt, wenn es schnell gehen muss — und das
 * Geld bliebe unbemerkt liegen.
 */
export async function stornoDurchAdmin(
  anmeldungId: string,
  jetzt: Date = new Date(),
): Promise<Stornoergebnis> {
  if (!anmeldungId) return { erfolg: false, fehler: "unbekannt" };

  const anmeldung = await buchungLaden(anmeldungId);
  if (!anmeldung) return { erfolg: false, fehler: "unbekannt" };

  const entscheidung = adminStornoEntscheidung({
    status: anmeldung.status,
    zahlungsStatus: anmeldung.zahlungsStatus,
    gesamtpreisCents: anmeldung.gesamtpreisCents,
    startAt: anmeldung.event.startAt,
  });
  if (!entscheidung.erlaubt) return { erfolg: false, fehler: entscheidung.grund };

  return vollziehen(anmeldung, entscheidung.erstatten, jetzt, true);
}
