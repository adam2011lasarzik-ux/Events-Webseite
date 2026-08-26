/* ---------------------------------------------------------------
   Eine Bezahlung für eine bestehende Anmeldung starten.

   Diese Datei sitzt bewusst zwischen der Anmelde-Aktion und der
   Danke-Seite: Beide brauchen denselben Ablauf. Zwei Fassungen
   liefen früher oder später auseinander — und zwar unbemerkt, weil
   der eine Weg seltener benutzt wird als der andere.

   Der Betrag kommt IMMER aus der Datenbank. Ein aus dem Browser
   mitgeschickter Betrag wird an keiner Stelle gelesen.
   --------------------------------------------------------------- */

import { db } from "@/lib/db";
import { reserviertBis } from "@/lib/plaetze";
import { darfZahlen, type ZahlungAbgelehnt } from "@/lib/zahlungRegeln";
import { sitzungErstellen, ZahlungNichtEingerichtet } from "@/lib/zahlung";

export type StartFehler = ZahlungAbgelehnt | "nicht-eingerichtet" | "anbieter";

export type StartErgebnis = { url: string } | { fehler: StartFehler };

export async function bezahlseiteFuer(
  anmeldungId: string,
  jetzt: Date = new Date(),
): Promise<StartErgebnis> {
  if (!anmeldungId) return { fehler: "unbekannt" };

  const anmeldung = await db.registration.findUnique({
    where: { id: anmeldungId },
    include: { event: { select: { titel: true } }, teilnehmer: { select: { id: true } } },
  });

  const abgelehnt = darfZahlen(anmeldung);
  if (abgelehnt) return { fehler: abgelehnt };
  if (!anmeldung) return { fehler: "unbekannt" }; // für den Typ; darfZahlen hat das schon

  try {
    const sitzung = await sitzungErstellen({
      anmeldungId: anmeldung.id,
      email: anmeldung.kontaktEmail,
      eventTitel: anmeldung.event.titel,
      personen: anmeldung.teilnehmer.length,
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
