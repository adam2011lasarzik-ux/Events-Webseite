# Überwachung von VERA

Kurzfassung: Alle 15 Minuten prüft der Server sich selbst. Geht etwas
kaputt, kommt **eine** E-Mail — und wenn es wieder läuft, eine
Entwarnung. Dazwischen Ruhe.

---

## Was geprüft wird

```
alle 15 Minuten   vera-wache.timer
                    └─ vera-wache.service
                         └─ /usr/local/bin/vera-wache.sh
                              ├─ laufen vera, nginx, mariadb?
                              ├─ antwortet https://veraevents.de/ mit 200?
                              ├─ ist die Festplatte unter 80 % belegt?
                              ├─ hält das Zertifikat noch über 20 Tage?
                              └─ ist die Datenbank-Sicherung jünger als 48 h?
```

Die Schwellen stehen als benannte Werte oben im Skript, nicht mitten
im Code verstreut.

### Warum über die öffentliche Adresse und nicht über localhost

Ein Test auf `127.0.0.1:3000` würde die Anwendung erreichen und
„alles gut" melden — auch dann, wenn Nginx falsch konfiguriert oder
das Zertifikat abgelaufen ist. Der Aufruf über `https://veraevents.de/`
prüft Anwendung, Reverse Proxy und Zertifikat in einem Zug. Genau so,
wie ein Besucher die Seite erreicht.

### Warum die Sicherung mitgeprüft wird

Das ist die wichtigste Prüfung von allen, und der Grund ist unauffällig:
**Die nächtliche Sicherung meldet sich nur, wenn sie fehlschlägt.**
Läuft ihr Timer gar nicht erst — abgeschaltet, nach einem Neustart nicht
wieder angelaufen, kaputt —, schweigt sie. Ohne die Altersprüfung des
Vermerks würde monatelang niemand merken, dass es keine Sicherungen
mehr gibt. Genau dann, wenn man sie braucht.

## Warum nicht bei jedem Durchlauf gemailt wird

Alle 15 Minuten eine Mail liest nach dem dritten Mal niemand mehr —
und dann geht die eine wichtige unter. Deshalb merkt sich die Wache
den zuletzt gemeldeten Zustand in `/var/lib/vera-wache/zustand` und
meldet nur beim **Wechsel**:

| Vorher | Jetzt | Was passiert |
|---|---|---|
| in Ordnung | Störung | **eine** Störungsmail |
| Störung | dieselbe Störung | nichts |
| Störung | zusätzlicher Befund | **eine** neue Störungsmail |
| Störung | in Ordnung | **eine** Entwarnung |

Der „Zustand" ist dabei eine Prüfsumme über die Befundliste. Kommt zu
einer bestehenden Störung eine zweite hinzu, ändert sich die Summe —
und die neue Störung geht nicht unter.

## Die ehrliche Grenze

**Die Wache läuft auf demselben Server, den sie überwacht.** Ist der
Server aus, abgestürzt oder vom Netz getrennt, kann sie nichts melden.
Sie merkt einen kaputten Dienst, eine volle Platte oder ein abgelaufenes
Zertifikat — aber nicht ihren eigenen Totalausfall.

**Diese Lücke ist geschlossen** — durch eine Prüfung von außen.

## Die Prüfung von außen: UptimeRobot

Der Betreiber hat sich bewusst für einen zusätzlichen Dienstleister
entschieden. Er erfährt: die Adresse, die Server-IP und wann die Seite
erreichbar war — **keine** Besucherdaten.

| | |
|---|---|
| Dienst | UptimeRobot, kostenloser Tarif |
| Monitor | Typ **Keyword** auf `https://veraevents.de` |
| Stichwort | `VERA` — Alarm, wenn es **fehlt** |
| Takt | alle 5 Minuten |
| Meldung an | `kontakt@veraevents.de` |
| Prüfstandort | Nordamerika (im kostenlosen Tarif nicht wählbar) |

**Warum die Meldung an `kontakt@veraevents.de` geht und nicht
irgendwohin:** Dieses Postfach liegt bei Hostinger, **nicht** auf dem
VPS. Fällt der Server komplett aus, kommt die Warnung trotzdem an. Ein
Alarm, der denselben Server braucht wie das, was er überwacht, wäre
wertlos.

**Warum ein Keyword-Monitor und nicht der einfache HTTP-Monitor:** Der
kostenlose Tarif fragt beim HTTP-Monitor nur mit `HEAD` an — es wird
also **nur die Kopfzeile geholt, nicht der Seiteninhalt**. Eine leere
oder kaputte Seite würde als „alles gut" gelten, solange der Server
irgendetwas antwortet. Der Keyword-Monitor lädt den Inhalt und sucht
nach `VERA`; verschwindet das Wort, ist die Anwendung nicht mehr
richtig da. Der ursprünglich automatisch angelegte HTTP-Monitor wurde
deshalb gelöscht — zwei Monitore auf derselben Seite hätten bei einem
Ausfall zwei Mails für ein Problem erzeugt.

