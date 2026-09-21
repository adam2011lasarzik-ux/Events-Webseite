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
| **K8** | Widerspruch gegen Aufnahmen und Veröffentlichungsprüfung (Art. 21 DS-GVO) | 3 Jahre Nachlauf | „Aufnahmen offline“-Markierung (von Hand) | löschen — erst ab dieser Markierung fällig, davor nie |

**K1 und K2 liegen auf Papier.** Die Anwendung kann sie nicht
vernichten — sie erinnert nur daran. Das ist keine Lücke der Umsetzung,
sondern die Eigenschaft von Papier. Die Erinnerung kommt **monatlich
per Mail** über `vera-papiererinnerung.timer` (1. des Monats, 08:00
UTC) und nur dann, wenn wirklich etwas ansteht — eine monatliche Mail
„nichts zu tun" wird nach dem dritten Mal ungelesen weggeklickt, und
dann auch die vierte, in der etwas steht. Sie nennt Klasse,
Veranstaltung, Fälligkeit und Anzahl, aber **keine Namen**.

**K8 war bis zum 21.09.2026 pauschal „niemals“ — das ist seitdem
korrigiert.** Seit dem Wegfall der Foto-Einwilligung (B-17) stützen sich
die Aufnahmen auf das berechtigte Interesse; der Widerspruch nach
Art. 21 DS-GVO ist damit die **einzige** Sicherung des Konzepts. Er darf
nicht verfallen, solange Aufnahmen veröffentlicht sind — sonst stünde im
elften Jahr eine Veröffentlichung online, zu der niemand mehr sagen
könnte, ob ihr widersprochen wurde. Eine Frist **ohne jedes Ende** stand
damit aber im Widerspruch zum eigenen Konzept: Anders als K7 (echte,
berechenbare Frist, nur vom Löschlauf nicht angefasst) hatte K8 gar
keinen Endpunkt — die einzige Klasse im ganzen System ohne Löschfrist
**und** ohne Aussonderungsprüffrist nach DIN 66398, und ein Verstoß
gegen die Speicherbegrenzung nach Art. 5 Abs. 1 Buchst. e DS-GVO, sobald
der Zweck (Aufnahmen sind online) tatsächlich wegfällt.

**Die Lösung ist ereignisbezogen, wie bei K6 (Vorfall).** `Event`
bekommt drei neue Felder: `aufnahmenOfflineAm`, `aufnahmenOfflineVon`,
`aufnahmenOfflineNotiz` — von Hand gesetzt unter **Verwaltung →
Aufnahmen**, mit Datum, Bearbeiter und Prüfvermerk, **nicht
vorausgewählt** und **nicht** vom jährlichen Prüflauf allein gesetzt.
Erst ab diesem Zeitpunkt hat ein `Aufnahmewiderspruch` oder eine
`Veroeffentlichungspruefung` überhaupt ein Fälligkeitsdatum
(`faelligAufnahmewiderspruch()` in `lib/loeschfristen.ts`: **3 Jahre
Nachlauf zur Beweissicherung**, Ende des dritten Kalenderjahres nach dem
Offline-Datum). Ohne diese Markierung bleibt `faelligAm` `null` — und
ein Datensatz ohne Fälligkeit wird laut `entscheide()` nie fällig,
genau wie ein offener Vorfall. Besteht bei Fälligkeit ein Streit, eine
Beschwerde oder ein laufendes Verfahren, sperrt eine gewöhnliche
`Loeschsperre` (`zielArt: "Aufnahmewiderspruch"` bzw.
`"Veroeffentlichungspruefung"`) die Löschung wie bei jeder anderen
Klasse — nach deren Abschluss wird erneut geprüft und gelöscht.

Wird ein Widerspruch zurückgenommen, bleibt die Zeile trotzdem stehen:
Sie belegt, dass zwischen Erklärung und Rücknahme einer bestand.
Verwaltet wird beides unter **Verwaltung → Aufnahmen**.

