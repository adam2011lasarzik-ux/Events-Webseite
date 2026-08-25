"use server";

/* ---------------------------------------------------------------
   Anmeldungen verwalten: Status, Zahlung, Löschen.

   Jede Aktion prüft selbst, ob jemand angemeldet ist — eine
   Server-Aktion ist über das Netz erreichbar wie jede andere Adresse
   und läuft an jedem Layout vorbei.
   --------------------------------------------------------------- */

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { verlangeAdmin } from "@/lib/adminAuth";

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
  await verlangeAdmin();

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

  auffrischen(vorhanden.eventId);
}

export async function zahlungSetzen(formular: FormData): Promise<void> {
  await verlangeAdmin();

  const id = text(formular.get("anmeldungId"));
  const neu: ZahlungsStatus | null = ausListe(ZAHLUNGS_STATUS, text(formular.get("zahlungsStatus")));
  if (!id || !neu) return;

  const vorhanden = await db.registration.findUnique({ where: { id } });
  if (!vorhanden) return;

  await db.registration.update({
    where: { id },
    data: {
      zahlungsStatus: neu,
      bezahltAm: neu === "BEZAHLT" ? (vorhanden.bezahltAm ?? new Date()) : null,
      // Der Betrag wird NICHT aus dem Formular übernommen, sondern aus
      // der Anmeldung. Was bezahlt wurde, ist der Preis, der bei der
      // Anmeldung galt — nicht das, was im Browser stand.
      bezahlterBetragCents: neu === "BEZAHLT" ? vorhanden.gesamtpreisCents : null,
    },
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
  await verlangeAdmin();

  const id = text(formular.get("anmeldungId"));
  if (!id) return;

  const vorhanden = await db.registration.findUnique({ where: { id } });
  if (!vorhanden || vorhanden.anonymisiertAm) return;

  await db.$transaction(async (tx) => {
    const teilnehmer = await tx.participant.findMany({
      where: { registrationId: id },
      select: { id: true },
    });

    for (const [i, t] of teilnehmer.entries()) {
      await tx.participant.update({
        where: { id: t.id },
        data: { vorname: "Gelöscht", nachname: `Teilnehmer ${i + 1}`, geburtsjahr: null },
      });
    }

    await tx.registration.update({
      where: { id },
      data: {
        kontaktVorname: "Gelöscht",
        kontaktNachname: "Anmeldung",
        // Die E-Mail-Adresse muss je Event eindeutig bleiben, sonst
        // scheitert eine zweite Anonymisierung an der Eindeutigkeit.
        // Deshalb die Anmeldenummer als Platzhalter — sie ist bereits
        // eindeutig und enthält keine Personendaten.
        kontaktEmail: `geloescht+${id}@invalid`,
        kontaktTelefon: null,
        anonymisiertAm: new Date(),
      },
    });
  });

  auffrischen(vorhanden.eventId);
}
