# Die öffentliche Webseite vorübergehend sperren

Vor dem Livegang soll noch niemand Fremdes die Seite sehen oder Tickets
kaufen. Dafür liegt seit dem **15.09.2026** ein Passwort vor der
gesamten öffentlichen Webseite.

> **Diese Sperre muss vor dem ersten echten Event wieder weg.**
> Wie das geht, steht unten — es dauert etwa zehn Sekunden und
> berührt die Anwendung nicht.

---

## Was genau geschützt ist

Das Passwort fragt **Nginx** ab, bevor die Anfrage überhaupt bei
Next.js ankommt. Die Anwendung weiß nichts davon; es wurde keine
einzige Zeile Anwendungscode geändert, nichts neu gebaut und der
Dienst nicht neu gestartet.

| Bereich | Verhalten |
|---|---|
| Startseite, Events, Anmeldung, Rechtsseiten … | **Passwort nötig** |
| `/zahlung/rueckmeldung` | frei — Stripe-Webhook |
| `/.well-known/` | frei — Let's Encrypt |
| `/admin` | frei von *dieser* Sperre — unverändert durch Login + 2FA geschützt |

Benutzername **`vera`**, Passwort nur auf dem Server bekannt (als
SHA-512-Hash in `/etc/nginx/.htpasswd-vera`). Der Browser merkt sich
die Eingabe für die Sitzung — einmal eintippen, danach normal testen.

**Warum die drei Ausnahmen kein Loch reißen:**

- Der **Webhook** hat einen stärkeren Schutz als jedes Passwort: die
  kryptografische Signaturprüfung. Ohne gültige Stripe-Unterschrift
  gibt es `400`, und es passiert nichts. Wäre er gesperrt, bekäme
  Stripe `401` — und **keine Zahlung würde je bestätigt**.
- **Let's Encrypt** erneuert das Zertifikat selbsttätig. Mit Passwort
  davor schlägt die Erneuerung fehl und die Seite wird irgendwann
  unerreichbar.
- Der **Adminbereich** ist mit scrypt-Passwort, Sitzungen in der
  Datenbank, zweitem Faktor und zwei Bremsen deutlich besser
  geschützt als durch ein geteiltes Passwort.

---

## Die drei Bausteine auf dem Server

| Wo | Was |
|---|---|
| `/etc/nginx/.htpasswd-vera` | Benutzer `vera` + Passwort-Hash (`chmod 640`, `root:www-data`) |
| `/etc/nginx/conf.d/vera-sperre.conf` | die Zuordnungstabelle mit den drei Ausnahmen — Vorlage: `server/vera-sperre.conf` |
| `/etc/nginx/sites-available/vera` | zwei Zeilen im 443er-Block: `auth_basic $vera_sperre;` und `auth_basic_user_file …` |

Der `location /`-Block wurde **bewusst nicht angefasst**. Dort steht
`proxy_set_header X-Forwarded-For $remote_addr;`, von der die Bremse am
Anmeldeformular und die am Admin-Login abhängen. Deshalb der Umweg über
eine Variable (`$vera_sperre`) statt über eigene `location`-Blöcke.

Dazu die Überwachung, die sonst falschen Alarm gäbe:

| Wo | Was |
|---|---|
| `/etc/systemd/system/vera-wache.service.d/sperre.conf` | Wache prüft `/admin/login` statt `/` — Vorlage: `server/vera-wache-sperre.conf` |
| UptimeRobot | Monitor-URL ebenfalls auf `/admin/login` |

**Bewusst hingenommen:** Beide prüfen jetzt die Anmeldeseite. Geht
speziell die öffentliche Startseite kaputt, während der Adminbereich
läuft, fällt es der Überwachung nicht auf. Die Lücke ist schmal —
beides kommt aus demselben Next.js-Prozess — und sie schließt sich
mit dem Entfernen der Sperre.

---

## Sperre wieder entfernen

Vier Schritte, keiner davon berührt die Anwendung. Kein Neubau, kein
Neustart des Dienstes, kein Ausfall.

```bash
# 1. Die zwei Zeilen aus dem Server-Block nehmen
sed -i '/auth_basic/d' /etc/nginx/sites-available/vera

# 2. Prüfen und sanft neu laden
nginx -t && systemctl reload nginx

# 3. NACH ein paar Sekunden prüfen (siehe Warnung unten): erwartet 200
sleep 5 && curl -s -o /dev/null -w "%{http_code}\n" https://veraevents.de/

# 4. Aufräumen
rm -f /etc/nginx/conf.d/vera-sperre.conf /etc/nginx/.htpasswd-vera
rm -rf /etc/systemd/system/vera-wache.service.d
systemctl daemon-reload
nginx -t && systemctl reload nginx
```

Danach in UptimeRobot die Monitor-URL zurück auf `https://veraevents.de`
stellen.

> ### Warnung: nach `reload` nicht sofort messen
>
> `systemctl reload nginx` kehrt sofort zurück, während Nginx seine
> Arbeitsprozesse erst austauscht. Ein `curl` unmittelbar danach wird
> unter Umständen noch vom **alten** Prozess mit der **alten**
> Konfiguration bedient.
>
> Genau das ist beim Einrichten am 15.09.2026 passiert: Die Messung
> meldete `200`, obwohl die Sperre bereits richtig konfiguriert war —
> und führte zu einer falschen Fehlersuche. Also ein paar Sekunden
> warten, und im Zweifel mit `nginx -T` nachsehen, was der laufende
> Nginx wirklich geladen hat.

---

## Wie geprüft wurde, dass es wirkt

Am 15.09.2026 gegen die laufende Seite gemessen, nicht angenommen:

| Prüfung | Ergebnis |
|---|---|
| `https://veraevents.de/` ohne Passwort | **401** |
| Kopfzeile | `WWW-Authenticate: Basic realm="VERA - noch nicht oeffentlich"` |
| `/impressum` ohne Passwort | **401** |
| `/zahlung/rueckmeldung` | **405** — erreichbar (405 = nur POST erlaubt) |
| `/admin/login` | **200** — unverändert |
| `/.well-known/acme-challenge/test` | **404** — erreichbar |
| Wache nach der Umstellung | „Alles in Ordnung", Exitcode 0 |
