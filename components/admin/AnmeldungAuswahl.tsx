"use client";

import { useMemo, useState } from "react";
import type { AnmeldungZurAuswahl } from "@/lib/loeschVorschau";
import stil from "@/app/admin/admin.module.css";

/**
 * Eine Anmeldung auswählen, ohne eine Kennung abzutippen.
 *
 * Vorher stand hier ein Textfeld für die Anmeldenummer. Das war im
 * Betrieb praktisch unbenutzbar: Man musste die Kennung erst in der
 * Datenbank oder in der Anmeldungsliste heraussuchen und dann
 * fehlerfrei übertragen — 25 Zeichen ohne Bedeutung.
 *
 * Jetzt: ein Suchfeld, das die Liste eingrenzt, und darunter die
 * Auswahl in Klartext. Gespeichert wird weiterhin die Kennung; die
 * Beschriftung ist reine Anzeige.
 *
 * OHNE JAVASCRIPT funktioniert das Formular weiterhin — dann zeigt
 * die Auswahl schlicht alle Anmeldungen, ungefiltert. Das Suchfeld
 * ist eine Erleichterung, keine Voraussetzung.
 */
export function AnmeldungAuswahl({
  anmeldungen,
  name,
}: {
  anmeldungen: AnmeldungZurAuswahl[];
  name: string;
}) {
  const [suche, setSuche] = useState("");

  const gefiltert = useMemo(() => {
    const s = suche.trim().toLowerCase();
    if (!s) return anmeldungen;
    // Jedes Wort muss vorkommen, Reihenfolge egal: So findet
    // "mustermann padel" dieselbe Zeile wie "padel mustermann".
    const woerter = s.split(/\s+/);
    return anmeldungen.filter((a) => {
      const text = a.beschriftung.toLowerCase();
      return woerter.every((w) => text.includes(w));
    });
  }, [anmeldungen, suche]);

  const offen = gefiltert.filter((a) => !a.anonymisiert);
  const anonym = gefiltert.filter((a) => a.anonymisiert);

  return (
    <div className={stil.feld}>
      <label className={stil.feld} htmlFor="anmeldung-suche">
        <span className={stil.feldLabel}>Anmeldung suchen</span>
        <input
          id="anmeldung-suche"
          type="search"
          className={stil.eingabe}
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          placeholder="Name, Veranstaltung oder E-Mail"
          autoComplete="off"
        />
        <span className={stil.feldHilfe}>
          Grenzt die Liste darunter ein. {gefiltert.length} von {anmeldungen.length}{" "}
          {anmeldungen.length === 1 ? "Anmeldung" : "Anmeldungen"} sichtbar.
        </span>
      </label>

      <label className={stil.feld} htmlFor="anmeldung-auswahl">
        <span className={stil.feldLabel}>Anmeldung</span>
        <select
          id="anmeldung-auswahl"
          name={name}
          className={stil.auswahl}
          required
          defaultValue=""
        >
          <option value="" disabled>
            — bitte auswählen —
          </option>

          {offen.length > 0 && (
            <optgroup label="Anmeldungen">
              {offen.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.beschriftung}
                  {a.bereitsGesperrt ? "  ·  bereits gesperrt" : ""}
                </option>
              ))}
            </optgroup>
          )}

          {/* Anonymisierte bleiben wählbar, aber deutlich abgesetzt.
              Sie wegzulassen wäre schlechter: Dann suchte man
              vergeblich nach einem Namen, den die Anmeldungsliste noch
              zeigt. Eine Sperre darauf ist nicht falsch, nur
              wirkungslos — die Personendaten sind schon überschrieben. */}
          {anonym.length > 0 && (
            <optgroup label="Bereits anonymisiert — eine Sperre wirkt hier nicht mehr">
              {anonym.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.beschriftung}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <span className={stil.feldHilfe}>
          Gespeichert wird die Anmeldenummer, angezeigt der Name.
        </span>
      </label>
    </div>
  );
}
