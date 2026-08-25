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

/**
 * Zählt einen Versuch und meldet, ob die Grenze überschritten ist.
 *
 * Räumt dabei alte Einträge weg, damit die Tabelle nicht wächst — so
 * braucht es keinen zusätzlichen Aufräum-Zeitplan.
 */
export async function versuchErlaubt(kennung: string): Promise<boolean> {
  const grenze = new Date(Date.now() - FENSTER_MINUTEN * 60_000);

  await db.anmeldeVersuch.deleteMany({ where: { zeitpunkt: { lt: grenze } } });

  const bisher = await db.anmeldeVersuch.count({
    where: { kennung, zeitpunkt: { gte: grenze } },
  });

  await db.anmeldeVersuch.create({ data: { kennung } });

  return bisher < MAX_VERSUCHE;
}
