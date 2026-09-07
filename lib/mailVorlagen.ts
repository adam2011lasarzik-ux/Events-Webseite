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

/**
 * Der Storno-Abschnitt am Ende einer Bestätigung.
 *
 * Ohne Link (Adresse oder Schlüssel fehlen) bleibt er ganz weg —
 * lieber kein Hinweis als ein Hinweis auf einen kaputten Link.
 *
 * Der Link steht AUSSCHLIESSLICH hier, in der Mail an die anmeldende
 * Person. Er ist der Nachweis für die Stornierung; wer ihn hat, kann
 * diese eine Buchung absagen.
 */
function stornoAbschnitt(link: string | null | undefined): string[] {
  if (!link) return [];
  return [
    "",
    "Falls du doch nicht kannst:",
    "Bis 24 Stunden vor Beginn kannst du hier selbst stornieren, der volle",
    "Betrag wird dann zurückerstattet.",
    link,
  ];
}

/** Anmeldebestätigung — nur für sofort bestätigte (kostenlose) Anmeldungen. */
export function bestaetigungsMail(
  anmeldung: MailAnmeldung,
  event: MailEvent,
  stornoLink?: string | null,
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
      ...stornoAbschnitt(stornoLink),
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
  stornoLink?: string | null,
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
      ...stornoAbschnitt(stornoLink),
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

/** Bestätigung an die anmeldende Person nach einer Stornierung. */
export function stornoBestaetigungsMail(
  anmeldung: MailAnmeldung,
  event: MailEvent,
  erstattet: boolean,
): { betreff: string; text: string } {
  return {
    betreff: `Stornierung bestätigt: ${event.titel}`,
    text: [
      `Hallo ${anmeldung.kontaktVorname},`,
      "",
      `deine Buchung für "${event.titel}" ist storniert. Dein Platz ist wieder frei.`,
      "",
      ...(erstattet
        ? [
            `Der volle Betrag von ${alsEuro(anmeldung.gesamtpreisCents)} ist zur`,
            "Rückerstattung angewiesen — auf dem Weg, über den du bezahlt hast.",
            "Je nach Bank dauert es einige Werktage, bis er bei dir ankommt.",
          ]
        : ["Für diese Buchung war nichts bezahlt, es wird also auch nichts erstattet."]),
      "",
      `Anmeldenummer: ${anmeldung.id}`,
      "",
      "Schade, dass es diesmal nicht klappt — vielleicht beim nächsten Mal.",
      "das VERA-Team",
    ].join("\n"),
  };
}

/** Benachrichtigung an den Veranstalter über eine Stornierung. */
export function stornoAdminMail(
  anmeldung: MailAnmeldung,
  event: MailEvent,
  erstattet: boolean,
): { betreff: string; text: string } {
  return {
    betreff: `Stornierung: ${event.titel} (${anmeldung.teilnehmer.length} Person${
      anmeldung.teilnehmer.length === 1 ? "" : "en"
    })`,
    text: [
      `Eine Buchung für "${event.titel}" wurde storniert.`,
      "",
      `Kontakt: ${anmeldung.kontaktVorname} ${anmeldung.kontaktNachname}`,
      `E-Mail: ${anmeldung.kontaktEmail}`,
      "",
      "Teilnehmer:",
      teilnehmerListe(anmeldung.teilnehmer),
      "",
      `Betrag: ${alsEuro(anmeldung.gesamtpreisCents)}`,
      erstattet
        ? "Erstattung: automatisch angewiesen, voller Betrag."
        : "Erstattung: keine — für diese Buchung war nichts bezahlt.",
      `Anmeldenummer: ${anmeldung.id}`,
      "",
      `${anmeldung.teilnehmer.length} Platz/Plätze sind wieder frei.`,
    ].join("\n"),
  };
}

/**
 * Störungsmeldung der Serverüberwachung.
 *
 * Wird nur beim WECHSEL des Zustands verschickt, nicht bei jedem
 * Durchlauf — eine Mail alle 15 Minuten liest nach dem dritten Mal
 * niemand mehr, und dann geht die eine wichtige unter.
 */
export function systemAlarmMail(befunde: string[]): { betreff: string; text: string } {
  const anzahl = befunde.length;
  return {
    betreff: `VERA: Störung auf dem Server (${anzahl} ${anzahl === 1 ? "Befund" : "Befunde"})`,
    text: [
      "Die Überwachung hat auf dem Server eine Störung festgestellt.",
      "",
      ...befunde.map((b) => `  - ${b}`),
      "",
      "Nachsehen lässt sich das in der Webkonsole mit:",
      "",
      "  vera-status",
      "",
      "Sobald alles wieder in Ordnung ist, kommt eine Entwarnung.",
      "Bis dahin wird nicht erneut gemailt, außer es kommt ein neuer",
      "Befund hinzu.",
    ].join("\n"),
  };
}

/** Entwarnung — der Gegenpol zur Störungsmeldung. */
export function systemEntwarnungMail(): { betreff: string; text: string } {
  return {
    betreff: "VERA: Störung behoben",
    text: [
      "Die Überwachung meldet wieder alles in Ordnung:",
      "",
      "  - alle Dienste laufen",
      "  - die Webseite antwortet über HTTPS",
      "  - genug Speicherplatz",
      "  - das Zertifikat ist gültig",
      "  - die Datenbank-Sicherung ist aktuell",
      "",
      "Es ist nichts weiter zu tun.",
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
