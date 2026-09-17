# Löschkonzept — Betrieb

Wie die automatische Löschung läuft, wie man hineinsieht, wie man sie
anhält und was nach einer Wiederherstellung zu tun ist.

Die inhaltliche Begründung der Fristen steht getrennt in
[`rechtstexte-entwuerfe/13-loeschkonzept.md`](rechtstexte-entwuerfe/13-loeschkonzept.md);
die Bestandsaufnahme in
[`rechtstexte-entwuerfe/12-datenbestand-und-loeschfristen.md`](rechtstexte-entwuerfe/12-datenbestand-und-loeschfristen.md).
Dieses Dokument beschreibt nur den laufenden Betrieb.

---

## Die sieben Klassen in einem Blick

| | Datenart | Frist | Fristbeginn | danach |
|---|---|---|---|---|
| **K1** | Gesundheits- und Notfallangaben | 7 Tage | Veranstaltungsende | Papier vernichten (Erinnerung) |
| **K2** | vollständige Einverständniserklärungen | 3 Jahre | Ende des Kalenderjahres | Papier vernichten (Erinnerung) |
| **K3** | reduzierter Zustimmungsnachweis | 10 Jahre | Ende des Kalenderjahres | löschen |
| **K4** | Anmelde- und Check-in-Daten | 3 Jahre | Ende des Kalenderjahres | anonymisieren |
| **K5** | Veranstaltungs- und Sicherheitschecklisten | 3 Jahre | Ende des Kalenderjahres | Personenbezug unwiderruflich entfernen |
| **K6** | Vorfall- und Versicherungsakten | 10 Jahre, bei schwerem Personen-/Gesundheitsschaden bis 30 | **Abschluss** des Vorgangs | löschen |
| **K7** | Steuerunterlagen (§ 147 AO) | 10 / 8 / 6 Jahre | Ende des Kalenderjahres | **vom Löschlauf niemals angefasst** |

**K1 und K2 liegen auf Papier.** Die Anwendung kann sie nicht
vernichten — sie erinnert nur daran. Das ist keine Lücke der Umsetzung,
sondern die Eigenschaft von Papier.

**K7 ist der Riegel.** `entscheide()` in `lib/loeschfristen.ts` prüft
die Steuerrelevanz an **erster** Stelle, noch vor der Sperre. Wer die
Reihenfolge tauscht, könnte eine steuerrelevante Zeile anfassen, nur
weil zufällig keine Sperre darauf lag. Die Reihenfolge ist:

1. steuerrelevant? → niemals anfassen
2. gesperrt? → nichts tun, auch wenn längst fällig
3. Fälligkeitsdatum vorhanden? → ohne Termin wird nichts gelöscht
4. fällig? → erst dann handeln

---

## Was wo passiert

| Datei | Aufgabe |
|---|---|
| `lib/loeschfristen.ts` | Die Regeln. Rein, ohne Datenbank, einzeln prüfbar. |
| `lib/anonymisieren.ts` | Überschreibt den Personenbezug. Kennt `STEUERRELEVANTE_FELDER` — die Liste, die die Prüfung gegenliest. |
| `lib/loeschlauf.ts` | Der Lauf: automatische Sperren, Fälligkeiten auffrischen, handeln, protokollieren. |
| `lib/loeschVorschau.ts` | Liest nur. Speist die Adminseite. |
| `prisma/loeschlauf.ts` | Der Einstieg von der Kommandozeile. |
| `app/admin/loeschen/` | Vorschau, Sperren, Protokoll, beide Knöpfe. |
| `app/admin/vorfaelle/` | Vorfälle anlegen, einstufen, abschließen. |
| `server/vera-loeschlauf.*` | Der nächtliche Lauf als systemd-Dienst. |
| `server/vera-nach-wiederherstellung.sh` | Nach dem Einspielen einer Sicherung. |

### Datenbanktabellen

Neu: `Loeschsperre`, `Vorfall`, `Zustimmungsnachweis`, `Checkliste`,
`Loeschprotokoll`.
Erweitert: `Registration` um `loeschklasse` und `faelligAm`.
Migration: `prisma/migrations/20260917131938_loeschkonzept/`.

---

## Täglich, ohne Zutun

`vera-loeschlauf.timer` startet **04:15 Uhr UTC**. Das ist bewusst
**nach** der Sicherung um 03:30 samt deren Streuwert: So enthält die
Sicherung dieses Tages noch den Stand **vor** der Löschung. Geht ein
Lauf daneben, ist der vorherige Stand nicht verloren.

