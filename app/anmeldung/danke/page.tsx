import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { Knopf } from "@/components/Knopf";
import { db } from "@/lib/db";
import { alsEuro } from "@/lib/preise";
import { texte } from "@/content";
import stil from "@/components/Textseite.module.css";

export const metadata: Metadata = { title: texte.danke.ueberschrift };

/**
 * Bestätigung nach dem Absenden.
 *
 * Bewusst ehrlich formuliert: Es wird keine Bestätigungsmail
 * versprochen, die es noch nicht gibt, und keine Bezahlung
 * vorgetäuscht. Beides kommt in späteren Schritten.
 *
 * Die Seite liest bei jedem Aufruf frisch aus der Datenbank — eine
 * gerade eben entstandene Anmeldung muss sofort sichtbar sein.
 */
export const dynamic = "force-dynamic";

export default async function DankeSeite({
  searchParams,
}: {
  searchParams: Promise<{ nr?: string }>;
}) {
  const { nr } = await searchParams;
  const t = texte;

  const anmeldung = nr
    ? await db.registration.findUnique({
        where: { id: nr },
        include: { event: true, teilnehmer: true },
      })
    : null;

  if (!anmeldung) {
    return (
      <Abschnitt>
        <AbschnittKopf titel={t.danke.nichtGefunden} haupt />
        <div style={{ marginTop: "2rem" }}>
          <Knopf href="/" art="zweit" pfeil>
            {t.aktion.zurueck}
          </Knopf>
        </div>
      </Abschnitt>
    );
  }

  return (
    <Abschnitt>
      <AbschnittKopf titel={t.danke.ueberschrift} haupt einleitung={t.danke.einleitung} />

      <dl className={stil.punkte} style={{ marginTop: "2rem" }}>
        <div>
          <dt><strong>{t.danke.nummer}:</strong></dt>
          <dd style={{ margin: 0, fontFamily: "var(--schrift-display)" }}>{anmeldung.id}</dd>
        </div>
        <div>
          <dt><strong>{t.danke.veranstaltung}:</strong></dt>
          <dd style={{ margin: 0 }}>{anmeldung.event.titel}</dd>
        </div>
        <div>
          <dt><strong>{t.danke.personen}:</strong></dt>
          <dd style={{ margin: 0 }}>
            {anmeldung.teilnehmer.map((p) => `${p.vorname} ${p.nachname}`).join(", ")}
          </dd>
        </div>
        <div>
          <dt><strong>{t.danke.betrag}:</strong></dt>
          <dd style={{ margin: 0 }}>
            {alsEuro(anmeldung.gesamtpreisCents)} — {t.danke.zahlungOffen}
          </dd>
        </div>
      </dl>

      <div className={stil.inhalt} style={{ marginTop: "2rem" }}>
        <h2 style={{ fontSize: "var(--gr-xl)" }}>{t.danke.zahlungTitel}</h2>
        <p>{t.danke.zahlungText}</p>
        <h2 style={{ fontSize: "var(--gr-xl)" }}>{t.danke.emailTitel}</h2>
        <p>{t.danke.emailText}</p>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <Knopf href="/" art="zweit" pfeil>
          {t.aktion.zurueck}
        </Knopf>
      </div>
    </Abschnitt>
  );
}
