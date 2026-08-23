import { alsEuro } from "@/lib/preise";
import { fuelle, type Sprache } from "@/lib/i18n";
import type { VeraEvent } from "@/content/events";
import type { Woerterbuch } from "@/content";
import stil from "./PreisKacheln.module.css";

export function PreisKacheln({
  sprache,
  t,
  event,
}: {
  sprache: Sprache;
  t: Woerterbuch;
  event: VeraEvent;
}) {
  const { preise } = event;
  const familie = preise.familie;

  return (
    <>
      <div className={stil.raster}>
        <div className={`${stil.kachel} ${stil.tonSchueler}`}>
          <span className={stil.ball} aria-hidden="true" />
          <div>
            <div className={stil.name}>{t.preise.schueler}</div>
            <div className={stil.hinweis}>{t.preise.schuelerHinweis}</div>
          </div>
          <div className={stil.betragZeile}>
            <span className={stil.betrag}>{alsEuro(preise.schuelerCents, sprache)}</span>
            <span className={stil.ab}>{t.preise.proPerson}</span>
          </div>
        </div>

        <div className={`${stil.kachel} ${stil.tonErwachsen}`}>
          <span className={stil.ball} aria-hidden="true" />
          <div>
            <div className={stil.name}>{t.preise.erwachsener}</div>
            <div className={stil.hinweis}>{t.preise.erwachsenerHinweis}</div>
          </div>
          <div className={stil.betragZeile}>
            <span className={stil.betrag}>{alsEuro(preise.erwachsenerCents, sprache)}</span>
            <span className={stil.ab}>{t.preise.proPerson}</span>
          </div>
        </div>

        {familie && (
          <div className={`${stil.kachel} ${stil.tonFamilie}`}>
            <span className={stil.ball} aria-hidden="true" />
            <div>
              <div className={stil.name}>{t.preise.familie}</div>
              <div className={stil.hinweis}>{t.preise.familieHinweis}</div>
            </div>
            <div className={stil.betragZeile}>
              <div>
                <span className={stil.abOben}>{t.preise.ab}</span>
                <span className={stil.betrag}>{alsEuro(familie.basisCents, sprache)}</span>
              </div>
            </div>
            <div className={stil.zusatz}>
              {fuelle(t.preise.familieZusatz, {
                betrag: alsEuro(familie.weitererSchuelerCents, sprache),
              })}
            </div>
          </div>
        )}
      </div>

      <p className={stil.mwst}>{t.preise.einleitung}</p>
    </>
  );
}
