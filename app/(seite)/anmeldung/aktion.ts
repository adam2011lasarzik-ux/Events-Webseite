"use server";

/* ---------------------------------------------------------------
   Nimmt eine Anmeldung entgegen.

   Grundsatz: Dem Browser wird NICHTS geglaubt. Preis, Teilnehmerzahl
   und freie Plätze ermittelt ausschließlich der Server aus der
   Datenbank. Ein mitgeschickter Betrag wird nicht einmal gelesen.

   ── Zwei Wege, seit dem Umbau vom 25.09.2026 ────────────────────

   KOSTENLOSE Veranstaltung: unverändert. Die Anmeldung entsteht
   sofort als bestätigt, die Bestätigungsmail geht raus. Es ist kein
   Zahlungsanbieter im Spiel und nichts zu verschlüsseln.

   KOSTENPFLICHTIGE Veranstaltung: Hier wird NICHTS gespeichert.
   Kein Anmeldedatensatz, kein Teilnehmer, keine Platzsperre, kein
   Zahlungsversuch, keine Zeile irgendeiner Art. Die geprüften Daten
   werden verschlüsselt (lib/anmeldeNutzlast.ts) und reisen in der
   Bezahlseite des Anbieters mit. Erst wenn die Zahlung bestätigt
   zurückkommt, entsteht die Anmeldung — in
   app/zahlung/rueckmeldung/route.ts über lib/anmeldungAnlegen.ts.

   Bricht jemand ab, bleibt hier keine Spur. Das ist der Zweck des
   ganzen Umbaus, und Prüfliste X4 zählt dafür vor und nach einem
   abgebrochenen Vorgang die Zeilen ALLER Tabellen.

   Alles unterhalb der Eingabeprüfung ist deshalb LESEND. Wer hier
   etwas ergänzt, das schreibt, hebt die Zusage auf.
   --------------------------------------------------------------- */

