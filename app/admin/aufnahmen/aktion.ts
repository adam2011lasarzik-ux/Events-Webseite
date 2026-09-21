"use server";

/* ---------------------------------------------------------------
   Widersprüche gegen Foto- und Videoaufnahmen und die Prüfung vor
   der Veröffentlichung (Bauaufträge B-10 und B-13).

   Warum das hier sicherheitsrelevant ist: Seit dem Wegfall der
   Foto-Einwilligung stützen sich die Aufnahmen auf das berechtigte
   Interesse (Art. 6 Abs. 1 Buchst. f DS-GVO). Der Widerspruch nach
   Art. 21 DS-GVO ist damit die einzige technische Sicherung des
   ganzen Konzepts. Geht hier ein Eintrag verloren, gibt es keine
   zweite Stelle, die ihn auffängt.

   Deshalb gilt: gelöscht wird nichts. Ein Widerspruch kann
   zurückgenommen werden, die Zeile bleibt stehen.

   Wie überall im Adminbereich beginnt JEDE Aktion mit
   verlangeAdmin() — nicht im Layout. Eine Serveraktion läuft an
   jedem Layout vorbei.
   --------------------------------------------------------------- */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verlangeAdmin } from "@/lib/adminAuth";
import { protokolliere, PROTOKOLL_AKTIONEN } from "@/lib/adminProtokoll";
import {
  VERANTWORTLICH_NAME,
  VeroeffentlichungenNochOffen,
  WIDERSPRUCHSWEGE,
  aufnahmenOfflineSetzen as aufnahmenOfflineSetzenDb,
  aufnahmenOfflineZuruecknehmen as aufnahmenOfflineZuruecknehmenDb,
  pruefungFesthalten,
  veroeffentlichungAnlegen,
  veroeffentlichungEntfernen as veroeffentlichungEntfernenDb,
  veroeffentlichungWiederherstellen as veroeffentlichungWiederherstellenDb,
  widerspruchAnlegen,
  widerspruchZuruecknehmen,
  type Widerspruchsweg,
} from "@/lib/aufnahmen";
import { db } from "@/lib/db";
import { ausFormular, alsIsoDatum } from "@/lib/zeit";

const NAME_MAX = 180;
const TEXT_MAX = 2000;
const ZIEL_MAX = 180;

function text(wert: FormDataEntryValue | null): string {
  return typeof wert === "string" ? wert.trim() : "";
}

function zurueck(eventId: string, hinweis: string): never {
  redirect(`/admin/aufnahmen?event=${encodeURIComponent(eventId)}&hinweis=${hinweis}`);
}

/**
 * Prüft, dass die Veranstaltung wirklich existiert.
 *
 * Ohne diese Prüfung liesse sich über ein gefälschtes Formular ein
 * Widerspruch an einer erfundenen Kennung anlegen — er stünde dann in
 * keiner Liste und würde bei der Veröffentlichungsprüfung nie
 * auftauchen. Ein Widerspruch, den niemand sieht, ist schlimmer als
 * keiner.
 */
async function gibtEsDieVeranstaltung(eventId: string): Promise<boolean> {
  if (!eventId) return false;
  const treffer = await db.event.findUnique({ where: { id: eventId }, select: { id: true } });
  return treffer !== null;
}

/** Einen Widerspruch festhalten. */
export async function widerspruchErfassen(formular: FormData): Promise<void> {
  const admin = await verlangeAdmin();

  const eventId = text(formular.get("eventId"));
  if (!(await gibtEsDieVeranstaltung(eventId))) {
    redirect("/admin/aufnahmen?hinweis=event-fehlt");
  }

  const name = text(formular.get("name")).slice(0, NAME_MAX);
  if (!name) zurueck(eventId, "name-fehlt");

  const rohWeg = text(formular.get("weg"));
  const weg: Widerspruchsweg = (WIDERSPRUCHSWEGE as string[]).includes(rohWeg)
    ? (rohWeg as Widerspruchsweg)
    : "VOR_ORT";

  const eintrag = await widerspruchAnlegen({
    eventId,
    name,
    weg,
    notiz: text(formular.get("notiz")).slice(0, TEXT_MAX) || null,
    registrationId: text(formular.get("registrationId")) || null,
    erfasstVon: admin.id,
  });

  await protokolliere({
    adminId: admin.id,
    aktion: PROTOKOLL_AKTIONEN.aufnahmeWiderspruchErfasst,
    zielArt: "Aufnahmewiderspruch",
    zielId: eintrag.id,
    detail: weg,
  });

  revalidatePath("/admin/aufnahmen");
  zurueck(eventId, "erfasst");
}