Der Dienst macht **zwei** Läufe hintereinander: erst einen Probelauf,
der nichts verändert und ins Protokoll schreibt, was gleich geschieht,
dann den echten. Bricht der echte ab, lässt sich hinterher nachlesen,
was er vorhatte.

**Was „verändert nichts" genau heißt.** Der Probelauf fasst kein
personenbezogenes Feld an und löscht keine Zeile. Zwei Dinge schreibt
er trotzdem, und das ist Absicht:

- `faelligAm` wird bei **jedem** Lauf aus dem Veranstaltungstermin neu
  berechnet. Verschiebt der Betreiber einen Termin, wandert die Frist
  mit. Ein einmal beim Anlegen gesetzter Wert wäre nach einer
  Terminänderung falsch — und zwar still.
- Die **automatischen** Sperren (Rückbuchung, offener Vorfall) werden
  neu abgeleitet. Ohne sie zeigte die Vorschau ein Bild, in dem
  Datensätze zur Löschung anstehen, die in Wahrheit gehalten werden.

Beides sind Verwaltungsangaben ohne Personenbezug, und beide wirken
nur in die vorsichtige Richtung: Sie können eine Löschung verhindern
oder verschieben, nie eine auslösen.

```bash
# Läuft der Timer?
systemctl list-timers vera-loeschlauf.timer

# Was hat der letzte Lauf getan?
tail -5 /home/vera/.vera-loeschlauf-status
journalctl -u vera-loeschlauf.service -n 60

# Von Hand nachsehen, ohne etwas zu verändern:
sudo -u vera bash -c 'cd /var/www/vera && npm run loeschen:vorschau'
```

Scheitert der Lauf, geht eine Mail an den Betreiber — ein
erfolgreicher Lauf schickt ausdrücklich keine.

### Einrichtung auf dem Server

```bash
sudo cp /var/www/vera/server/vera-loeschlauf.sh /usr/local/bin/
sudo chmod +x /usr/local/bin/vera-loeschlauf.sh
sudo cp /var/www/vera/server/vera-loeschlauf.service /etc/systemd/system/
sudo cp /var/www/vera/server/vera-loeschlauf.timer   /etc/systemd/system/
sudo cp /var/www/vera/server/vera-nach-wiederherstellung.sh /usr/local/bin/
sudo chmod +x /usr/local/bin/vera-nach-wiederherstellung.sh
sudo systemctl daemon-reload
sudo systemctl enable --now vera-loeschlauf.timer

# Einmal von Hand, um zu sehen dass es läuft:
sudo systemctl start vera-loeschlauf.service
journalctl -u vera-loeschlauf.service -n 60
```

---

## Im Adminbereich

**`/admin/loeschen`**

- Was jetzt fällig ist, was in den nächsten 90 Tagen fällig wird und
  was nur wegen einer Sperre liegen bleibt
- Welche Papierunterlagen zu vernichten sind
- Alle offenen Löschsperren, jede mit Grund, Datum und Person — und
  einem Knopf zum Aufheben
- Ein Formular, um eine Sperre von Hand zu setzen
- Die letzten 50 Protokollzeilen
- Zwei Knöpfe: **Probelauf** (verändert nichts) und **Löschlauf jetzt
  ausführen** (braucht ein ausdrückliches Häkchen)

Auf der Seite stehen **Kennungen, keine Namen**. Wer wissen will, um
wen es geht, schlägt die Kennung in der Anmeldung nach — solange es
sie noch gibt. Eine Löschvorschau, die selbst eine Namensliste ist,
wäre eine zweite Datensammlung.

**`/admin/vorfaelle`**

Vorfälle eröffnen, einstufen und abschließen. Zwei Dinge daran sind
wichtig:

- Ein **offener** Vorfall wird nie gelöscht und hält auch die
  zugehörige Anmeldung fest. Erst mit dem Abschluss beginnt die Frist
  überhaupt zu laufen.
- Die **Einstufung** (leicht / schwer) ist sichtbar und von Hand
  änderbar. Ob ein Schaden ein Personenschaden ist, kann keine
  Software entscheiden. Wird sie bei einem abgeschlossenen Vorfall
  geändert, wandert die Fälligkeit sofort mit.

---

## Löschsperren

