/* ---------------------------------------------------------------
   Passwörter sicher speichern und prüfen.

   Ein Passwort wird NIEMALS gespeichert, nur ein Hash davon. Wer die
   Datenbank in die Hände bekommt, hält damit keine Zugangsdaten,
   sondern nur Rechenarbeit.

   Warum scrypt aus Node und nicht bcrypt oder argon2:

   1. scrypt (RFC 7914) ist ein etabliertes, absichtlich langsames und
      speicherhungriges Verfahren — genau das, was Passwörter brauchen.
      Die Node-Dokumentation nennt es ausdrücklich für diesen Zweck.
   2. Es steckt bereits in Node. Das Projekt hat heute sechs
      Laufzeit-Abhängigkeiten; für etwas so Wichtiges wie Passwörter
      keine siebte aufzunehmen, ist ein Vorteil, kein Verzicht.
   3. argon2 und das schnelle bcrypt müssen beim Installieren
      übersetzt werden (C++). Auf einem geteilten Hosting-Paket wie
      Hostinger geht das oft schief. Was sich nicht installieren
      lässt, schützt niemanden.

   Der Hash wird als eine Zeile abgelegt:
       scrypt$<N>$<r>$<p>$<Salz base64>$<Hash base64>
   Die Parameter stehen mit drin, damit sich später stärkere Werte
   einführen lassen, ohne dass alte Passwörter ungültig werden.
   --------------------------------------------------------------- */

import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

/**
 * scrypt mit Rückruf in ein Versprechen verpacken.
 *
 * Von Hand statt mit promisify(): promisify kennt nur die Fassung
 * ohne Einstellungen, und ohne Einstellungen lassen sich weder
 * Rechenaufwand noch Speichergrenze angeben.
 */
function scryptAsync(
  passwort: string,
  salz: Buffer,
  laenge: number,
  optionen: ScryptOptions,
): Promise<Buffer> {
  return new Promise((fertig, fehler) => {
    scrypt(passwort, salz, laenge, optionen, (e, hash) =>
      e ? fehler(e) : fertig(hash as Buffer),
    );
  });
}

/** Rechenaufwand. Höher = sicherer und langsamer. */
const N = 16384;
const r = 8;
const p = 1;
const LAENGE = 64;
/**
 * scrypt braucht ungefähr 128 × N × r Bytes Arbeitsspeicher, hier also
 * rund 16 MB. Node bricht ohne diese Angabe mit „memory limit exceeded"
 * ab, weil die Voreinstellung darunter liegt.
 */
const speicher = 128 * N * r * 2;

/** Aus einem Passwort einen speicherbaren Hash machen. */
export async function hashen(passwort: string): Promise<string> {
  const salz = randomBytes(16);
  const hash = await scryptAsync(passwort.normalize("NFKC"), salz, LAENGE, {
    N,
    r,
    p,
    maxmem: speicher,
  });
  return ["scrypt", N, r, p, salz.toString("base64"), hash.toString("base64")].join("$");
}

/**
 * Stimmt das Passwort zum gespeicherten Hash?
 *
 * Der Vergleich läuft über timingSafeEqual und nicht über `===`. Ein
 * normaler Vergleich bricht beim ersten falschen Zeichen ab; aus den
 * Antwortzeiten liesse sich das Ergebnis Zeichen für Zeichen erraten.
 */
export async function passtPasswort(passwort: string, gespeichert: string): Promise<boolean> {
  const teile = gespeichert.split("$");
  if (teile.length !== 6 || teile[0] !== "scrypt") return false;

  const [, nText, rText, pText, salzText, hashText] = teile;
  const salz = Buffer.from(salzText, "base64");
  const erwartet = Buffer.from(hashText, "base64");
  const nZahl = Number(nText);
  const rZahl = Number(rText);

  if (!Number.isFinite(nZahl) || !Number.isFinite(rZahl) || erwartet.length === 0) return false;

  const berechnet = await scryptAsync(passwort.normalize("NFKC"), salz, erwartet.length, {
    N: nZahl,
    r: rZahl,
    p: Number(pText),
    maxmem: 128 * nZahl * rZahl * 2,
  });

  return berechnet.length === erwartet.length && timingSafeEqual(berechnet, erwartet);
}

/**
 * Mindestanforderungen an ein Admin-Passwort.
 *
 * Bewusst Länge statt Zeichenklassen-Zwang: „Sonnenblume-Kaffee-Regen"
 * ist deutlich schwerer zu erraten als „Pw1!x", und man kann es sich
 * merken. Erzwungene Sonderzeichen führen erfahrungsgemäß zu „Passwort1!"
 * und zu Zetteln am Bildschirm.
 */
export function passwortZuSchwach(passwort: string): string | null {
  if (passwort.length < 12) return "Das Passwort muss mindestens 12 Zeichen lang sein.";
  if (passwort.length > 200) return "Das Passwort ist zu lang.";
  if (/^\s|\s$/.test(passwort)) return "Das Passwort darf nicht mit einem Leerzeichen beginnen oder enden.";
  return null;
}