**Was der kostenlose Tarif NICHT kann** (und wer es stattdessen macht):

| Fehlt bei UptimeRobot | Wird abgedeckt durch |
|---|---|
| Warnung vor Ablauf des SSL-Zertifikats | die eigene Wache (Punkt 4 oben) |
| Inhaltsprüfung beim HTTP-Monitor (nur `HEAD`) | den Keyword-Monitor |
| Prüfung aus mehreren Regionen | — bewusst hingenommen |

### Der Alarm wurde einmal wirklich ausgelöst

Am 7. September 2026 gemeinsam getestet, nicht angenommen:

1. Stichwort vorübergehend auf `ZZQXNICHTVORHANDEN` gesetzt — ein Wort,
   das auf der Seite garantiert nicht vorkommt
2. Der Monitor ging auf **Down**
3. Die Warn-E-Mail kam bei `kontakt@veraevents.de` **an**
4. Stichwort zurück auf `VERA` → Monitor wieder **Up**

Damit ist zweierlei belegt: Die Bedingung ist **richtig herum**
eingestellt (Alarm bei Abwesenheit, nicht bei Anwesenheit), und der
Meldeweg funktioniert wirklich.

**Warum dieser Test nötig war:** Die Oberfläche beschreibt den Monitor
mit „checking absence of VERA" — das lässt sich in beide Richtungen
lesen. Ein verkehrt herum eingestellter Keyword-Monitor sieht im
Normalbetrieb genauso grün aus wie ein richtiger und schweigt im
Ernstfall. Man sieht ihm den Fehler nicht an; man muss ihn auslösen.

Dasselbe Prinzip wie bei der Datensicherung: **Ein Alarm, der nie
ausgelöst hat, ist kein Alarm.**

**Wiederholen:** einmal jährlich, und nach jedem Umbau an Domain,
Zertifikat oder Startseite.

## Selbst nachsehen

```
vera-status
```

Zeigt auf einem Bildschirm: die fünf Dienste, die Antwort der Seite,
den Speicherplatz, die Restlaufzeit des Zertifikats, die letzten drei
Sicherungen und die Fehler des Dienstes aus den letzten 24 Stunden.

Ein Probelauf der Wache, der **nichts verschickt**:

```
sudo /usr/local/bin/vera-wache.sh --probe
```

## Protokolle

| Was | Wo | Aufbewahrung |
|---|---|---|
| Anwendung (Fehler, `console.error`) | `journalctl -u vera` | begrenzt durch die Größe des Journals |
| Zugriffe und Fehler von Nginx | `/var/log/nginx/` | von `logrotate` gedreht |
| Wache und Sicherung | `journalctl -u vera-wache` bzw. `-u vera-sicherung` | wie oben |

**Was NICHT protokolliert wird:** Passwörter, Schlüssel oder
Zahlungsdaten. Fehler der Anwendung werden serverseitig festgehalten;
Besucher bekommen nie interne Einzelheiten zu sehen.

**Offener Punkt — Nginx protokolliert IP-Adressen.** Das ist die
Voreinstellung von Ubuntu und betrifft personenbezogene Daten. Vor dem
Livegang ist zu entscheiden, ob die Aufbewahrung verkürzt oder die
letzte Stelle der Adresse verworfen wird. Das gehört zur
Datenschutzerklärung (siehe `docs/rechtliches.md`, Punkt 2) und ist
Teil der Fragen an die rechtliche Prüfung.

**Vorbereitet, aber bewusst noch nicht aktiv:**
`server/nginx-protokoll-kuerzen.conf` kürzt die letzte Stelle der
IP-Adresse im Protokoll. Der Einbau steht als Anleitung im Kopf der
Datei; es ist eine Zwei-Minuten-Sache, sobald entschieden ist.

Wichtig dabei, weil es leicht verwechselt wird: **Die Bremse gegen
Massenanmeldungen benutzt dieses Protokoll nicht.** Sie wertet die
Kopfzeile `X-Forwarded-For` in der Anwendung aus. Das Kürzen im
Protokoll schwächt den Missbrauchsschutz also nicht ab.

## Prüfliste für den Server

Diese Punkte lassen sich nur auf dem Server prüfen, nicht hier:

1. `systemctl list-timers vera-wache.timer` zeigt den nächsten Lauf
2. `sudo /usr/local/bin/vera-wache.sh --probe` meldet „Alles in Ordnung"
3. Einen Dienst absichtlich anhalten → beim nächsten Lauf kommt **eine**
   Störungsmail, beim übernächsten **keine** zweite
4. Dienst wieder starten → **eine** Entwarnung
5. `vera-status` läuft und zeigt alle Blöcke
6. `journalctl -u vera-wache -n 20` zeigt die Läufe
