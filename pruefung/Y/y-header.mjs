/* Sicherheits-Kopfzeilen jeder Antwort.

   Die Kopfzeilen werden in next.config.mjs gesetzt und galten lange
   als „einmal eingestellt, nie wieder angesehen". Genau solche
   Einstellungen verrutschen unbemerkt: Ein Wert wird beim Umbau
   gelöscht, ein `preload` rutscht aus Versehen hinein. Diese Liste
   fängt das ab, indem sie die real ausgelieferten Kopfzeilen eines
   laufenden Servers prüft — nicht den Quelltext, sondern die Antwort.

   Läuft gegen den Server OHNE Sonderwerte (Port 3249); die Kopfzeilen
   sind auf jedem Pfad gleich.
*/
const BASIS = process.env.PRUEF_BASIS ?? "http://127.0.0.1:3249";

let n = 0;
const schief = [];
const pruefe = (name, ok, zusatz = "") => {
  n += 1;
  console.log(`${ok ? "✓" : "✗"} ${n}. ${name}${zusatz ? "  — " + zusatz : ""}`);
  if (!ok) schief.push(name);
};

const antwort = await fetch(BASIS + "/", { redirect: "manual" });
const h = (name) => antwort.headers.get(name) ?? "";

/* HSTS: mindestens ein Jahr, Unterdomänen eingeschlossen, und
   AUSDRÜCKLICH ohne preload — preload ist ein kaum umkehrbarer
   Schritt und darf nicht versehentlich hineinrutschen. */
const hsts = h("strict-transport-security");
const maxAge = Number((hsts.match(/max-age=(\d+)/) ?? [])[1] ?? 0);
pruefe("HSTS: max-age mindestens ein Jahr", maxAge >= 31536000, `max-age=${maxAge}`);
pruefe("HSTS: schließt Unterdomänen ein", /includeSubDomains/i.test(hsts));
pruefe("HSTS: KEIN preload (bewusste Entscheidung)", !/preload/i.test(hsts), hsts || "(kein Header)");

/* CSP: vorhanden und mit den tragenden Direktiven. */
const csp = h("content-security-policy");
pruefe("CSP: default-src 'self'", /default-src 'self'/.test(csp));
pruefe("CSP: frame-ancestors 'none'", /frame-ancestors 'none'/.test(csp));
pruefe("CSP: object-src 'none'", /object-src 'none'/.test(csp));

pruefe("X-Content-Type-Options: nosniff", h("x-content-type-options") === "nosniff");
pruefe("X-Frame-Options: DENY", h("x-frame-options") === "DENY");
pruefe("Referrer-Policy gesetzt", h("referrer-policy").length > 0, h("referrer-policy"));
pruefe("Permissions-Policy schränkt Kamera/Mikrofon/Standort ein",
  /camera=\(\)/.test(h("permissions-policy")) && /geolocation=\(\)/.test(h("permissions-policy")));

/* Die mit SEC-004 ergänzten Cross-Origin-Kopfzeilen. */
pruefe("Cross-Origin-Opener-Policy: same-origin", h("cross-origin-opener-policy") === "same-origin");
pruefe("Cross-Origin-Resource-Policy: same-origin", h("cross-origin-resource-policy") === "same-origin");

/* COEP ist bewusst NICHT gesetzt — würde eine spätere Widget-Einbindung
   ohne Gewinn blockieren. Diese Prüfung hält die Entscheidung fest:
   taucht der Header auf, war es vermutlich keine bewusste. */
pruefe("Cross-Origin-Embedder-Policy bewusst NICHT gesetzt",
  h("cross-origin-embedder-policy") === "",
  h("cross-origin-embedder-policy") || "(nicht gesetzt — richtig)");

/* Das Framework soll sich nicht zu erkennen geben. */
pruefe("Kein X-Powered-By", h("x-powered-by") === "", h("x-powered-by") || "(nicht gesetzt — richtig)");

console.log(`\n${n - schief.length} von ${n} in Ordnung.`);
if (schief.length) {
  console.log("Nicht in Ordnung:", schief.join(" · "));
  process.exit(1);
}
