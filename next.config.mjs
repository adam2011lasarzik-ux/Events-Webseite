/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Verrät sonst in jeder Antwort das verwendete Framework. Das nützt
  // niemandem außer jemandem, der nach bekannten Lücken sucht.
  poweredByHeader: false,

  // Wer die Seite ohne Sprachkürzel aufruft, landet auf der deutschen
  // Fassung. Kein dauerhafter Umzug, damit die Regel später ohne
  // zwischengespeicherte Umleitungen änderbar bleibt.
  async redirects() {
    return [{ source: "/", destination: "/de", permanent: false }];
  },

  // Zwei Kopfzeilen, die auf einer Seite ohne Formulare und ohne fremde
  // Inhalte nichts kaputtmachen können:
  // - nosniff: der Browser soll Dateitypen nicht selbst erraten
  // - Referrer-Policy: beim Wegklicken wird nicht die volle Adresse
  //   der besuchten Unterseite an fremde Seiten weitergegeben
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
};

export default nextConfig;
