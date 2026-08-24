/** @type {import('next').NextConfig} */

// Nur für den Vorschau-Build auf GitHub Pages gesetzt (siehe
// .github/workflows/pages-vorschau.yml). Der normale Server — lokale
// Entwicklung und später Hostinger — läuft ganz normal weiter und
// merkt von dieser Fallunterscheidung nichts.
const istGithubPagesVorschau = process.env.GITHUB_PAGES_BUILD === "true";
const repoName = "Events-Webseite";

const nextConfig = {
  reactStrictMode: true,

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
        // Zwei Kopfzeilen, die auf einer Seite ohne Formulare und ohne
        // fremde Inhalte nichts kaputtmachen können:
        // - nosniff: der Browser soll Dateitypen nicht selbst erraten
        // - Referrer-Policy: beim Wegklicken wird nicht die volle
        //   Adresse der besuchten Unterseite an fremde Seiten
        //   weitergegeben
        async headers() {
          return [
            {
              source: "/:pfad*",
              headers: [
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
