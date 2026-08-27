import { absenden, personen } from "./senden.mjs";
const r = await absenden({
  eventSlug: "padel-falkensee", weg: "selbst", selbstAls: "student",
  schueler: 1, erwachsene: 0, webseite: "",
  ...personen([{ vorname: "Test", nachname: "Schueler", email: "t1@example.org", telefon: "0123" }]),
});
console.log("Status:", r.status);
console.log("Ziel:", r.ziel);
console.log("Antwortanfang:", r.text.slice(0, 300));
