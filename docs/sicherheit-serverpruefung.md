# Sicherheit: Server-Checkliste (SEC-006, SEC-008)

Stand: 08.10.2026.

Diese Punkte lassen sich **nicht aus dem Repository** prüfen oder
beheben — sie hängen an der nginx/TLS-Konfiguration und am laufenden
System auf dem Hostinger-VPS. Der Server wird aus der Ferne **nicht
automatisch** verändert; jeder Befehl wird hier gezeigt, du führst ihn
aus und prüfst die Ausgabe.

> Kein Befehl unten verändert etwas, außer den ausdrücklich als
> „ÄNDERT" markierten. Die reinen Prüfbefehle sind gefahrlos.

Lege für jeden Punkt fest: **erfüllt / nicht erfüllt**. Erst wenn alle
erfüllt sind, steigen Transport Security und Server Security auf 9/10.

---

## 1. TLS-Versionen und Cipher (PRÜFEN)

```bash
nmap --script ssl-enum-ciphers -p 443 veraevents.de
```

**Soll:** nur `TLSv1.2` und `TLSv1.3`, kein `TLSv1.0`/`TLSv1.1`/SSL.
Jede Cipher-Zeile mit Bewertung `A`. Kein Export- oder RC4-Cipher.

Ohne nmap, als Ersatz:

```bash
for v in tls1 tls1_1 tls1_2 tls1_3; do
  echo -n "$v: "; echo | openssl s_client -connect veraevents.de:443 -$v 2>/dev/null | grep -q "BEGIN CERTIFICATE" && echo "akzeptiert" || echo "abgelehnt"
done
```

**Soll:** `tls1` und `tls1_1` → abgelehnt; `tls1_2` und `tls1_3` → akzeptiert.

---

## 2. HTTP → HTTPS Weiterleitung (PRÜFEN)

```bash
curl -sI http://veraevents.de/ | head -1
curl -sI http://veraevents.de/ | grep -i location
```

**Soll:** `301` (oder `308`) und `Location: https://veraevents.de/`.

---

## 3. HSTS an der nginx-Kante (PRÜFEN, ggf. ÄNDERN)

Die App setzt HSTS bereits (`next.config.mjs`, jetzt ein Jahr). Zusätzlich
sollte nginx den Header setzen, damit er auch bei Antworten greift, die
nicht durch die App laufen (Fehlerseiten, statische Umleitungen).

```bash
curl -sI https://veraevents.de/ | grep -i strict-transport-security
```

**Soll:** `max-age=31536000; includeSubDomains` — **ohne** `preload`.

Fehlt der Header an der Kante, in den `server {}`-Block für 443 in
`/etc/nginx/sites-available/vera` aufnehmen (ÄNDERT):

