/* ---------------------------------------------------------------
   Der Löschlauf.

   Setzt docs/rechtstexte-entwuerfe/13-loeschkonzept.md um. Die Regeln
   selbst stehen in lib/loeschfristen.ts (rein, ohne Datenbank);
   hier steht nur, wie sie auf echte Datensätze angewendet werden.

   ZWEI BETRIEBSARTEN, und der Unterschied ist die wichtigste
   Eigenschaft dieser Datei:

     probelauf: true   — es wird NICHTS verändert. Der Lauf liest,
                         entscheidet und protokolliert, was er täte.
     probelauf: false  — es wird wirklich anonymisiert und gelöscht.

   Der Probelauf ist nicht eine Abkürzung, sondern die Voraussetzung:
   Ein Löschlauf, den man nicht vorher ohne Wirkung ansehen kann,
   gehört nicht in den Betrieb.

   WAS DIESER LAUF NIEMALS ANFASST: Datensätze der Klasse
   STEUERUNTERLAGEN und alle steuerrelevanten Felder einer Anmeldung.
   Die Prüfung dafür steht in lib/loeschfristen.ts → entscheide(), an
   allererster Stelle.
   --------------------------------------------------------------- */

import { randomUUID } from "node:crypto";

import { anmeldungAnonymisieren, checklisteAnonymisieren } from "./anonymisieren";
import { db } from "./db";
import {
  entscheide,
  faelligAnmeldedaten,
  faelligAufnahmewiderspruch,
  faelligEinverstaendnis,
  faelligGesundheit,
  faelligVorfall,
  istFaellig,
  type Loeschklasse,
  type Sperrangabe,
} from "./loeschfristen";

/** Eine einzelne Entscheidung des Laufs, für Protokoll und Vorschau. */
export interface Laufeintrag {
  klasse: Loeschklasse;
  zielArt: string;
  /** Kennung — niemals ein Name. */
  zielId: string;
  aktion: "anonymisiert" | "geloescht" | "uebersprungen" | "faellig";
  grund?: string;
}

export interface Laufergebnis {
  laufId: string;
  probelauf: boolean;
  begonnenAm: Date;
  eintraege: Laufeintrag[];
  /** Zusammenfassung je Aktion. */
  zusammenfassung: Record<string, number>;
}

/* ── Sperren ───────────────────────────────────────────────────── */

/**
 * Alle offenen Sperren zu einer Zielart, gebündelt nach Kennung.
 *
 * Bewusst EINE Abfrage statt einer je Datensatz: Bei einigen hundert
 * Anmeldungen wären das sonst einige hundert Abfragen je Lauf.
 */
async function offeneSperren(zielArt: string): Promise<Map<string, Sperrangabe[]>> {
  const sperren = await db.loeschsperre.findMany({
    where: { zielArt, aufgehobenAm: null },
    select: { zielId: true, grund: true, aufgehobenAm: true },
  });

  const karte = new Map<string, Sperrangabe[]>();
  for (const s of sperren) {
    const liste = karte.get(s.zielId) ?? [];
    liste.push({ grund: s.grund, aufgehobenAm: s.aufgehobenAm });
    karte.set(s.zielId, liste);
  }
  return karte;
}

/**
 * Automatische Sperren aus dem aktuellen Zustand ableiten.
 *
 * Läuft vor jedem Löschlauf. Idempotent: Eine bereits vorhandene
 * offene Sperre desselben Grundes wird nicht verdoppelt.
 *
 * Zwei Auslöser sind maschinell erkennbar:
 *
 *   1. Erstattung oder Teilerstattung → Rückbuchung. Solange Geld
 *      zurückgeflossen ist, gehört der Vorgang nicht gelöscht.
 *   2. Offener Vorfall mit Bezug auf eine Anmeldung → Unfall.
 *
 * Beschwerde, Versicherungsfall und Rechtsstreit lassen sich nicht
 * aus den Daten ableiten — sie werden im Adminbereich von Hand
 * gesetzt. Das ist keine Lücke, sondern die ehrliche Grenze: Eine
 * Beschwerde kommt per E-Mail, nicht als Datenbankfeld.
 */
