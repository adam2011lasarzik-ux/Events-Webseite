import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { Knopf } from "@/components/Knopf";
import { db } from "@/lib/db";
import { alsEuro } from "@/lib/preise";
import { fuelle } from "@/lib/formate";
import { sitzungPruefen } from "@/lib/zahlung";
import { entschluesseln } from "@/lib/anmeldeNutzlast";
import { schluesselbund } from "@/lib/anmeldeSchluessel";
import { anmeldungAusZahlung } from "@/lib/anmeldungAnlegen";
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
 * nichts fest ist.
 *
 * ── Seit dem Umbau vom 25.09.2026 ───────────────────────────────
 *
 * Bei einer kostenpflichtigen Anmeldung GIBT ES vor der Zahlung
 * nichts, worauf diese Seite zeigen könnte. Sie bekommt deshalb die
 * Sitzungskennung des Anbieters (`?sitzung=cs_…`) und fragt damit
 * SELBST beim Anbieter nach, ob bezahlt wurde. Der Browser liefert
 * nur die Kennung; geglaubt wird ihm nichts.
 *
 * Ist bezahlt, legt sie die Anmeldung an — über dieselbe idempotente
 * Funktion wie die Rückmeldung des Anbieters. Sie ist damit nicht ein
 * zweiter Weg mit eigener Logik, sondern derselbe Weg, nur früher.
 * Wer schneller zurück ist als die Rückmeldung, wartet nicht.
 *
 * Nach einem Abbruch gibt es weder Kennung noch Datensatz. Dann sagt
 * die Seite, was wirklich geschehen ist: nichts.
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
async function ausSitzungAnlegen(sitzungId: string): Promise<string | null> {
  try {
    const stand = await sitzungPruefen(sitzungId);
    if (!stand.bezahlt) return null;
    if (stand.betragCents === null || !stand.marke) return null;

    const nutzlast = entschluesseln(stand.marke, schluesselbund(), {
      eventId: stand.eventId ?? "",
      preisCents: stand.betragCents,
    });

    const ergebnis = await anmeldungAusZahlung(nutzlast, {
      sitzungId,
      zahlungId: stand.zahlungId,
      bezahlterBetragCents: stand.betragCents,
    });

    if (ergebnis.lage === "angelegt" || ergebnis.lage === "schon-da") {
      return ergebnis.anmeldungId;
    }
    /* Eine Fehlbuchung wird hier NICHT abgewickelt. Das tut die
       Rückmeldung des Anbieters, und zwar vollständig: Beleg
       schreiben, erstatten, Mail verschicken. Zweimal erstatten wäre
       schlimmer als ein paar Sekunden später zu erstatten. Die Seite
       sagt derweil, dass die Zahlung geprüft wird. */
    return null;
  } catch (e) {
    // Kein Drama: Die Rückmeldung des Anbieters erledigt es ohnehin.
    console.error("Nachfrage beim Zahlungsanbieter fehlgeschlagen:", e);
    return null;
  }
}

