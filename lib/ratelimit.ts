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

  await db.anmeldeVersuch.create({ data: { kennung } });

  return bisher < max;
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
