"use server";

/* ---------------------------------------------------------------
   Der Knopf „Buchung stornieren".

   Diese Datei darf ausschließlich async-Funktionen ausgeben — die
   Regeln stehen deshalb in lib/storno.ts, die Ausführung in
   lib/stornoAusfuehren.ts.

   Warum eine Server-Aktion und keine eigene Route: Next.js prüft bei
   Server-Aktionen selbst, ob die Anfrage von dieser Seite kommt. Das
   ist der Schutz davor, dass eine fremde Seite jemanden unbemerkt
   zum Stornieren bringt (Skill §7). Und es stellt sicher, dass hier
   nichts über einen bloßen Seitenaufruf passiert.
   --------------------------------------------------------------- */

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { versuchErlaubt } from "@/lib/ratelimit";
import { stornoAusfuehren } from "@/lib/stornoAusfuehren";

function text(wert: FormDataEntryValue | null): string {
  return typeof wert === "string" ? wert : "";
}

export async function stornoAbsenden(formular: FormData): Promise<void> {
  const id = text(formular.get("anmeldungId"));
  const schluessel = text(formular.get("schluessel"));

  /* Eigene Bremse, getrennt von der des Anmeldeformulars.
     Grund wie beim Admin-Login (Skill §5/§6): Wer über das eine
     Formular das Kontingent aufbraucht, darf das andere nicht
     lahmlegen. Hier bremst sie zusätzlich das Durchprobieren von
     Schlüsseln. */
  const kopf = await headers();
  const ip =
    kopf.get("x-forwarded-for")?.split(",")[0]?.trim() || kopf.get("x-real-ip") || "unbekannt";

  const zieladresse = (ergebnis: string) =>
    `/anmeldung/stornieren?nr=${encodeURIComponent(id)}` +
    `&schluessel=${encodeURIComponent(schluessel)}&ergebnis=${ergebnis}`;

  if (!(await versuchErlaubt(`storno:${ip}`))) {
    redirect(zieladresse("gebremst"));
  }

  const ergebnis = await stornoAusfuehren(id, schluessel);
  redirect(zieladresse(ergebnis.erfolg ? (ergebnis.erstattet ? "erstattet" : "storniert") : ergebnis.fehler));
}