export default async function AbschlussSeite({
  searchParams,
}: {
  searchParams: Promise<{ nr?: string; sitzung?: string; zahlung?: string; frei?: string }>;
}) {
  const { nr, sitzung, zahlung, frei } = await searchParams;
  const t = texte;

  /* Nach der Rückkehr von der Bezahlseite beim Anbieter nachfragen —
     nicht bei jedem Seitenaufruf. Ist bezahlt, entsteht die Anmeldung
     jetzt; sonst bleibt es bei null und die Seite sagt, dass die
     Bestätigung noch aussteht. */
  const ausSitzung = sitzung && zahlung === "zurueck" ? await ausSitzungAnlegen(sitzung) : null;

  /* `nr` gibt es nur noch bei kostenlosen Veranstaltungen — dort
     entsteht die Anmeldung weiterhin sofort beim Absenden. */
  const kennung = ausSitzung ?? nr ?? null;

  const anmeldung = kennung
    ? await db.registration.findUnique({
        where: { id: kennung },
        // Nur die ANZAHL der Teilnehmer wird gebraucht (siehe unten) —
        // ihre Namen werden hier bewusst nicht mehr geladen, nicht nur
        // nicht mehr angezeigt.
        include: { event: true, _count: { select: { teilnehmer: true } } },
      })
    : null;

  if (!anmeldung) {
    /* Zwei verschiedene Lagen, die nicht verwechselt werden dürfen:

       Kam die Person gerade von der Bezahlseite zurück, ist die
       Zahlung womöglich unterwegs und die Anmeldung entsteht in
       Sekunden — dann wäre „nicht gefunden" schlicht falsch und
       beunruhigend.

       Wurde dagegen abgebrochen, ist wirklich nichts passiert, und
       genau das gehört gesagt: kein Geld abgebucht, keine Angaben
       gespeichert, bitte neu ausfüllen. */
    const wartetNoch = Boolean(sitzung) && zahlung === "zurueck";

    return (
      <Abschnitt>
        <AbschnittKopf
          titel={wartetNoch ? t.danke.zahlungLaeuft : t.danke.nichtsGespeichertTitel}
          haupt
          einleitung={wartetNoch ? t.danke.zahlungLaeuftText : t.danke.nichtsGespeichertText}
        />
        <div style={{ marginTop: "2rem" }}>
          <Knopf href="/events" art="haupt" pfeil>
            {t.danke.zurueckZurAnmeldung}
          </Knopf>
        </div>
      </Abschnitt>
    );
  }

  const personen = anmeldung._count.teilnehmer;
  const mehrere = personen > 1;
  const kostenlos = anmeldung.gesamtpreisCents <= 0;
  const bezahlt = anmeldung.zahlungsStatus === "BEZAHLT" || kostenlos;
  const storniert = anmeldung.status === "STORNIERT";
  /* „Abgelaufen" gibt es nicht mehr als Zustand einer Anmeldung: Eine
     Anmeldung entsteht erst mit der bezahlten Zahlung, eine unbezahlte
     gibt es also nicht. Der Fall bleibt nur noch für kostenlose
     Veranstaltungen theoretisch und ist dort nie erreichbar. */
  const abgelaufen = false;

  /* Es hat gar nicht erst zur Bezahlseite gereicht: zu wenige Plätze.
     Dann ist die Anmeldung nicht zustande gekommen, und ein Knopf
     „Jetzt bezahlen" wäre eine Einladung ins Leere. */
  const keinePlaetze = zahlung === "keine-plaetze";
  const freiZahl = Number(frei ?? "0");

  /* Ohne feststehenden Termin darf nicht bezahlt werden (Entscheidung
     2.5). Ein Knopf „Jetzt bezahlen" führte dann in eine Aktion, die
     ohnehin ablehnt. */
  const keinTermin = zahlung === "kein-termin";

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
    : keinTermin
      ? { titel: t.danke.zahlungTitel, text: t.danke.zahlungKeinTermin }
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
            ? { titel: t.danke.zahlungNochOffen, text: t.danke.zahlungAbgebrochen }
            : zahlung === "nicht-eingerichtet"
              ? { titel: t.danke.zahlungTitel, text: t.danke.zahlungFehlerEingerichtet }
              : zahlung === "anbieter"
                ? { titel: t.danke.zahlungTitel, text: t.danke.zahlungFehlerAnbieter }
                : { titel: t.danke.zahlungNochOffen, text: t.danke.zahlungNochOffenText };

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
          {/* Nur die Anzahl, keine Namen — dieselbe Zurückhaltung wie auf
              der Storno-Seite (storno.personen). Die Seite ist über eine
              unratbare, aber nicht geheime Kennung erreichbar (siehe
              generateMetadata oben); die Projektvorgabe „nur das
              Nötigste" verlangt hier bewusst weniger als den vollen
              Namen jedes Teilnehmers. */}
          <dd style={{ margin: 0 }}>{personen}</dd>
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
        {/* Der Knopf „Jetzt bezahlen" ist am 26.09.2026 entfallen.
            Er setzte einen gespeicherten Vorgang voraus, den es nicht
            mehr gibt: Vor der Zahlung wird nichts gespeichert. Wer
            abgebrochen hat, füllt das Formular neu aus — das ist der
            Preis dafür, dass nach einem Abbruch keine Daten
            zurückbleiben. */}

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
