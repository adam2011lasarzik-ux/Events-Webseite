/* ---------------------------------------------------------------
   Bremse gegen Massen-Einsendungen.

   Bewusst über die Datenbank statt über einen Zähler im
   Arbeitsspeicher: Ein Zähler im Speicher vergisst bei jedem Neustart
   der Anwendung alles — und genau darauf würde ein Angreifer warten.
   Ein externer Dienst (Redis o. Ä.) wäre dafür überdimensioniert und
   kostenpflichtig; die vorhandene Datenbank genügt.

   Hier landen keine Namen und keine E-Mail-Adressen, nur eine Kennung
   und ein Zeitpunkt.
   --------------------------------------------------------------- */

import { createHash } from "node:crypto";

import { db } from "./db";

/** Wie viele Versuche je Kennung im Zeitfenster erlaubt sind. */
export const MAX_VERSUCHE = 5;
/** Länge des Zeitfensters in Minuten. */
export const FENSTER_MINUTEN = 60;
/** Das längste Zeitfenster, das irgendein Zähler nutzt — siehe unten. */
const MAX_FENSTER_MINUTEN = 60;

/**
 * Zählt einen Versuch und meldet, ob die Grenze überschritten ist.
 *
 * Räumt dabei alte Einträge weg, damit die Tabelle nicht wächst — so
 * braucht es keinen zusätzlichen Aufräum-Zeitplan.
 */
export async function versuchErlaubt(
  kennung: string,
  max: number = MAX_VERSUCHE,
  fensterMinuten: number = FENSTER_MINUTEN,
): Promise<boolean> {
  const grenze = new Date(Date.now() - fensterMinuten * 60_000);
  const aeltesteGrenze = new Date(Date.now() - MAX_FENSTER_MINUTEN * 60_000);

  // Nur wirklich alte Einträge wegräumen: Die Tabelle wird von
  // mehreren Zählern mit unterschiedlich langen Zeitfenstern genutzt.
  // Würde hier am kürzesten Fenster aufgeräumt, löschte der eine
  // Zähler dem anderen die Einträge weg.
  await db.anmeldeVersuch.deleteMany({ where: { zeitpunkt: { lt: aeltesteGrenze } } });

  const bisher = await db.anmeldeVersuch.count({
    where: { kennung, zeitpunkt: { gte: grenze } },
  });

  /* Nur ZUGELASSENE Versuche zaehlen.

     Vorher wurde jeder Aufruf eingetragen, auch der bereits
     abgewiesene. Damit schob jeder weitere Klick das Zeitfenster nach
     hinten — wer einmal gebremst war, kam durch Probieren nie wieder
     heraus, sondern immer tiefer hinein. Im Testbetrieb sind so 48
     Eintraege entstanden und die Sperre lag Stunden in der Zukunft.

     Sicherheitlich kostet das nichts: Ein abgewiesener Aufruf kehrt
     um, bevor er irgendetwas prueft oder ausloest — er kann also
     weder Schluessel durchprobieren noch Arbeit verursachen. */
  const erlaubt = bisher < max;
  if (erlaubt) await db.anmeldeVersuch.create({ data: { kennung } });

  return erlaubt;
}

/**
 * Bremse für das Anmeldeformular des Adminbereichs.
 *
 * Eigene Kennung mit Vorsilbe, damit sie sich nicht mit der Bremse
 * für Event-Anmeldungen ins Gehege kommt: Sonst könnte ein Angreifer
 * über das öffentliche Formular das Kontingent aufbrauchen und den
 * Administrator aus seinem eigenen Bereich aussperren.
 *
 * Zehn Versuche in fünfzehn Minuten: genug für vertippte Passwörter,
 * zu wenig zum Durchprobieren.
 */
export const LOGIN_MAX = 10;
export const LOGIN_FENSTER_MINUTEN = 15;

export function loginVersuchErlaubt(ip: string): Promise<boolean> {
  return versuchErlaubt(`admin:${ip}`, LOGIN_MAX, LOGIN_FENSTER_MINUTEN);
}

/**
 * Bremse je Admin-KONTO — zusätzlich zu der je IP-Adresse.
 *
 * Die Bremse darüber zählt je Absender-Adresse. Wer die Versuche über
 * viele verschiedene Adressen verteilt, wird davon nicht gebremst:
 * Jede Adresse bringt ihr eigenes Kontingent mit. Diese zweite Bremse
 * zählt deshalb je Konto und begrenzt die Gesamtzahl der Versuche,
 * ganz gleich, woher sie kommen.
 *
 * Die Grenze liegt bewusst HÖHER als die je Adresse (20 statt 10). So
 * läuft ein Administrator, der sich mehrfach vertippt, zuerst in seine
 * eigene Adressgrenze und sperrt sich nicht das Konto aus. Wer das
 * Konto absichtlich sperrt, erreicht höchstens fünfzehn Minuten Pause
 * — die Sperre läuft von selbst ab, es bleibt nichts zurück.
 *
 * Die E-Mail-Adresse wird NICHT im Klartext abgelegt: In der Tabelle
 * landet nur ein Hash davon. Gezählt wird damit genauso zuverlässig,
 * aber der Spam-Schutz sammelt keine Adressen, die er nicht braucht.
 */
export const LOGIN_KONTO_MAX = 20;

/** Vorsilbe der Kennung — auch für die Prüfskripte nachvollziehbar. */
export const LOGIN_KONTO_VORSILBE = "admin-konto:";

export function loginKontoVersuchErlaubt(email: string): Promise<boolean> {
  const abdruck = createHash("sha256").update(email).digest("hex").slice(0, 32);
  return versuchErlaubt(
    `${LOGIN_KONTO_VORSILBE}${abdruck}`,
    LOGIN_KONTO_MAX,
    LOGIN_FENSTER_MINUTEN,
  );
}

/**
 * Bremse für den zweiten Faktor.
 *
 * Ein sechsstelliger TOTP-Code hat eine Million mögliche Werte — ohne
 * Bremse liesse sich das in vertretbarer Zeit durchprobieren, sobald
 * jemand ein gestohlenes Passwort hat und nur noch am zweiten Faktor
 * scheitert. Eigene, engere Kennung je Zwischenschritt statt je
 * Konto: Der Zwischenschritt selbst läuft ohnehin nach wenigen
 * Minuten ab (siehe lib/adminAuth.ts), die Bremse muss ihn nur für
 * seine kurze Lebenszeit schützen.
 *
 * Die Kennung ist die interne Datenbank-ID des Zwischenschritts —
 * keine E-Mail-Adresse, kein Personenbezug, muss also nicht gehasht
 * werden.
 */
export const ZWEITER_FAKTOR_MAX = 8;

export function zweiterFaktorVersuchErlaubt(pruefungId: string): Promise<boolean> {
  return versuchErlaubt(`2fa:${pruefungId}`, ZWEITER_FAKTOR_MAX, LOGIN_FENSTER_MINUTEN);
}
