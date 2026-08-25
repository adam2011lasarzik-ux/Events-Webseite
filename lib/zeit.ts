/* ---------------------------------------------------------------
   Datum und Uhrzeit zwischen Formular und Datenbank umrechnen.

   Das Problem, das diese Datei löst: Der Server läuft praktisch immer
   in UTC, eingegeben und gelesen wird aber deutsche Zeit. Ohne
   Umrechnung stünde bei einem Event, das um 14:00 beginnt, auf der
   Webseite 12:00 — und niemand würde es merken, bis die ersten Gäste
   zwei Stunden zu früh vor der Halle stehen.

   Gespeichert wird deshalb immer der echte Zeitpunkt (UTC), gezeigt
   und eingegeben immer deutsche Zeit. Die Sommerzeit erledigt die
   eingebaute Zeitzonen-Datenbank von Node, nicht eine feste Zahl:
   Deutschland liegt im Winter eine, im Sommer zwei Stunden vor UTC.
   --------------------------------------------------------------- */

const ZONE = "Europe/Berlin";

const teiler = new Intl.DateTimeFormat("de-DE", {
  timeZone: ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

interface Teile {
  jahr: string; monat: string; tag: string;
  stunde: string; minute: string; sekunde: string;
}

/** Einen Zeitpunkt in seine deutschen Kalenderteile zerlegen. */
function deutscheTeile(zeitpunkt: Date): Teile {
  const p = Object.fromEntries(
    teiler.formatToParts(zeitpunkt).map((t) => [t.type, t.value]),
  ) as Record<string, string>;
  return {
    jahr: p.year, monat: p.month, tag: p.day,
    stunde: p.hour, minute: p.minute, sekunde: p.second,
  };
}

/** Wie weit läuft die deutsche Zeit zu diesem Zeitpunkt vor UTC? (in Millisekunden) */
function versatzMs(zeitpunkt: Date): number {
  const t = deutscheTeile(zeitpunkt);
  const alsWaereEsUtc = Date.UTC(
    Number(t.jahr), Number(t.monat) - 1, Number(t.tag),
    Number(t.stunde), Number(t.minute), Number(t.sekunde),
  );
  return alsWaereEsUtc - zeitpunkt.getTime();
}

/**
 * Aus einer Formulareingabe („2026-09-19T14:00", deutsche Zeit) den
 * echten Zeitpunkt machen.
 *
 * Zweimal gerechnet: Der Versatz hängt selbst vom Zeitpunkt ab
 * (Sommer- oder Winterzeit). Die erste Rechnung liefert eine
 * Näherung, die zweite den richtigen Versatz für genau diesen Tag.
 * Ohne den zweiten Schritt läge ein Termin kurz nach der Zeitumstellung
 * um eine Stunde daneben.
 */
export function ausFormular(text: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text)) return null;
  const alsWaereEsUtc = new Date(`${text}:00Z`);
  if (Number.isNaN(alsWaereEsUtc.getTime())) return null;

  const naeherung = new Date(alsWaereEsUtc.getTime() - versatzMs(alsWaereEsUtc));
  return new Date(alsWaereEsUtc.getTime() - versatzMs(naeherung));
}

/** Für das Eingabefeld: echter Zeitpunkt → „2026-09-19T14:00" in deutscher Zeit. */
export function fuerFormular(zeitpunkt: Date | null): string {
  if (!zeitpunkt) return "";
  const t = deutscheTeile(zeitpunkt);
  return `${t.jahr}-${t.monat}-${t.tag}T${t.stunde}:${t.minute}`;
}

/** Nur das Datum in deutscher Zeit, z. B. „2026-09-19". */
export function alsIsoDatum(zeitpunkt: Date | null): string | null {
  if (!zeitpunkt) return null;
  const t = deutscheTeile(zeitpunkt);
  return `${t.jahr}-${t.monat}-${t.tag}`;
}

/** Nur die Uhrzeit in deutscher Zeit, z. B. „14:00". */
export function alsUhrzeit(zeitpunkt: Date | null): string | null {
  if (!zeitpunkt) return null;
  const t = deutscheTeile(zeitpunkt);
  return `${t.stunde}:${t.minute}`;
}

/** Lesbare Fassung für Listen im Adminbereich. */
export function alsLesbar(zeitpunkt: Date | null): string {
  if (!zeitpunkt) return "—";
  const t = deutscheTeile(zeitpunkt);
  return `${t.tag}.${t.monat}.${t.jahr}, ${t.stunde}:${t.minute}`;
}
