import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { Platzhalter } from "@/components/Platzhalter";
import { texte } from "@/content";
import stil from "@/components/Textseite.module.css";

export const metadata: Metadata = { title: texte.recht.impressumTitel };

/**
 * Impressum nach § 5 DDG.
 *
 * Alle Angaben kommen aus `texte.anbieter` — der einzigen Stelle, an
 * der sie stehen. Was dort `null` ist, erscheint hier sichtbar als
 * Platzhalter, statt still zu fehlen oder erfunden zu werden.
 *
 * Bewusst NICHT auf dieser Seite: ein Banner „diese Seite ist noch
 * nicht ausgefüllt". Das Impressum ist der Aufbau, den es dauerhaft
 * behält; unfertig sind nur die beiden markierten Felder.
 *
 * Ebenfalls bewusst nicht enthalten: eine
 * Umsatzsteuer-Identifikationsnummer (es ist ungeklärt, ob eine
 * vorliegt — eine erfundene wäre schlimmer als keine) und der Link
 * zur EU-Streitschlichtungsplattform (die ist eingestellt, der
 * Standardbaustein zeigt ins Leere).
 */
export default function Seite() {
  const t = texte;
  const a = t.anbieter;
  const marke = t.platzhalter.markierung;

  return (
    <Abschnitt>
      <AbschnittKopf titel={t.recht.impressumTitel} haupt />
      <div className={stil.inhalt}>
        <p>{t.recht.impressumAngaben}</p>

        <p>
          {a.markeHinweis}
          <br />
          <strong>{a.name}</strong>
        </p>

        <p>
          <strong>{t.recht.impressumAnschrift}</strong>
          <br />
          {a.anschrift ?? <Platzhalter text={a.anschriftFolgt} markierung={marke} />}
        </p>

        <p>
          <strong>{t.recht.impressumKontakt}</strong>
          <br />
          {t.kontakt.email}: {a.email}
          <br />
          {t.kontakt.telefon}: {a.telefon ?? <Platzhalter text={a.telefonFolgt} markierung={marke} />}
        </p>

        <p>
          <strong>{t.recht.impressumUmsatzsteuer}</strong>
          <br />
          {a.umsatzsteuer}
        </p>

        <p>{t.recht.hinweisJurist}</p>
        <p>{t.recht.keineCookies}</p>
      </div>
    </Abschnitt>
  );
}
