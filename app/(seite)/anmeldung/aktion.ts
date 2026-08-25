"use server";

/* ---------------------------------------------------------------
   Nimmt eine Anmeldung entgegen und speichert sie.

   Grundsatz: Dem Browser wird NICHTS geglaubt. Preis, Teilnehmerzahl
   und freie Plätze ermittelt ausschließlich der Server aus der
   Datenbank. Ein mitgeschickter Betrag wird nicht einmal gelesen.
   --------------------------------------------------------------- */

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { berechnePreis } from "@/lib/preise";
import { pruefeUndBaue, type AnmeldeEingabe, type AnmeldeErgebnis } from "@/lib/anmeldung";
import { vorschauRollen, type Anmeldeweg } from "@/lib/vorschau";
import { alsAuswahl } from "@/lib/anmeldung";
import { versuchErlaubt } from "@/lib/ratelimit";

function zahl(wert: FormDataEntryValue | null, standard = 0): number {
  const n = Number(wert);
  return Number.isFinite(n) ? Math.trunc(n) : standard;
}

function text(wert: FormDataEntryValue | null): string {
  return typeof wert === "string" ? wert : "";
}

export async function anmeldungAbsenden(
  _bisher: AnmeldeErgebnis,
  formular: FormData,
): Promise<AnmeldeErgebnis> {
  const slug = text(formular.get("eventSlug"));

  // ── Bot-Falle ──────────────────────────────────────────────────
  // Das Feld ist für Menschen unsichtbar. Wer es ausfüllt, ist keiner.
  // Wir verraten den Grund bewusst nicht — sonst lernt der Bot dazu.
  if (text(formular.get("webseite")).trim() !== "") {
    return { fehler: [], meldung: "Die Anmeldung konnte nicht verarbeitet werden." };
  }

  // ── Bremse gegen Massen-Einsendungen ───────────────────────────
  const kopf = await headers();
  const ip =
    kopf.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    kopf.get("x-real-ip") ||
    "unbekannt";

  if (!(await versuchErlaubt(ip))) {
    return {
      fehler: [],
      meldung: "Zu viele Versuche in kurzer Zeit. Bitte versuche es später noch einmal.",
    };
  }

  // ── Event aus der Datenbank ────────────────────────────────────
  const event = await db.event.findFirst({
    where: { slug, status: "VEROEFFENTLICHT" },
  });
  if (!event) {
    return { fehler: [], meldung: "Diese Veranstaltung gibt es nicht (mehr)." };
  }

  const regeln = {
    schuelerCents: event.preisSchuelerCents,
    erwachsenerCents: event.preisErwachsenerCents,
    familie:
      event.familieAktiv &&
      event.familieBasisCents !== null &&
      event.familieEnthaltenErwachsene !== null &&
      event.familieEnthaltenSchueler !== null &&
      event.familieWeitererSchuelerCents !== null &&
      event.familieMaxSchueler !== null
        ? {
            basisCents: event.familieBasisCents,
            enthalteneErwachsene: event.familieEnthaltenErwachsene,
            enthalteneSchueler: event.familieEnthaltenSchueler,
            weitererSchuelerCents: event.familieWeitererSchuelerCents,
            maxSchueler: event.familieMaxSchueler,
          }
        : null,
  };

  // ── Eingaben einsammeln ────────────────────────────────────────
  const weg = text(formular.get("weg")) as Anmeldeweg;
  if (!["selbst", "kind", "familie"].includes(weg)) {
    return { fehler: [], meldung: "Die Anmeldung konnte nicht verarbeitet werden." };
  }

  const roh: AnmeldeEingabe = {
    weg,
    selbstAls: text(formular.get("selbstAls")) === "adult" ? "adult" : "student",
    schueler: zahl(formular.get("schueler")),
    erwachsene: zahl(formular.get("erwachsene")),
    personen: [],
    einwilligungVormund: formular.get("einwilligungVormund") === "an",
    einwilligungFotos: formular.get("einwilligungFotos") === "an",
  };

  // Wie viele Personen abgefragt werden, bestimmt der Server über
  // dieselbe Rollenlogik, die auch das Formular aufbaut.
  const anzahlRollen = vorschauRollen(weg, alsAuswahl(roh)).length;
  roh.personen = Array.from({ length: anzahlRollen }, (_, i) => ({
    vorname: text(formular.get(`person.${i}.vorname`)),
    nachname: text(formular.get(`person.${i}.nachname`)),
    email: text(formular.get(`person.${i}.email`)),
    telefon: text(formular.get(`person.${i}.telefon`)),
  }));

  const geprueft = pruefeUndBaue(regeln, roh);
  if (geprueft.fehler) return { fehler: geprueft.fehler };

  const { anmeldung } = geprueft;

  // ── Preis: ausschließlich serverseitig aus den Datenbankwerten ──
  const preis = berechnePreis(regeln, anmeldung.auswahl);
  const personenZahl = anmeldung.teilnehmer.length;

  let neueId: string;

  try {
    // Alles in EINER Transaktion: Zwischen „Plätze zählen" und
    // „speichern" darf niemand dazwischenkommen. Sonst könnten zwei
    // Personen gleichzeitig die letzten Plätze buchen und beide
    // durchkommen — ein überbuchtes Event, das erst am
    // Veranstaltungstag auffällt.
    neueId = await db.$transaction(async (tx) => {
      if (event.maxPersonen !== null) {
        const bestaetigte = await tx.registration.findMany({
          where: { eventId: event.id, status: "BESTAETIGT" },
          select: { id: true, _count: { select: { teilnehmer: true } } },
        });
        const belegt = bestaetigte.reduce((s, a) => s + a._count.teilnehmer, 0);

        // Bei einer Reaktivierung zählt die eigene alte Anmeldung
        // nicht doppelt — sie ist storniert und damit ohnehin nicht
        // in der Summe.
        if (belegt + personenZahl > event.maxPersonen) {
          throw new PlatzFehler(Math.max(0, event.maxPersonen - belegt));
        }
      }

      const vorhanden = await tx.registration.findUnique({
        where: {
          eventId_kontaktEmail: { eventId: event.id, kontaktEmail: anmeldung.kontakt.email },
        },
      });

      const felder = {
        kontaktVorname: anmeldung.kontakt.vorname,
        kontaktNachname: anmeldung.kontakt.nachname,
        kontaktTelefon: anmeldung.kontakt.telefon,
        buchungsart: anmeldung.buchungsart,
        status: "BESTAETIGT" as const,
        istVormundBuchung: anmeldung.istVormundBuchung,
        einwilligungVormund: anmeldung.einwilligungVormund,
        einwilligungFotos: anmeldung.einwilligungFotos,
        gesamtpreisCents: preis.gesamtCents,
      };

      if (vorhanden) {
        if (vorhanden.status !== "STORNIERT") throw new DoppeltFehler();

        // Reaktivieren statt einen zweiten Datensatz anlegen — so
        // bleibt es bei genau einer Anmeldung je Person und Event.
        await tx.participant.deleteMany({ where: { registrationId: vorhanden.id } });
        await tx.registration.update({
          where: { id: vorhanden.id },
          data: {
            ...felder,
            storniertAm: null,
            reaktiviertAm: new Date(),
            teilnehmer: { create: anmeldung.teilnehmer },
          },
        });
        return vorhanden.id;
      }

      const neu = await tx.registration.create({
        data: {
          eventId: event.id,
          kontaktEmail: anmeldung.kontakt.email,
          ...felder,
          teilnehmer: { create: anmeldung.teilnehmer },
        },
      });
      return neu.id;
    });
  } catch (e) {
    if (e instanceof PlatzFehler) {
      return {
        fehler: [],
        meldung:
          e.frei === 0
            ? "Die Veranstaltung ist inzwischen ausgebucht."
            : `Es sind nur noch ${e.frei} Plätze frei — für ${personenZahl} Personen reicht das nicht.`,
      };
    }
    if (e instanceof DoppeltFehler) {
      return {
        fehler: [],
        meldung:
          "Für diese E-Mail-Adresse gibt es bereits eine Anmeldung zu dieser Veranstaltung. " +
          "Schreib uns, wenn du sie ändern möchtest.",
      };
    }
    // Besuchern niemals interne Einzelheiten zeigen.
    console.error("Anmeldung fehlgeschlagen:", e);
    return {
      fehler: [],
      meldung: "Die Anmeldung konnte gerade nicht gespeichert werden. Bitte versuche es noch einmal.",
    };
  }

  redirect(`/anmeldung/danke?nr=${neueId}`);
}

class PlatzFehler extends Error {
  constructor(readonly frei: number) {
    super("zu wenige Plätze");
  }
}
class DoppeltFehler extends Error {
  constructor() {
    super("bereits angemeldet");
  }
}
