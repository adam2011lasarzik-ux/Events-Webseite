/* ---------------------------------------------------------------
   Die Regeln des Gründer-Formulars.

   Reine Funktionen: kein HTTP, keine Datenbank, keine Anzeige — nur
   Entscheidungen. Dieselbe Herangehensweise wie bei lib/preise.ts,
   lib/anmeldung.ts und lib/eventFormular.ts, damit sich jede Regel
   einzeln prüfen lässt.

   Warum diese Datei getrennt von der Server-Aktion liegt: Eine Datei
   mit "use server" darf ausschließlich async-Funktionen ausgeben. Ein
   dort ausgegebener Startzustand käme als `undefined` an — im Projekt
   bereits zweimal passiert.
   --------------------------------------------------------------- */

import type { Feldfehler } from "./eventFormular";

export type { Feldfehler };

export interface GruenderErgebnis {
  fehler: Feldfehler[];
  meldung?: string;
}

export const GRUENDER_STARTZUSTAND: GruenderErgebnis = { fehler: [] };

/** Vorgaben, solange noch nichts gespeichert wurde. */
export const GRUENDER_NAME_STANDARD = "Adam Lasarzik";
export const GRUENDER_ROLLE_STANDARD = "Gründer von VERA";

const MAX_NAME = 80;
const MAX_ROLLE = 80;
const MAX_TEXT = 1200;

export interface GruenderDaten {
  gruenderName: string;
  gruenderRolle: string;
  gruenderText: string | null;
  gruenderAufStart: boolean;
}

const sauber = (wert: string | undefined) => (wert ?? "").trim();

/**
 * Prüft die Eingaben und baut daraus die zu speichernden Daten.
 *
 * Liefert entweder Fehler ODER das Ergebnis, nie beides — der Aufrufer
 * kann also nicht versehentlich mit halbgültigen Daten weiterarbeiten.
 */
export function pruefeGruender(
  roh: Record<string, string>,
): { fehler: Feldfehler[] } | { fehler: null; daten: GruenderDaten } {
  const fehler: Feldfehler[] = [];

  const name = sauber(roh.gruenderName);
  if (!name) fehler.push({ feld: "gruenderName", text: "Der Name fehlt." });
  else if (name.length > MAX_NAME)
    fehler.push({ feld: "gruenderName", text: "Der Name ist zu lang." });

  const rolle = sauber(roh.gruenderRolle);
  if (!rolle) fehler.push({ feld: "gruenderRolle", text: "Die Bezeichnung fehlt." });
  else if (rolle.length > MAX_ROLLE)
    fehler.push({ feld: "gruenderRolle", text: "Die Bezeichnung ist zu lang." });

  const beschreibung = sauber(roh.gruenderText);
  if (beschreibung.length > MAX_TEXT)
    fehler.push({
      feld: "gruenderText",
      text: `Der Text ist zu lang (${beschreibung.length} Zeichen, erlaubt sind ${MAX_TEXT}).`,
    });

  if (fehler.length > 0) return { fehler };

  return {
    fehler: null,
    daten: {
      gruenderName: name,
      gruenderRolle: rolle,
      // Leer wird bewusst zu null statt zu "": So gibt es genau EINEN
      // Zustand für „noch nichts hinterlegt“, und die Anzeige muss
      // nicht zwei Fälle unterscheiden.
      gruenderText: beschreibung === "" ? null : beschreibung,
      gruenderAufStart: roh.gruenderAufStart === "an",
    },
  };
}
