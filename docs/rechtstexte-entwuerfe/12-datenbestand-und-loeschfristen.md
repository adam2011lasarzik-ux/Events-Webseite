# 12 — Wo personenbezogene Daten liegen, und wie lange

> **Stand: 17.09.2026.** Vollständig aus dem Code und der
> Serverdokumentation erhoben. **Nichts wurde geändert oder gelöscht.**
>
> Grundlage für Entscheidung 1.12 (Aufbewahrungsfrist) und für
> Abschnitt 15 der Datenschutzerklärung.
>
> *(Die Veranstaltungscheckliste, früher als Dokument 12 vorgesehen,
> wird dadurch zu Dokument 13.)*

---

## 1. Die neun Orte auf einen Blick

| # | Ort | Enthält | Heutige Aufbewahrung |
|---|---|---|---|
| 1 | **Datenbank — Anmeldungen** | Name, E-Mail, Telefon, Einwilligungen, Betrag, Zahlungsbezug | **unbegrenzt** ⚠️ |
| 2 | **Datenbank — Teilnehmer** | Vor- und Nachname, Art | **unbegrenzt** ⚠️ |
| 3 | **Datenbank — Missbrauchsschutz** | IP-Adresse im Klartext | 60 Minuten, automatisch |
| 4 | **Datenbank — Adminzugang** | E-Mail und Passwort-Hash des Betreibers | unbegrenzt (gewollt) |
| 5 | **Server-Protokolle** | gekürzte IP, Adresse, Browserkennung | ~14 Tage Nginx, 7 Tage Journal, automatisch |
| 6 | **Sicherungen bei Backblaze B2** | **alles aus der Datenbank**, verschlüsselt | **180 Tage**, automatisch |
| 7 | **CSV-Exporte** | alles inkl. Einwilligungen | **unbegrenzt auf dem Gerät des Betreibers** ⚠️ |
| 8 | **E-Mail-Postfach bei Hostinger** | Name, E-Mail, Telefon, Teilnehmerliste, Betrag | **unbegrenzt** ⚠️ |
| 9 | **Papierformulare** | Name, Geburtsdatum, Mobilnummer, Gesundheitsangaben | Gesundheitsangaben 30 Tage, Rest ungeregelt ⚠️ |

Dazu, außerhalb der Anmeldedaten: **Stripe** (Betrag, Anmeldenummer,
E-Mail, Eventtitel, Personenzahl — Aufbewahrung durch Stripe, nicht
durch VERA) und **hochgeladene Bilder** (`/var/vera-bilder`, unbegrenzt).

---

## 2. Die einzelnen Orte im Detail

### 2.1 Datenbank — Tabelle `Registration`

| Feld | Inhalt |
|---|---|
| `kontaktVorname`, `kontaktNachname` | Name der anmeldenden Person |
| `kontaktEmail` | Pflichtangabe |
| `kontaktTelefon` | freiwillig, nullable |
| `einwilligungVormund`, `einwilligungFotos` | die beiden Häkchen |
| `gesamtpreisCents`, `bezahlterBetragCents`, `bezahltAm` | Zahlungsdaten |
| `zahlungsReferenz`, `zahlungsAbsicht` | Stripe-Kennungen |
| `stornoSchluessel` | Zufallswert, steht auch in der Bestätigungsmail |
| `angemeldetAm`, `storniertAm`, `reaktiviertAm`, `anonymisiertAm` | Zeitstempel |

**Aufbewahrung: unbegrenzt.** Es gibt keine automatische Löschung.

### 2.2 Datenbank — Tabelle `Participant`

`vorname`, `nachname`, `typ` (Schüler/Erwachsener), `geburtsjahr`.

> **Nebenbefund:** `geburtsjahr` wird **nirgends im Code geschrieben.**
> Der einzige Zugriff darauf ist das Nullsetzen beim Anonymisieren. Das
> Feld ist seit seiner Anlage leer. Es kann entweder entfernt oder
> bewusst für eine spätere Nutzung stehen gelassen werden — als
> Datenbestand ist es derzeit gegenstandslos.

### 2.3 Datenbank — Tabelle `AnmeldeVersuch`

`kennung` (die **ungekürzte IP-Adresse im Klartext**) und `zeitpunkt`.
Einträge werden automatisch entfernt, sobald sie älter als 60 Minuten
sind. Die E-Mail-Adresse wird für die kontobezogene Bremse gehasht, die
IP nicht — bereits als Befund T-3 festgehalten.

