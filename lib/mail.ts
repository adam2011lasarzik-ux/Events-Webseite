/* ---------------------------------------------------------------
   Die einzige Stelle, die den Mail-Versand kennt.

   Alles andere im Projekt spricht nur mit dieser Datei. Ein späterer
   Wechsel des Anbieters (anderes Postfach, anderer Dienst) bleibt
   dadurch auf diese eine Datei begrenzt — dasselbe Prinzip wie bei
   lib/zahlung.ts.

   Grundsatz: Verschickt NICHTS, solange die SMTP-Variablen nicht
   gesetzt sind. Ein `npm run build` ohne .env darf dadurch nicht
   abbrechen, und bis zum Livegang ist genau das der Normalfall.
   --------------------------------------------------------------- */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

/** Fehler, die der Aufrufer verständlich behandeln kann. */
export class MailNichtEingerichtet extends Error {
  constructor(readonly grund: string) {
    super(grund);
  }
}

let zugang: Transporter | null = null;
let abgesenderCache: string | null = null;

/**
 * Den Versandweg erst beim ersten Gebrauch aufbauen.
 *
 * Nicht beim Laden der Datei: Sonst bräche schon das Bauen der Seite
 * ab, solange keine SMTP-Zugangsdaten hinterlegt sind.
 */
function transport(): Transporter {
  if (zugang) return zugang;

  const server = (process.env.SMTP_SERVER ?? "").trim();
  const portRoh = (process.env.SMTP_PORT ?? "").trim();
  const benutzer = (process.env.SMTP_BENUTZER ?? "").trim();
  const passwort = process.env.SMTP_PASSWORT ?? "";
  const absender = (process.env.SMTP_ABSENDER ?? "").trim();

  if (!server || !portRoh || !benutzer || !passwort || !absender) {
    throw new MailNichtEingerichtet("Es sind keine vollständigen SMTP-Zugangsdaten hinterlegt.");
  }

  const port = Number(portRoh);
  if (!Number.isInteger(port) || port <= 0) {
    throw new MailNichtEingerichtet(`SMTP_PORT ist keine gültige Portnummer: "${portRoh}"`);
  }

  zugang = nodemailer.createTransport({
    host: server,
    port,
    // Port 465 = TLS/SSL direkt beim Verbindungsaufbau (kein STARTTLS).
    // Das ist bei Hostinger die vorgesehene Kombination für 465.
    secure: port === 465,
    auth: { user: benutzer, pass: passwort },
  });
  abgesenderCache = absender;
  return zugang;
}

/** Nur für die Prüfungen: den zwischengespeicherten Versandweg verwerfen. */
export function zugangVergessen(): void {
  zugang = null;
  abgesenderCache = null;
}

export interface MailNachricht {
  an: string;
  betreff: string;
  text: string;
  /** Optional: HTML-Fassung derselben Nachricht. */
  html?: string;
}

/**
 * Eine Mail verschicken.
 *
 * Wirft MailNichtEingerichtet, solange die SMTP-Variablen fehlen, und
 * reicht jeden Versandfehler des Anbieters unverändert weiter — der
 * Aufrufer entscheidet, ob das den restlichen Vorgang abbricht.
 */
export async function mailSenden(nachricht: MailNachricht): Promise<void> {
  const t = transport();
  await t.sendMail({
    from: abgesenderCache!,
    to: nachricht.an,
    subject: nachricht.betreff,
    text: nachricht.text,
    html: nachricht.html,
  });
}

/**
 * Wie mailSenden(), aber schluckt jeden Fehler (fehlende Einrichtung
 * ebenso wie einen echten Versandfehler) und protokolliert ihn nur.
 *
 * Für alle Stellen, an denen eine Mail eine ANGENEHME ZUGABE ist,
 * aber niemals einen bereits abgeschlossenen Vorgang (Anmeldung,
 * Zahlung) zu Fall bringen darf — die Anmeldung steht schon in der
 * Datenbank, ein Mail-Ausfall darf das nicht rückgängig machen.
 */
export async function mailSendenOhneAbbruch(nachricht: MailNachricht): Promise<void> {
  try {
    await mailSenden(nachricht);
  } catch (e) {
    if (e instanceof MailNichtEingerichtet) {
      // Erwartbar, solange SMTP noch nicht eingerichtet ist — kein Lärm.
      return;
    }
    console.error("Mail-Versand fehlgeschlagen:", nachricht.betreff, "an", nachricht.an, e);
  }
}

/**
 * Prüft, ob der Versandweg grundsätzlich erreichbar ist (Verbindung +
 * Anmeldung), ohne eine Mail zu verschicken. Für npm run mail:pruefen.
 */
export async function verbindungPruefen(): Promise<void> {
  await transport().verify();
}

/**
 * Die Adresse, an die Admin-Benachrichtigungen gehen.
 *
 * Eigene Variable, damit sie sich später von der Absenderadresse
 * trennen lässt (z. B. ein zweites Postfach). Solange nur ein
 * Postfach existiert, ist der Absender selbst der sinnvolle Standard.
 */
export function adminEmpfaenger(): string | null {
  const eigene = (process.env.MAIL_ADMIN_EMPFAENGER ?? "").trim();
  if (eigene) return eigene;
  const absender = (process.env.SMTP_ABSENDER ?? "").trim();
  return absender || null;
}
