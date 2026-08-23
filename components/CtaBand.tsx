import { CourtLinien } from "./CourtGrafik";
import { Knopf } from "./Knopf";
import { pfad, type Sprache } from "@/lib/i18n";
import type { Woerterbuch } from "@/content";
import stil from "./CtaBand.module.css";

export function CtaBand({ sprache, t }: { sprache: Sprache; t: Woerterbuch }) {
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
        <Knopf href={pfad(sprache, "/anmeldung")} pfeil>
          {t.aktion.anmelden}
        </Knopf>
        <Knopf href={pfad(sprache, "/kontakt")} art="aufDunkel">
          {t.nav.kontakt}
        </Knopf>
      </div>
    </div>
  );
}
