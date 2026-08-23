/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Wer die Seite ohne Sprachkürzel aufruft, landet auf der deutschen
  // Fassung. Kein dauerhafter Umzug, damit die Regel später ohne
  // zwischengespeicherte Umleitungen änderbar bleibt.
  async redirects() {
    return [{ source: "/", destination: "/de", permanent: false }];
  },
};

export default nextConfig;
