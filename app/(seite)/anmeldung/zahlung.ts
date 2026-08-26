"use server";

/* ---------------------------------------------------------------
   Der Knopf „Jetzt bezahlen" auf der Danke-Seite.

   Zweiter Anlauf für alle, bei denen die Weiterleitung direkt nach dem
   Absenden nicht geklappt hat oder die den Vorgang abgebrochen haben.

   Diese Datei darf ausschließlich async-Funktionen ausgeben — ein hier
   ausgegebener Wert käme als `undefined` an. Die Regeln stehen deshalb
   in lib/zahlungStart.ts.
   --------------------------------------------------------------- */

import { redirect } from "next/navigation";
import { bezahlseiteFuer } from "@/lib/zahlungStart";

export async function zahlungStarten(formular: FormData): Promise<void> {
  const wert = formular.get("anmeldungId");
  const id = typeof wert === "string" ? wert : "";

  const ergebnis = await bezahlseiteFuer(id);
  if ("url" in ergebnis) redirect(ergebnis.url);

  redirect(`/anmeldung/danke?nr=${encodeURIComponent(id)}&zahlung=${ergebnis.fehler}`);
}