### 2.4 Datenbank — Protokoll des Adminbereichs

`AdminProtokoll` hält Zeitpunkt, Admin-Kennung, Aktion und ein
Detailfeld. **Geprüft: das Detailfeld enthält keine Personendaten** —
nur Statuswechsel („RESERVIERT → BESTAETIGT"), Zählungen und
„geändert"/„neu angelegt". Es enthält aber die **Kennung der betroffenen
Anmeldung**, ist also ein Zeiger auf einen Datensatz.

### 2.5 Server-Protokolle

Nginx: Zeitpunkt, Adresse, Browserkennung, Verweisquelle, Host — und
die **gekürzte** IP-Adresse (letzte Stelle verworfen, seit 08.09.2026).
Täglich gedreht, 14 Generationen. System-Journal 7 Tage, max. 1 GB.

> **Geprüft und erfreulich:** Eine Volltextsuche über `lib/` und `app/`
> nach `console.log`, `console.error` und `console.warn` in Verbindung
> mit `email`, `vorname`, `nachname`, `telefon` oder `kontakt` ergibt
> **keinen einzigen Treffer.** Die Anwendung protokolliert keine
> Personendaten.

### 2.6 Sicherungen bei Backblaze B2 — die eigentliche Grenze

Jede Nacht um 03:30 Uhr wird die **gesamte Datenbank** gesichert, mit
`age` verschlüsselt und hochgeladen. Objektsperre 90 Tage, Aufbewahrung
180 Tage.

> ⚠️ **Das setzt die Untergrenze für jede Löschzusage.** Wird eine
> Anmeldung heute anonymisiert, steht sie in den Sicherungen der
> letzten 180 Tage weiterhin im Klartext — innerhalb der
> verschlüsselten Datei. Erst nach 180 Tagen ist sie überall weg.
>
> **Die tatsächliche Löschfrist ist also immer: gewählte Frist + 180
> Tage.** Das gehört in die Datenschutzerklärung, statt eine Löschung
> zu versprechen, die so nicht stattfindet.

### 2.7 CSV-Exporte

**Geprüft: Die Datei wird nicht auf dem Server gespeichert.** Sie wird
erzeugt und direkt an den Browser ausgeliefert (`Content-Disposition:
attachment`). Auf dem Server bleibt nichts zurück.

**Aber sie liegt danach auf dem Gerät des Betreibers** — und enthält
fünfzehn Spalten:

> Anmeldenummer · Angemeldet am · Status · Zahlung · Betrag ·
> Buchungsart · **Kontakt Vorname · Kontakt Nachname · E-Mail ·
> Telefon** · Einwilligung Erziehungsberechtigte · Fotos erlaubt ·
> **Teilnehmer Vorname · Teilnehmer Nachname** · Teilnehmer Art

Das ist der vollständige Datensatz, eine Zeile je Teilnehmer.
Ausgedruckt als Anwesenheitsliste (Entscheidung 3.27) existiert er
zusätzlich auf Papier.

`[VOR VERWENDUNG KLÄREN: Wie lange werden heruntergeladene CSV-Dateien
und ausgedruckte Anwesenheitslisten aufbewahrt, und wo? Das ist die
Stelle, an der Daten das System verlassen und keiner technischen
Löschung mehr zugänglich sind.]`

### 2.8 ⚠️ E-Mail-Postfach — der Fund, der in keiner Erklärung steht

Bei **jeder** neuen Anmeldung geht eine Benachrichtigung an den
Veranstalter. Ihr Inhalt, wörtlich aus `lib/mailVorlagen.ts`:

```
Kontakt: {Vorname} {Nachname}
E-Mail:  {E-Mail-Adresse}
Telefon: {Telefonnummer}

Teilnehmer:
{vollständige Teilnehmerliste}

Betrag: {Betrag}
Anmeldenummer: {Kennung}
```

Diese Mails liegen im Postfach `kontakt@veraevents.de` bei Hostinger —
**unbegrenzt, und außerhalb jeder Anonymisierung.** Wird eine Anmeldung
in der Datenbank anonymisiert, bleibt die Mail mit allen Daten
unverändert im Posteingang.

Dasselbe gilt für die Bestätigungs- und Stornomails im Ordner
„Gesendet".

> **Das ist der praktisch wichtigste Befund dieser Bestandsaufnahme.**
> Eine Anonymisierungsfunktion, die das Postfach nicht erreicht, löscht
> die Daten nicht — sie löscht eine von mehreren Kopien.

### 2.9 Papierformulare

Die Einverständniserklärungen mit Name, Geburtsdatum, Mobilnummer der
erziehungsberechtigten Person und freiwilligen Gesundheitsangaben.

Für die **Gesundheitsangaben** gilt bereits: Löschung oder Vernichtung
spätestens 30 Tage nach Veranstaltungsende (Datenschutz Abschnitt 2).
Für die **übrigen Angaben** auf dem Formular gibt es keine Frist.

`[VOR VERWENDUNG KLÄREN: Wo werden die Papierformulare zwischen
Veranstaltung und Vernichtung aufbewahrt, und wie werden sie
vernichtet?]`

### 2.10 Stripe

Übermittelt werden Betrag, Anmeldenummer, E-Mail-Adresse, Titel der
Veranstaltung und Personenzahl. Die Aufbewahrung richtet sich nach
Stripes eigenen Fristen; VERA kann sie nicht setzen. Gehört als
Tatsache in die Erklärung, nicht als Zusage.

### 2.11 Hochgeladene Bilder

`/var/vera-bilder`, unbegrenzt. Betrifft heute Gründerfoto und
Eventbilder. **Sobald Fotos von Teilnehmenden hochgeladen werden, ist
das ein weiterer Ort mit Personendaten** — die Foto-Entscheidungen
(Gruppe 4) wirken also auch hier.

---

## 3. Kann die Löschung automatisiert werden?

**Ja, weitgehend — und der Weg dorthin ist kurz.**

### Was schon da ist

| Baustein | Stand |
|---|---|
| Anonymisierungsfunktion | **fertig.** Überschreibt `vorname`/`nachname`/`geburtsjahr` aller Teilnehmer sowie `kontaktVorname`, `kontaktNachname`, `kontaktEmail` und `kontaktTelefon` der Anmeldung; setzt `anonymisiertAm` |
| Muster für zeitgesteuerte Läufe | **fertig.** `vera-sicherung.timer` und `vera-wache.timer` laufen seit Wochen zuverlässig |
| Feld zum Wiedererkennen | **fertig.** `anonymisiertAm` verhindert Doppelläufe |

### Was fehlt

Ein nächtlicher Lauf, der alle Anmeldungen findet, deren Veranstaltung
länger als die gewählte Frist zurückliegt und die noch nicht
anonymisiert sind — und die vorhandene Funktion darauf anwendet.
**Aufwand: klein.** Ein Skript plus ein systemd-Timer nach dem Muster
der bestehenden.

### Was sich **nicht** automatisieren lässt

| Ort | Warum |
|---|---|
| **E-Mail-Postfach** | Automatisches Löschen alter Mails ist im Postfach einzustellen, nicht in der Anwendung. Möglich, aber ein getrennter Schritt |
| **CSV auf dem Gerät des Betreibers** | liegt außerhalb des Systems — nur organisatorisch lösbar |
| **Ausgedruckte Anwesenheitslisten** | Papier |
| **Sicherungen** | absichtlich unveränderlich (Objektsperre). Sie verfallen von selbst nach 180 Tagen |
| **Papierformulare** | Vernichtung von Hand |
| **Stripe** | fremdes System |

---

## 4. Was daraus für die Entscheidung folgt

1. **Eine Frist ohne Automatisierung ist wertlos** — heute wird ohne
   manuellen Eingriff nie gelöscht. Die Automatisierung ist der
   eigentliche Schritt, nicht die Zahl.
2. **Die Frist gilt effektiv plus 180 Tage** wegen der Sicherungen. Das
   muss die Datenschutzerklärung sagen.
3. **Drei Orte bleiben außerhalb der Automatik:** Postfach, CSV auf dem
   Gerät, Papier. Für sie braucht es organisatorische Regeln, sonst ist
   die technische Löschung Kosmetik.
4. **Das Postfach ist der größte ungeregelte Bestand** — dort liegt bei
   jeder Anmeldung ein vollständiger Datensatz, zeitlich unbegrenzt.
