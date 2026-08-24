import Link from "next/link";
import { VeraWortmarke } from "./VeraWortmarke";
import { fuelle } from "@/lib/formate";
import type { Woerterbuch } from "@/content";
import stil from "./Footer.module.css";

export function Footer({ t }: { t: Woerterbuch }) {
  const jahr = new Date().getFullYear();

  return (
    <footer className={`${stil.fuss} aufDunkel`}>
      <div className={stil.innen}>
        <div className={stil.raster}>
          <div>
            <VeraWortmarke groesse="mittel" />
            <p className={stil.claim}>{t.footer.claim}</p>
          </div>

          <div className={stil.spalte}>
            <h3>{t.footer.seiten}</h3>
            <ul className={stil.liste}>
              <li><Link href={"/events/padel-falkensee"}>{t.nav.event}</Link></li>
              <li><Link href={"/anmeldung"}>{t.aktion.anmelden}</Link></li>
              <li><Link href={"/fuer-schulen"}>{t.nav.schulen}</Link></li>
              <li><Link href={"/ueber-vera"}>{t.nav.ueber}</Link></li>
              <li><Link href={"/faq"}>{t.nav.faq}</Link></li>
            </ul>
          </div>

          <div className={stil.spalte}>
            <h3>{t.footer.kontaktUeberschrift}</h3>
            <ul className={stil.liste}>
              <li><Link href={"/kontakt"}>{t.nav.kontakt}</Link></li>
              <li><span>{t.platzhalter.email}</span></li>
              <li><span>Falkensee</span></li>
            </ul>
          </div>

          <div className={stil.spalte}>
            <h3>{t.footer.rechtliches}</h3>
            <ul className={stil.liste}>
              <li><Link href={"/impressum"}>{t.recht.impressum}</Link></li>
              <li><Link href={"/datenschutz"}>{t.recht.datenschutz}</Link></li>
            </ul>
          </div>
        </div>

        <div className={stil.grosseMarke} aria-hidden="true">
          <VeraWortmarke groesse="gross" />
        </div>

        <p className={stil.abschluss}>{fuelle(t.footer.rechte, { jahr })}</p>
      </div>
    </footer>
  );
}