Zwei Wege, und die Trennung ist Absicht:

**Automatisch**, bei jedem Lauf neu abgeleitet:

| Auslöser | Grund |
|---|---|
| Zahlung ganz oder teilweise erstattet | `RUECKBUCHUNG` |
| offener Vorfall mit Bezug auf eine Anmeldung | `UNFALL` |

**Von Hand** im Adminbereich: `BESCHWERDE`, `VERSICHERUNG`,
`RECHTSSTREIT` — und bei Bedarf auch die beiden oberen.

Beschwerde, Versicherungsfall und Rechtsstreit lassen sich nicht aus
den Daten ableiten. Eine Beschwerde kommt per E-Mail, nicht als
Datenbankfeld. Das ist keine Lücke, sondern die ehrliche Grenze.

Eine aufgehobene Sperre wird **nicht gelöscht**, sondern mit Zeitpunkt
und Person abgeschlossen. Sonst bliebe später offen, ob es je eine
Sperre gab — und genau das ist die Frage, die im Streitfall gestellt
wird.

---

## Sicherungen

Eine Sicherung ist ein Abbild von gestern, mitsamt der Daten, die
seitdem gelöscht wurden. Ohne Gegenmaßnahme wäre jede Wiederherstellung
eine stille Rücknahme aller Löschungen. Drei Dinge greifen ineinander:

1. **Die Sicherungen selbst verfallen.** Backblaze räumt sie nach
   spätestens 180 Tagen ab (siehe [`sicherung.md`](sicherung.md)). Eine
   Löschung kommt dort also auch ohne Zutun an.
2. **Nach jeder Wiederherstellung läuft der Löschlauf erneut**, bevor
   die Anwendung wieder in Betrieb geht. Er rechnet die Fälligkeit aus
   dem Veranstaltungstermin — was gestern fällig war, ist es heute erst
   recht.
3. **Dafür gibt es ein geführtes Skript:**

```bash
sudo systemctl stop vera
# … Sicherung einspielen (siehe sicherung.md) …
sudo /usr/local/bin/vera-nach-wiederherstellung.sh
# erst danach:
sudo systemctl start vera
```

**Was der Lauf nicht wiederherstellen kann:** Eine **von Hand**
gesetzte Löschsperre, die nach dem Zeitpunkt der Sicherung entstanden
ist, fehlt im zurückgespielten Stand. Die automatischen Sperren setzt
der Lauf selbst neu; Beschwerde, Versicherungsfall und Rechtsstreit
müssen im Adminbereich erneut eingetragen werden. Das Skript fragt
ausdrücklich danach, statt es stillschweigend zu übergehen.

---

## Prüfen

```bash
# Die Regeln allein, ohne Datenbank:
npx tsx pruefung/S/s-fristen.mjs            # 39 Prüfungen

# Gegen die echte Datenbank:
npx tsx --env-file=.env pruefung/S/s-loeschlauf.mjs   # 42 Prüfungen

# Zugangsschutz (braucht den Server auf Port 3213):
npx tsx --env-file=.env pruefung/S/s-zugang.mjs       # 17 Prüfungen
```

Geprüft wird unter anderem: jede Klasse, jeder der fünf Sperrgründe,
dass der Probelauf nichts verändert, dass die steuerrelevanten Felder
Zeichen für Zeichen erhalten bleiben, dass im Protokoll kein Name und
keine E-Mail-Adresse steht, und dass ein zweiter Lauf nichts mehr tut.

---

## Was bewusst offen bleibt

- **K1 und K2 werden nur erinnert, nicht vernichtet.** Papier.
- **Der reduzierte Zustimmungsnachweis (K3) entsteht noch nicht
  automatisch**, wenn eine vollständige Erklärung vernichtet wird. Er
  wird angelegt, wenn jemand ihn anlegt — die Vernichtung des Papiers
  passiert ohnehin von Hand, und die beiden gehören zusammen.
- **Checklisten (K5) werden noch nicht im Adminbereich erfasst.** Das
  Datenmodell und der Löschlauf stehen; ein Eingabeformular fehlt.
- **Die rechtliche Prüfung der Fristen steht aus.** Die Begründungen
  stehen in `13-loeschkonzept.md`, die offenen Punkte in dessen
  Abschnitt 6. Das ist kein Programmierfehler, sondern die Grenze
  dessen, was ohne fachkundige Prüfung feststehen kann.