export async function automatischeSperrenSetzen(): Promise<number> {
  let neu = 0;

  const erstattet = await db.registration.findMany({
    where: { zahlungsStatus: { in: ["ERSTATTET", "TEILWEISE_ERSTATTET"] } },
    select: { id: true },
  });

  for (const r of erstattet) {
    const vorhanden = await db.loeschsperre.findFirst({
      where: { zielArt: "Registration", zielId: r.id, grund: "RUECKBUCHUNG", aufgehobenAm: null },
      select: { id: true },
    });
    if (vorhanden) continue;
    await db.loeschsperre.create({
      data: {
        zielArt: "Registration",
        zielId: r.id,
        grund: "RUECKBUCHUNG",
        automatisch: true,
        gesetztVon: "system",
        notiz: "Automatisch: Betrag wurde ganz oder teilweise erstattet.",
      },
    });
    neu++;
  }

  const offeneVorfaelle = await db.vorfall.findMany({
    where: { status: "OFFEN", registrationId: { not: null } },
    select: { registrationId: true, titel: true },
  });

  for (const v of offeneVorfaelle) {
    if (!v.registrationId) continue;
    const vorhanden = await db.loeschsperre.findFirst({
      where: {
        zielArt: "Registration",
        zielId: v.registrationId,
        grund: "UNFALL",
        aufgehobenAm: null,
      },
      select: { id: true },
    });
    if (vorhanden) continue;
    await db.loeschsperre.create({
      data: {
        zielArt: "Registration",
        zielId: v.registrationId,
        grund: "UNFALL",
        automatisch: true,
        gesetztVon: "system",
        notiz: "Automatisch: offener Vorfall zu dieser Anmeldung.",
      },
    });
    neu++;
  }

  return neu;
}

/* ── Fälligkeiten auffrischen ──────────────────────────────────── */

/**
 * Fälligkeitsdatum je Anmeldung aus dem Veranstaltungstermin neu
 * berechnen.
 *
 * Absichtlich bei JEDEM Lauf: Verschiebt der Betreiber einen Termin,
 * wandert die Fälligkeit mit. Ein einmal beim Anlegen gesetzter Wert
 * wäre nach einer Terminänderung falsch — und zwar still.
 *
 * Veranstaltungen ohne Termin bekommen `null`. Ein Datensatz ohne
 * Fälligkeit wird nie gelöscht; das ist die vorsichtige Richtung.
 */
export async function faelligkeitenAuffrischen(): Promise<number> {
  const anmeldungen = await db.registration.findMany({
    select: {
      id: true,
      faelligAm: true,
      event: { select: { startAt: true, endAt: true } },
    },
  });

  let geaendert = 0;
  for (const a of anmeldungen) {
    const termin = a.event.endAt ?? a.event.startAt;
    const soll = termin ? faelligAnmeldedaten(termin) : null;

    const istGleich =
      (soll === null && a.faelligAm === null) ||
      (soll !== null && a.faelligAm !== null && soll.getTime() === a.faelligAm.getTime());
    if (istGleich) continue;

    await db.registration.update({ where: { id: a.id }, data: { faelligAm: soll } });
    geaendert++;
  }

  /* Vorfälle: Fälligkeit entsteht erst mit dem Abschluss und hängt an
     der Einstufung. Ändert der Betreiber die Einstufung von LEICHT
     auf SCHWER, muss die Frist mitwandern. */
  const vorfaelle = await db.vorfall.findMany({
    select: { id: true, abgeschlossenAm: true, einstufung: true, faelligAm: true },
  });
  for (const v of vorfaelle) {
    const soll = faelligVorfall(v.abgeschlossenAm, v.einstufung);
    const istGleich =
      (soll === null && v.faelligAm === null) ||
      (soll !== null && v.faelligAm !== null && soll.getTime() === v.faelligAm.getTime());
    if (istGleich) continue;
    await db.vorfall.update({ where: { id: v.id }, data: { faelligAm: soll } });
    geaendert++;
  }

  /* K8: faelligAm hängt an Event.aufnahmenOfflineAm, nicht an einem
     bei der Anlage fest eingetragenen Datum. Wird die Offline-
     Markierung nachträglich korrigiert, oder entsteht ein neuer
     Widerspruch bzw. Prüfvermerk NACHDEM ein Event schon als offline
     markiert wurde, muss die Frist mitwandern — dieselbe Systematik
     wie bei Vorfällen und der Einstufung. */
  const widersprueche = await db.aufnahmewiderspruch.findMany({
    select: { id: true, faelligAm: true, event: { select: { aufnahmenOfflineAm: true } } },
  });
  for (const w of widersprueche) {
    const soll = faelligAufnahmewiderspruch(w.event.aufnahmenOfflineAm);
    const istGleich =
      (soll === null && w.faelligAm === null) ||
      (soll !== null && w.faelligAm !== null && soll.getTime() === w.faelligAm.getTime());
    if (istGleich) continue;
    await db.aufnahmewiderspruch.update({ where: { id: w.id }, data: { faelligAm: soll } });
    geaendert++;
  }

  const pruefvermerke = await db.veroeffentlichungspruefung.findMany({
    select: { id: true, faelligAm: true, event: { select: { aufnahmenOfflineAm: true } } },
  });
  for (const p of pruefvermerke) {
    const soll = faelligAufnahmewiderspruch(p.event.aufnahmenOfflineAm);
    const istGleich =
      (soll === null && p.faelligAm === null) ||
      (soll !== null && p.faelligAm !== null && soll.getTime() === p.faelligAm.getTime());
    if (istGleich) continue;
    await db.veroeffentlichungspruefung.update({ where: { id: p.id }, data: { faelligAm: soll } });
    geaendert++;
  }

  return geaendert;
}

