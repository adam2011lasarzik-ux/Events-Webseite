/* ---------------------------------------------------------------
   Was steht demnächst zur Löschung oder Anonymisierung an?

   Diese Datei liest nur — sie verändert nichts. Sie beantwortet die
   Frage, die ein Betreiber vor dem Löschlauf stellt: "Was würde
   verschwinden, und ist darunter etwas, das ich sperren muss?"

   Name, E-Mail, Veranstaltung und Datum werden beim LESEN
   nachgeschlagen, NICHT gespeichert — genau wie bei den offenen
   Löschsperren weiter unten. Eine zweite Ablage der Personendaten
   nur für diese Vorschau wäre eine zusätzliche Datensammlung, und
   sie bliebe nach dem Anonymisieren stehen. Die Kennung bleibt
   trotzdem sichtbar (klein, mit Kopierfunktion): Sie ist es, was man
   braucht, um einen Datensatz anderswo wiederzufinden.
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

  /* ── Klartext statt nur Kennung ────────────────────────────────
     Nachgeschlagen beim Lesen, siehe Kopfkommentar. */
  /** Name der Person bzw. sachliche Bezeichnung (z. B. „Veranstaltungscheckliste"). */
  bezeichnung: string;
  /** Veranstaltung, falls über eine echte Relation zuzuordnen (nur Anmeldungen). */
  eventTitel: string | null;
  veranstaltungAm: Date | null;
  email: string | null;
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

  /* ── Wer oder was steckt hinter der Kennung? ──────────────────
     Wird beim Lesen nachgeschlagen, NICHT gespeichert. Eine Kopie des
     Namens in der Sperrtabelle wäre eine zweite Stelle, an der
     Personendaten liegen — und sie bliebe nach dem Anonymisieren
     stehen. Genau das soll das Löschkonzept verhindern. */
  bezeichnung: string;
  /** Veranstaltung, falls zuzuordnen. */
  eventTitel: string | null;
  veranstaltungAm: Date | null;
  email: string | null;
  /** true = die Personendaten dahinter sind bereits überschrieben. */
  anonymisiert: boolean;
  /** false = der Datensatz existiert nicht mehr. */
  vorhanden: boolean;
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
  eingabe: {
    klasse: Loeschklasse;
    zielArt: string;
    zielId: string;
    faelligAm: Date | null;
    sperren: Sperrangabe[];
    bezeichnung: string;
    eventTitel: string | null;
    veranstaltungAm: Date | null;
    email: string | null;
  },
  jetzt: Date,
  grenze: Date,
): VorschauZeile | null {
  const { klasse, zielArt, zielId, faelligAm, sperren, bezeichnung, eventTitel, veranstaltungAm, email } =
    eingabe;
  if (!faelligAm) return null;

  const e = entscheide(klasse, faelligAm, sperren, jetzt);
  // Steuerunterlagen tauchen in der Vorschau überhaupt nicht auf:
  // Sie werden nie gelöscht, also gibt es nichts anzukündigen.
  if (!e.handeln && e.grund === "steuerrelevant") return null;

  const ueberfaellig = istFaellig(faelligAm, jetzt);
  if (!ueberfaellig && faelligAm > grenze) return null;

  const gesperrtWegen =
    !e.handeln && e.grund === "gesperrt" ? offeneSperrgruende(sperren) : [];
  return {
    klasse,
    zielArt,
    zielId,
    faelligAm,
    ueberfaellig,
    gesperrtWegen,
    bezeichnung,
    eventTitel,
    veranstaltungAm,
    email,
  };
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
      kontaktVorname: true,
      kontaktNachname: true,
      kontaktEmail: true,
      event: { select: { titel: true, startAt: true, endAt: true } },
    },
  });
  for (const a of anmeldungen) {
    const z = zeileBauen(
      {
        klasse: a.loeschklasse,
        zielArt: "Registration",
        zielId: a.id,
        faelligAm: a.faelligAm,
        sperren: karte.get(`Registration:${a.id}`) ?? [],
        bezeichnung: `${a.kontaktVorname} ${a.kontaktNachname}`.trim(),
        eventTitel: a.event.titel,
        veranstaltungAm: a.event.startAt ?? a.event.endAt,
        email: a.kontaktEmail,
      },
      jetzt,
      grenze,
    );
    if (z) zeilen.push(z);
  }

  const checklisten = await db.checkliste.findMany({
    where: { anonymisiertAm: null },
    select: { id: true, faelligAm: true, loeschklasse: true, durchgefuehrtAm: true },
  });
  for (const c of checklisten) {
    const z = zeileBauen(
      {
        klasse: c.loeschklasse,
        zielArt: "Checkliste",
        zielId: c.id,
        faelligAm: c.faelligAm,
        sperren: karte.get(`Checkliste:${c.id}`) ?? [],
        // Kein Personenbezug: eine Checkliste betrifft keine einzelne
        // Person. "eventId" ist hier ein rohes Feld ohne Prisma-
        // Relation — der Titel lässt sich ohne eine zweite Abfrage je
        // Zeile nicht mitliefern, deshalb bleibt eventTitel leer.
        bezeichnung: "Veranstaltungscheckliste",
        eventTitel: null,
        veranstaltungAm: c.durchgefuehrtAm,
        email: null,
      },
      jetzt,
      grenze,
    );
    if (z) zeilen.push(z);
  }

  const nachweise = await db.zustimmungsnachweis.findMany({
    select: { id: true, faelligAm: true, loeschklasse: true, teilnehmerName: true, veranstaltungAm: true },
  });
  for (const n of nachweise) {
    const z = zeileBauen(
      {
        klasse: n.loeschklasse,
        zielArt: "Zustimmungsnachweis",
        zielId: n.id,
        faelligAm: n.faelligAm,
        sperren: karte.get(`Zustimmungsnachweis:${n.id}`) ?? [],
        bezeichnung: n.teilnehmerName,
        eventTitel: null,
        veranstaltungAm: n.veranstaltungAm,
        email: null,
      },
      jetzt,
      grenze,
    );
    if (z) zeilen.push(z);
  }

  const vorfaelle = await db.vorfall.findMany({
    where: { status: "ABGESCHLOSSEN" },
    select: { id: true, faelligAm: true, loeschklasse: true, titel: true, eroeffnetAm: true },
  });
  for (const v of vorfaelle) {
    const z = zeileBauen(
      {
        klasse: v.loeschklasse,
        zielArt: "Vorfall",
        zielId: v.id,
        faelligAm: v.faelligAm,
        sperren: karte.get(`Vorfall:${v.id}`) ?? [],
        bezeichnung: v.titel,
        eventTitel: null,
        veranstaltungAm: v.eroeffnetAm,
        email: null,
      },
      jetzt,
      grenze,
    );
    if (z) zeilen.push(z);
  }

  const widersprueche = await db.aufnahmewiderspruch.findMany({
    select: {
      id: true,
      faelligAm: true,
      loeschklasse: true,
      name: true,
      event: { select: { titel: true, startAt: true, endAt: true } },
    },
  });
  for (const w of widersprueche) {
    const z = zeileBauen(
      {
        klasse: w.loeschklasse,
        zielArt: "Aufnahmewiderspruch",
        zielId: w.id,
        faelligAm: w.faelligAm,
        sperren: karte.get(`Aufnahmewiderspruch:${w.id}`) ?? [],
        bezeichnung: w.name,
        eventTitel: w.event.titel,
        veranstaltungAm: w.event.startAt ?? w.event.endAt,
        email: null,
      },
      jetzt,
      grenze,
    );
    if (z) zeilen.push(z);
  }

  const pruefvermerke = await db.veroeffentlichungspruefung.findMany({
    select: {
      id: true,
      faelligAm: true,
      loeschklasse: true,
      ziel: true,
      event: { select: { titel: true, startAt: true, endAt: true } },
    },
  });
  for (const p of pruefvermerke) {
    const z = zeileBauen(
      {
        klasse: p.loeschklasse,
        zielArt: "Veroeffentlichungspruefung",
        zielId: p.id,
        faelligAm: p.faelligAm,
        sperren: karte.get(`Veroeffentlichungspruefung:${p.id}`) ?? [],
        bezeichnung: `Prüfung: ${p.ziel}`,
        eventTitel: p.event.titel,
        veranstaltungAm: p.event.startAt ?? p.event.endAt,
        email: null,
      },
      jetzt,
      grenze,
    );
    if (z) zeilen.push(z);
  }

  // Überfälliges zuerst, danach nach Termin — das ist die
  // Reihenfolge, in der man es abarbeitet.
  zeilen.sort((a, b) => a.faelligAm.getTime() - b.faelligAm.getTime());
  return zeilen;
}

