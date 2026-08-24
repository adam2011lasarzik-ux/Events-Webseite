import { Platzhalter } from "./Platzhalter";
import type { Woerterbuch } from "@/content";
import stil from "./FormularVorschau.module.css";

export interface VorschauFeldGruppe {
  titel: string;
  felder: string[];
}

/**
 * Zeigt, welche Angaben ein Anmeldeformular später abfragen wird —
 * rein optisch. Jedes Feld ist bewusst `disabled`: nichts lässt sich
 * eintippen, nichts wird abgeschickt oder gespeichert.
 */
export function FormularVorschau({
  t,
  gruppen,
}: {
  t: Woerterbuch;
  gruppen: VorschauFeldGruppe[];
}) {
  return (
    <div className={stil.box}>
      <div className={stil.kopf}>
        <span className={stil.titel}>
          <Platzhalter
            text={t.anmeldung.vorschau.ueberschrift}
            markierung={t.platzhalter.markierung}
          />
        </span>
      </div>
      <p className={stil.hinweis}>{t.anmeldung.vorschau.hinweis}</p>

      <div className={stil.gruppen}>
        {gruppen.map((gruppe) => (
          <div key={gruppe.titel} className={stil.gruppe}>
            <span className={stil.gruppenTitel}>{gruppe.titel}</span>
            <div className={stil.felder}>
              {gruppe.felder.map((feldName) => (
                <label key={feldName} className={stil.feld}>
                  <span className={stil.label}>{feldName}</span>
                  <input className={stil.eingabe} type="text" disabled aria-disabled="true" />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Kurzform, aus Platzhalter-Bausteinen die üblichen Feldnamen zu bauen. */
export function feldnamen(t: Woerterbuch) {
  return {
    vorname: t.anmeldung.vorschau.labelVorname,
    nachname: t.anmeldung.vorschau.labelNachname,
    email: t.anmeldung.vorschau.labelEmail,
    telefon: t.anmeldung.vorschau.labelTelefon,
  };
}