**Seit 21.09.2026 (B-14) gibt es eine zweite, vorgelagerte Absicherung:
die Veröffentlichungen selbst.** Bis dahin war „Aufnahmen offline
setzen" eine reine Vertrauensfrage — nichts hinderte daran, die
Markierung zu setzen, während eine Aufnahme tatsächlich noch irgendwo
veröffentlicht war. Das Modell `Veroeffentlichung` schließt diese
Lücke: Jede Veröffentlichung eines Events (Ort, Verantwortlicher — VERA
oder die Veranstaltungsstätte —, Zweck) wird unter **Verwaltung →
Aufnahmen** einzeln festgehalten und beim endgültigen Entfernen als
`entferntAm` markiert. `aufnahmenOfflineSetzen()` in `lib/aufnahmen.ts`
prüft **vor** jeder K8-Offline-Feststellung, ob noch mindestens eine
Veröffentlichung dieses Events ohne `entferntAm` dasteht — ist das der
Fall, wird die Feststellung mit `VeroeffentlichungenNochOffen`
verweigert. Ein Event **ohne** jede erfasste `Veroeffentlichung` (etwa
eine ältere Veranstaltung von vor B-14) bleibt davon unberührt und lässt
sich wie bisher offline setzen — sonst wäre jede bestehende Veranstaltung
rückwirkend blockiert.

**`Veroeffentlichung` selbst trägt keine Löschklasse und wird vom
Löschlauf nicht angefasst.** Sie enthält keine personenbezogenen Daten
der Teilnehmenden — nur organisatorische Fakten (Ort, Verantwortlicher,
Zweck, Zeitpunkte, Bearbeiter) — und wird wie `AdminProtokoll` auf Dauer
als Rechenschaftsnachweis nach Art. 5 Abs. 2 DS-GVO aufbewahrt: Sie belegt
später, wohin eine Aufnahme ging und wann sie entfernt wurde. Eine eigene
`Loeschsperre` auf `Veroeffentlichung` wäre deshalb wirkungslos (es gibt
nichts, was sie sperren könnte) und ist bewusst nicht vorgesehen — die
vom Nutzer verlangte Sperre bei Streit, Beschwerde oder laufendem
Verfahren wirkt weiterhin dort, wo sie etwas bewirkt: auf den K8-Datensätzen
selbst (`Aufnahmewiderspruch`, `Veroeffentlichungspruefung`), wie oben
beschrieben.

**Wichtig, damit hier nichts missverstanden wird:** `Veroeffentlichung`
ist ein Nachweis- und Arbeits­werkzeug, **keine automatisierte Löschung**
extern gehosteter Inhalte. VERA kann einen Instagram- oder TikTok-Beitrag
der Veranstaltungsstätte technisch nicht selbst entfernen — das
„Entfernen" in diesem Modell bedeutet ausschließlich: Ein Mensch hat
geprüft und dokumentiert, dass die Aufnahme an diesem Ort nicht mehr
veröffentlicht ist.

**K7 ist der Riegel — K8 nicht.** `entscheide()` in
`lib/loeschfristen.ts` prüft die Steuerrelevanz an **erster** Stelle,
noch vor der Sperre. Wer die Reihenfolge tauscht, könnte eine
steuerrelevante Zeile anfassen, nur weil zufällig keine Sperre darauf
lag. K8 braucht diesen Riegel nicht: Seine Klasse selbst darf der
Löschlauf grundsätzlich anfassen (`loeschen`), geschützt wird sie
ausschließlich über das fehlende `faelligAm`. Die Reihenfolge ist:

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
| `prisma/papiererinnerung.ts`, `server/vera-papiererinnerung.*` | Monatliche Erinnerung an Papierunterlagen. |

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

Schritt für Schritt, mit Sicherungskontrolle, Trockenlauf und
Gegenprobe, steht das in
**[`loeschkonzept-produktivsetzung.md`](loeschkonzept-produktivsetzung.md)**.
Das ist der Weg, der beim ersten Mal zu gehen ist.

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

