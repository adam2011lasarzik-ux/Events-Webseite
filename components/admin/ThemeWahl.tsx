"use client";

import { THEME_LISTE, type Theme } from "@/lib/themes";
import stil from "@/app/admin/admin.module.css";
import wahl from "./ThemeWahl.module.css";

/**
 * Die Design-Auswahl als drei Vorschaukarten.
 *
 * Jede Karte trägt ihre eigenen Farben und ihre eigene Schrift — man
 * SIEHT die Wahl, statt sie zu lesen. Eine Klappliste mit drei Wörtern
 * wäre schneller gebaut gewesen, verlangt aber, dass man sich unter
 * „Premium" etwas vorstellt.
 *
 * Die Karten sind echte Auswahlknöpfe (`radio`) und keine anklickbaren
 * Kacheln: So funktioniert die Bedienung mit Tastatur und Screenreader
 * ohne Zusatzarbeit.
 */
export function ThemeWahl({
  standard,
  gewaehlt,
  setzeGewaehlt,
}: {
  standard: Theme;
  gewaehlt: Theme;
  setzeGewaehlt: (t: Theme) => void;
}) {
  return (
    <fieldset className={wahl.feld}>
      <legend className={stil.formGruppenTitel}>Design der Event-Seite</legend>
      <p className={stil.feldHilfe} style={{ marginBottom: "1rem" }}>
        Nur das Aussehen ändert sich. Texte, Preise, Plätze und die Anmeldung
        bleiben in jedem Design gleich — und lassen sich später jederzeit umstellen.
      </p>

      <div className={wahl.karten}>
        {THEME_LISTE.map((theme) => (
          <label
            key={theme.wert}
            className={wahl.karte}
            data-gewaehlt={gewaehlt === theme.wert ? "ja" : undefined}
          >
            <input
              type="radio"
              name="theme"
              value={theme.wert}
              checked={gewaehlt === theme.wert}
              onChange={() => setzeGewaehlt(theme.wert)}
              className={wahl.knopf}
            />

            {/* Die Probe zeigt die echten Farben und die echte Schrift
                des Themes — nicht eine nachgebaute Ahnung davon. */}
            <span
              className={wahl.probe}
              aria-hidden="true"
              style={{ background: theme.vorschau.grund, color: theme.vorschau.text }}
            >
              <span className={wahl.probeTitel} style={{ fontFamily: theme.vorschau.schrift }}>
                {theme.name}
              </span>
              <span className={wahl.probeZeile} />
              <span className={wahl.probeZeile} style={{ width: "60%" }} />
              <span className={wahl.probeKnopf} style={{ background: theme.vorschau.akzent }} />
            </span>

            <span className={wahl.name}>
              {theme.name}
              {theme.wert === standard && <span className={wahl.jetzt}>aktuell</span>}
            </span>
            <span className={wahl.kurz}>{theme.kurz}</span>
            <span className={wahl.passtZu}>Passt zu: {theme.passtZu}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
