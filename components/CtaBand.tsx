import { CourtLinien } from "./CourtGrafik";
import { Knopf } from "./Knopf";
import type { Woerterbuch } from "@/content";
import stil from "./CtaBand.module.css";

export function CtaBand({ t }: { t: Woerterbuch }) {
  return (
    <div className={`${stil.band} aufDunkel`}>
      <div className={stil.courtEcke} aria-hidden="true">
        <CourtLinien />
      </div>
      <div>
        <h2 className={stil.titel}>{t.cta.ueberschrift}</h2>
        <p className={stil.text}>{t.cta.text}</p>
      </div>
      <div className={stil.knoepfe}>
        <Knopf href={"/anmeldung"} pfeil>
          {t.aktion.anmelden}
        </Knopf>
        <Knopf href={"/kontakt"} art="aufDunkel">
          {t.nav.kontakt}
        </Knopf>
      </div>
    </div>
  );
}
