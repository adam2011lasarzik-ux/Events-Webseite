/* ---------------------------------------------------------------
   Der eine Zugang zur Datenbank.

   Warum an genau einer Stelle: Verstreute Datenbankzugriffe in
   einzelnen Seiten und Komponenten sind später kaum noch zu
   überblicken — und genau dort entstehen dann Sicherheitslücken und
   widersprüchliche Abfragen. Alles, was mit der Datenbank spricht,
   holt sich den Zugang hier.

   Prisma spricht nicht selbst mit MySQL, sondern über einen Treiber
   („Adapter"). Ab Prisma 7 ist das Pflicht. Der MariaDB-Adapter
   funktioniert mit MariaDB und MySQL gleichermaßen — also auch mit
   der späteren Datenbank beim Hoster.
   --------------------------------------------------------------- */

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

const verbindung = process.env.DATABASE_URL;

if (!verbindung) {
  // Bewusst deutlich: Ohne Verbindung läuft nichts, und ein stiller
  // Fehlschlag wäre beim Suchen später teurer als ein klarer Abbruch.
  throw new Error(
    "DATABASE_URL ist nicht gesetzt. In der Entwicklung steht der Wert in .env, " +
      "im Livebetrieb in den Umgebungsvariablen des Hosters. Vorlage: .env.example",
  );
}

function neuerClient() {
  return new PrismaClient({ adapter: new PrismaMariaDb(verbindung!) });
}

/**
 * In der Entwicklung lädt Next.js Dateien bei jeder Änderung neu. Ohne
 * diesen Zwischenspeicher entstünde dabei jedes Mal eine neue
 * Datenbankverbindung, bis die Datenbank keine mehr annimmt. Im
 * Livebetrieb greift das nicht — dort wird einmal gestartet.
 */
const global_ = globalThis as unknown as { prisma?: PrismaClient };

export const db = global_.prisma ?? neuerClient();

if (process.env.NODE_ENV !== "production") global_.prisma = db;