/* ── Der Lauf ──────────────────────────────────────────────────── */

/**
 * Einen Löschlauf durchführen.
 *
 * @param probelauf true = nichts verändern, nur berichten.
 */
export async function loeschlauf(probelauf: boolean): Promise<Laufergebnis> {
  const laufId = randomUUID();
  const begonnenAm = new Date();
  const eintraege: Laufeintrag[] = [];

  // Sperren und Fälligkeiten werden auch im Probelauf aufgefrischt:
  // Beides verändert keine personenbezogenen Daten, und ohne sie
  // zeigte die Vorschau ein falsches Bild.
  await automatischeSperrenSetzen();
  await faelligkeitenAuffrischen();

  const sperrenRegistration = await offeneSperren("Registration");
  const sperrenVorfall = await offeneSperren("Vorfall");
  const sperrenCheckliste = await offeneSperren("Checkliste");
  const sperrenNachweis = await offeneSperren("Zustimmungsnachweis");
  const sperrenAufnahmewiderspruch = await offeneSperren("Aufnahmewiderspruch");
  const sperrenVeroeffentlichungspruefung = await offeneSperren("Veroeffentlichungspruefung");

  /* ── K4: Anmelde- und Check-in-Daten → anonymisieren ─────────── */
  const anmeldungen = await db.registration.findMany({
    where: { anonymisiertAm: null },
    select: { id: true, faelligAm: true, loeschklasse: true },
  });

  for (const a of anmeldungen) {
    const e = entscheide(
      a.loeschklasse,
      a.faelligAm,
      sperrenRegistration.get(a.id) ?? [],
      begonnenAm,
    );
    if (!e.handeln) {
      if (e.grund === "gesperrt" || e.grund === "steuerrelevant") {
        eintraege.push({
          klasse: a.loeschklasse,
          zielArt: "Registration",
          zielId: a.id,
          aktion: "uebersprungen",
          grund: e.grund,
        });
      }
      continue;
    }
    if (probelauf) {
      eintraege.push({
        klasse: a.loeschklasse,
        zielArt: "Registration",
        zielId: a.id,
        aktion: "faellig",
      });
      continue;
    }
    const getan = await anmeldungAnonymisieren(a.id);
    if (getan) {
      eintraege.push({
        klasse: a.loeschklasse,
        zielArt: "Registration",
        zielId: a.id,
        aktion: "anonymisiert",
      });
    }
  }

  /* ── K5: Checklisten → Personenbezug entfernen ───────────────── */
  const checklisten = await db.checkliste.findMany({
    where: { anonymisiertAm: null },
    select: { id: true, faelligAm: true, loeschklasse: true },
  });

  for (const c of checklisten) {
    const e = entscheide(
      c.loeschklasse,
      c.faelligAm,
      sperrenCheckliste.get(c.id) ?? [],
      begonnenAm,
    );
    if (!e.handeln) {
      if (e.grund === "gesperrt" || e.grund === "steuerrelevant") {
        eintraege.push({
          klasse: c.loeschklasse,
          zielArt: "Checkliste",
          zielId: c.id,
          aktion: "uebersprungen",
          grund: e.grund,
        });
      }
      continue;
    }
    if (probelauf) {
      eintraege.push({
        klasse: c.loeschklasse,
        zielArt: "Checkliste",
        zielId: c.id,
        aktion: "faellig",
      });
      continue;
    }
    const getan = await checklisteAnonymisieren(c.id);
    if (getan) {
      eintraege.push({
        klasse: c.loeschklasse,
        zielArt: "Checkliste",
        zielId: c.id,
        aktion: "anonymisiert",
      });
    }
  }

  /* ── K3: Zustimmungsnachweise → löschen ──────────────────────── */
  const nachweise = await db.zustimmungsnachweis.findMany({
    select: { id: true, faelligAm: true, loeschklasse: true },
  });

  for (const n of nachweise) {
    const e = entscheide(n.loeschklasse, n.faelligAm, sperrenNachweis.get(n.id) ?? [], begonnenAm);
    if (!e.handeln) {
      if (e.grund === "gesperrt" || e.grund === "steuerrelevant") {
        eintraege.push({
          klasse: n.loeschklasse,
          zielArt: "Zustimmungsnachweis",
          zielId: n.id,
          aktion: "uebersprungen",
          grund: e.grund,
        });
      }
      continue;
    }
    if (probelauf) {
      eintraege.push({
        klasse: n.loeschklasse,
        zielArt: "Zustimmungsnachweis",
        zielId: n.id,
        aktion: "faellig",
      });
      continue;
    }
    await db.zustimmungsnachweis.delete({ where: { id: n.id } });
    eintraege.push({
      klasse: n.loeschklasse,
      zielArt: "Zustimmungsnachweis",
      zielId: n.id,
      aktion: "geloescht",
    });
  }

  /* ── K6: Vorfallakten → löschen ──────────────────────────────── */
  const vorfaelle = await db.vorfall.findMany({
    where: { status: "ABGESCHLOSSEN" },
    select: { id: true, faelligAm: true, loeschklasse: true },
  });

  for (const v of vorfaelle) {
    const e = entscheide(v.loeschklasse, v.faelligAm, sperrenVorfall.get(v.id) ?? [], begonnenAm);
    if (!e.handeln) {
      if (e.grund === "gesperrt" || e.grund === "steuerrelevant") {
        eintraege.push({
          klasse: v.loeschklasse,
          zielArt: "Vorfall",
          zielId: v.id,
          aktion: "uebersprungen",
          grund: e.grund,
        });
      }
      continue;
    }
    if (probelauf) {
      eintraege.push({
        klasse: v.loeschklasse,
        zielArt: "Vorfall",
        zielId: v.id,
        aktion: "faellig",
      });
      continue;
    }
    await db.vorfall.delete({ where: { id: v.id } });
    eintraege.push({
      klasse: v.loeschklasse,
      zielArt: "Vorfall",
      zielId: v.id,
      aktion: "geloescht",
    });
  }

  /* ── K8a: Aufnahmewidersprüche → löschen ─────────────────────── */
  const widersprueche = await db.aufnahmewiderspruch.findMany({
    select: { id: true, faelligAm: true, loeschklasse: true },
  });

  for (const w of widersprueche) {
    const e = entscheide(
      w.loeschklasse,
      w.faelligAm,
      sperrenAufnahmewiderspruch.get(w.id) ?? [],
      begonnenAm,
    );
    if (!e.handeln) {
      if (e.grund === "gesperrt" || e.grund === "steuerrelevant") {
        eintraege.push({
          klasse: w.loeschklasse,
          zielArt: "Aufnahmewiderspruch",
          zielId: w.id,
          aktion: "uebersprungen",
          grund: e.grund,
        });
      }
      continue;
    }
    if (probelauf) {
      eintraege.push({
        klasse: w.loeschklasse,
        zielArt: "Aufnahmewiderspruch",
        zielId: w.id,
        aktion: "faellig",
      });
      continue;
    }
    await db.aufnahmewiderspruch.delete({ where: { id: w.id } });
    eintraege.push({
      klasse: w.loeschklasse,
      zielArt: "Aufnahmewiderspruch",
      zielId: w.id,
      aktion: "geloescht",
    });
  }

  /* ── K8b: Veröffentlichungsprüfungen → löschen ────────────────── */
  const pruefvermerke = await db.veroeffentlichungspruefung.findMany({
    select: { id: true, faelligAm: true, loeschklasse: true },
  });

  for (const p of pruefvermerke) {
    const e = entscheide(
      p.loeschklasse,
      p.faelligAm,
      sperrenVeroeffentlichungspruefung.get(p.id) ?? [],
      begonnenAm,
    );
    if (!e.handeln) {
      if (e.grund === "gesperrt" || e.grund === "steuerrelevant") {
        eintraege.push({
          klasse: p.loeschklasse,
          zielArt: "Veroeffentlichungspruefung",
          zielId: p.id,
          aktion: "uebersprungen",
          grund: e.grund,
        });
      }
      continue;
    }
    if (probelauf) {
      eintraege.push({
        klasse: p.loeschklasse,
        zielArt: "Veroeffentlichungspruefung",
        zielId: p.id,
        aktion: "faellig",
      });
      continue;
    }
    await db.veroeffentlichungspruefung.delete({ where: { id: p.id } });
    eintraege.push({
      klasse: p.loeschklasse,
      zielArt: "Veroeffentlichungspruefung",
      zielId: p.id,
      aktion: "geloescht",
    });
  }

  /* ── Protokoll schreiben ─────────────────────────────────────── */
  if (eintraege.length > 0) {
    await db.loeschprotokoll.createMany({
      data: eintraege.map((e) => ({
        laufId,
        klasse: e.klasse,
        zielArt: e.zielArt,
        zielId: e.zielId,
        aktion: e.aktion,
        grund: e.grund ?? null,
        probelauf,
      })),
    });
  }

  const zusammenfassung: Record<string, number> = {};
  for (const e of eintraege) {
    zusammenfassung[e.aktion] = (zusammenfassung[e.aktion] ?? 0) + 1;
  }

  return { laufId, probelauf, begonnenAm, eintraege, zusammenfassung };
}

