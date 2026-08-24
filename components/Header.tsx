"use client";

import Link from "next/link";
import { useState } from "react";
import { VeraWortmarke } from "./VeraWortmarke";
import { Knopf } from "./Knopf";
import { pfad, type Sprache } from "@/lib/i18n";
import type { Woerterbuch } from "@/content";
import stil from "./Header.module.css";

export function Header({ sprache, t }: { sprache: Sprache; t: Woerterbuch }) {
  const [offen, setzeOffen] = useState(false);
  const andereSprache: Sprache = sprache === "de" ? "en" : "de";

  const punkte = [
    { href: pfad(sprache, "/events/padel-falkensee"), text: t.nav.event },
    { href: pfad(sprache, "/fuer-schulen"), text: t.nav.schulen },
    { href: pfad(sprache, "/ueber-vera"), text: t.nav.ueber },
    { href: pfad(sprache, "/faq"), text: t.nav.faq },
    { href: pfad(sprache, "/kontakt"), text: t.nav.kontakt },
  ];

  return (
    <header className={stil.kopf}>
      <div className={stil.innen}>
        <Link href={pfad(sprache)} className={stil.markeLink} aria-label="VERA">
          <VeraWortmarke groesse="klein" kurzAufKlein />
        </Link>

        <nav className={stil.menue} aria-label={t.nav.hauptmenue}>
          {punkte.map((p) => (
            <Link key={p.href} href={p.href}>
              {p.text}
            </Link>
          ))}
        </nav>

        <div className={stil.rechts}>
          <Link href={pfad(andereSprache)} className={stil.sprache} lang={andereSprache}>
            {andereSprache.toUpperCase()}
            <span className="nurVorlesen"> — {t.nav.spracheWechseln}</span>
          </Link>

          <span className={stil.anmeldeKnopf}>
            <Knopf href={pfad(sprache, "/anmeldung")}>{t.aktion.anmelden}</Knopf>
          </span>

          <button
            type="button"
            className={`${stil.schalter} ${offen ? stil.offen : ""}`}
            aria-expanded={offen}
            aria-controls="kopfmenue"
            onClick={() => setzeOffen((v) => !v)}
          >
            <span className="nurVorlesen">
              {offen ? t.nav.menueSchliessen : t.nav.menueOeffnen}
            </span>
            <span className={`${stil.balken} ${stil.balkenOben}`} aria-hidden="true" />
            <span className={`${stil.balken} ${stil.balkenMitte}`} aria-hidden="true" />
            <span className={`${stil.balken} ${stil.balkenUnten}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      {offen && (
        <div className={stil.klappe} id="kopfmenue">
          <nav className={stil.klappeInnen} aria-label={t.nav.hauptmenue}>
            {punkte.map((p) => (
              <Link key={p.href} href={p.href} onClick={() => setzeOffen(false)}>
                {p.text}
              </Link>
            ))}
            <span className={stil.klappeAktion}>
              <Knopf href={pfad(sprache, "/anmeldung")}>{t.aktion.anmelden}</Knopf>
            </span>
          </nav>
        </div>
      )}
    </header>
  );
}