/** Einen Widerspruch zurücknehmen — oder die Rücknahme rückgängig machen. */
export async function widerspruchUmstellen(formular: FormData): Promise<void> {
  const admin = await verlangeAdmin();

  const id = text(formular.get("widerspruchId"));
  const wunsch = text(formular.get("zurueck"));
  if (!id || (wunsch !== "ja" && wunsch !== "nein")) return;

  const vorhanden = await db.aufnahmewiderspruch.findUnique({
    where: { id },
    select: { id: true, eventId: true, zurueckgenommenAm: true },
  });
  if (!vorhanden) return;

  const zurueckgenommen = wunsch === "ja";
  if ((vorhanden.zurueckgenommenAm !== null) === zurueckgenommen) {
    zurueck(vorhanden.eventId, zurueckgenommen ? "zurueckgenommen" : "wieder-gueltig");
  }

  await widerspruchZuruecknehmen(id, zurueckgenommen);

  await protokolliere({
    adminId: admin.id,
    aktion: PROTOKOLL_AKTIONEN.aufnahmeWiderspruchGeaendert,
    zielArt: "Aufnahmewiderspruch",
    zielId: id,
    detail: zurueckgenommen ? "zurückgenommen" : "wieder gültig",
  });

  revalidatePath("/admin/aufnahmen");
  zurueck(vorhanden.eventId, zurueckgenommen ? "zurueckgenommen" : "wieder-gueltig");
}

/**
 * Eine Veröffentlichungsprüfung festhalten (B-13).
 *
 * Das Ergebnis kommt als ausdrückliche Auswahl aus dem Formular —
 * es gibt keinen Standardwert. Wer nicht hingesehen hat, kann hier
 * nichts eintragen, und ohne Eintrag verweigert die Seite die
 * Freigabe. Genau so herum ist es gewollt.
 */
export async function pruefungErfassen(formular: FormData): Promise<void> {
  const admin = await verlangeAdmin();

  const eventId = text(formular.get("eventId"));
  if (!(await gibtEsDieVeranstaltung(eventId))) {
    redirect("/admin/aufnahmen?hinweis=event-fehlt");
  }

  const ziel = text(formular.get("ziel")).slice(0, ZIEL_MAX);
  if (!ziel) zurueck(eventId, "ziel-fehlt");

  const ergebnis = text(formular.get("erkennbar"));
  if (ergebnis !== "ja" && ergebnis !== "nein") zurueck(eventId, "ergebnis-fehlt");

  const vermerk = await pruefungFesthalten({
    eventId,
    ziel,
    erkennbar: ergebnis === "ja",
    notiz: text(formular.get("notiz")).slice(0, TEXT_MAX) || null,
    geprueftVon: admin.id,
  });

  await protokolliere({
    adminId: admin.id,
    aktion: PROTOKOLL_AKTIONEN.veroeffentlichungGeprueft,
    zielArt: "Veroeffentlichungspruefung",
    zielId: vermerk.id,
    detail: `${vermerk.widersprueche} Widersprüche, erkennbar: ${ergebnis}`,
  });

  revalidatePath("/admin/aufnahmen");
  zurueck(eventId, ergebnis === "ja" ? "gesperrt" : "freigegeben");
}

const OFFLINE_NOTIZ_MAX = 1000;