/* ── Papierklassen: erinnern statt löschen ─────────────────────── */

export interface Papiererinnerung {
  klasse: Loeschklasse;
  eventTitel: string;
  veranstaltungAm: Date | null;
  faelligAm: Date;
  anzahl: number;
}

/**
 * Welche Papierunterlagen sind zur Vernichtung fällig?
 *
 * Klasse 1 (Gesundheitsangaben) und Klasse 2 (vollständige
 * Einverständniserklärungen) liegen auf Papier. Die Anwendung kann
 * sie nicht vernichten — sie kann nur sagen, was ansteht.
 *
 * Das ist kein Mangel der Umsetzung, sondern die Eigenschaft von
 * Papier. Der einzige verlässliche Weg ist eine Erinnerung, die
 * jemand abarbeitet.
 */
export async function papiererinnerungen(jetzt: Date = new Date()): Promise<Papiererinnerung[]> {
  const events = await db.event.findMany({
    where: { startAt: { not: null } },
    select: {
      id: true,
      titel: true,
      startAt: true,
      endAt: true,
      _count: { select: { anmeldungen: true } },
    },
  });

  const liste: Papiererinnerung[] = [];
  for (const ev of events) {
    const termin = ev.endAt ?? ev.startAt;
    if (!termin) continue;

    const gesundheit = faelligGesundheit(termin);
    if (istFaellig(gesundheit, jetzt)) {
      liste.push({
        klasse: "GESUNDHEITSANGABEN",
        eventTitel: ev.titel,
        veranstaltungAm: termin,
        faelligAm: gesundheit,
        anzahl: ev._count.anmeldungen,
      });
    }

    const einverstaendnis = faelligEinverstaendnis(termin);
    if (istFaellig(einverstaendnis, jetzt)) {
      liste.push({
        klasse: "EINVERSTAENDNIS_VOLL",
        eventTitel: ev.titel,
        veranstaltungAm: termin,
        faelligAm: einverstaendnis,
        anzahl: ev._count.anmeldungen,
      });
    }
  }

  return liste;
}