/**
 * Alle offenen Sperren, neueste zuerst — mit lesbarer Bezeichnung.
 *
 * Die Sperrtabelle kennt nur `zielArt` und `zielId`. Wer davor sitzt,
 * braucht aber einen Namen, um zu entscheiden, ob die Sperre noch
 * nötig ist. Eine Liste aus Kennungen ist praktisch unbenutzbar.
 *
 * Nachgeschlagen wird gebündelt: je Zielart EINE Abfrage, nicht eine
 * je Sperre. Bei zwanzig Sperren wären das sonst zwanzig Abfragen für
 * eine Tabelle.
 */
export async function offeneSperrenListe(): Promise<OffeneSperre[]> {
  const sperren = await db.loeschsperre.findMany({
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
  if (sperren.length === 0) return [];

  const idsVon = (art: string) =>
    sperren.filter((s) => s.zielArt === art).map((s) => s.zielId);

  const [anmeldungen, vorfaelle, checklisten, nachweise, widersprueche, pruefvermerke] =
    await Promise.all([
      db.registration.findMany({
        where: { id: { in: idsVon("Registration") } },
        select: {
          id: true,
          kontaktVorname: true,
          kontaktNachname: true,
          kontaktEmail: true,
          anonymisiertAm: true,
          event: { select: { titel: true, startAt: true, endAt: true } },
        },
      }),
      db.vorfall.findMany({
        where: { id: { in: idsVon("Vorfall") } },
        select: { id: true, titel: true, eroeffnetAm: true, status: true },
      }),
      db.checkliste.findMany({
        where: { id: { in: idsVon("Checkliste") } },
        select: { id: true, durchgefuehrtAm: true, anonymisiertAm: true },
      }),
      db.zustimmungsnachweis.findMany({
        where: { id: { in: idsVon("Zustimmungsnachweis") } },
        select: { id: true, teilnehmerName: true, veranstaltungAm: true },
      }),
      db.aufnahmewiderspruch.findMany({
        where: { id: { in: idsVon("Aufnahmewiderspruch") } },
        select: {
          id: true,
          name: true,
          event: { select: { titel: true, startAt: true, endAt: true } },
        },
      }),
      db.veroeffentlichungspruefung.findMany({
        where: { id: { in: idsVon("Veroeffentlichungspruefung") } },
        select: {
          id: true,
          ziel: true,
          event: { select: { titel: true, startAt: true, endAt: true } },
        },
      }),
    ]);

  const a = new Map(anmeldungen.map((x) => [x.id, x]));
  const v = new Map(vorfaelle.map((x) => [x.id, x]));
  const c = new Map(checklisten.map((x) => [x.id, x]));
  const z = new Map(nachweise.map((x) => [x.id, x]));
  const w = new Map(widersprueche.map((x) => [x.id, x]));
  const pv = new Map(pruefvermerke.map((x) => [x.id, x]));

  return sperren.map((s) => {
    const leer = {
      ...s,
      bezeichnung: "Datensatz nicht mehr vorhanden",
      eventTitel: null,
      veranstaltungAm: null,
      email: null,
      anonymisiert: false,
      vorhanden: false,
    };

    if (s.zielArt === "Registration") {
      const t = a.get(s.zielId);
      if (!t) return leer;
      return {
        ...s,
        bezeichnung: `${t.kontaktVorname} ${t.kontaktNachname}`.trim(),
        eventTitel: t.event.titel,
        veranstaltungAm: t.event.startAt ?? t.event.endAt,
        email: t.kontaktEmail,
        anonymisiert: t.anonymisiertAm !== null,
        vorhanden: true,
      };
    }
    if (s.zielArt === "Vorfall") {
      const t = v.get(s.zielId);
      if (!t) return leer;
      return {
        ...s,
        bezeichnung: t.titel,
        eventTitel: null,
        veranstaltungAm: t.eroeffnetAm,
        email: null,
        anonymisiert: false,
        vorhanden: true,
      };
    }
    if (s.zielArt === "Checkliste") {
      const t = c.get(s.zielId);
      if (!t) return leer;
      return {
        ...s,
        bezeichnung: "Veranstaltungscheckliste",
        eventTitel: null,
        veranstaltungAm: t.durchgefuehrtAm,
        email: null,
        anonymisiert: t.anonymisiertAm !== null,
        vorhanden: true,
      };
    }
    if (s.zielArt === "Zustimmungsnachweis") {
      const t = z.get(s.zielId);
      if (!t) return leer;
      return {
        ...s,
        bezeichnung: t.teilnehmerName,
        eventTitel: null,
        veranstaltungAm: t.veranstaltungAm,
        email: null,
        anonymisiert: false,
        vorhanden: true,
      };
    }
    if (s.zielArt === "Aufnahmewiderspruch") {
      const t = w.get(s.zielId);
      if (!t) return leer;
      return {
        ...s,
        bezeichnung: t.name,
        eventTitel: t.event.titel,
        veranstaltungAm: t.event.startAt ?? t.event.endAt,
        email: null,
        anonymisiert: false,
        vorhanden: true,
      };
    }
    const t = pv.get(s.zielId);
    if (!t) return leer;
    return {
      ...s,
      bezeichnung: `Prüfung: ${t.ziel}`,
      eventTitel: t.event.titel,
      veranstaltungAm: t.event.startAt ?? t.event.endAt,
      email: null,
      anonymisiert: false,
      vorhanden: true,
    };
  });
}

/** Eine Anmeldung, wie sie in der Auswahlliste erscheint. */
export interface AnmeldungZurAuswahl {
  id: string;
  /** „Vorname Nachname — Veranstaltung — Datum — E-Mail" */
  beschriftung: string;
  anonymisiert: boolean;
  /** true = auf diesen Datensatz liegt bereits eine offene Sperre. */
  bereitsGesperrt: boolean;
}

/**
 * Die Anmeldungen für die Auswahl beim Setzen einer Sperre.
 *
 * Damit niemand mehr eine Kennung abtippen muss. Gespeichert wird
 * weiterhin die Kennung — die Beschriftung ist reine Anzeige und
 * entsteht bei jedem Aufruf neu.
 *
 * Bereits anonymisierte Anmeldungen bleiben in der Liste, aber
 * erkennbar gekennzeichnet: Eine Sperre darauf ist nicht falsch, nur
 * wirkungslos — der Löschlauf überspringt sie ohnehin, weil ihre
 * Personendaten schon überschrieben sind. Sie stillschweigend
 * wegzulassen wäre schlechter: Dann suchte man vergeblich nach einem
 * Namen, den man in der Anmeldungsliste noch sieht.
 */
export async function anmeldungenZurAuswahl(): Promise<AnmeldungZurAuswahl[]> {
  const [anmeldungen, gesperrte] = await Promise.all([
    db.registration.findMany({
      orderBy: { angemeldetAm: "desc" },
      select: {
        id: true,
        kontaktVorname: true,
        kontaktNachname: true,
        kontaktEmail: true,
        anonymisiertAm: true,
        event: { select: { titel: true, startAt: true, endAt: true } },
      },
    }),
    db.loeschsperre.findMany({
      where: { zielArt: "Registration", aufgehobenAm: null },
      select: { zielId: true },
    }),
  ]);

  const schonGesperrt = new Set(gesperrte.map((g) => g.zielId));

  return anmeldungen.map((r) => {
    const termin = r.event.startAt ?? r.event.endAt;
    const teile = [
      `${r.kontaktVorname} ${r.kontaktNachname}`.trim(),
      r.event.titel,
      termin ? termin.toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" }) : "Termin offen",
      r.kontaktEmail,
    ];
    return {
      id: r.id,
      beschriftung: teile.join(" — "),
      anonymisiert: r.anonymisiertAm !== null,
      bereitsGesperrt: schonGesperrt.has(r.id),
    };
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
