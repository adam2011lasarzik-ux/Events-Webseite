import { verlangeAdmin } from "@/lib/adminAuth";
import { AdminRahmen } from "@/components/admin/AdminRahmen";
import { EventFormular, type EventVorbelegung } from "@/components/admin/EventFormular";

export const dynamic = "force-dynamic";
export const metadata = { title: "Neues Event" };

/**
 * Vorbelegung für eine neue Veranstaltung.
 *
 * Bewusst mit sinnvollen Startwerten statt leer: Wer zum ersten Mal
 * ein Event anlegt, sieht an den Zahlen, was gemeint ist. Geändert
 * werden können sie alle.
 */
export const LEERES_EVENT: EventVorbelegung = {
  id: "",
  slug: "",
  status: "ENTWURF",
  kategorie: "SPORT",
  titel: "",
  untertitel: "",
  karteTitel: "",
  karteKurz: "",
  karteZielgruppe: "",
  kurz: "",
  beschreibung: "",
  hinweise: "",
  startAt: "",
  endAt: "",
  ortName: "",
  strasse: "",
  plz: "",
  stadt: "",
  bildUrl: "",
  videoUrl: "",
  maxPersonen: "",
  schwelleWenigPlaetze: "10",
  preisSchueler: "",
  preisErwachsener: "",
  familieAktiv: false,
  familieBasis: "",
  familieEnthaltenErwachsene: "2",
  familieEnthaltenSchueler: "1",
  familieWeitererSchueler: "",
  familieMaxSchueler: "6",
  anmeldungAb: "",
  anmeldungBis: "",
  dabei: "",
  mitbringen: "",
};

export default async function NeuesEvent() {
  const admin = await verlangeAdmin();

  return (
    <AdminRahmen
      admin={admin}
      titel="Neue Veranstaltung"
      unterzeile="Sie wird als Entwurf angelegt und erscheint erst auf der Webseite, wenn du sie veröffentlichst."
    >
      <EventFormular vorbelegung={LEERES_EVENT} />
    </AdminRahmen>
  );
}
