/* ---------------------------------------------------------------
   Eine Bezahlung für eine bestehende Anmeldung starten.

   Diese Datei sitzt bewusst zwischen der Anmelde-Aktion und der
   Danke-Seite: Beide brauchen denselben Ablauf. Zwei Fassungen liefen
   früher oder später auseinander — und zwar unbemerkt, weil der eine
   Weg seltener benutzt wird als der andere.

   Drei Dinge passieren hier, bevor irgendetwas beim Anbieter angelegt
   wird:

     1. Darf für diese Anmeldung überhaupt bezahlt werden?
     2. Sind für die GANZE Gruppe noch genug Plätze frei?
     3. Gibt es schon eine offene Bezahlseite, die man weiterbenutzen
        kann?

   Der Betrag kommt IMMER aus der Datenbank. Ein aus dem Browser
   mitgeschickter Betrag wird an keiner Stelle gelesen.
   --------------------------------------------------------------- */

import { db } from "@/lib/db";
import { belegtFilter, reserviertBis } from "@/lib/plaetze";
import { darfZahlen, plaetzeReichen, betragPasst, type ZahlungAbgelehnt } from "@/lib/zahlungRegeln";
import {
  sitzungErstellen,
  sitzungPruefen,
  sitzungSchliessen,
  ZahlungNichtEingerichtet,
} from "@/lib/zahlung";

export type StartFehler = ZahlungAbgelehnt | "nicht-eingerichtet" | "anbieter";

export type StartErgebnis =
  | { url: string }
  /** `frei` ist nur bei „keine-plaetze" gesetzt. */
  | { fehler: StartFehler; frei?: number };

export async function bezahlseiteFuer(
  anmeldungId: string,
  jetzt: Date = new Date(),
): Promise<StartErgebnis> {
  if (!anmeldungId) return { fehler: "unbekannt" };

  const anmeldung = await db.registration.findUnique({
    where: { id: anmeldungId },
    include: {
      event: { select: { id: true, titel: true, maxPersonen: true } },
      teilnehmer: { select: { id: true } },
    },
  });

  const abgelehnt = darfZahlen(anmeldung);
  if (abgelehnt) return { fehler: abgelehnt };
  if (!anmeldung) return { fehler: "unbekannt" }; // für den Typ; darfZahlen hat das schon

  const personen = anmeldung.teilnehmer.length;

  /* ── Reichen die Plätze noch? ────────────────────────────────
     Auch beim zweiten Anlauf. Zwischen dem ersten Versuch und jetzt
     können andere gebucht haben — und für einen Platz zu bezahlen,
     den es nicht mehr gibt, ist der unangenehmste Fehler von allen.

     Die eigene Anmeldung wird ausgenommen: Sie wird bezahlt, nicht
     zusätzlich gebucht. */
  const belegte = await db.registration.findMany({
    where: {
      eventId: anmeldung.event.id,
      ...belegtFilter(jetzt),
      id: { not: anmeldung.id },
    },
    select: { _count: { select: { teilnehmer: true } } },
  });
  const belegtOhneDiese = belegte.reduce((s, a) => s + a._count.teilnehmer, 0);

  const platz = plaetzeReichen(anmeldung.event.maxPersonen, belegtOhneDiese, personen);
  if (!platz.reicht) return { fehler: "keine-plaetze", frei: platz.frei };

  try {
    /* ── Gibt es schon eine offene Bezahlseite? ────────────────
       Wer zweimal tippt, soll nicht zwei bezahlbare Vorgänge
       bekommen. Eine noch offene Seite mit demselben Betrag wird
       einfach weiterbenutzt — der Kunde muss auch nichts neu
       eingeben. */
    if (anmeldung.zahlungsReferenz) {
      const stand = await sitzungPruefen(anmeldung.zahlungsReferenz).catch(() => null);

      /* Bereits bezahlt — aber NUR, wenn auch der Betrag stimmt.

         Ohne die zweite Bedingung würde eine Sitzung, bei der der
         Anbieter einen anderen Betrag meldet, als „bezahlt" gelten,
         obwohl die Rückmeldung sie aus genau diesem Grund abgelehnt
         hat. Die Person käme dann nie wieder zu einer Bezahlseite.
         Beide Stellen müssen dieselbe Regel anwenden. */
      if (stand?.bezahlt && betragPasst(stand.betragCents, anmeldung.gesamtpreisCents)) {
        // Die Rückmeldung war nur noch nicht da. Der Abgleich passiert
        // auf der Danke-Seite; hier reicht die ehrliche Antwort.
        return { fehler: "bereits-bezahlt" };
      }

      if (stand?.lage === "open" && stand.url && betragPasst(stand.betragCents, anmeldung.gesamtpreisCents)) {
        // Reservierung auffrischen, aber KEINE zweite Sitzung.
        await db.registration.update({
          where: { id: anmeldung.id },
          data:
            anmeldung.status === "BESTAETIGT"
              ? {}
              : { status: "RESERVIERT", reserviertBis: reserviertBis(jetzt) },
        });
        return { url: stand.url };
      }

      /* Sonst entsteht gleich eine neue — die alte muss vorher
         geschlossen werden, sonst bliebe sie über den Link im
         Verlauf weiterhin bezahlbar. Das ist der eigentliche Schutz
         vor einer doppelten Abbuchung. */
      if (stand?.lage === "open") await sitzungSchliessen(anmeldung.zahlungsReferenz);
    }

    const sitzung = await sitzungErstellen({
      anmeldungId: anmeldung.id,
      email: anmeldung.kontaktEmail,
      eventTitel: anmeldung.event.titel,
      personen,
      gesamtCents: anmeldung.gesamtpreisCents,
    });

    /* Erst NACH der erfolgreichen Antwort speichern: Sonst stünde eine
       Sitzungskennung in der Datenbank, die es beim Anbieter gar nicht
       gibt.

       Die Reservierung wird dabei aufgefrischt. Wer einen zweiten
       Anlauf nimmt, soll nicht daran scheitern, dass die erste Frist
       schon abgelaufen ist. Eine bereits bestätigte Anmeldung behält
       ihren Status — sie hat ihren Platz sicher. */
    await db.registration.update({
      where: { id: anmeldung.id },
      data: {
        zahlungsReferenz: sitzung.id,
        zahlungsWeg: "ONLINE",
        ...(anmeldung.status === "BESTAETIGT"
          ? {}
          : { status: "RESERVIERT" as const, reserviertBis: reserviertBis(jetzt) }),
      },
    });

    return { url: sitzung.url };
  } catch (e) {
    // Besuchern niemals interne Einzelheiten zeigen — aber im
    // Serverprotokoll festhalten, sonst sucht man später blind.
    if (e instanceof ZahlungNichtEingerichtet) {
      console.error("Zahlung nicht eingerichtet:", e.grund);
      return { fehler: "nicht-eingerichtet" };
    }
    console.error("Bezahlseite konnte nicht erzeugt werden:", e);
    return { fehler: "anbieter" };
  }
}
