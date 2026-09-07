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

Wer das schließen will, braucht eine Prüfung **von außen**: einen
kostenlosen Erreichbarkeitsdienst, der die Seite von woanders aus
aufruft und meldet, wenn sie nicht antwortet. Das ist eine bewusste
Entscheidung des Betreibers, weil damit ein weiterer Dienstleister ins
Spiel kommt (er erfährt: die Adresse, die Server-IP und wann die Seite
erreichbar war — **keine** Besucherdaten).

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
Datenschutzerklärung (siehe `docs/rechtliches.md`, Punkt 2).

## Prüfliste für den Server

Diese Punkte lassen sich nur auf dem Server prüfen, nicht hier:

1. `systemctl list-timers vera-wache.timer` zeigt den nächsten Lauf
2. `sudo /usr/local/bin/vera-wache.sh --probe` meldet „Alles in Ordnung"
3. Einen Dienst absichtlich anhalten → beim nächsten Lauf kommt **eine**
   Störungsmail, beim übernächsten **keine** zweite
4. Dienst wieder starten → **eine** Entwarnung
5. `vera-status` läuft und zeigt alle Blöcke
6. `journalctl -u vera-wache -n 20` zeigt die Läufe
