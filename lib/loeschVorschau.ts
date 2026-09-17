/* ---------------------------------------------------------------
   Was steht demnächst zur Löschung oder Anonymisierung an?

   Diese Datei liest nur — sie verändert nichts. Sie beantwortet die
   Frage, die ein Betreiber vor dem Löschlauf stellt: "Was würde
   verschwinden, und ist darunter etwas, das ich sperren muss?"

   Der Adminbereich zeigt bewusst KEINE Namen. Wer wissen will, um
   wen es geht, schlägt die Kennung in der Anmeldung nach — solange
   es sie noch gibt. Eine Löschvorschau, die selbst eine Namensliste
   ist, wäre eine zweite Datensammlung.
   --------------------------------------------------------------- */

import { db } from "./db";
import {
  entscheide,
  faelligEinverstaendnis,
  faelligGesundheit,
  istFaellig,
  offeneSperrgruende,
  type Loeschklasse,
  type Sperrangabe,
} from "./loeschfristen";

/** Wie weit nach vorn die Vorschau blickt. */
export const VORSCHAU_TAGE = 90;

export interface VorschauZeile {
  klasse: Loeschklasse;
  zielArt: string;
  zielId: string;
  faelligAm: Date;
  /** true = die Frist ist bereits abgelaufen. */
  ueberfaellig: boolean;
  /** Offene Sperrgründe. Leer = nichts hält den Datensatz. */
  gesperrtWegen: string[];
  /** Kurze, personenfreie Einordnung, z. B. der Eventtitel. */
  hinweis?: string;
}

export interface OffeneSperre {
  id: string;
  zielArt: string;
  zielId: string;
  grund: string;
  automatisch: boolean;
  gesetztAm: Date;
  gesetztVon: string;
  notiz: string | null;
}

export interface ProtokollZeile {
  id: string;
  zeitpunkt: Date;
  laufId: string;
  klasse: Loeschklasse;
  zielArt: string;
  zielId: string;
  aktion: string;
  grund: string | null;
  probelauf: boolean;
}

/** Alle offenen Sperren, gebündelt nach "zielArt:zielId". */
async function sperrenKarte(): Promise<Map<string, Sperrangabe[]>> {
  const sperren = await db.loeschsperre.findMany({
    where: { aufgehobenAm: null },
    select: { zielArt: true, zielId: true, grund: true, aufgehobenAm: true },
  });
  const karte = new Map<string, Sperrangabe[]>();
  for (const s of sperren) {
    const schluessel = `${s.zielArt}:${s.zielId}`;
    const liste = karte.get(schluessel) ?? [];
    liste.push({ grund: s.grund, aufgehobenAm: s.aufgehobenAm });
    karte.set(schluessel, liste);
  }
  return karte;
}

/**
 * Entscheiden, ob eine Zeile in die Vorschau gehört.
 *
 * Aufgenommen wird, was innerhalb des Vorschaufensters fällig wird
 * ODER bereits fällig ist und nur wegen einer Sperre liegen bleibt.
 * Das zweite ist der wichtigere Fall: Ein Datensatz, der seit zwei
 * Jahren gesperrt ist, verschwindet sonst aus dem Blick — und mit
 * ihm die Frage, ob die Sperre noch nötig ist.
 */
function zeileBauen(
  klasse: Loeschklasse,
  zielArt: string,
  zielId: string,
  faelligAm: Date | null,
  sperren: Sperrangabe[],
  jetzt: Date,
  grenze: Date,
  hinweis?: string,
): VorschauZeile | null {
  if (!faelligAm) return null;

  const e = entscheide(klasse, faelligAm, sperren, jetzt);
  // Steuerunterlagen tauchen in der Vorschau überhaupt nicht auf:
  // Sie werden nie gelöscht, also gibt es nichts anzukündigen.
  if (!e.handeln && e.grund === "steuerrelevant") return null;

  const ueberfaellig = istFaellig(faelligAm, jetzt);
  if (!ueberfaellig && faelligAm > grenze) return null;

  const gesperrtWegen =
    !e.handeln && e.grund === "gesperrt" ? offeneSperrgruende(sperren) : [];
  return { klasse, zielArt, zielId, faelligAm, ueberfaellig, gesperrtWegen, hinweis };
}

/**
 * Die Vorschau über alle Klassen, die diese Anwendung selbst löscht.
 *
 * K1 und K2 liegen auf Papier und erscheinen getrennt über
 * papiererinnerungen() — sie stehen hier nicht, weil die Anwendung
 * sie nicht löschen kann und eine Zeile "würde gelöscht" dort eine
 * Unwahrheit wäre.
 */
