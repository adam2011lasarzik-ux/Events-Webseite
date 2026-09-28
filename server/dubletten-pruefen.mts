/* ---------------------------------------------------------------
   Doppelte Zahlungsreferenzen suchen — REIN LESEND.

   Die Migration `20260926120000_ohne_reserviert` legt einen
   EINDEUTIGEN Index auf `Registration.zahlungsReferenz`. Gäbe es
   dort Dubletten, schlüge sie fehl — mitten im Umbau, mit
   angehaltenem Dienst.

   ── Warum ein eigenes Skript ────────────────────────────────────

   Der Ausrollplan liess diese Abfrage bis zum 28.09.2026 über
   `npx prisma db execute --stdin` laufen. Das war falsch: `db
   execute` führt SQL aus, gibt aber KEINE Ergebniszeilen zurück.
   Die Abfrage hätte immer eine leere Ausgabe geliefert — bei
   Dubletten genauso wie ohne. Eine Prüfung, die in beiden Fällen
   gleich aussieht, ist keine.

   `$queryRaw` gibt die Zeilen zurück. Deshalb dieser Weg.

   ── Aufruf ──────────────────────────────────────────────────────

       cd /var/www/vera
       sudo -u vera npx tsx --env-file=.env ./dubletten-pruefen.mts

   Ausgegeben werden nur Zahlungsreferenzen und Anzahlen — keine
   Namen, keine E-Mail-Adressen.
   --------------------------------------------------------------- */

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "./generated/prisma/client.ts";

const VERBINDUNG = process.env.DATABASE_URL;
if (!VERBINDUNG) {
  console.error("DATABASE_URL ist nicht gesetzt. Wurde --env-file=.env vergessen?");
  process.exit(1);
}

const db = new PrismaClient({ adapter: new PrismaMariaDb(VERBINDUNG) });

async function hauptlauf() {
  const dubletten = await db.$queryRaw<{ zahlungsReferenz: string; anzahl: bigint }[]>`
    SELECT zahlungsReferenz, COUNT(*) AS anzahl FROM Registration
     WHERE zahlungsReferenz IS NOT NULL
     GROUP BY zahlungsReferenz HAVING anzahl > 1`;

  const gesamt = await db.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*) AS n FROM Registration WHERE zahlungsReferenz IS NOT NULL`;

  console.log(`\nAnmeldungen mit Zahlungsreferenz: ${Number(gesamt[0]?.n ?? 0)}`);

  if (dubletten.length === 0) {
    console.log("KEINE DUBLETTEN — der eindeutige Index der Migration kann angelegt werden.\n");
    return;
  }

  console.log(`\nACHTUNG: ${dubletten.length} doppelte Zahlungsreferenz(en).`);
  console.log("Die Migration würde daran scheitern. Erst klären, dann migrieren.\n");
  for (const d of dubletten) {
    console.log(`  ${d.zahlungsReferenz}  —  ${Number(d.anzahl)}×`);
  }
  console.log("");
  process.exitCode = 1;
}

hauptlauf()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => db.$disconnect());
