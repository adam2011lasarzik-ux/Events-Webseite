import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { Knopf } from "@/components/Knopf";
import { db } from "@/lib/db";
import { alsEuro } from "@/lib/preise";
import { RESERVIERUNG_MINUTEN } from "@/lib/plaetze";
import { sitzungPruefen } from "@/lib/zahlung";
import { betragPasst } from "@/lib/zahlungRegeln";
import { zahlungStarten } from "../zahlung";
import { texte } from "@/content";
import stil from "@/components/Textseite.module.css";

export const metadata: Metadata = { title: texte.danke.ueberschrift };

/**
 * Bestätigung nach dem Absenden.
 *
 * Die Seite liest bei jedem Aufruf frisch aus der Datenbank — eine
 * gerade eben entstandene Anmeldung muss sofort sichtbar sein.
 */
export const dynamic = "force-dynamic";

/**
 * Nach der Rückkehr von der Bezahlseite beim ANBIETER nachfragen.
 *
 * Nicht der Adresszeile glauben: „…?zahlung=zurueck" kann jeder selbst
 * eintippen. Diese Nachfrage geht vom Server direkt zum Anbieter und
 * ist damit ein echter Nachweis.
 *
 * Die maßgebliche Quelle bleibt trotzdem die Rückmeldung an
 * app/zahlung/rueckmeldung — sie kommt auch dann an, wenn der Besucher
 * den Tab schließt. Diese Nachfrage schließt nur die Lücke von
 * wenigen Sekunden dazwischen.
 */
async function standAbgleichen(anmeldungId: string): Promise<void> {
  const anmeldung = await db.registration.findUnique({ where: { id: anmeldungId } });
  if (!anmeldung || anmeldung.zahlungsStatus === "BEZAHLT") return;
  if (!anmeldung.zahlungsReferenz) return;

  try {
    const stand = await sitzungPruefen(anmeldung.zahlungsReferenz);
    if (!stand.bezahlt) return;
    if (!betragPasst(stand.betragCents, anmeldung.gesamtpreisCents)) return;

    await db.registration.update({
      where: { id: anmeldung.id },
      data: {
        status: "BESTAETIGT",
        reserviertBis: null,
        zahlungsStatus: "BEZAHLT",
        zahlungsWeg: "ONLINE",
        bezahlterBetragCents: stand.betragCents,
        bezahltAm: new Date(),
      },
    });
  } catch (e) {
    // Kein Drama: Die Rückmeldung des Anbieters erledigt es ohnehin.
    console.error("Nachfrage beim Zahlungsanbieter fehlgeschlagen:", e);
  }
}

export default async function DankeSeite({
  searchParams,
}: {
  searchParams: Promise<{ nr?: string; zahlung?: string }>;
}) {
  const { nr, zahlung } = await searchParams;
  const t = texte;

  // Nur bei der Rückkehr von der Bezahlseite nachfragen — nicht bei
  // jedem Seitenaufruf.
  if (nr && zahlung === "zurueck") await standAbgleichen(nr);

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

  const bezahlt = anmeldung.zahlungsStatus === "BEZAHLT";
  const kostenlos = anmeldung.gesamtpreisCents <= 0;
  const offen = !bezahlt && !kostenlos && anmeldung.status !== "STORNIERT";

  /* Welche Erklärung unter dem Betrag steht. Bewusst ehrlich: Solange
     die Zahlung nicht bestätigt ist, wird sie nicht als erledigt
     dargestellt. */
  const lage = bezahlt
    ? { titel: t.danke.zahlungBezahlt, text: t.danke.zahlungBezahltText }
    : zahlung === "zurueck"
      ? { titel: t.danke.zahlungLaeuft, text: t.danke.zahlungLaeuftText }
      : zahlung === "abgebrochen"
        ? { titel: t.danke.zahlungReserviert, text: t.danke.zahlungAbgebrochen }
        : zahlung === "nicht-eingerichtet"
          ? { titel: t.danke.zahlungTitel, text: t.danke.zahlungFehlerEingerichtet }
          : zahlung === "anbieter"
            ? { titel: t.danke.zahlungTitel, text: t.danke.zahlungFehlerAnbieter }
            : {
                titel: t.danke.zahlungReserviert,
                text: t.danke.zahlungReserviertText.replace(
                  "{minuten}",
                  String(RESERVIERUNG_MINUTEN),
                ),
              };

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
            {alsEuro(anmeldung.gesamtpreisCents)}
            {!bezahlt && !kostenlos && ` — ${t.danke.zahlungOffen}`}
          </dd>
        </div>
      </dl>

      <div className={stil.inhalt} style={{ marginTop: "2rem" }}>
        <h2 style={{ fontSize: "var(--gr-xl)" }}>{lage.titel}</h2>
        <p>{lage.text}</p>
        {!bezahlt && !kostenlos && <p>{t.danke.zahlungText}</p>}

        {offen && (
          <form action={zahlungStarten} style={{ marginTop: "1.5rem" }}>
            <input type="hidden" name="anmeldungId" value={anmeldung.id} />
            <button type="submit" className={stil.zahlKnopf}>
              {t.danke.zahlungKnopf}
            </button>
            <span className={stil.zahlWege}>{t.danke.zahlungWege}</span>
          </form>
        )}

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
