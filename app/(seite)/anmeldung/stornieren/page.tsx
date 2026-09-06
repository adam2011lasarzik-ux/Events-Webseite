import type { Metadata } from "next";
import { Abschnitt, AbschnittKopf } from "@/components/Abschnitt";
import { Knopf } from "@/components/Knopf";
import { alsEuro } from "@/lib/preise";
import { alsLesbar } from "@/lib/zeit";
import { stornoansichtFuer } from "@/lib/stornoAusfuehren";
import { stornoAbsenden } from "./aktion";
import { texte } from "@/content";
import stil from "@/components/Textseite.module.css";

/**
 * Selbstbedienungs-Stornierung.
 *
 * Erreichbar ausschließlich über den Link aus der Bestätigungsmail:
 * Anmeldenummer UND Storno-Schlüssel. Die Anmeldenummer allein genügt
 * bewusst nicht — sie steht in der Adresse der Abschluss-Seite und ist
 * laut Skill §8 ausdrücklich „kein Zugriffsschutz". Wer eine fremde
 * Buchung stornieren könnte, löste damit eine echte Geldbewegung aus.
 *
 * WICHTIG: Der Aufruf dieser Seite storniert NICHTS. Er zeigt nur an.
 * Storniert wird erst durch den Knopf, also über eine Server-Aktion.
 * Der Grund ist kein Geschmack: Spam-Filter, Link-Vorschauen und
 * Sicherheitsscanner rufen Links in E-Mails automatisch auf. Würde der
 * Aufruf selbst stornieren, verschwänden Buchungen von allein.
 *
 * Die Seite liest bei jedem Aufruf frisch aus der Datenbank.
 */
export const dynamic = "force-dynamic";

/* Wie die Abschluss-Seite: Gelangt die Adresse je nach außen, darf
   sie nicht in einer Suchmaschine landen. */
export const metadata: Metadata = {
  title: texte.storno.titel,
  robots: { index: false, follow: false },
};

export default async function StornoSeite({
  searchParams,
}: {
  searchParams: Promise<{ nr?: string; schluessel?: string; ergebnis?: string }>;
}) {
  const { nr, schluessel, ergebnis } = await searchParams;
  const t = texte;

  const ansicht = await stornoansichtFuer(nr ?? "", schluessel ?? "");

  /* Buchung unbekannt ODER Schlüssel falsch — dieselbe Antwort.
     Zwei verschiedene Meldungen würden verraten, ob es eine Buchung
     gibt, und damit das Durchprobieren belohnen. */
  if (!ansicht) {
    return (
      <Abschnitt>
        <AbschnittKopf titel={t.storno.unbekanntTitel} haupt />
        <div className={stil.inhalt} style={{ marginTop: "2rem" }}>
          <p>{t.storno.unbekanntText}</p>
        </div>
        <div style={{ marginTop: "2rem" }}>
          <Knopf href="/kontakt" art="zweit" pfeil>
            {t.nav.kontakt}
          </Knopf>
        </div>
      </Abschnitt>
    );
  }

  /* Das Ergebnis eines gerade abgeschickten Vorgangs. Es kommt aus der
     Adresse — deshalb wird ihm NICHTS geglaubt, was Folgen hätte: Was
     wirklich gilt, steht in `ansicht.entscheidung`, frisch aus der
     Datenbank. Die Adresse steuert nur, welcher Text erscheint. */
  const meldung = ((): { titel: string; text: string } | null => {
    switch (ergebnis) {
      case "erstattet":
        return { titel: t.storno.erfolgTitel, text: t.storno.erfolgErstattung };
      case "storniert":
        return { titel: t.storno.erfolgTitel, text: t.storno.erfolgOhneErstattung };
      case "zu-spaet":
        return { titel: t.storno.zuSpaetTitel, text: t.storno.zuSpaetText };
      case "bereits-storniert":
        return { titel: t.storno.bereitsStorniertTitel, text: t.storno.bereitsStorniertText };
      case "bereits-erstattet":
        return { titel: t.storno.bereitsErstattetTitel, text: t.storno.bereitsErstattetText };
      case "anbieter":
        return { titel: t.storno.anbieterTitel, text: t.storno.anbieterText };
      case "gebremst":
        return { titel: t.storno.gebremstTitel, text: t.storno.gebremstText };
      default:
        return null;
    }
  })();

  /* Ohne frisches Ergebnis: der Zustand, wie er jetzt wirklich ist. */
  const lage =
    meldung ??
    (ansicht.entscheidung.erlaubt
      ? { titel: t.storno.frageTitel, text: "" }
      : ansicht.entscheidung.grund === "zu-spaet"
        ? { titel: t.storno.zuSpaetTitel, text: t.storno.zuSpaetText }
        : ansicht.entscheidung.grund === "bereits-storniert"
          ? { titel: t.storno.bereitsStorniertTitel, text: t.storno.bereitsStorniertText }
          : { titel: t.storno.bereitsErstattetTitel, text: t.storno.bereitsErstattetText });

  const zeigtKnopf = ansicht.entscheidung.erlaubt;

  return (
    <Abschnitt>
      <AbschnittKopf titel={t.storno.titel} haupt />

      <dl className={stil.punkte} style={{ marginTop: "2rem" }}>
        <div>
          <dt><strong>{t.storno.veranstaltung}:</strong></dt>
          <dd style={{ margin: 0 }}>{ansicht.eventTitel}</dd>
        </div>
        <div>
          <dt><strong>{t.storno.termin}:</strong></dt>
          <dd style={{ margin: 0 }}>
            {ansicht.startAt ? alsLesbar(ansicht.startAt) : t.platzhalter.datumKurz}
          </dd>
        </div>
        <div>
          <dt><strong>{t.storno.personen}:</strong></dt>
          <dd style={{ margin: 0 }}>{ansicht.personen}</dd>
        </div>
        <div>
          <dt><strong>{t.storno.betrag}:</strong></dt>
          <dd style={{ margin: 0 }}>
            {ansicht.bezahlt ? alsEuro(ansicht.gesamtpreisCents) : alsEuro(0)}
          </dd>
        </div>
      </dl>

      <div className={stil.inhalt} style={{ marginTop: "2rem" }}>
        <h2 style={{ fontSize: "var(--gr-xl)" }}>{lage.titel}</h2>
        {lage.text && <p>{lage.text}</p>}

        {zeigtKnopf && (
          <>
            <p>
              {ansicht.entscheidung.erstatten
                ? t.storno.frageErstattung
                : t.storno.frageOhneErstattung}
            </p>
            <p>{t.storno.frageEndgueltig}</p>

            {/* Kein Link, sondern ein Knopf: Ein Seitenaufruf darf
                nichts verändern (Skill §7). */}
            <form action={stornoAbsenden} style={{ marginTop: "1.5rem" }}>
              <input type="hidden" name="anmeldungId" value={ansicht.id} />
              <input type="hidden" name="schluessel" value={schluessel ?? ""} />
              <button type="submit" className={stil.zahlKnopf}>
                {t.storno.knopf}
              </button>
            </form>
          </>
        )}
      </div>

      <div style={{ marginTop: "2rem" }}>
        <Knopf href="/" art="zweit" pfeil>
          {t.aktion.zurueck}
        </Knopf>
      </div>
    </Abschnitt>
  );
}
