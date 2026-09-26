"use server";

/* ---------------------------------------------------------------
   Anmeldungen verwalten: Status, Zahlung, Löschen.

   Jede Aktion prüft selbst, ob jemand angemeldet ist — eine
   Server-Aktion ist über das Netz erreichbar wie jede andere Adresse
   und läuft an jedem Layout vorbei.
   --------------------------------------------------------------- */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { anmeldungAnonymisieren } from "@/lib/anonymisieren";
import { db } from "@/lib/db";
import { verlangeAdmin } from "@/lib/adminAuth";
import { protokolliere, PROTOKOLL_AKTIONEN } from "@/lib/adminProtokoll";
import { stornoDurchAdmin } from "@/lib/stornoAusfuehren";

const ANMELDE_STATUS = ["BESTAETIGT", "WARTELISTE", "STORNIERT"] as const;
const ZAHLUNGS_STATUS = ["OFFEN", "BEZAHLT", "ERSTATTET", "TEILWEISE_ERSTATTET"] as const;

type AnmeldeStatus = (typeof ANMELDE_STATUS)[number];
type ZahlungsStatus = (typeof ZAHLUNGS_STATUS)[number];

function text(wert: FormDataEntryValue | null): string {
  return typeof wert === "string" ? wert : "";
}

function ausListe<T extends string>(erlaubt: readonly T[], wert: string): T | null {
  return (erlaubt as readonly string[]).includes(wert) ? (wert as T) : null;
}

/** Nach einer Änderung müssen Übersicht und Liste die neuen Zahlen zeigen. */
function auffrischen(eventId: string) {
  revalidatePath("/admin");
  revalidatePath(`/admin/events/${eventId}/anmeldungen`);
}

export async function statusSetzen(formular: FormData): Promise<void> {
  const admin = await verlangeAdmin();

  const id = text(formular.get("anmeldungId"));
  const neu: AnmeldeStatus | null = ausListe(ANMELDE_STATUS, text(formular.get("status")));
  if (!id || !neu) return;

  const vorhanden = await db.registration.findUnique({ where: { id } });
  if (!vorhanden) return;

  await db.registration.update({
    where: { id },
    data: {
      status: neu,
      // Die Zeitstempel mitführen, damit später nachvollziehbar
      // bleibt, wann was passiert ist.
      storniertAm: neu === "STORNIERT" ? new Date() : null,
      reaktiviertAm:
        vorhanden.status === "STORNIERT" && neu !== "STORNIERT"
          ? new Date()
          : vorhanden.reaktiviertAm,
    },
  });

  await protokolliere({
    adminId: admin.id,
    aktion: PROTOKOLL_AKTIONEN.anmeldungStatus,
    zielArt: "Registration",
    zielId: id,
    detail: `${vorhanden.status} → ${neu}`,
  });

  auffrischen(vorhanden.eventId);
}

export async function zahlungSetzen(formular: FormData): Promise<void> {
  const admin = await verlangeAdmin();

  const id = text(formular.get("anmeldungId"));
  const neu: ZahlungsStatus | null = ausListe(ZAHLUNGS_STATUS, text(formular.get("zahlungsStatus")));
  if (!id || !neu) return;

  const vorhanden = await db.registration.findUnique({ where: { id } });
  if (!vorhanden) return;

  await db.registration.update({
    where: { id },
    data: {
      zahlungsStatus: neu,
      /* Von Hand als bezahlt markieren bestätigt auch die Anmeldung.
         Das ist der Weg für Barzahlung und Überweisung — und der
         Notausgang, falls eine Rückmeldung des Anbieters einmal
         ausbleibt. Eine bezahlte Anmeldung, die als bloße Reservierung
         weiterläuft und dann verfällt, wäre die schlechteste
         Überraschung von allen. */
      ...(neu === "BEZAHLT" && vorhanden.status !== "BESTAETIGT"
        ? { status: "BESTAETIGT" as const }
        : {}),
      bezahltAm: neu === "BEZAHLT" ? (vorhanden.bezahltAm ?? new Date()) : null,
      // Der Betrag wird NICHT aus dem Formular übernommen, sondern aus
      // der Anmeldung. Was bezahlt wurde, ist der Preis, der bei der
      // Anmeldung galt — nicht das, was im Browser stand.
      bezahlterBetragCents: neu === "BEZAHLT" ? vorhanden.gesamtpreisCents : null,
    },
  });

  await protokolliere({
    adminId: admin.id,
    aktion: PROTOKOLL_AKTIONEN.anmeldungZahlung,
    zielArt: "Registration",
    zielId: id,
    detail: `${vorhanden.zahlungsStatus} → ${neu}`,
  });

  auffrischen(vorhanden.eventId);
}

