import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { verlangeAdmin } from "@/lib/adminAuth";
import { centsAlsEingabe } from "@/lib/eventFormular";
import { fuerFormular } from "@/lib/zeit";
import { eventEntfernen } from "../aktion";
import { AdminRahmen } from "@/components/admin/AdminRahmen";
import { EventFormular, type EventVorbelegung } from "@/components/admin/EventFormular";
import stil from "../../admin.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Event bearbeiten" };

const oderLeer = (wert: string | null) => wert ?? "";
const zahl = (wert: number | null) => (wert === null ? "" : String(wert));

export default async function EventBearbeiten({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ gespeichert?: string; fehler?: string }>;
}) {
  const admin = await verlangeAdmin();
  const { id } = await params;
  const { gespeichert, fehler } = await searchParams;

  const e = await db.event.findUnique({
    where: { id },
    include: { abschnitte: true, _count: { select: { anmeldungen: true } } },
  });
  if (!e) notFound();

  const block = (art: string) => e.abschnitte.find((a) => a.art === art)?.inhalt ?? "";

  const vorbelegung: EventVorbelegung = {
    id: e.id,
    slug: e.slug,
    status: e.status,
    kategorie: e.kategorie,
    titel: e.titel,
    untertitel: oderLeer(e.untertitel),
    karteTitel: e.karteTitel,
    karteKurz: e.karteKurz,
    karteZielgruppe: oderLeer(e.karteZielgruppe),
    kurz: e.kurz,
    beschreibung: e.beschreibung,
    hinweise: oderLeer(e.hinweise),
    startAt: fuerFormular(e.startAt),
    endAt: fuerFormular(e.endAt),
    ortName: oderLeer(e.ortName),
    strasse: oderLeer(e.strasse),
    plz: oderLeer(e.plz),
    stadt: e.stadt,
    bildUrl: oderLeer(e.bildUrl),
    videoUrl: oderLeer(e.videoUrl),
    maxPersonen: zahl(e.maxPersonen),
    schwelleWenigPlaetze: String(e.schwelleWenigPlaetze),
    preisSchueler: centsAlsEingabe(e.preisSchuelerCents),
    preisErwachsener: centsAlsEingabe(e.preisErwachsenerCents),
    familieAktiv: e.familieAktiv,
    familieBasis: centsAlsEingabe(e.familieBasisCents),
    familieEnthaltenErwachsene: zahl(e.familieEnthaltenErwachsene),
    familieEnthaltenSchueler: zahl(e.familieEnthaltenSchueler),
    familieWeitererSchueler: centsAlsEingabe(e.familieWeitererSchuelerCents),
    familieMaxSchueler: zahl(e.familieMaxSchueler),
    anmeldungAb: fuerFormular(e.anmeldungAb),
    anmeldungBis: fuerFormular(e.anmeldungBis),
    dabei: block("dabei"),
    mitbringen: block("mitbringen"),
  };

  return (
    <AdminRahmen
      admin={admin}
      titel={e.titel}
      unterzeile={`/events/${e.slug} · ${e._count.anmeldungen} Anmeldung${e._count.anmeldungen === 1 ? "" : "en"}`}
      aktionen={
        <Link href={`/admin/events/${e.id}/anmeldungen`} className={`${stil.knopf} ${stil.knopfLeise}`}>
          Anmeldungen ansehen
        </Link>
      }
    >
      {gespeichert && (
        <p className={`${stil.meldung} ${stil.meldungGut}`} role="status">
          Gespeichert.
          {e.status === "ENTWURF" && " Die Veranstaltung ist noch ein Entwurf und steht nicht auf der Webseite."}
        </p>
      )}
      {fehler === "anmeldungen" && (
        <p className={`${stil.meldung} ${stil.meldungFehler}`} role="alert">
          Diese Veranstaltung hat bereits Anmeldungen und lässt sich deshalb nicht löschen.
          Setze sie stattdessen auf „Archiviert" — dann verschwindet sie von der Webseite,
          die Anmeldungen bleiben aber erhalten.
        </p>
      )}

      <EventFormular vorbelegung={vorbelegung} />

      {e._count.anmeldungen === 0 && (
        <div className={stil.karte}>
          <p className={stil.formGruppenTitel}>Entfernen</p>
          <p className={stil.unterzeile}>
            Diese Veranstaltung hat noch keine Anmeldungen und kann vollständig gelöscht
            werden. Sobald es Anmeldungen gibt, ist das nicht mehr möglich — dann bleibt
            nur „Archiviert".
          </p>
          <form action={eventEntfernen}>
            <input type="hidden" name="eventId" value={e.id} />
            <button type="submit" className={`${stil.knopf} ${stil.knopfGefahr} ${stil.knopfKlein}`}>
              Veranstaltung endgültig löschen
            </button>
          </form>
        </div>
      )}
    </AdminRahmen>
  );
}
