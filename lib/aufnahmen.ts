/* ---------------------------------------------------------------
   Widerspruch gegen Aufnahmen und die Prüfung vor der
   Veröffentlichung — die Regeln an EINER Stelle.

   Hintergrund: Entscheidung 4.8 und Bauauftrag B-10/B-13. Seit dem
   Wegfall der Foto-Einwilligung stützen sich die Aufnahmen auf
   Art. 6 Abs. 1 Buchst. f DS-GVO. Wer nicht abgebildet werden möchte,
   widerspricht nach Art. 21 DS-GVO.

   Daraus folgt etwas, das man sich klarmachen muss: Der Widerspruch
   ist die **einzige** technische Sicherung des ganzen Konzepts. Es
   gibt keine Einwilligung mehr, die danebenstünde. Fällt die Prüfung
   vor der Veröffentlichung aus, gibt es keine zweite.

   Wie überall im Projekt sind die reinen Regeln von den
   Datenbankzugriffen getrennt — so lässt sich jede einzeln prüfen.
   --------------------------------------------------------------- */

import { db } from "./db";

/** Auf welchem Weg ein Widerspruch erklärt wurde. */
export type Widerspruchsweg = "CHECKIN" | "VOR_ORT" | "EMAIL" | "SONSTIGES";

export const WIDERSPRUCHSWEGE: Widerspruchsweg[] = ["CHECKIN", "VOR_ORT", "EMAIL", "SONSTIGES"];

export const WEGNAME: Record<Widerspruchsweg, string> = {
  CHECKIN: "beim Ankommen",
  VOR_ORT: "während der Veranstaltung",
  EMAIL: "per E-Mail",
  SONSTIGES: "auf anderem Weg",
};

/* ── Reine Regeln ───────────────────────────────────────────────── */

/** Das Nötigste, um zu entscheiden, ob ein Widerspruch gilt. */
export interface WiderspruchStand {
  zurueckgenommenAm: Date | null;
}

/**
 * Gilt dieser Widerspruch noch?
 *
 * Ein zurückgenommener Widerspruch bleibt als Zeile stehen — er
 * belegt, dass zwischen Erklärung und Rücknahme einer bestand, und
 * genau das kann später zählen. Für die Prüfung vor der
 * Veröffentlichung zählt er aber nicht mehr mit.
 */
export function giltNoch(w: WiderspruchStand): boolean {
  return w.zurueckgenommenAm === null;
}

/**
 * Darf veröffentlicht werden?
 *
 * Die Regel ist bewusst streng und bewusst einfach: Solange ein
 * geltender Widerspruch vorliegt, ist eine Veröffentlichung **nur**
 * zulässig, wenn ausdrücklich festgestellt wurde, dass niemand davon
 * erkennbar ist.
 *
 * `null` bedeutet NICHT „unbekannt, dann halt ja". Wer nicht geprüft
 * hat, darf nicht veröffentlichen — das ist der Kern der Entscheidung
 * 4.8, und ein Standardwert „erlaubt" wäre hier der teuerste Fehler
 * im ganzen Konzept.
 */
export function darfVeroeffentlichen(
  geltendeWidersprueche: number,
  erkennbarGeprueft: boolean | null,
): { erlaubt: true } | { erlaubt: false; grund: "ungeprueft" | "erkennbar" } {
  if (geltendeWidersprueche === 0) return { erlaubt: true };
  if (erkennbarGeprueft === null) return { erlaubt: false, grund: "ungeprueft" };
  if (erkennbarGeprueft) return { erlaubt: false, grund: "erkennbar" };
  return { erlaubt: true };
}

/** Das Nötigste aus einem Prüfvermerk, um daraus eine Freigabe abzuleiten. */
export interface PruefStand {
  ziel: string;
  erkennbar: boolean;
  geprueftAm: Date;
}

/** Das Nötigste aus einem geltenden Widerspruch für dieselbe Frage. */
export interface WiderspruchZeit {
  erklaertAm: Date;
}

/**
 * Je Veröffentlichungsziel der jüngste Vermerk.
 *
 * Es wird mehrfach geprüft — vor der Website, vor Instagram, vor der
 * Weitergabe an die Halle. Für die Frage „darf ich jetzt dorthin
 * veröffentlichen?" zählt immer nur der letzte Vermerk für genau
 * dieses Ziel; die älteren sind Geschichte, keine Freigabe.
 */