import { redirect } from "next/navigation";
import { terminSteht } from "@/lib/termin";
import { geltendeFassungJetzt, fassungenZurBuchung } from "@/lib/rechtstexte";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { berechnePreis } from "@/lib/preise";
import { pruefeUndBaue, type AnmeldeEingabe, type AnmeldeErgebnis } from "@/lib/anmeldung";
import { vorschauRollen, type Anmeldeweg } from "@/lib/vorschau";
import { alsAuswahl } from "@/lib/anmeldung";
import { versuchErlaubt } from "@/lib/bremseFluechtig";
import { belegtFilter } from "@/lib/plaetze";
import { bezahlseiteFuerNutzlast } from "@/lib/zahlungStart";
import type { Nutzlast } from "@/lib/anmeldeNutzlast";
import { neuerStornoSchluessel, stornoLink } from "@/lib/storno";
import { mailSendenOhneAbbruch, adminEmpfaenger } from "@/lib/mail";
import { bestaetigungsMail, adminBenachrichtigungsMail, type MailAnmeldung } from "@/lib/mailVorlagen";

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

  /* Die Bremse liegt seit dem 25.09.2026 im Arbeitsspeicher, nicht in
     der Datenbank: Vor einer erfolgreichen Zahlung darf dort keine
     Zeile entstehen — auch keine mit einer IP-Adresse darin. Davor
     bremst zusätzlich Nginx (server/vera-bremse.conf). */
  if (!versuchErlaubt(ip)) {
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

  /* ── Steht der Termin fest? ──────────────────────────────────
     Ohne Datum und Uhrzeit darf nicht gebucht werden (Entscheidung
     2.5). Die Prüfung steht hier und nicht nur im Formular: Eine
     Serveraktion ist über HTTP direkt aufrufbar, und ein
     ausgeblendeter Knopf hält niemanden auf. */
  if (!terminSteht(event)) {
    return {
      fehler: [],
      meldung:
        "Für diese Veranstaltung steht noch kein Termin fest. " +
        "Eine Anmeldung ist erst möglich, wenn Datum und Uhrzeit feststehen.",
    };
  }

  const regeln = {
    // Fallback 0 ist rein für den Zahlentyp — abgerechnet wird er nie,
    // weil pruefeUndBaue() bei schuelerAktiv=false jede Anmeldung
    // serverseitig auf "Mich selbst, Erwachsener" zurückstuft.
    schuelerAktiv: event.schuelerAktiv,
    schuelerCents: event.preisSchuelerCents ?? 0,
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
    agbAkzeptiert: formular.get("agbAkzeptiert") === "an",
    kenntnisAufnahmen: formular.get("kenntnisAufnahmen") === "an",
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

  const jetzt = new Date();

  /* Welche Fassung der Rechtstexte bei diesem Vertragsschluss
     einbezogen wird. Sie wird JETZT festgehalten, beim Absenden —
     nicht später beim Zahlungseingang. Massgeblich ist, was der
     Person angezeigt wurde; würde der Webhook frisch nachschlagen,
     stünde nach einer Textänderung die falsche Fassung an einer
     Buchung, die unter der alten zustande kam. Bei der bezahlten
     Anmeldung reist die Kennung deshalb in der Marke mit. */
  const [agbFassung, datenschutzFassung] = await Promise.all([
    geltendeFassungJetzt("AGB_B2C"),
    geltendeFassungJetzt("DATENSCHUTZ"),
  ]);

  /* ══ Kostenpflichtig: nichts speichern, verschlüsselt weiterreichen ══

     Ab hier wird für diesen Weg NICHTS in die Datenbank geschrieben.
     Die Anmeldung entsteht erst mit der bestätigten Zahlung. */
  if (preis.gesamtCents > 0) {
    const nutzlast: Omit<Nutzlast, "erstelltMs"> = {
      eventId: event.id,
      kontaktVorname: anmeldung.kontakt.vorname,
      kontaktNachname: anmeldung.kontakt.nachname,
      kontaktEmail: anmeldung.kontakt.email,
      kontaktTelefon: anmeldung.kontakt.telefon,
      buchungsart: anmeldung.buchungsart,
      istVormundBuchung: anmeldung.istVormundBuchung,
      einwilligungVormund: anmeldung.einwilligungVormund,
      agbAkzeptiert: anmeldung.agbAkzeptiert,
      kenntnisAufnahmen: anmeldung.kenntnisAufnahmen,
      gesamtpreisCents: preis.gesamtCents,
      agbFassungId: agbFassung?.id ?? null,
      datenschutzFassungId: datenschutzFassung?.id ?? null,
      teilnehmer: anmeldung.teilnehmer.map((t) => ({
        vorname: t.vorname,
        nachname: t.nachname,
        /* Ein Zeichen statt eines Wortes: Die Marke muss in die
           Metadatenfelder des Anbieters passen, und bei zwanzig
           Personen zählt jedes eingesparte Byte. Zurückübersetzt wird
           in lib/anmeldungAnlegen.ts. */
        typ: t.typ === "SCHUELER" ? ("S" as const) : ("E" as const),
        /* Ein Geburtsjahr erhebt das Online-Formular nicht
           (lib/anmeldung.ts kennt nur Vorname, Nachname und Typ). Es
           steht in der Nutzlast trotzdem als Feld, weil das
           Papierformular es kennt und eine spätere Erfassung sonst die
           Marke ändern müsste. */
      })),
    };

    const bezahlseite = await bezahlseiteFuerNutzlast(nutzlast, event.titel);
    if ("url" in bezahlseite) redirect(bezahlseite.url);

    /* Kein Datensatz, auf den eine Abschluss-Seite zeigen könnte —
       die Meldung geht deshalb direkt an das Formular zurück. Die
       Person behält ihre Eingaben im Browser und kann es erneut
       versuchen, ohne alles neu zu tippen. */
    switch (bezahlseite.fehler) {
      case "kein-termin":
        return {
          fehler: [],
          meldung:
            "Für diese Veranstaltung steht kein Termin mehr fest. " +
            "Eine Anmeldung ist deshalb gerade nicht möglich.",
        };
      case "keine-plaetze":
        return {
          fehler: [],
          meldung:
            bezahlseite.frei === 0
              ? "Die Veranstaltung ist inzwischen ausgebucht."
              : `Es sind nur noch ${bezahlseite.frei} Plätze frei — für ` +
                `${personenZahl} Personen reicht das nicht. Schreib uns, wir suchen eine Lösung.`,
        };
      case "doppelt":
        return {
          fehler: [],
          meldung:
            "Für diese E-Mail-Adresse gibt es bereits eine Anmeldung zu dieser Veranstaltung. " +
            "Schreib uns, wenn du sie ändern möchtest.",
        };
      default:
        return {
          fehler: [],
          meldung:
            "Die Bezahlseite liess sich gerade nicht öffnen. Bitte versuche es noch einmal — " +
            "es wurde nichts gespeichert und nichts abgebucht.",
        };
    }
  }

  /* ══ Kostenlos: unveränderter Weg ═══════════════════════════════

     Ohne Zahlung gibt es nichts, worauf zu warten wäre. Die Anmeldung
     entsteht sofort als bestätigt. */
  let neueId: string;

  try {
    // Alles in EINER Transaktion: Zwischen „Plätze zählen" und
    // „speichern" darf niemand dazwischenkommen.
    neueId = await db.$transaction(async (tx) => {
      const vorhanden = await tx.registration.findUnique({
        where: {
          eventId_kontaktEmail: { eventId: event.id, kontaktEmail: anmeldung.kontakt.email },
        },
      });

      if (event.maxPersonen !== null) {
        /* Belegt sind ausschliesslich bestätigte Anmeldungen
           (lib/plaetze.ts). Die eigene, gleich zu ersetzende zählt
           nicht mit. */
        const bestaetigte = await tx.registration.findMany({
          where: {
            eventId: event.id,
            ...belegtFilter(),
            ...(vorhanden ? { id: { not: vorhanden.id } } : {}),
          },
          select: { id: true, _count: { select: { teilnehmer: true } } },
        });
        const belegt = bestaetigte.reduce((s, a) => s + a._count.teilnehmer, 0);
        if (belegt + personenZahl > event.maxPersonen) {
          throw new PlatzFehler(Math.max(0, event.maxPersonen - belegt));
        }
      }

      const felder = {
        agbFassungId: agbFassung?.id ?? null,
        datenschutzFassungId: datenschutzFassung?.id ?? null,
        kontaktVorname: anmeldung.kontakt.vorname,
        kontaktNachname: anmeldung.kontakt.nachname,
        kontaktTelefon: anmeldung.kontakt.telefon,
        buchungsart: anmeldung.buchungsart,
        status: "BESTAETIGT" as const,
        istVormundBuchung: anmeldung.istVormundBuchung,
        einwilligungVormund: anmeldung.einwilligungVormund,
        agbAkzeptiert: anmeldung.agbAkzeptiert,
        kenntnisAufnahmen: anmeldung.kenntnisAufnahmen,
        gesamtpreisCents: preis.gesamtCents,
      };

      if (vorhanden) {
        /* Nur eine stornierte Buchung darf ersetzt werden. Einen
           zweiten Anlauf innerhalb eines laufenden Bezahlvorgangs gibt
           es nicht mehr — dafür müsste es einen Datensatz geben, und
           genau den gibt es bei kostenpflichtigen Anmeldungen bis zur
           Zahlung nicht. */
        if (vorhanden.status !== "STORNIERT") throw new DoppeltFehler();

        await tx.participant.deleteMany({ where: { registrationId: vorhanden.id } });
        await tx.registration.update({
          where: { id: vorhanden.id },
          data: {
            ...felder,
            storniertAm: null,
            reaktiviertAm: new Date(),
            stornoSchluessel: vorhanden.stornoSchluessel ?? neuerStornoSchluessel(),
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
          // Der Nachweis für die spätere Selbstbedienungs-Stornierung.
          // Er steht ausschliesslich im Link der Bestätigungsmail.
          stornoSchluessel: neuerStornoSchluessel(),
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
    console.error("Anmeldung fehlgeschlagen:", e);
    return {
      fehler: [],
      meldung: "Die Anmeldung konnte gerade nicht gespeichert werden. Bitte versuche es noch einmal.",
    };
  }

  const mailAnmeldung: MailAnmeldung = {
    id: neueId,
    kontaktVorname: anmeldung.kontakt.vorname,
    kontaktNachname: anmeldung.kontakt.nachname,
    kontaktEmail: anmeldung.kontakt.email,
    kontaktTelefon: anmeldung.kontakt.telefon,
    gesamtpreisCents: preis.gesamtCents,
    teilnehmer: anmeldung.teilnehmer,
  };
  const mailEvent = {
    titel: event.titel,
    startAt: event.startAt,
    ortName: event.ortName,
    stadt: event.stadt,
  };

  const empfaenger = adminEmpfaenger();
  if (empfaenger) {
    await mailSendenOhneAbbruch({
      an: empfaenger,
      ...adminBenachrichtigungsMail(mailAnmeldung, mailEvent),
    });
  }

  const gespeichert = await db.registration.findUnique({
    where: { id: neueId },
    select: { stornoSchluessel: true },
  });
  await mailSendenOhneAbbruch({
    an: anmeldung.kontakt.email,
    ...bestaetigungsMail(
      mailAnmeldung,
      mailEvent,
      stornoLink(process.env.OEFFENTLICHE_ADRESSE, neueId, gespeichert?.stornoSchluessel),
      // Volltext der einbezogenen Bedingungen — § 312f Abs. 2 BGB
      // verlangt die Vertragsbestätigung auf dauerhaftem Datenträger
      // einschliesslich der Bedingungen. Ein Link genügt dafür nicht.
      await fassungenZurBuchung(neueId),
    ),
  });
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