/**
 * Alle Aufnahmen einer Veranstaltung als endgültig offline markieren
 * (Löschklasse K8). Erst dadurch beginnt die dreijährige
 * Nachlauffrist für Widerspruch und Prüfvermerk zu laufen.
 *
 * Bewusst kein vorausgefülltes Datum: Wer nicht bewusst ein Datum
 * einträgt, soll hier nichts auslösen können. Das Datum darf nicht
 * in der Zukunft liegen — die Markierung ist eine Feststellung, keine
 * Ankündigung.
 */
export async function aufnahmenOfflineSetzen(formular: FormData): Promise<void> {
  const admin = await verlangeAdmin();

  const eventId = text(formular.get("eventId"));
  if (!(await gibtEsDieVeranstaltung(eventId))) {
    redirect("/admin/aufnahmen?hinweis=event-fehlt");
  }

  const datumRoh = text(formular.get("datum"));
  if (!datumRoh) zurueck(eventId, "offline-datum-fehlt");

  const datum = ausFormular(`${datumRoh}T00:00`);
  if (!datum) zurueck(eventId, "offline-datum-ungueltig");
  if (datum.getTime() > Date.now()) zurueck(eventId, "offline-datum-zukunft");

  const notiz = text(formular.get("notiz")).slice(0, OFFLINE_NOTIZ_MAX);
  if (!notiz) zurueck(eventId, "offline-notiz-fehlt");

  try {
    await aufnahmenOfflineSetzenDb({ eventId, datum, notiz, gesetztVon: admin.id });
  } catch (fehler) {
    if (fehler instanceof VeroeffentlichungenNochOffen) {
      zurueck(eventId, "offline-noch-veroeffentlicht");
    }
    throw fehler;
  }

  await protokolliere({
    adminId: admin.id,
    aktion: PROTOKOLL_AKTIONEN.aufnahmenOfflineGesetzt,
    zielArt: "Event",
    zielId: eventId,
    detail: alsIsoDatum(datum) ?? undefined,
  });

  revalidatePath("/admin/aufnahmen");
  revalidatePath("/admin/loeschen");
  zurueck(eventId, "offline-gesetzt");
}

/**
 * Die Offline-Markierung zurücknehmen — etwa nach einer Fehleingabe.
 *
 * Setzt die Fälligkeit der zugehörigen K8-Datensätze wieder auf
 * "keine" zurück: Ohne die Feststellung "offline" gibt es keine
 * Frist, wie bei jedem anderen Datensatz ohne Fälligkeitsdatum auch.
 */
export async function aufnahmenOfflineZuruecknehmen(formular: FormData): Promise<void> {
  const admin = await verlangeAdmin();

  const eventId = text(formular.get("eventId"));
  if (!(await gibtEsDieVeranstaltung(eventId))) {
    redirect("/admin/aufnahmen?hinweis=event-fehlt");
  }

  await aufnahmenOfflineZuruecknehmenDb(eventId);

  await protokolliere({
    adminId: admin.id,
    aktion: PROTOKOLL_AKTIONEN.aufnahmenOfflineZurueckgenommen,
    zielArt: "Event",
    zielId: eventId,
  });

  revalidatePath("/admin/aufnahmen");
  revalidatePath("/admin/loeschen");
  zurueck(eventId, "offline-zurueckgenommen");
}

const VEROEFFENTLICHUNG_ORT_MAX = 180;
const VEROEFFENTLICHUNG_ZWECK_MAX = 500;
const VEROEFFENTLICHUNG_NOTIZ_MAX = 1000;

/**
 * Eine Veröffentlichung erfassen — Ort, Verantwortlicher und Zweck (B-14).
 *
 * Ohne diese Angaben wäre nicht nachvollziehbar, wohin eine Aufnahme
 * gegangen ist und wer dafür verantwortlich ist. Solange mindestens
 * eine Veröffentlichung eines Events offen ist, blockiert
 * aufnahmenOfflineSetzenDb die K8-Fälligkeit — das ist der technische
 * Zusammenhang, den diese Erfassung erst herstellt.
 */
