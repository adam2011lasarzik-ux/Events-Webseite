"use client";

import { useState } from "react";
import stil from "@/app/admin/admin.module.css";

/**
 * Die technische Kennung klein anzeigen — und kopierbar machen.
 *
 * Die Kennung gehört nicht in den Vordergrund: Wer auf die Seite
 * sieht, will Namen lesen. Ganz weglassen geht aber nicht — sie ist
 * das, was man braucht, um einen Datensatz in der Datenbank oder in
 * einem anderen Bereich wiederzufinden.
 *
 * Also klein, gedämpft, mit einem Knopf zum Kopieren. Ohne
 * JavaScript bleibt die Kennung sichtbar und lässt sich von Hand
 * markieren; nur der Knopf fehlt dann.
 */
export function KennungKopieren({ kennung }: { kennung: string }) {
  const [kopiert, setKopiert] = useState(false);

  async function kopieren() {
    try {
      await navigator.clipboard.writeText(kennung);
      setKopiert(true);
      // Nach zwei Sekunden zurücksetzen, damit der Knopf nicht
      // dauerhaft "Kopiert" behauptet und beim nächsten Mal niemand
      // weiß, ob es geklappt hat.
      setTimeout(() => setKopiert(false), 2000);
    } catch {
      /* Zwischenablage verweigert (ältere Browser, kein HTTPS).
         Dann bleibt die Kennung sichtbar und von Hand markierbar —
         kein Grund, eine Fehlermeldung zu zeigen. */
    }
  }

  return (
    <span className={stil.kennung}>
      <code>{kennung}</code>
      <button
        type="button"
        onClick={kopieren}
        className={stil.kennungKnopf}
        aria-label={`Kennung ${kennung} kopieren`}
      >
        {kopiert ? "Kopiert" : "Kopieren"}
      </button>
    </span>
  );
}