```nginx
# HSTS auch an der Kante. "always", damit der Header auch bei
# Fehlerantworten mitgeht. KEIN preload (siehe docs/pretix-stufe1.md
# bzw. die Begruendung in next.config.mjs).
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

> **preload bewusst nicht.** preload traegt die Domain in eine fest in
> die Browser eingebackene Liste ein. Das ist kaum umkehrbar und
> verlangt, dass die Domain samt ALLER Unterdomänen dauerhaft und
> ausnahmslos ueber HTTPS laeuft. Erst setzen, wenn das sicher
> feststeht und die Folgen bewusst in Kauf genommen werden.

---

## 4. Alle Sicherheits-Kopfzeilen live (PRÜFEN)

```bash
curl -sI https://veraevents.de/ | grep -iE "strict-transport|content-security|x-frame|x-content|referrer|permissions-policy|cross-origin|x-powered"
```

**Soll** (von der App gesetzt, seit den SEC-004/005-Aenderungen):
`Strict-Transport-Security`, `Content-Security-Policy`,
`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy`, `Permissions-Policy`,
`Cross-Origin-Opener-Policy: same-origin`,
`Cross-Origin-Resource-Policy: same-origin`. **Kein** `X-Powered-By`.
Diese Kopfzeilen prüft ab jetzt auch `pruefung/Y/y-header.mjs` lokal.

> **Doppelte Kopfzeilen vermeiden:** Setzt nginx dieselben Header wie
> die App nochmals (ausser HSTS), liefert die Antwort sie doppelt. Nur
> HSTS gehoert zusaetzlich an die Kante; den Rest setzt die App.

---

## 5. nginx server_tokens (PRÜFEN, ggf. ÄNDERN)

```bash
curl -sI https://veraevents.de/ | grep -i "^server:"
```

**Soll:** nur `Server: nginx` ohne Versionsnummer. Steht dort eine
Version, im `http {}`-Block in `/etc/nginx/nginx.conf` (ÄNDERT):

```nginx
server_tokens off;
```

danach `sudo nginx -t && sudo systemctl reload nginx`.

---

## 6. Offene Ports (PRÜFEN)

```bash
sudo ss -tlnp
```

**Soll:** Von aussen erreichbar nur `443` (und `80` fuer die
Weiterleitung). Der Node-Dienst (`3000` o. Ä.) und MariaDB (`3306`)
duerfen **nur** auf `127.0.0.1` lauschen, nicht auf `0.0.0.0`.

Gegenprobe von aussen (von einem anderen Rechner):

```bash
nmap -p 22,80,443,3000,3306 veraevents.de
```

**Soll:** `3000` und `3306` → `filtered`/`closed`, nicht `open`.

---

## 7. MariaDB nur lokal (PRÜFEN)

```bash
sudo ss -tlnp | grep 3306
```

**Soll:** `127.0.0.1:3306`, niemals `0.0.0.0:3306` oder `:::3306`.
Steht dort `0.0.0.0`, in der MariaDB-Konfiguration (ÄNDERT,
`/etc/mysql/mariadb.conf.d/50-server.cnf`):

```ini
bind-address = 127.0.0.1
```

danach `sudo systemctl restart mariadb`. Zusaetzlich die Firewall
pruefen:

```bash
sudo ufw status verbose
```

**Soll:** 3306 taucht in keiner `ALLOW`-Regel von aussen auf.

---

## 8. .env und .git nicht oeffentlich (PRÜFEN)

```bash
for p in /.env /.env.local /.env.production /.git/config /.git/HEAD; do
  echo -n "$p -> "; curl -s -o /dev/null -w '%{http_code}\n' "https://veraevents.de$p"
done
```

**Soll:** jeweils `403` oder `404`, niemals `200`.

> Bei dieser Next.js-Anwendung liegen diese Dateien ohnehin nicht im
> ausgelieferten Verzeichnis. Trifft dennoch eine `200` ein, liefert
> nginx faelschlich aus dem Projektwurzel-Verzeichnis statt nur aus
> `public/` bzw. ueber den Node-Proxy — dann die `location`-Regeln
> pruefen. Ergaenzend ein Riegel (ÄNDERT):

```nginx
location ~ /\.(env|git) { deny all; return 404; }
```

---

## 9. NODE_ENV=production (PRÜFEN)

```bash
sudo systemctl show vera -p Environment
```

**Soll:** enthaelt `NODE_ENV=production`. Fehlt es, laeuft die App im
Entwicklungsmodus: ausfuehrlichere Fehlerseiten, langsamer, und die
Session-Cookies werden ohne das `secure`-Flag gesetzt
(`lib/adminAuth.ts` setzt `secure` nur bei `NODE_ENV === "production"`).
Dann in der systemd-Unit (ÄNDERT, `/etc/systemd/system/vera.service`):

```ini
Environment=NODE_ENV=production
```

danach `sudo systemctl daemon-reload && sudo systemctl restart vera`.

> **Dieser Punkt ist sicherheitsrelevanter, als er aussieht:** Ohne
> `secure` kann das Admin-Sitzungscookie theoretisch ueber eine
> unverschluesselte Verbindung abfliessen. In Kombination mit Punkt 2
> (erzwungenes HTTPS) und Punkt 3 (HSTS) ist das Risiko gering, aber
> `secure` gehoert gesetzt.

---

## Ergebnis eintragen

| Punkt | erfuellt? | Notiz |
|---|---|---|
| 1 TLS-Versionen/Cipher | | |
| 2 HTTP→HTTPS | | |
| 3 HSTS an der Kante | | |
| 4 Kopfzeilen live | | |
| 5 server_tokens off | | |
| 6 Offene Ports | | |
| 7 MariaDB nur lokal | | |
| 8 .env/.git 403/404 | | |
| 9 NODE_ENV=production | | |

Schick mir die Ausgaben; ich werte sie aus und sage, was noch fehlt.