/**
 * Personendaten einer Anmeldung dauerhaft entfernen.
 *
 * Eine Stornierung ist KEINE Löschung — sie muss gespeichert bleiben,
 * damit Platzzählung und Zahlungsabgleich stimmen. Für das
 * Auskunfts- und Löschrecht braucht es diesen zweiten Weg: Namen,
 * E-Mail-Adresse und Telefonnummer werden überschrieben, die
 * Teilnehmer ebenso. Übrig bleibt eine anonyme Zeile mit Betrag und
 * Datum — genug für die Buchhaltung, ohne Personenbezug.
 *
 * Wichtig: Die Teilnehmer werden mit anonymisiert. Sonst blieben
 * verwaiste Personendaten zurück, die niemand mehr zuordnen kann und
 * deshalb auch niemand mehr löscht.
 */
export async function anonymisieren(formular: FormData): Promise<void> {
  const admin = await verlangeAdmin();

  const id = text(formular.get("anmeldungId"));
  if (!id) return;

  const vorhanden = await db.registration.findUnique({ where: { id } });
  if (!vorhanden || vorhanden.anonymisiertAm) return;

  /* Die eigentliche Arbeit steht in lib/anonymisieren.ts und wird vom
     nächtlichen Löschlauf gemeinsam mit diesem Knopf benutzt.

     Vorher stand sie hier ein zweites Mal. Zwei Umsetzungen desselben
     Vorgangs laufen irgendwann auseinander — und dann löscht der eine
     Weg ein Feld, das der andere stehen lässt, ohne dass es jemandem
     auffällt. Bei einer Löschung ist das der teuerste Fehler: Er sieht
     wie Erfolg aus. */
  const getan = await anmeldungAnonymisieren(id);
  if (!getan) return;

  /* Hier ist das Protokoll besonders wichtig: Nach dem
     Anonymisieren lässt sich aus der Anmeldung selbst nicht mehr
     ablesen, dass und wann jemand sie entfernt hat. Der Eintrag hält
     genau das fest — ohne Namen, nur mit der Kennung. */
  await protokolliere({
    adminId: admin.id,
    aktion: PROTOKOLL_AKTIONEN.anmeldungAnonymisiert,
    zielArt: "Registration",
    zielId: id,
  });

  auffrischen(vorhanden.eventId);
}

/**
 * Stornieren UND das Geld zurueckgeben — der Weg, der wirklich alles tut.
 *
 * Warum es diese Aktion zusaetzlich zu statusSetzen gibt: Dort wird nur
 * ein Vermerk umgestellt. Kein Geld bewegt sich, keine Mail geht raus.
 * Storniert der Veranstalter nach einem Anruf ueber statusSetzen, behaelt
 * er die Zahlung — ohne dass irgendetwas darauf hinweist. Und wer
 * anschliessend von Hand "Erstattet" anklickt, hat dann eine Liste, die
 * ueber Geld die Unwahrheit sagt.
 *
 * Diese Aktion benutzt denselben Kern wie die Selbstbedienung des Kunden
 * (lib/stornoAusfuehren.ts): erst erstatten, dann speichern, dann beide
 * Mails. Scheitert die Erstattung beim Anbieter, bleibt die Buchung
 * unveraendert bestehen und der Veranstalter bekommt es zu sehen.
 */
export async function stornierenUndErstatten(formular: FormData): Promise<void> {
  const admin = await verlangeAdmin();

  const id = text(formular.get("anmeldungId"));
  if (!id) return;

  const vorhanden = await db.registration.findUnique({
    where: { id },
    select: { eventId: true },
  });
  if (!vorhanden) return;

  const ergebnis = await stornoDurchAdmin(id);
  auffrischen(vorhanden.eventId);

  /* Rueckmeldung ueber die Adresse statt ueber einen Zustand im
     Browser: Die Seite funktioniert damit auch ohne JavaScript, wie
     alles andere im Adminbereich auch. */
  const hinweis = ergebnis.erfolg
    ? ergebnis.erstattet
      ? "erstattet"
      : "storniert"
    : `fehler-${ergebnis.fehler}`;

  await protokolliere({
    adminId: admin.id,
    aktion: PROTOKOLL_AKTIONEN.anmeldungStorniert,
    zielArt: "Registration",
    zielId: id,
    detail: hinweis,
  });

  redirect(`/admin/events/${vorhanden.eventId}/anmeldungen?hinweis=${hinweis}`);
}
