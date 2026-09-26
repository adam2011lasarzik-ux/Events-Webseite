"use server";

/* ---------------------------------------------------------------
   Eine Fehlbuchung von Hand als geklärt abhaken.

   Eine Fehlbuchung ist eingegangenes Geld, aus dem keine Anmeldung
   geworden ist. Vier der fünf Gründe erstatten von selbst und
   verschwinden damit aus der Warnung. Einer nicht:
   `betrag-abweichend` wird ABSICHTLICH nicht automatisch
   zurückgebucht — ein abweichender Betrag ist entweder ein Fehler
   oder ein Angriff, und beides gehört angesehen.

   Ohne diese Aktion hätte eine solche Zeile keinen Weg, jemals wieder
   aus der Warnung zu verschwinden. Sie stünde für immer da, auch wenn
   der Vorgang längst im Dashboard des Anbieters geklärt ist. Eine
   Warnung, die immer dasteht, wird nach zwei Wochen nicht mehr
   gelesen — und ist dann schlimmer als keine.

   ── Was dieses Abhaken NICHT tut ────────────────────────────────

   Es löscht nichts. Die Zeile bleibt mit Betrag, Grund, Zeitpunkt und
   Sitzungskennung vollständig stehen und erscheint weiterhin in der
   Rückschau auf der Übersichtsseite. Sie wird nur nicht mehr
   angemahnt.

   Es erstattet auch nichts. Wer Geld zurückgeben will, tut das im
   Dashboard des Anbieters; die Rückmeldung darüber landet ohnehin
   hier. Ein Knopf, der beides zugleich täte, würde die Frage „ist das
   Geld zurück?" mit „jemand hat draufgedrückt" beantworten.
   --------------------------------------------------------------- */

import { revalidatePath } from "next/cache";
import { verlangeAdmin } from "@/lib/adminAuth";
import { protokolliere, PROTOKOLL_AKTIONEN } from "@/lib/adminProtokoll";
import { erledigtVermerken } from "@/lib/anmeldungAnlegen";

/** Länge, ab der der Vermerk gekürzt wird. */
const NOTIZ_MAX = 300;

function text(wert: FormDataEntryValue | null): string {
  return typeof wert === "string" ? wert.trim() : "";
}

export async function fehlbuchungErledigen(formular: FormData): Promise<void> {
  /* Prüft selbst, ob jemand angemeldet ist. Eine Server-Aktion ist
     über das Netz erreichbar wie jede andere Adresse und läuft an
     jedem Layout vorbei. */
  const admin = await verlangeAdmin();

  const sitzungId = text(formular.get("sitzungId"));
  if (!sitzungId) return;

  const notiz = text(formular.get("notiz")).slice(0, NOTIZ_MAX) || null;

  const abgehakt = await erledigtVermerken(sitzungId, admin.id, notiz);

  /* Nur protokollieren, wenn wirklich etwas geschehen ist. Ein
     zweiter Klick auf denselben Knopf — zwei offene Fenster, ein
     Doppeltipp auf dem Handy — soll keinen zweiten Eintrag erzeugen,
     der aussieht, als hätten zwei Menschen entschieden. */
  if (abgehakt) {
    await protokolliere({
      adminId: admin.id,
      aktion: PROTOKOLL_AKTIONEN.fehlbuchungErledigt,
      zielArt: "Fehlbuchung",
      zielId: sitzungId,
      detail: notiz ?? "ohne Vermerk",
    });
  }

  revalidatePath("/admin");
}