export async function veroeffentlichungErfassen(formular: FormData): Promise<void> {
  const admin = await verlangeAdmin();

  const eventId = text(formular.get("eventId"));
  if (!(await gibtEsDieVeranstaltung(eventId))) {
    redirect("/admin/aufnahmen?hinweis=event-fehlt");
  }

  const ort = text(formular.get("ort")).slice(0, VEROEFFENTLICHUNG_ORT_MAX);
  if (!ort) zurueck(eventId, "veroeffentlichung-ort-fehlt");

  const rohVerantwortlich = text(formular.get("verantwortlich"));
  const verantwortlich =
    rohVerantwortlich === "VERANSTALTUNGSSTAETTE" ? "VERANSTALTUNGSSTAETTE" : "VERA";

  const zweck = text(formular.get("zweck")).slice(0, VEROEFFENTLICHUNG_ZWECK_MAX);
  if (!zweck) zurueck(eventId, "veroeffentlichung-zweck-fehlt");

  const pruefungId = text(formular.get("pruefungId")) || null;

  const eintrag = await veroeffentlichungAnlegen({
    eventId,
    ort,
    verantwortlich,
    zweck,
    pruefungId,
    erfasstVon: admin.id,
  });

  await protokolliere({
    adminId: admin.id,
    aktion: PROTOKOLL_AKTIONEN.veroeffentlichungAngelegt,
    zielArt: "Veroeffentlichung",
    zielId: eintrag.id,
    detail: `${VERANTWORTLICH_NAME[verantwortlich]} · ${ort}`,
  });

  revalidatePath("/admin/aufnahmen");
  revalidatePath("/admin/loeschen");
  zurueck(eventId, "veroeffentlichung-erfasst");
}

/**
 * Eine Veröffentlichung als endgültig entfernt markieren.
 *
 * Erst wenn ALLE Veröffentlichungen eines Events so markiert sind, lässt
 * sich die K8-Offline-Feststellung setzen (aufnahmenOfflineSetzenDb prüft
 * das). Diese Markierung ist also der eigentliche fachliche Auslöser der
 * Nachlauffrist, nicht die spätere Offline-Feststellung selbst.
 */
export async function veroeffentlichungAlsEntferntMarkieren(formular: FormData): Promise<void> {
  const admin = await verlangeAdmin();

  const id = text(formular.get("veroeffentlichungId"));
  if (!id) return;

  const vorhanden = await db.veroeffentlichung.findUnique({
    where: { id },
    select: { id: true, eventId: true, ort: true },
  });
  if (!vorhanden) return;

  const notiz = text(formular.get("notiz")).slice(0, VEROEFFENTLICHUNG_NOTIZ_MAX);

  await veroeffentlichungEntfernenDb(id, {
    entferntVon: admin.id,
    entfernungNotiz: notiz || null,
  });

  await protokolliere({
    adminId: admin.id,
    aktion: PROTOKOLL_AKTIONEN.veroeffentlichungEntfernt,
    zielArt: "Veroeffentlichung",
    zielId: id,
    detail: vorhanden.ort,
  });

  revalidatePath("/admin/aufnahmen");
  revalidatePath("/admin/loeschen");
  zurueck(vorhanden.eventId, "veroeffentlichung-entfernt");
}

/** Eine als entfernt markierte Veröffentlichung wieder als aktiv setzen. */
export async function veroeffentlichungWiederherstellenAktion(formular: FormData): Promise<void> {
  const admin = await verlangeAdmin();

  const id = text(formular.get("veroeffentlichungId"));
  if (!id) return;

  const vorhanden = await db.veroeffentlichung.findUnique({
    where: { id },
    select: { id: true, eventId: true, ort: true },
  });
  if (!vorhanden) return;

  await veroeffentlichungWiederherstellenDb(id);

  await protokolliere({
    adminId: admin.id,
    aktion: PROTOKOLL_AKTIONEN.veroeffentlichungWiederhergestellt,
    zielArt: "Veroeffentlichung",
    zielId: id,
    detail: vorhanden.ort,
  });

  revalidatePath("/admin/aufnahmen");
  revalidatePath("/admin/loeschen");
  zurueck(vorhanden.eventId, "veroeffentlichung-wiederhergestellt");
}
