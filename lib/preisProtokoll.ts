/* ---------------------------------------------------------------
   Preis-Änderungsprotokoll: reine Logik.

   Getrennt von der Server-Aktion, damit sie ohne HTTP und ohne
   Datenbank einzeln prüfbar ist (dieselbe Herangehensweise wie
   lib/preise.ts). Die Aktion app/admin/events/aktion.ts ruft diese
   Funktionen auf und schreibt das Ergebnis als PreisAenderung-Zeilen.

   Die Schlüssel entsprechen den Posten-Bezeichnungen aus
   lib/preise.ts: schueler, erwachsener, familieBasis,
   familieWeitererSchueler.
   --------------------------------------------------------------- */

export interface PreisStand {
  schueler: number | null;
  erwachsener: number | null;
  familieBasis: number | null;
  familieWeitererSchueler: number | null;
}

export interface PreisAenderungEintrag {
  ticketart: string;
  altCents: number | null;
  neuCents: number | null;
}

/** Zieht aus einem Event(-Datensatz) die vier Ticketpreise. */
export function alsPreisStand(e: {
  preisSchuelerCents: number | null;
  preisErwachsenerCents: number;
  familieBasisCents: number | null;
  familieWeitererSchuelerCents: number | null;
}): PreisStand {
  return {
    schueler: e.preisSchuelerCents,
    erwachsener: e.preisErwachsenerCents,
    familieBasis: e.familieBasisCents,
    familieWeitererSchueler: e.familieWeitererSchuelerCents,
  };
}

/**
 * Liefert je GEÄNDERTER Ticketart einen Protokolleintrag (alt→neu).
 *
 * `alt === null` bedeutet „kein Vorzustand" (neues Event): dann werden
 * die Anfangspreise als alt=null erfasst. Ein unverändertes Feld
 * erzeugt KEINEN Eintrag — sonst stünde bei jedem Textedit die ganze
 * Preisliste erneut im Protokoll.
 */
export function preisAenderungen(
  alt: PreisStand | null,
  neu: PreisStand,
): PreisAenderungEintrag[] {
  const arten: (keyof PreisStand)[] = [
    "schueler",
    "erwachsener",
    "familieBasis",
    "familieWeitererSchueler",
  ];
  const liste: PreisAenderungEintrag[] = [];
  for (const art of arten) {
    const a = alt ? alt[art] : null;
    const n = neu[art];
    if (a !== n) liste.push({ ticketart: art, altCents: a, neuCents: n });
  }
  return liste;
}