**Namen, E-Mail-Adresse, Veranstaltung und Datum stehen in Klartext**
— sowohl in den beiden Vorschau-Tabellen als auch bei den offenen
Sperren. Ohne das war die Seite im Betrieb kaum benutzbar: Man konnte
nicht entscheiden, ob eine Sperre noch nötig ist, ohne jede Kennung
einzeln in der Datenbank nachzuschlagen. Die Kennung bleibt trotzdem
sichtbar — klein, gedämpft, mit einem Knopf zum Kopieren — weil man
sie braucht, um den Datensatz anderswo wiederzufinden.

Nichts davon wird zusätzlich gespeichert: Name, E-Mail und
Veranstaltung werden bei jedem Aufruf der Seite aus der jeweiligen
Anmeldung, Checkliste, dem Vorfall oder Zustimmungsnachweis
nachgeschlagen. Eine Kopie in einer eigenen Tabelle wäre eine zweite
Stelle mit Personendaten — und sie bliebe nach dem Anonymisieren
stehen, obwohl die Person genau das nicht mehr wollte.

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

# Monatliche Papiererinnerung:
npx tsx --env-file=.env pruefung/S/s-papier.mjs       # 11 Prüfungen
```

Geprüft wird unter anderem: jede Klasse, jeder der fünf Sperrgründe,
dass der Probelauf nichts verändert, dass die steuerrelevanten Felder
Zeichen für Zeichen erhalten bleiben, dass im Protokoll kein Name und
keine E-Mail-Adresse steht, und dass ein zweiter Lauf nichts mehr tut.

---

## Rechnungen und Buchungsbelege

**Heute erzeugt VERA keine Rechnungen.** Nachgesehen, nicht vermutet:

- Im Code kommt kein Rechnungs-, Beleg- oder Quittungsdokument vor.
  Die Treffer auf „Rechnung" sind Rechenvorgänge, die auf „belegt"
  sind belegte Plätze.
- Die Stripe-Sitzung läuft mit `mode: "payment"` **ohne**
  `invoice_creation` (`lib/zahlung.ts`). Stripe erzeugt damit keine
  Rechnung.
- Die Zahlungsbestätigung per Mail ist eine Bestätigung, keine
  Rechnung: kein Rechnungsdatum, keine fortlaufende Nummer, keine
  Verkäuferangaben, keine Steuerausweisung (Kleinunternehmer nach
  § 19 UStG). Sie wird verschickt, nicht als Dokument gespeichert.

**Die Regel, sobald sich das ändert.** Werden je Rechnungen mit
personenbezogenen Angaben erzeugt, gilt für sie:

1. Sie sind **eigenständige Buchungsbelege**, nicht Teil der
   Teilnehmerdaten.
2. Sie werden **unverändert** aufbewahrt — mindestens acht Jahre nach
   § 147 Abs. 3 AO, gerechnet ab dem Ende des Kalenderjahres.
3. Der Teilnehmer-Löschlauf fasst sie **nie** an.

Punkt 3 ist bereits gebaut und braucht keine neue Mechanik: Die Klasse
`STEUERUNTERLAGEN` wird von `entscheide()` an allererster Stelle
ausgeschlossen, noch vor jeder Sperrprüfung, und ihre Aktion heißt
ausdrücklich `"niemals"`. Das ist **strenger** als acht Jahre — es wird
gar nicht automatisch gelöscht, sondern von Hand entschieden, wenn die
Frist abgelaufen ist. Ein Rechnungsdatensatz bekommt diese Klasse und
ist damit vom ersten Tag an außerhalb der Reichweite des Löschlaufs.

Was in dem Fall zusätzlich zu tun wäre: ein Ablageort, der ein
Deployment übersteht (wie `BILDER_VERZEICHNIS`), und eine fortlaufende
Nummernvergabe. Beides ist eigene Arbeit und steht hier nur, damit es
beim nächsten Mal nicht neu gefunden werden muss.

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
