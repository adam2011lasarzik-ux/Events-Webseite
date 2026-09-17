"use server";

/* ---------------------------------------------------------------
   Löschsperren setzen und aufheben, Löschlauf starten.

   Jede Aktion prüft selbst den Zugang. Eine Server-Aktion ist über
   das Netz erreichbar wie jede andere Adresse und läuft an jedem
   Layout vorbei — eine Prüfung im Layout täuschte Sicherheit vor.

   Jede Aktion hinterlässt einen Eintrag im Adminprotokoll. Wer eine
   Sperre aufhebt, gibt damit einen Datensatz zur Vernichtung frei;
   das muss nachvollziehbar bleiben.
   --------------------------------------------------------------- */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verlangeAdmin } from "@/lib/adminAuth";
import { protokolliere, PROTOKOLL_AKTIONEN } from "@/lib/adminProtokoll";
import { db } from "@/lib/db";
import { loeschlauf } from "@/lib/loeschlauf";

const SPERRGRUENDE = [
  "UNFALL",
  "BESCHWERDE",
  "RUECKBUCHUNG",
  "VERSICHERUNG",
  "RECHTSSTREIT",
] as const;

const ZIELARTEN = ["Registration", "Vorfall", "Checkliste", "Zustimmungsnachweis"] as const;

type Sperrgrund = (typeof SPERRGRUENDE)[number];
type Zielart = (typeof ZIELARTEN)[number];

function text(wert: FormDataEntryValue | null): string {
  return typeof wert === "string" ? wert.trim() : "";
}

function ausListe<T extends string>(erlaubt: readonly T[], wert: string): T | null {
  return (erlaubt as readonly string[]).includes(wert) ? (wert as T) : null;
}

/** Länge, ab der die Notiz gekürzt wird. Freitext bleibt kurz. */
const NOTIZ_MAX = 500;

/**
 * Einen Datensatz von Hand gegen Löschung sperren.
 *
 * Für die Gründe, die sich NICHT aus den Daten ableiten lassen:
 * Beschwerde, Versicherungsfall, dokumentierter Rechtsstreit. Eine
 * Beschwerde kommt per E-Mail, nicht als Datenbankfeld — deshalb
 * braucht es diesen Weg.
 */
export async function sperreSetzen(formular: FormData): Promise<void> {
  const admin = await verlangeAdmin();

  const zielArt = ausListe(ZIELARTEN, text(formular.get("zielArt")));
  const zielId = text(formular.get("zielId"));
  const grund = ausListe(SPERRGRUENDE, text(formular.get("grund")));
  const notiz = text(formular.get("notiz")).slice(0, NOTIZ_MAX);

  if (!zielArt || !zielId || !grund) {
    redirect("/admin/loeschen?hinweis=sperre-unvollstaendig");
  }

  /* Dieselbe offene Sperre nicht zweimal anlegen: Sonst müsste man
     sie auch zweimal aufheben, und beim zweiten Mal wäre unklar,
     warum der Datensatz weiterhin liegen bleibt. */
  const vorhanden = await db.loeschsperre.findFirst({
    where: { zielArt, zielId, grund, aufgehobenAm: null },
    select: { id: true },
  });
  if (vorhanden) {
    redirect("/admin/loeschen?hinweis=sperre-vorhanden");
  }

  await db.loeschsperre.create({
    data: {
      zielArt,
      zielId,
      grund,
      automatisch: false,
      gesetztVon: admin.id,
      notiz: notiz || null,
    },
  });

  await protokolliere({
    adminId: admin.id,
    aktion: PROTOKOLL_AKTIONEN.loeschsperreGesetzt,
    zielArt,
    zielId,
    detail: grund,
  });

  revalidatePath("/admin/loeschen");
  redirect("/admin/loeschen?hinweis=sperre-gesetzt");
}

/**
 * Eine Sperre aufheben.
 *
 * Die Zeile wird NICHT gelöscht, sondern mit Zeitpunkt und Person
 * abgeschlossen. Sonst bliebe später offen, ob es je eine Sperre
 * gab — und genau das ist die Frage, die im Streitfall gestellt wird.
 */
export async function sperreAufheben(formular: FormData): Promise<void> {
  const admin = await verlangeAdmin();

  const id = text(formular.get("sperreId"));
  if (!id) return;

  const sperre = await db.loeschsperre.findUnique({
    where: { id },
    select: { id: true, zielArt: true, zielId: true, grund: true, aufgehobenAm: true },
  });
  if (!sperre || sperre.aufgehobenAm) {
    redirect("/admin/loeschen?hinweis=sperre-schon-auf");
  }

  await db.loeschsperre.update({
    where: { id },
    data: { aufgehobenAm: new Date(), aufgehobenVon: admin.id },
  });

  await protokolliere({
    adminId: admin.id,
    aktion: PROTOKOLL_AKTIONEN.loeschsperreAufgehoben,
    zielArt: sperre.zielArt,
    zielId: sperre.zielId,
    detail: sperre.grund,
  });

  revalidatePath("/admin/loeschen");
  redirect("/admin/loeschen?hinweis=sperre-aufgehoben");
}

/**
 * Einen Probelauf starten — verändert keine personenbezogenen Daten.
 *
 * Das ist der Knopf, den man gefahrlos drückt. Er schreibt einen
 * Protokolleintrag mit `probelauf: true`, sodass später erkennbar
 * bleibt, dass hier nichts verschwunden ist.
 */
export async function probelaufStarten(): Promise<void> {
  const admin = await verlangeAdmin();

  const ergebnis = await loeschlauf(true);

  await protokolliere({
    adminId: admin.id,
    aktion: PROTOKOLL_AKTIONEN.loeschlaufProbe,
    zielArt: "Loeschlauf",
    zielId: ergebnis.laufId,
    detail: `${ergebnis.eintraege.length} Entscheidungen`,
  });

  revalidatePath("/admin/loeschen");
  redirect(`/admin/loeschen?hinweis=probelauf&lauf=${ergebnis.laufId}`);
}

/**
 * Den Löschlauf wirklich ausführen.
 *
 * Bewusst als zweiter, getrennter Knopf mit eigener Bestätigung:
 * Anonymisieren und Löschen lassen sich nicht rückgängig machen.
 * Der Löschjob läuft ohnehin automatisch — dieser Knopf ist für den
 * Fall, dass etwas sofort verschwinden soll.
 */
export async function loeschlaufAusfuehren(formular: FormData): Promise<void> {
  const admin = await verlangeAdmin();

  // Ohne ausdrückliche Bestätigung passiert nichts. Ein Fehlklick
  // auf einen Knopf, der Daten endgültig entfernt, darf nicht
  // genügen.
  if (text(formular.get("bestaetigt")) !== "ja") {
    redirect("/admin/loeschen?hinweis=nicht-bestaetigt");
  }

  const ergebnis = await loeschlauf(false);

  await protokolliere({
    adminId: admin.id,
    aktion: PROTOKOLL_AKTIONEN.loeschlaufEcht,
    zielArt: "Loeschlauf",
    zielId: ergebnis.laufId,
    detail: `${ergebnis.eintraege.length} Entscheidungen`,
  });

  revalidatePath("/admin/loeschen");
  revalidatePath("/admin");
  redirect(`/admin/loeschen?hinweis=ausgefuehrt&lauf=${ergebnis.laufId}`);
}
