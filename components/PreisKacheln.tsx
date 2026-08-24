import { alsEuro } from "@/lib/preise";
import { fuelle } from "@/lib/formate";
import type { VeraEvent } from "@/content/events";
import type { Woerterbuch } from "@/content";
import stil from "./PreisKacheln.module.css";

export function PreisKacheln({
  t,
  event,
}: {
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
            <span className={stil.betrag}>{alsEuro(preise.schuelerCents)}</span>
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
            <span className={stil.betrag}>{alsEuro(preise.erwachsenerCents)}</span>
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
                <span className={stil.betrag}>{alsEuro(familie.basisCents)}</span>
              </div>
            </div>
            <div className={stil.zusatz}>
              {fuelle(t.preise.familieZusatz, {
                betrag: alsEuro(familie.weitererSchuelerCents),
              })}
            </div>
          </div>
        )}
      </div>

      <p className={stil.mwst}>{t.preise.einleitung}</p>
    </>
  );
}
