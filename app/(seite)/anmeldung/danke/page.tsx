import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { Knopf } from "@/components/Knopf";
import { db } from "@/lib/db";
import { alsEuro } from "@/lib/preise";
import { fuelle } from "@/lib/formate";
import { sitzungPruefen } from "@/lib/zahlung";
import { betragPasst } from "@/lib/zahlungRegeln";
import { zahlungStarten } from "../zahlung";
import { texte } from "@/content";
import stil from "@/components/Textseite.module.css";

/**
 * Die Seite nach der Bezahlung — mit ZWEI klar getrennten Gesichtern.
 *
 * Für den Besucher gibt es genau zwei Zustände:
 *   bezahlt        → die Anmeldung ist bestätigt
 *   nicht bezahlt  → die Anmeldung ist NICHT abgeschlossen
 *
 * Eine Zwischenbestätigung („Danke, wir haben deine Anmeldung") vor
 * der Bezahlung wäre irreführend: Sie klingt nach fertig, obwohl noch
 * nichts fest ist. Die 30-Minuten-Reservierung ist eine technische
 * Sicherung während des Bezahlens, keine Anmeldung und keine
 * Warteliste — und wird hier auch nicht so genannt.
 *
 * Die Seite liest bei jedem Aufruf frisch aus der Datenbank.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ nr?: string }>;
}): Promise<Metadata> {
  const { nr } = await searchParams;
  // Die Adresse trägt eine unratbare, aber keine geheime Kennung — der
  // Besucher braucht sie, um ohne Konto zu seiner Zahlung zurückzufinden.
  // Eine unratbare Adresse ist trotzdem kein Zugriffsschutz: Gelangt sie
  // nach außen, darf sie nicht in einer Suchmaschine landen.
  const robots: Metadata["robots"] = { index: false, follow: false };
  if (!nr) return { title: texte.danke.offenTitel, robots };
  const anmeldung = await db.registration.findUnique({
    where: { id: nr },
    select: { zahlungsStatus: true, gesamtpreisCents: true },
  });
  const bezahlt =
    anmeldung?.zahlungsStatus === "BEZAHLT" || (anmeldung?.gesamtpreisCents ?? 1) <= 0;
  return { title: bezahlt ? texte.danke.bezahltTitel : texte.danke.offenTitel, robots };
}

/**
 * Nach der Rückkehr von der Bezahlseite beim ANBIETER nachfragen.
 *
 * Nicht der Adresszeile glauben: „…?zahlung=zurueck" kann jeder selbst
 * eintippen. Diese Nachfrage geht vom Server direkt zum Anbieter und
 * ist damit ein echter Nachweis.
 *
 * Die maßgebliche Quelle bleibt trotzdem die Rückmeldung an
 * app/zahlung/rueckmeldung — sie kommt auch dann an, wenn der Besucher
 * den Tab schließt. Diese Nachfrage schließt nur die Lücke von wenigen
 * Sekunden dazwischen.
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

export default async function AbschlussSeite({
  searchParams,
}: {
  searchParams: Promise<{ nr?: string; zahlung?: string; frei?: string }>;
}) {
  const { nr, zahlung, frei } = await searchParams;
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

  const personen = anmeldung.teilnehmer.length;
  const mehrere = personen > 1;
  const kostenlos = anmeldung.gesamtpreisCents <= 0;
  const bezahlt = anmeldung.zahlungsStatus === "BEZAHLT" || kostenlos;
  const storniert = anmeldung.status === "STORNIERT";
  const abgelaufen =
    !bezahlt &&
    anmeldung.status === "RESERVIERT" &&
    anmeldung.reserviertBis !== null &&
    anmeldung.reserviertBis <= new Date();

  /* Es hat gar nicht erst zur Bezahlseite gereicht: zu wenige Plätze.
     Dann ist die Anmeldung nicht zustande gekommen, und ein Knopf
     „Jetzt bezahlen" wäre eine Einladung ins Leere. */
  const keinePlaetze = zahlung === "keine-plaetze";
  const freiZahl = Number(frei ?? "0");

  const zeigtBezahlknopf = !bezahlt && !storniert && !keinePlaetze;

  const titel = bezahlt ? t.danke.bezahltTitel : t.danke.offenTitel;

  const einleitung = bezahlt
    ? mehrere
      ? t.danke.bezahltEinleitungMehrere
      : t.danke.bezahltEinleitung
    : t.danke.offenEinleitung;

  /* Die Erklärung unter dem Betrag. Bewusst ehrlich: Solange die
     Zahlung nicht bestätigt ist, wird sie nicht als erledigt
     dargestellt. */
  const lage = bezahlt
    ? { titel: t.danke.zahlungBezahlt, text: t.danke.zahlungBezahltText }
    : keinePlaetze
      ? {
          titel: t.danke.zahlungTitel,
          text:
            freiZahl === 0
              ? t.danke.zahlungAusgebucht
              : fuelle(t.danke.zahlungKeinePlaetze, { frei: freiZahl, personen }),
        }
      : abgelaufen
        ? { titel: t.danke.zahlungAbgelaufen, text: t.danke.zahlungAbgelaufenText }
        : zahlung === "zurueck"
          ? { titel: t.danke.zahlungLaeuft, text: t.danke.zahlungLaeuftText }
          : zahlung === "abgebrochen"
            ? { titel: t.danke.zahlungReserviert, text: t.danke.zahlungAbgebrochen }
            : zahlung === "nicht-eingerichtet"
              ? { titel: t.danke.zahlungTitel, text: t.danke.zahlungFehlerEingerichtet }
              : zahlung === "anbieter"
                ? { titel: t.danke.zahlungTitel, text: t.danke.zahlungFehlerAnbieter }
                : { titel: t.danke.zahlungReserviert, text: t.danke.zahlungReserviertText };

  return (
    <Abschnitt>
      <AbschnittKopf titel={titel} haupt einleitung={einleitung} />

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
            {!bezahlt && ` — ${t.danke.zahlungOffen}`}
          </dd>
        </div>
      </dl>

      <div className={stil.inhalt} style={{ marginTop: "2rem" }}>
        <h2 style={{ fontSize: "var(--gr-xl)" }}>{lage.titel}</h2>
        <p>{lage.text}</p>
        {zeigtBezahlknopf && <p>{t.danke.zahlungText}</p>}

        {zeigtBezahlknopf && (
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