export async function loeschVorschau(jetzt: Date = new Date()): Promise<VorschauZeile[]> {
  const grenze = new Date(jetzt.getTime() + VORSCHAU_TAGE * 24 * 60 * 60 * 1000);
  const karte = await sperrenKarte();
  const zeilen: VorschauZeile[] = [];

  const anmeldungen = await db.registration.findMany({
    where: { anonymisiertAm: null },
    select: {
      id: true,
      faelligAm: true,
      loeschklasse: true,
      event: { select: { titel: true } },
    },
  });
  for (const a of anmeldungen) {
    const z = zeileBauen(
      a.loeschklasse,
      "Registration",
      a.id,
      a.faelligAm,
      karte.get(`Registration:${a.id}`) ?? [],
      jetzt,
      grenze,
      a.event.titel,
    );
    if (z) zeilen.push(z);
  }

  const checklisten = await db.checkliste.findMany({
    where: { anonymisiertAm: null },
    select: { id: true, faelligAm: true, loeschklasse: true, durchgefuehrtAm: true },
  });
  for (const c of checklisten) {
    const z = zeileBauen(
      c.loeschklasse,
      "Checkliste",
      c.id,
      c.faelligAm,
      karte.get(`Checkliste:${c.id}`) ?? [],
      jetzt,
      grenze,
      `durchgeführt ${c.durchgefuehrtAm.toISOString().slice(0, 10)}`,
    );
    if (z) zeilen.push(z);
  }

  const nachweise = await db.zustimmungsnachweis.findMany({
    select: { id: true, faelligAm: true, loeschklasse: true },
  });
  for (const n of nachweise) {
    const z = zeileBauen(
      n.loeschklasse,
      "Zustimmungsnachweis",
      n.id,
      n.faelligAm,
      karte.get(`Zustimmungsnachweis:${n.id}`) ?? [],
      jetzt,
      grenze,
    );
    if (z) zeilen.push(z);
  }

  const vorfaelle = await db.vorfall.findMany({
    where: { status: "ABGESCHLOSSEN" },
    select: { id: true, faelligAm: true, loeschklasse: true, titel: true },
  });
  for (const v of vorfaelle) {
    const z = zeileBauen(
      v.loeschklasse,
      "Vorfall",
      v.id,
      v.faelligAm,
      karte.get(`Vorfall:${v.id}`) ?? [],
      jetzt,
      grenze,
      v.titel,
    );
    if (z) zeilen.push(z);
  }

  // Überfälliges zuerst, danach nach Termin — das ist die
  // Reihenfolge, in der man es abarbeitet.
  zeilen.sort((a, b) => a.faelligAm.getTime() - b.faelligAm.getTime());
  return zeilen;
}

/** Alle offenen Sperren, neueste zuerst. */
export async function offeneSperrenListe(): Promise<OffeneSperre[]> {
  return db.loeschsperre.findMany({
    where: { aufgehobenAm: null },
    orderBy: { gesetztAm: "desc" },
    select: {
      id: true,
      zielArt: true,
      zielId: true,
      grund: true,
      automatisch: true,
      gesetztAm: true,
      gesetztVon: true,
      notiz: true,
    },
  });
}

/** Die letzten Protokollzeilen — für den Blick "was ist zuletzt passiert". */
export async function letztesProtokoll(anzahl = 50): Promise<ProtokollZeile[]> {
  return db.loeschprotokoll.findMany({
    orderBy: { zeitpunkt: "desc" },
    take: anzahl,
    select: {
      id: true,
      zeitpunkt: true,
      laufId: true,
      klasse: true,
      zielArt: true,
      zielId: true,
      aktion: true,
      grund: true,
      probelauf: true,
    },
  });
}

/** Fällige Papierunterlagen, die nur von Hand vernichtet werden können. */
export async function papierFaellig(jetzt: Date = new Date()) {
  const events = await db.event.findMany({
    where: { startAt: { not: null } },
    select: { id: true, titel: true, startAt: true, endAt: true },
  });

  const liste: { klasse: Loeschklasse; eventTitel: string; faelligAm: Date }[] = [];
  for (const ev of events) {
    const termin = ev.endAt ?? ev.startAt;
    if (!termin) continue;

    const g = faelligGesundheit(termin);
    if (istFaellig(g, jetzt)) {
      liste.push({ klasse: "GESUNDHEITSANGABEN", eventTitel: ev.titel, faelligAm: g });
    }
    const e = faelligEinverstaendnis(termin);
    if (istFaellig(e, jetzt)) {
      liste.push({ klasse: "EINVERSTAENDNIS_VOLL", eventTitel: ev.titel, faelligAm: e });
    }
  }
  return liste;
}
