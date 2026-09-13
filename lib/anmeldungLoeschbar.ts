/* ---------------------------------------------------------------
   Darf eine Anmeldung ENDGÜLTIG aus der Datenbank entfernt werden?

   Reine Funktion, kein Netzverkehr, keine Datenbank — dasselbe
   Vorgehen wie bei lib/storno.ts und lib/preise.ts. Die Regel lässt
   sich dadurch einzeln prüfen, ohne dass ein einziger echter
   Datensatz angefasst wird.

   Der Unterschied zum Anonymisieren (lib/adminDaten.ts →
   anonymisieren): Anonymisieren überschreibt Namen, E-Mail und
   Telefon, lässt aber Betrag und Datum für die Buchhaltung stehen —
   eine Stornierung ist keine Löschung. Diese Funktion beantwortet die
   davon getrennte, seltenere Frage: Darf die ganze Zeile weg, weil sie
   ohnehin nie eine echte Zahlung war? Das trifft nur auf Testbuchungen
   zu, die während einer Funktionsprüfung entstanden sind.

   Die Regel ist absichtlich streng — lieber einmal zu oft ablehnen als
   einmal eine echte Buchung verlieren:

     1. status === STORNIERT
        Nur bereits stornierte Buchungen. Eine laufende oder bestätigte
        Anmeldung wird hier nie angefasst.
     2. anonymisiertAm !== null
        Nur Buchungen, die bereits den ordentlichen Weg für das
        Löschrecht durchlaufen haben. Eine Zeile mit noch echtem Namen
        und echter E-Mail lehnt diese Funktion IMMER ab — selbst wenn
        sie unbezahlt und storniert ist.
     3. zahlungsStatus === OFFEN
        Niemals BEZAHLT, ERSTATTET oder TEILWEISE_ERSTATTET. Jede
        dieser drei Lagen bedeutet: hier ist wirklich Geld geflossen,
        und der Datensatz gehört zur Buchhaltung.
     4. zahlungsAbsicht === null
        Keine echte Zahlung beim Anbieter angestoßen wurde (die
        Kennung "pi_…" entsteht erst mit einer echten Zahlung).
     5. bezahlterBetragCents === null und bezahltAm === null
        Doppelt geprüft, was Punkt 3 und 4 bereits sagen — bewusst
        redundant, weil hier die letzte Instanz vor dem Löschen ist.
   --------------------------------------------------------------- */

export interface LoeschbarkeitsAngaben {
  status: "RESERVIERT" | "BESTAETIGT" | "WARTELISTE" | "STORNIERT";
  zahlungsStatus: "OFFEN" | "BEZAHLT" | "ERSTATTET" | "TEILWEISE_ERSTATTET";
  zahlungsAbsicht: string | null;
  bezahlterBetragCents: number | null;
  bezahltAm: Date | null;
  anonymisiertAm: Date | null;
}

export type LoeschAblehnungsgrund =
  | "nicht-storniert"
  | "nicht-anonymisiert"
  | "zahlung-vorhanden";

export type Loeschbarkeitsentscheidung =
  | { loeschbar: true }
  | { loeschbar: false; grund: LoeschAblehnungsgrund; erklaerung: string };

export function anmeldungLoeschbar(a: LoeschbarkeitsAngaben): Loeschbarkeitsentscheidung {
  if (a.status !== "STORNIERT") {
    return {
      loeschbar: false,
      grund: "nicht-storniert",
      erklaerung: "Nur bereits stornierte Buchungen dürfen entfernt werden.",
    };
  }
  if (a.anonymisiertAm === null) {
    return {
      loeschbar: false,
      grund: "nicht-anonymisiert",
      erklaerung:
        "Diese Buchung enthält noch echte Kontaktdaten. Erst anonymisieren " +
        "(Personendaten löschen), dann kann sie ganz entfernt werden.",
    };
  }
  const echteZahlung =
    a.zahlungsStatus !== "OFFEN" ||
    a.zahlungsAbsicht !== null ||
    a.bezahlterBetragCents !== null ||
    a.bezahltAm !== null;
  if (echteZahlung) {
    return {
      loeschbar: false,
      grund: "zahlung-vorhanden",
      erklaerung:
        "Für diese Buchung ist wirklich Geld geflossen oder eine Zahlung wurde " +
        "angestoßen. Sie gehört zur Buchhaltung und bleibt bestehen.",
    };
  }
  return { loeschbar: true };
}
