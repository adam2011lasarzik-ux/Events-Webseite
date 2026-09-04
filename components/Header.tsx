"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { VeraWortmarke } from "./VeraWortmarke";
import { Knopf } from "./Knopf";
import { zeigeSchulen } from "@/lib/navigation";
import type { Woerterbuch } from "@/content";
import stil from "./Header.module.css";

/**
 * `schulenSlugs` sind die Adressen der Events mit Schüler-Kategorie.
 * Sie kommen aus dem Layout, weil die Leiste selbst im Browser läuft
 * und dort keine Datenbank erreichbar ist.
 *
 * `schulenZeigen` übergeht die Pfad-Regel und wird nur von der
 * Admin-Vorschau gebraucht: Dort lautet die Adresse
 * „/admin/events/<kennung>/vorschau" und verrät das Event nicht — ohne
 * diese Vorgabe zeigte die Vorschau eine Leiste, die der echten Seite
 * nicht entspricht.
 */
export function Header({
  t,
  schulenSlugs,
  schulenZeigen,
}: {
  t: Woerterbuch;
  schulenSlugs: string[];
  schulenZeigen?: boolean;
}) {
  const [offen, setzeOffen] = useState(false);
  const pfad = usePathname() ?? "/";

  const punkte = [
    // Führt zur Übersicht mit ALLEN Veranstaltungen. Vorher zeigte der
    // Punkt fest auf ein einzelnes Event — wird das archiviert oder
    // gelöscht, landet der Besucher auf einer Fehlerseite.
    { href: "/", text: t.nav.events },
    ...((schulenZeigen ?? zeigeSchulen(pfad, schulenSlugs))
      ? [{ href: "/fuer-schulen", text: t.nav.schulen }]
      : []),
    { href: "/ueber-vera", text: t.nav.ueber },
    { href: "/faq", text: t.nav.faq },
    { href: "/kontakt", text: t.nav.kontakt },
  ];

  return (
    <header className={stil.kopf}>
      <div className={stil.innen}>
        <Link href="/" className={stil.markeLink} aria-label="VERA">
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
          <span className={stil.anmeldeKnopf}>
            <Knopf href="/anmeldung">{t.aktion.anmelden}</Knopf>
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
              <Knopf href="/anmeldung">{t.aktion.anmelden}</Knopf>
            </span>
          </nav>
        </div>
      )}
    </header>
  );
}