export function letzteJeZiel(vermerke: PruefStand[]): PruefStand[] {
  const neueste = new Map<string, PruefStand>();
  for (const v of vermerke) {
    const schluessel = v.ziel.trim().toLowerCase();
    const bisher = neueste.get(schluessel);
    if (!bisher || v.geprueftAm > bisher.geprueftAm) neueste.set(schluessel, v);
  }
  return [...neueste.values()].sort((a, b) => a.ziel.localeCompare(b.ziel, "de"));
}

/**
 * Darf zu genau diesem Ziel veröffentlicht werden?
 *
 * Über darfVeroeffentlichen() hinaus wird hier die Zeit
 * berücksichtigt: Ein Widerspruch, der NACH der letzten Prüfung
 * erklärt wurde, war damals noch nicht bekannt. Eine Prüfung, die ihn
 * gar nicht kannte, ist keine Freigabe für ihn — sie ist überholt.
 *
 * Ohne diese Regel entstünde der gefährlichste Fall des ganzen
 * Konzepts: Es wurde ordentlich geprüft, ein Mensch widerspricht
 * danach, und der alte grüne Haken steht weiterhin da.
 */
export function freigabe(
  geltende: WiderspruchZeit[],
  vermerk: PruefStand | null,
): { erlaubt: true } | { erlaubt: false; grund: "ungeprueft" | "erkennbar" | "veraltet" } {
  if (geltende.length === 0) return { erlaubt: true };
  if (vermerk === null) return { erlaubt: false, grund: "ungeprueft" };
  if (geltende.some((w) => w.erklaertAm > vermerk.geprueftAm)) {
    return { erlaubt: false, grund: "veraltet" };
  }
  return darfVeroeffentlichen(geltende.length, vermerk.erkennbar);
}

/**
 * Ein Name, wie er in den Prüfvermerk gehört.
 *
 * Leerzeichen am Rand weg, mehrfache zusammengezogen. Ein Name, der
 * sich nur durch Leerzeichen unterscheidet, ist derselbe Mensch —
 * und ein Vermerk, in dem „Anna Meier" zweimal steht, hilft niemandem.
 */
export function namenZeile(namen: string[]): string {
  const sauber = namen.map((n) => n.trim().replace(/\s+/g, " ")).filter((n) => n.length > 0);
  return [...new Set(sauber)].join(", ");
}

/** Die Angaben zu einer Veranstaltungsstätte, wie sie am Event stehen. */
export interface Staette {
  firma: string | null;
  name: string | null;
  strasse: string | null;
  plz: string | null;
  stadt: string;
  register: string | null;
}

/**
 * Eine Veranstaltungsstätte in einer Zeile, wie sie in der
 * Empfängerangabe stehen muss (Art. 13 Abs. 1 Buchst. e DS-GVO).
 *
 * Ohne Firmierung wird auf den Anzeigenamen zurückgefallen und sonst
 * auf die Stadt — die Zeile bleibt damit immer lesbar. Sie ist dann
 * aber rechtlich unvollständig; `staetteVollstaendig()` sagt das, und
 * der Adminbereich soll es zeigen, statt eine halbe Angabe als fertig
 * auszugeben.
 */
export function staetteZeile(ort: Staette): string {
  const anschrift = [ort.strasse, [ort.plz, ort.stadt].filter(Boolean).join(" ")]
    .filter((t) => t && t.trim().length > 0)
    .join(", ");
  /* Der Kopf darf leer bleiben. Stünde hier ersatzweise die Stadt,
     hiesse eine Stätte ohne jede Angabe „Falkensee, Falkensee". */
  const kopf = ort.firma?.trim() || ort.name?.trim() || "";
  const teile = [kopf, anschrift].filter((t) => t.length > 0);
  const zeile = teile.length > 0 ? teile.join(", ") : ort.stadt.trim();
  const register = ort.register?.trim();
  return register ? `${zeile} (${register})` : zeile;
}

/** Ist die Empfängerangabe vollständig genug, um veröffentlicht zu werden? */
export function staetteVollstaendig(ort: Staette): boolean {
  return Boolean(ort.firma?.trim() && ort.strasse?.trim() && ort.plz?.trim() && ort.stadt.trim());
}

/* ── Mit Datenbank ──────────────────────────────────────────────── */

/**
 * Die Veranstaltungsstätten der angekündigten Veranstaltungen.
 *
 * Grundlage der Empfängerangabe auf der Seite „Hinweise zu
 * Aufnahmen". Doppelte werden zusammengefasst: Finden drei
 * Veranstaltungen in derselben Halle statt, steht sie einmal da.
 */
