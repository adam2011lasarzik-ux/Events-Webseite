import { anmelden, hole } from "./admin-senden.mjs";
const a = await anmelden("test-admin@vera.example", "Sonnenblume-Kaffee-Regen");
console.log("Status:", a.antwort.status, "Ziel:", a.antwort.ziel);
console.log("Cookie gesetzt:", a.cookie ? "ja" : "nein");
console.log("Cookie-Eigenschaften:", a.rohKeks);
if (a.cookie) {
  const s = await hole("/admin", a.cookie);
  console.log("/admin mit Cookie:", s.status, "— enthält Übersicht:", s.html.includes("Übersicht"));
}
