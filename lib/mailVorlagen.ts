/* ---------------------------------------------------------------
   Reine Textbausteine für die drei automatischen E-Mails. Kein
   Netzverkehr hier — nur Zusammenbau von Betreff und Text, damit sich
   der Inhalt einzeln prüfen lässt (wie lib/preise.ts, lib/vorschau.ts).
   --------------------------------------------------------------- */

import { alsEuro } from "./preise";
import { alsLesbar } from "./zeit";

export interface MailEvent {
  titel: string;
  startAt: Date | null;
  ortName: string | null;
  stadt: string;
}

export interface MailTeilnehmer {
  vorname: string;
  nachname: string;
}

export interface MailAnmeldung {
  id: string;
  kontaktVorname: string;
  kontaktNachname: string;
  kontaktEmail: string;
  kontaktTelefon: string | null;
  gesamtpreisCents: number;
  teilnehmer: MailTeilnehmer[];
}

function ortZeile(event: MailEvent): string {
  return event.ortName ? `${event.ortName}, ${event.stadt}` : event.stadt;
}

function terminZeile(event: MailEvent): string {
  return event.startAt ? alsLesbar(event.startAt) : "Termin steht noch nicht fest";
}

function teilnehmerListe(teilnehmer: MailTeilnehmer[]): string {
  return teilnehmer.map((t) => `  - ${t.vorname} ${t.nachname}`).join("\n");
}

/** Anmeldebestätigung — nur für sofort bestätigte (kostenlose) Anmeldungen. */
export function bestaetigungsMail(
  anmeldung: MailAnmeldung,
  event: MailEvent,
): { betreff: string; text: string } {
  return {
    betreff: `Anmeldung bestätigt: ${event.titel}`,
    text: [
      `Hallo ${anmeldung.kontaktVorname},`,
      "",
      `deine Anmeldung für "${event.titel}" ist bestätigt.`,
      "",
      `Termin: ${terminZeile(event)}`,
      `Ort: ${ortZeile(event)}`,
      "",
      "Angemeldete Personen:",
      teilnehmerListe(anmeldung.teilnehmer),
      "",
      `Anmeldenummer: ${anmeldung.id}`,
      "",
      "Bis bald,",
      "das VERA-Team",
    ].join("\n"),
  };
}

/** Zahlungsbestätigung — nach erfolgreicher Zahlung über den Anbieter. */
export function zahlungsBestaetigungsMail(
  anmeldung: MailAnmeldung,
  event: MailEvent,
): { betreff: string; text: string } {
  return {
    betreff: `Zahlung erhalten: ${event.titel}`,
    text: [
      `Hallo ${anmeldung.kontaktVorname},`,
      "",
      `deine Zahlung über ${alsEuro(anmeldung.gesamtpreisCents)} ist eingegangen.`,
      `Deine Anmeldung für "${event.titel}" ist damit bestätigt.`,
      "",
      `Termin: ${terminZeile(event)}`,
      `Ort: ${ortZeile(event)}`,
      "",
      "Angemeldete Personen:",
      teilnehmerListe(anmeldung.teilnehmer),
      "",
      `Anmeldenummer: ${anmeldung.id}`,
      "",
      "Bis bald,",
      "das VERA-Team",
    ].join("\n"),
  };
}

/** Benachrichtigung an den Veranstalter über jede neue Anmeldung. */
export function adminBenachrichtigungsMail(
  anmeldung: MailAnmeldung,
  event: MailEvent,
): { betreff: string; text: string } {
  return {
    betreff: `Neue Anmeldung: ${event.titel} (${anmeldung.teilnehmer.length} Person${
      anmeldung.teilnehmer.length === 1 ? "" : "en"
    })`,
    text: [
      `Neue Anmeldung für "${event.titel}".`,
      "",
      `Kontakt: ${anmeldung.kontaktVorname} ${anmeldung.kontaktNachname}`,
      `E-Mail: ${anmeldung.kontaktEmail}`,
      `Telefon: ${anmeldung.kontaktTelefon ?? "—"}`,
      "",
      "Teilnehmer:",
      teilnehmerListe(anmeldung.teilnehmer),
      "",
      `Betrag: ${alsEuro(anmeldung.gesamtpreisCents)}`,
      `Anmeldenummer: ${anmeldung.id}`,
    ].join("\n"),
  };
}

/** Alarm-Mail für die nächtliche Datenbank-Sicherung — nur bei Fehlern. */
export function sicherungsAlarmMail(zeitpunkt: string, meldung: string): { betreff: string; text: string } {
  return {
    betreff: "VERA: Datenbank-Sicherung fehlgeschlagen",
    text: [
      "Die nächtliche Sicherung der VERA-Datenbank ist fehlgeschlagen.",
      "",
      `Zeitpunkt: ${zeitpunkt}`,
      `Meldung: ${meldung}`,
      "",
      "Bitte auf dem Server prüfen: journalctl -u vera-sicherung.service -n 50",
    ].join("\n"),
  };
}
