/* ---------------------------------------------------------------
   Gemeinsame Hilfsmittel für den Bezahlweg — seit Stufe 2.

   Ab dem 26.09.2026 entsteht eine Anmeldung erst mit der bestätigten
   Zahlung. Das Absenden des Formulars liefert deshalb KEINE Anmeldung
   mehr, sondern nur eine Weiterleitung zur Bezahlseite. Wer in einer
   Prüfliste eine Anmeldung braucht, muss den ganzen Weg gehen:

       absenden → Sitzungskennung → bezahlen → Rückmeldung

   Diese Datei bündelt das, damit nicht acht Listen denselben Ablauf
   jede für sich nachbauen — und dann bei der nächsten Änderung acht
   Mal nachgezogen werden müssten.
   --------------------------------------------------------------- */

import stripe from "stripe";

export const ATTRAPPE = "http://127.0.0.1:4242";
export const GEHEIMNIS = "whsec_pruefgeheimnis_nur_lokal";

/**
 * Die Sitzungskennung aus der Weiterleitung ziehen.
 *
 * Die Adresse endet auf `/bezahlseite/cs_…`. Gibt null zurück, wenn
 * gar nicht weitergeleitet wurde — dann ist die Anmeldung abgelehnt
 * worden, und der Aufrufer soll das unterscheiden können.
 */
export function sitzungAusZiel(ziel) {
  if (!ziel || !ziel.includes("/bezahlseite/")) return null;
  return ziel.split("/bezahlseite/")[1].split(/[?#]/)[0];
}

/** Die Attrappe eine Sitzung als bezahlt melden lassen. */
export async function bezahlen(sitzungId, betrag) {
  const zusatz = betrag === undefined ? "" : `?betrag=${betrag}`;
  return (
    await fetch(`${ATTRAPPE}/steuerung/bezahlt/${sitzungId}${zusatz}`, { method: "POST" })
  ).json();
}

/** Eine Sitzung so holen, wie die Attrappe sie führt. */
export async function holeSitzung(id) {
  const alle = await (await fetch(`${ATTRAPPE}/steuerung/sitzungen`)).json();
  return alle.find((s) => s.id === id);
}

let ereignisse = 0;

/**
 * Eine unterschriebene Rückmeldung an den Server schicken.
 *
 * Die Unterschrift wird echt gebildet — ohne sie weist der Server ab,
 * und das ist genau so gewollt.
 */
export async function rueckmeldung(basis, sitzung, art = "checkout.session.completed", kennung) {
  const ereignis = {
    id: kennung ?? `evt_z_${++ereignisse}_${Date.now()}`,
    object: "event",
    type: art,
    data: { object: sitzung },
  };
  const rohtext = JSON.stringify(ereignis);
  const kopf = stripe.webhooks.generateTestHeaderString({
    payload: rohtext,
    secret: GEHEIMNIS,
  });
  const antwort = await fetch(`${basis}/zahlung/rueckmeldung`, {
    method: "POST",
    body: rohtext,
    headers: { "content-type": "application/json", "stripe-signature": kopf },
  });
  return { status: antwort.status, ereignisId: ereignis.id, text: await antwort.text() };
}

/**
 * Der ganze Weg: absenden, bezahlen, Rückmeldung — und die Anmeldung
 * zurückgeben, die dabei entstanden ist.
 *
 * `absendenFn` ist die Sendefunktion der jeweiligen Liste; `db` die
 * Datenbankverbindung. Beides wird übergeben statt hier importiert,
 * damit diese Datei keine Annahme über die Liste trifft, die sie
 * benutzt.
 */
export async function durchbezahlen(absendenFn, db, basis, felder, email, ip) {
  const antwort = await absendenFn(felder, ip);
  const sitzungId = sitzungAusZiel(antwort.ziel);
  if (!sitzungId) return { antwort, sitzungId: null, anmeldung: null };

  const sitzung = await bezahlen(sitzungId);
  await rueckmeldung(basis, sitzung);

  const anmeldung = await db.registration.findFirst({
    where: { kontaktEmail: email },
    include: { teilnehmer: true },
  });
  return { antwort, sitzungId, sitzung, anmeldung };
}

/**
 * Eine vollständige Nutzlast bauen, wie sie `aktion.ts` nach dem
 * Absenden erzeugt — ohne Datenbank, ohne Zeitstempel.
 *
 * Mehrere Listen brauchen eine Bezahlseite, ohne den Weg über das
 * Formular zu gehen (etwa um den Termin dazwischen zu entfernen).
 * Seit Stufe 2 gibt es dafür keine Anmeldenummer mehr, an der man das
 * aufhängen könnte — also braucht es die Nutzlast selbst.
 */
export function nutzlastFuer(eventId, email, zusatz = {}) {
  return {
    eventId,
    kontaktVorname: "Prüf",
    kontaktNachname: "Person",
    kontaktEmail: email,
    kontaktTelefon: null,
    buchungsart: "EINZEL",
    istVormundBuchung: false,
    einwilligungVormund: false,
    agbAkzeptiert: true,
    kenntnisAufnahmen: true,
    gesamtpreisCents: 1400,
    agbFassungId: null,
    datenschutzFassungId: null,
    teilnehmer: [{ vorname: "Prüf", nachname: "Person", typ: "E" }],
    ...zusatz,
  };
}

/**
 * Eine ECHTE, beim Anbieter bezahlte Bezahlseite herstellen — ohne
 * das Anmeldeformular.
 *
 * Für Listen, die eine bezahlte Buchung als Ausgangslage brauchen
 * (Storno, Erstattung) und nicht den Anmeldeweg prüfen. Die Marke ist
 * gültig verschlüsselt, damit die Sitzung aussieht wie eine aus dem
 * Betrieb — sonst prüfte man gegen einen Sonderfall.
 */
export async function bezahlteSitzung({ eventId, eventTitel, email, personen, gesamtCents, zusatz = {} }) {
  const { sitzungErstellen, sitzungPruefen } = await import("../lib/zahlung.ts");
  const { verschluesseln } = await import("../lib/anmeldeNutzlast.ts");
  const { schluesselbund } = await import("../lib/anmeldeSchluessel.ts");

  const nutzlast = nutzlastFuer(eventId, email, { gesamtpreisCents: gesamtCents, ...zusatz });
  const sitzung = await sitzungErstellen({
    email, eventId, eventTitel, personen, gesamtCents,
    marke: verschluesseln(nutzlast, schluesselbund()),
  });
  await fetch(`${ATTRAPPE}/steuerung/bezahlt/${sitzung.id}`, { method: "POST" });
  return { sitzung, stand: await sitzungPruefen(sitzung.id) };
}

/**
 * Die Marke aus den `metadata` wieder zusammensetzen.
 *
 * Bewusst die ECHTE Funktion aus lib/zahlung.ts und keine
 * nachgebaute: Eine eigene Fassung hier würde bei jeder Änderung an
 * der Aufteilung stillschweigend danebenliegen — und die Prüfung
 * bestünde dann aus dem falschen Grund.
 */
export async function markeAusMetadaten(metadaten) {
  const { markeZusammensetzen } = await import("../lib/zahlung.ts");
  return markeZusammensetzen(metadaten ?? {}) ?? "";
}