export async function veranstaltungsstaetten(): Promise<string[]> {
  const events = await db.event.findMany({
    where: { status: "VEROEFFENTLICHT" },
    orderBy: { startAt: "asc" },
    select: {
      ortFirma: true,
      ortName: true,
      strasse: true,
      plz: true,
      stadt: true,
      ortRegister: true,
    },
  });
  const zeilen = events.map((e) =>
    staetteZeile({
      firma: e.ortFirma,
      name: e.ortName,
      strasse: e.strasse,
      plz: e.plz,
      stadt: e.stadt,
      register: e.ortRegister,
    }),
  );
  return [...new Set(zeilen)];
}


/** Alle Widersprüche einer Veranstaltung, neueste zuerst. */
export async function widersprueche(eventId: string) {
  return db.aufnahmewiderspruch.findMany({
    where: { eventId },
    orderBy: { erklaertAm: "desc" },
    select: {
      id: true,
      name: true,
      weg: true,
      notiz: true,
      erklaertAm: true,
      erfasstVon: true,
      zurueckgenommenAm: true,
      registrationId: true,
    },
  });
}

/** Nur die, die noch gelten — die Grundlage jeder Prüfung. */
export async function geltendeWidersprueche(eventId: string) {
  return db.aufnahmewiderspruch.findMany({
    where: { eventId, zurueckgenommenAm: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, erklaertAm: true },
  });
}

/**
 * Einen Widerspruch festhalten.
 *
 * Der Name ist das einzige Pflichtfeld — ohne ihn liesse sich später
 * nicht sagen, um wen es geht, und die Prüfung vor der
 * Veröffentlichung wäre wertlos.
 */
export async function widerspruchAnlegen(daten: {
  eventId: string;
  name: string;
  weg: Widerspruchsweg;
  notiz?: string | null;
  registrationId?: string | null;
  erfasstVon: string;
}): Promise<{ id: string }> {
  const name = daten.name.trim().replace(/\s+/g, " ");
  if (name.length === 0) throw new Error("Ein Widerspruch ohne Namen lässt sich später niemandem zuordnen.");

  return db.aufnahmewiderspruch.create({
    data: {
      eventId: daten.eventId,
      name,
      weg: daten.weg,
      notiz: daten.notiz?.trim() || null,
      registrationId: daten.registrationId || null,
      erfasstVon: daten.erfasstVon,
    },
    select: { id: true },
  });
}

/**
 * Einen Widerspruch zurücknehmen — oder die Rücknahme rückgängig.
 *
 * Gelöscht wird nichts. Die Zeile belegt, dass ein Widerspruch
 * bestand; das bleibt auch dann wahr, wenn er später zurückgenommen
 * wurde.
 */
export async function widerspruchZuruecknehmen(id: string, zurueck: boolean): Promise<void> {
  await db.aufnahmewiderspruch.update({
    where: { id },
    data: { zurueckgenommenAm: zurueck ? new Date() : null },
  });
}

/**
 * Eine Veröffentlichungsprüfung festhalten (Bauauftrag B-13).
 *
 * Die Zahl der Widersprüche und ihre Namen werden **kopiert**, nicht
 * nur verknüpft: Der Vermerk soll belegen, was zum Zeitpunkt der
 * Prüfung bekannt war. Kommt später ein Widerspruch hinzu, war er
 * damals eben noch nicht da — und das soll man hinterher sehen.
 */
export async function pruefungFesthalten(daten: {
  eventId: string;
  ziel: string;
  erkennbar: boolean;
  notiz?: string | null;
  geprueftVon: string;
}): Promise<{ id: string; widersprueche: number }> {
  const geltende = await geltendeWidersprueche(daten.eventId);
  const eintrag = await db.veroeffentlichungspruefung.create({
    data: {
      eventId: daten.eventId,
      ziel: daten.ziel.trim(),
      widersprueche: geltende.length,
      namen: namenZeile(geltende.map((w) => w.name)) || null,
      erkennbar: daten.erkennbar,
      notiz: daten.notiz?.trim() || null,
      geprueftVon: daten.geprueftVon,
    },
    select: { id: true },
  });
  return { id: eintrag.id, widersprueche: geltende.length };
}

/** Alle Prüfvermerke einer Veranstaltung, neueste zuerst. */
export async function pruefungen(eventId: string) {
  return db.veroeffentlichungspruefung.findMany({
    where: { eventId },
    orderBy: { geprueftAm: "desc" },
    select: {
      id: true,
      ziel: true,
      widersprueche: true,
      namen: true,
      erkennbar: true,
      notiz: true,
      geprueftAm: true,
      geprueftVon: true,
    },
  });
}
