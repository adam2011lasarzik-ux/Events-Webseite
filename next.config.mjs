/** @type {import('next').NextConfig} */

// Nur für den Vorschau-Build auf GitHub Pages gesetzt (siehe
// .github/workflows/pages-vorschau.yml). Der normale Server — lokale
// Entwicklung und später Hostinger — läuft ganz normal weiter und
// merkt von dieser Fallunterscheidung nichts.
const istGithubPagesVorschau = process.env.GITHUB_PAGES_BUILD === "true";
const repoName = "Events-Webseite";

const nextConfig = {
  reactStrictMode: true,

  experimental: {
    // Titelbilder werden als Teil des Event-Formulars hochgeladen.
    // Die Voreinstellung für Server-Funktionen liegt bei 1 MB — ein
    // Foto vom iPhone ist grösser, der Upload bräche also immer ab.
    // 12 MB lassen Luft über der 10-MB-Grenze aus lib/bilder.ts, damit
    // eine zu grosse Datei die verständliche Meldung von dort bekommt
    // und nicht einen nackten Netzwerkfehler.
    serverActions: { bodySizeLimit: "12mb" },
  },

  // Verrät sonst in jeder Antwort das verwendete Framework. Das nützt
  // niemandem außer jemandem, der nach bekannten Lücken sucht.
  poweredByHeader: false,

  ...(istGithubPagesVorschau
    ? {
        // GitHub Pages kann nur fertige HTML-Dateien ausliefern, keinen
        // Node-Server. „output: export" baut die Seite deshalb einmal
        // komplett vor. Version 1 hat ohnehin keine Serverfunktionen
        // (keine Datenbank, kein Formular-Versand), daher geht dabei
        // nichts verloren.
        output: "export",
        // Ohne diese Zeile erzeugt der Export flache Dateien wie
        // „de.html" statt „de/index.html". GitHub Pages kommt damit
        // zwar meist auch klar, aber „ordentliche" Adressen mit
        // Schrägstrich am Ende sind auf statischem Hosting die
        // zuverlässigere, empfohlene Variante.
        trailingSlash: true,
        // GitHub Pages liefert dieses Projekt unter einem Unterordner
        // aus (…github.io/Events-Webseite/), nicht unter der Wurzel.
        basePath: `/${repoName}`,
        assetPrefix: `/${repoName}/`,
        // Dateien aus `public/` (z. B. das Hero-Video) bekommen den
        // Unterordner nicht automatisch vorangestellt — lib/pfade.ts
        // erledigt das und liest den Wert hier aus.
        env: { NEXT_PUBLIC_BASIS_PFAD: `/${repoName}` },
        images: { unoptimized: true },
      }
    : {
        // Sicherheits-Kopfzeilen — bewusst HIER und nicht in Nginx, damit sie im
        // Repository stehen und einen künftigen Serverumzug überleben (Vorgabe aus
        // dem Skill event-backend-database, Abschnitt „Sicherheits-Kopfzeilen").
        //
        // Die strenge Content-Security-Policy ist möglich, WEIL diese Seite keine
        // fremden Skripte lädt: Schriften werden selbst ausgeliefert, es gibt kein
        // Tracking, und die Bezahlung läuft ausschließlich auf der gehosteten
        // Stripe-Seite (eine normale Weiterleitung, kein eingebettetes Skript).
        // Würde später ein SDK eines Zahlungsanbieters eingebettet, MUSS diese
        // Regel vorher erweitert und danach erneut gemessen werden — sonst wird
        // das Skript stillschweigend blockiert und die Bezahlung schlägt fehl.
        async headers() {
          const csp = [
            "default-src 'self'",
            // 'unsafe-inline' hier ist ein bewusster, geprüfter Kompromiss: Next.js
            // liefert die Serverdaten beim ersten Seitenaufruf über kleine
            // eingebettete <script>-Blöcke aus (self.__next_f.push(…)) — das ist
            // Kernfunktion des App Routers, keine Zusatzfunktion, und OHNE diese
            // Erlaubnis wäre die Seite für Besucher unbenutzbar (kein Fehler beim
            // Bauen, aber kaputte Interaktivität im Browser). Ein sichererer Weg
            // wäre ein Nonce über eine eigene middleware.ts — bewusst als spätere
            // Verbesserung offengelassen, nicht als vergessene Einstellung.
            // Fremde Skripte von anderen Servern bleiben trotzdem ausgeschlossen:
            // "'unsafe-inline'" erlaubt nur eingebetteten Code, kein "https:".
            "script-src 'self' 'unsafe-inline'",
            // 'unsafe-inline' auch für style-src: React schreibt Abstände u. Ä.
            // stellenweise als style="…"-Attribut, das braucht diese Erlaubnis.
            // Es werden dadurch keine fremden Stylesheets erlaubt (kein "https:").
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data:",
            "font-src 'self'",
            "connect-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "upgrade-insecure-requests",
          ].join("; ");

          return [
            {
              source: "/:pfad*",
              headers: [
                // HSTS: der Browser spricht die Seite künftig nur noch über HTTPS
                // an. Ohne "preload" — das ist ein eigener, kaum umkehrbarer
                // Schritt (Eintrag in die Browser-Listen) und wird nur nach
                // ausdrücklicher Entscheidung gesetzt, nicht nebenbei.
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=15552000; includeSubDomains",
                },
                { key: "Content-Security-Policy", value: csp },
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "X-Frame-Options", value: "DENY" },
                { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                {
                  key: "Permissions-Policy",
                  value:
                    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
                },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
