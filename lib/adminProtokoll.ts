/* ---------------------------------------------------------------
   Protokoll der Admin-Aktionen.

   Wer hat wann was mit welchen Daten gemacht? Ohne eine Antwort
   darauf lässt sich nach einem Vorfall nur raten. Für Teilnehmerdaten
   ist das zu wenig: Die DSGVO verlangt, Zugriffe belegen zu können,
   und im Betrieb ist es der Unterschied zwischen „da fehlt etwas" und
   „das war am Dienstag der Export für die Anwesenheitsliste".

   ── Was hier NICHT hineingehört ──

   Keine Namen, keine E-Mail-Adressen, keine Telefonnummern, keine
   Beträge mit Personenbezug. Nur Kennungen. Ein Protokoll, das selbst
   zur Datensammlung wird, verschlimmert genau das Problem, das es
   lösen soll — und es müsste dann seinerseits gelöscht werden, wenn
   jemand sein Recht auf Löschung wahrnimmt.

   Wer wissen will, um wen es ging, schlägt die Kennung in der
   Anmeldung nach. Ist die gelöscht, ist die Auskunft vorbei — das ist
   richtig so.
   --------------------------------------------------------------- */

import { db } from "./db";

/**
 * Die Namen der Vorgänge an einer Stelle.
 *
 * Als Konstante statt als lose Zeichenketten in acht Dateien: So
 * lässt sich später zuverlässig nach einem Vorgang filtern, ohne dass
 * ein Tippfehler eine ganze Kategorie unsichtbar macht.
 */
export const PROTOKOLL_AKTIONEN = {
  anmeldungStatus: "anmeldung.status",
  anmeldungZahlung: "anmeldung.zahlung",
  anmeldungAnonymisiert: "anmeldung.anonymisiert",
  anmeldungStorniert: "anmeldung.storniert",
  eventGespeichert: "event.gespeichert",
  eventEntfernt: "event.entfernt",
  einstellungenGespeichert: "einstellungen.gespeichert",
  csvExport: "csv.export",
  zugangUeberallAbgemeldet: "zugang.ueberall-abgemeldet",
  zweiterFaktorEingerichtet: "zugang.zweiter-faktor-eingerichtet",
  zweiterFaktorDeaktiviert: "zugang.zweiter-faktor-deaktiviert",
  zweiterFaktorBackupCodesErneuert: "zugang.zweiter-faktor-codes-erneuert",
  loeschsperreGesetzt: "loeschsperre.gesetzt",
  loeschsperreAufgehoben: "loeschsperre.aufgehoben",
  loeschlaufProbe: "loeschlauf.probe",
  loeschlaufEcht: "loeschlauf.echt",
  vorfallAngelegt: "vorfall.angelegt",
  vorfallGeaendert: "vorfall.geaendert",
  zustimmungsnachweisAngelegt: "zustimmungsnachweis.angelegt",
  checklisteAngelegt: "checkliste.angelegt",
  checklisteGeaendert: "checkliste.geaendert",
  aufnahmeWiderspruchErfasst: "aufnahme.widerspruch-erfasst",
  aufnahmeWiderspruchGeaendert: "aufnahme.widerspruch-geaendert",
  veroeffentlichungGeprueft: "veroeffentlichung.geprueft",
  aufnahmenOfflineGesetzt: "aufnahmen.offline-gesetzt",
  aufnahmenOfflineZurueckgenommen: "aufnahmen.offline-zurueckgenommen",
  veroeffentlichungAngelegt: "veroeffentlichung.angelegt",
  veroeffentlichungEntfernt: "veroeffentlichung.entfernt",
  veroeffentlichungWiederhergestellt: "veroeffentlichung.wiederhergestellt",
  fehlbuchungErledigt: "fehlbuchung.erledigt",
} as const;

export type ProtokollAktion = (typeof PROTOKOLL_AKTIONEN)[keyof typeof PROTOKOLL_AKTIONEN];

/** Länge, ab der ein Zusatz gekürzt wird — die Spalte fasst 191 Zeichen. */
const DETAIL_MAX = 180;

interface Eintrag {
  /** Kennung des handelnden Zugangs, aus verlangeAdmin(). */
  adminId: string;
  aktion: ProtokollAktion;
  /** Art des betroffenen Datensatzes, z. B. "Registration". */
  zielArt?: string;
  /** Kennung des betroffenen Datensatzes. */
  zielId?: string;
  /** Kurzer, personenfreier Zusatz — etwa "OFFEN → BEZAHLT". */
  detail?: string;
}

/**
 * Einen Vorgang festhalten.
 *
 * Wird NACH der eigentlichen Änderung aufgerufen, nicht davor: Ein
 * Protokolleintrag für etwas, das dann doch nicht passiert ist, wäre
 * schlechter als keiner.
 *
 * Ein Fehlschlag beim Schreiben wird bewusst NICHT verschluckt. Ein
 * Protokoll, das im Stillen aussetzt, wiegt in Sicherheit — und wenn
 * diese Tabelle nicht beschreibbar ist, ist die Datenbank ohnehin
 * kaputt und die Aktion selbst wäre gescheitert.
 */
export async function protokolliere(eintrag: Eintrag): Promise<void> {
  await db.adminProtokoll.create({
    data: {
      adminId: eintrag.adminId,
      aktion: eintrag.aktion,
      zielArt: eintrag.zielArt ?? null,
      zielId: eintrag.zielId ?? null,
      detail: eintrag.detail ? eintrag.detail.slice(0, DETAIL_MAX) : null,
    },
  });
}
