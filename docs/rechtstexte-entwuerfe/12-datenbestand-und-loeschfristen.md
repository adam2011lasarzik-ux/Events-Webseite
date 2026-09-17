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

---

# Teil II — Fristen nach Datenart

> **Stand: 17.09.2026.** Auf Wunsch von Adam getrennt nach Datenart
> statt einer pauschalen Frist.
>
> ⚠️ **Quellenlage:** `gesetze-im-internet.de` und `dejure.org` sind aus
> dieser Arbeitsumgebung netzwerkseitig gesperrt. Alle Normangaben
> stammen aus Suchergebnissen und Fachbeiträgen, **nicht aus dem
> abgerufenen amtlichen Text.** Jede Frist ist vor der Umsetzung im
> Original nachzulesen und fachlich zu bestätigen.
>
> **Nichts wurde implementiert.**

## Der Schlüssel: Beleg und Kontaktdaten trennen

Die steuerliche Aufbewahrung betrifft den **Buchungsbeleg** — Betrag,
Datum, Zahlungsbezug, Steuerausweis. Sie verlangt **nicht** die
Telefonnummer eines Teilnehmers.

Daraus folgt das ganze Konzept: **Kontaktdaten werden anonymisiert,
der Buchungssatz bleibt vollständig.** Beides ist gleichzeitig möglich.

> ✅ **Die vorhandene Anonymisierungsfunktion ist bereits genau so
> gebaut.** Sie überschreibt `kontaktVorname`, `kontaktNachname`,
> `kontaktEmail`, `kontaktTelefon` sowie alle Teilnehmernamen — und
> lässt `gesamtpreisCents`, `bezahlterBetragCents`, `bezahltAm`,
> `angemeldetAm`, `zahlungsReferenz` und die Personenzahl unangetastet.
> Es braucht keine neue Funktion, nur einen zeitgesteuerten Aufruf.

---

## Die Tabelle

| # | Datenart | Frist | Rechtsgrund / Zweck | Danach |
|---|---|---|---|---|
| **1** | **Kontaktdaten der anmeldenden Person** (Name, E-Mail, Telefon) | **keine gesetzliche Pflicht.** Empfehlung: bis zum Ablauf der regelmäßigen Verjährung — 3 Jahre zum Jahresende | Art. 6 Abs. 1 Buchst. b DSGVO; Nachweis- und Verteidigungsfähigkeit, §§ 195, 199 Abs. 1 BGB | **anonymisieren** |
| **2** | **Teilnehmernamen** | wie 1 | wie 1 | **anonymisieren** |
| **3** | **Einwilligungsnachweise** (Vormund, Fotos — die beiden Häkchen) | solange die Einwilligung wirkt, danach bis Verjährung | Art. 7 Abs. 1 DSGVO — Nachweispflicht des Verantwortlichen | **anonymisieren**, Häkchenwert bleibt ohne Personenbezug |
| **4** | **Buchungs- und Zahlungsdaten** (Betrag, Datum, Zahlungsstatus, Stripe-Referenz) | **8 Jahre** | § 147 Abs. 3 AO — Buchungsbelege, seit 01.01.2025 acht statt zehn Jahre (4. Bürokratieentlastungsgesetz) | **behalten**, ohne Personenbezug |
| **5** | **Rechnungen und steuerliche Unterlagen** | **8 Jahre** (Belege) bzw. **10 Jahre** (Jahresabschlüsse, Inventare, Organisationsunterlagen) | § 147 AO, § 257 HGB | **behalten** |
| **6** | **Einverständniserklärungen Minderjähriger** (Papier, ohne Gesundheitsangaben) | **offen — Entscheidung nötig.** Siehe Abwägung unten | Nachweis der Zustimmung; §§ 195, 199 Abs. 1 BGB gegen § 199 Abs. 2 BGB | **vernichten** |
| **7** | **Gesundheitsangaben auf dem Formular** | **30 Tage nach Veranstaltungsende** | Art. 9 Abs. 2 Buchst. a DSGVO, Datenminimierung. **Bereits geltende Zusage** in Datenschutz Abschnitt 2 | **vernichten** — gilt unverändert |
| **8** | **E-Mail-Benachrichtigungen an den Veranstalter** | wie 1 — 3 Jahre. Keine gesetzliche Aufbewahrungspflicht, da kein Handelsbrief | Art. 6 Abs. 1 Buchst. f DSGVO | **löschen** per Postfachregel |
| **9** | **Bestätigungs- und Stornomails an Teilnehmende** (Ordner „Gesendet") | wie 8 | wie 8 | **löschen** per Postfachregel |
| **10** | **Server-Protokolle** | 14 Tage Nginx, 7 Tage Journal | Art. 6 Abs. 1 Buchst. f DSGVO — Betriebssicherheit | **löschen**, läuft bereits automatisch |
| **11** | **Missbrauchsschutz** (IP im Klartext) | 60 Minuten | Art. 6 Abs. 1 Buchst. f DSGVO | **löschen**, läuft bereits automatisch |
| **12** | **Verschlüsselte Sicherungen** | 180 Tage | technische Ausfallsicherheit | **verfallen automatisch** |
| **13** | **CSV-Exporte und ausgedruckte Anwesenheitslisten** | so kurz wie möglich — Empfehlung: **nach der Veranstaltung vernichten** | kein eigener Zweck über die Veranstaltung hinaus | **vernichten** |
| **14** | **Protokoll des Adminbereichs** | Empfehlung 12 Monate | Art. 6 Abs. 1 Buchst. f DSGVO — Nachvollziehbarkeit | **löschen** |
| **15** | **Fotos von Teilnehmenden** | richtet sich nach der Einwilligung | Gruppe 4, noch offen | **löschen** |

---

## Die eine Frist, die wirklich abgewogen werden muss: Nummer 6

**Das Spannungsfeld.**

Die Einverständniserklärung ist der Nachweis, dass die
erziehungsberechtigte Person der Teilnahme zugestimmt hat — und, nach
dem Anlagenmodell, dem selbstständigen Verlassen.

| Für eine **kurze** Frist | Für eine **lange** Frist |
|---|---|
| Datenminimierung, Art. 5 Abs. 1 Buchst. c DSGVO | **§ 199 Abs. 2 BGB:** Schadensersatz wegen Verletzung von Leben, Körper, Gesundheit oder Freiheit verjährt **absolut erst nach 30 Jahren** ab dem Ereignis — kenntnisunabhängig |
| Papierlagerung ist unpraktisch | Bei einer Sportveranstaltung mit Minderjährigen ist genau das der realistische Streitfall |
| 3 Jahre decken den weit überwiegenden Teil ab | Ohne Formular lässt sich nach Jahren nicht mehr belegen, dass zugestimmt wurde |

**Drei gangbare Wege:**

1. **3 Jahre zum Jahresende.** Deckt die regelmäßige Verjährung ab.
   Restrisiko: ein Personenschaden, der später geltend gemacht wird.
2. **10 Jahre.** Deutlich längerer Schutz bei überschaubarem Bestand —
   ein Ordner je Veranstaltung. Braucht eine tragfähige Begründung in
   der Datenschutzerklärung.
3. **Gestuft:** Das vollständige Formular 3 Jahre, danach nur noch ein
   reduzierter Nachweis (Name, Veranstaltung, Datum, „Zustimmung lag
   vor") für die restliche Zeit. Datensparsam **und** beweisfähig.

> **Empfehlung: Weg 3.** Er löst das Spannungsfeld, statt es zu einer
> Seite hin aufzulösen. Er ist aber der einzige der drei, der eine
> bewusste organisatorische Umsetzung braucht.
>
> ⚖️ **Diese Frist gehört ausdrücklich in die fachliche Prüfung.** Die
> Abwägung zwischen Datenminimierung und Beweisvorsorge bei
> Personenschäden ist eine juristische Wertung, keine technische.

---

## Was das für die Umsetzung bedeutet

| Ort | Automatisierbar? | Was zu bauen wäre |
|---|---|---|
| Datenbank, Nummern 1–3 | **ja** | nächtlicher Lauf, der fällige Anmeldungen an die vorhandene Funktion übergibt |
| Datenbank, Nummern 4–5 | — | nichts; der Buchungssatz bleibt ohnehin |
| Nummer 14 | **ja** | im selben Lauf |
| Nummern 8–9 (Postfach) | **teilweise** | Regel im Postfach bei Hostinger, nicht in der Anwendung |
| Nummern 10–12 | **läuft bereits** | nichts |
| Nummern 6–7, 13 (Papier) | **nein** | organisatorische Regel, gehört in die Veranstaltungscheckliste |

**Der Aufwand liegt bei einem Skript und einem systemd-Timer** nach dem
Muster von `vera-sicherung.timer`. Die eigentliche Arbeit ist nicht der
Bau, sondern die Entscheidung über Nummer 6.

---

## Offene Punkte dieser Tabelle

| # | Frage |
|---|---|
| L-1 | **Frist für die Einverständniserklärungen** — 3 Jahre, 10 Jahre oder gestuft? |
| L-2 | Stellt VERA überhaupt Rechnungen aus? Gegenüber Privatpersonen besteht dafür in der Regel keine Pflicht. Falls ja, gilt Nummer 5 mit Namen |
| L-3 | Ist VERA buchführungspflichtig, oder reicht die Einnahmenüberschussrechnung? Das ändert nichts an den acht Jahren für Belege, wohl aber am Umfang der übrigen Unterlagen |
| L-4 | Wo werden Papierformulare zwischen Veranstaltung und Vernichtung aufbewahrt, und wie werden sie vernichtet? |
| L-5 | Sollen die drei Fristen für Kontaktdaten, Adminprotokoll und Postfach gleich lang sein? Einheitlichkeit erleichtert die Erklärung erheblich |

---

# Teil III — Einverständniserklärungen: Aufbewahrung und reduzierter Nachweis

> **Stand: 17.09.2026.** Auf ausdrückliche Anforderung erstellt: erst die
> fachliche Klärung, dann die Frist.
>
> ⚠️ **Das ist keine Rechtsberatung.** Es ist eine begründete
> Einschätzung mit benannten Quellen, die vor der Umsetzung fachkundig
> zu bestätigen ist. **Nichts wurde implementiert, keine Frist gesetzt,
> keine automatische Löschung eingerichtet.**
>
> **Quellenlage unverändert:** `gesetze-im-internet.de` und `dejure.org`
> sind aus dieser Arbeitsumgebung gesperrt. Alle Normangaben stammen aus
> Suchergebnissen und Fachbeiträgen.

---

## 1. Auf welcher Grundlage darf überhaupt länger aufbewahrt werden?

**Art. 17 Abs. 3 Buchst. e DSGVO.** Die Löschpflicht gilt nicht, soweit
die Daten „zur Geltendmachung, Ausübung oder Verteidigung von
Rechtsansprüchen erforderlich" sind. Das ist die Grundlage für
Beweisvorsorge — und zugleich ihre Grenze, denn sie verlangt
*Erforderlichkeit*.

**Zwei Feststellungen aus den geprüften Fachbeiträgen sind dabei
entscheidend:**

1. Die Interessenabwägung darf **nicht abstrakt** erfolgen. Sie muss die
   Interessen der betroffenen Person und die **Wahrscheinlichkeit**
   berücksichtigen, dass Ansprüche tatsächlich geltend gemacht werden.
2. **„Mit zunehmendem Zeitablauf wird diese Rechtfertigung schwächer."**

> **Punkt 2 ist die Antwort auf die gestellte Frage.** Wenn die
> Rechtfertigung mit der Zeit schwächer wird, ist der richtige Umgang
> nicht „alles behalten" oder „alles löschen", sondern **den Bestand
> mit der Zeit zu verringern.** Genau das ist ein reduzierter Nachweis.

---

## 2. Ist ein gestufter, reduzierter Nachweis zulässig?

**Ja — und er ist nicht nur zulässig, sondern das anerkannte Vorgehen.**

**DIN 66398** („Leitlinie zur Entwicklung eines Löschkonzepts mit
Ableitung von Löschfristen für personenbezogene Daten", Mai 2016) ist
der in Deutschland maßgebliche Standard dafür. Ihr Kern ist genau diese
Systematik:

- Datenarten werden **Löschklassen** zugeordnet,
- jede Klasse hat eine **Regelfrist** und einen definierten Startzeitpunkt,
- unterschiedliche Datenarten desselben Vorgangs dürfen **unterschiedlich
  lange** aufbewahrt werden.

Ein Löschkonzept, das ein Formular nach drei Jahren durch einen
reduzierten Nachweis ersetzt, ist damit kein Behelf, sondern ein
lehrbuchmäßiger Anwendungsfall von Art. 5 Abs. 1 Buchst. c
(Datenminimierung) und Buchst. e DSGVO (Speicherbegrenzung).

---

## 3. ⚠️ Die Feststellung, die das Ergebnis dreht

In Teil II hatte ich § 199 Abs. 2 BGB — die 30-jährige Höchstfrist für
Personenschäden — als Argument für eine **lange** Aufbewahrung der
Formulare angeführt. **Bei genauerer Betrachtung trägt dieses Argument
nicht, jedenfalls nicht für das Formular.**

**Der Grund: Die Einverständniserklärung beweist die falsche Tatsache.**

| Streitfall | Was strittig ist | Beweist das Formular das? |
|---|---|---|
| Ein Teilnehmer verletzt sich | Hat VERA eine Pflicht verletzt — Verkehrssicherung, Einweisung, Ausrüstung? | **nein** |
| Ein Elternteil sagt, das Kind sei ohne Zustimmung dort gewesen | Lag eine Zustimmung vor? | **ja** |
| Streit über die selbstständige Abreise | War sie erlaubt? | **ja** |

Bei einem **Personenschaden** ist der umkämpfte Punkt regelmäßig die
Pflichtverletzung, nicht die Zustimmung. Dass die Eltern der Teilnahme
zugestimmt haben, hilft VERA dort wenig — eine Zustimmung zur Teilnahme
ist keine Einwilligung in eine Pflichtverletzung.

Die beiden Streitfälle, für die das Formular **wirklich** das
Beweismittel ist, haben eine andere Eigenschaft: **Sie werden zeitnah
geltend gemacht.** Ein Elternteil, das von der Teilnahme nichts wusste,
meldet sich in Tagen oder Wochen, nicht nach acht Jahren.

> **Folge:** Die Wahrscheinlichkeit, dass das vollständige Formular nach
> Jahren noch gebraucht wird, ist **gering** — und genau diese
> Wahrscheinlichkeit verlangt die Abwägung nach Art. 17 Abs. 3 Buchst. e
> DSGVO zu berücksichtigen. Das spricht für eine **kürzere** Frist als
> in Teil II angenommen.

---

## 4. Was das eigentliche Langzeit-Beweismittel ist

Wenn der umkämpfte Punkt die **Pflichtverletzung** ist, dann ist das
wertvolle Beweismittel nicht das Formular, sondern der Nachweis, dass
VERA seine Pflichten erfüllt hat:

- dass die **Sicherheitseinweisung** stattgefunden hat (Entscheidung 3.22),
- wer sie durchgeführt hat und wann,
- dass die Ausrüstung in Ordnung war,
- welche Regeln galten.

**Das steht auf der Veranstaltungscheckliste — und die enthält keine
personenbezogenen Daten.**

> ✅ **Damit löst sich das Spannungsfeld fast vollständig auf.** Das
> Beweismittel, das man lange braucht, ist nicht personenbezogen und
> kann unbefristet aufbewahrt werden. Das Beweismittel, das
> personenbezogen ist, braucht man nur kurz.
>
> **Regel: nicht-personenbezogene Nachweise lang, personenbezogene kurz.**

---

## 5. Empfehlung

| Stufe | Was | Wie lange | Grundlage |
|---|---|---|---|
| **1** | **Vollständiges Formular** — Name, Geburtsdatum, Mobilnummer, Zustimmungen | **3 Jahre zum Jahresende** nach der Veranstaltung | §§ 195, 199 Abs. 1 BGB; Art. 17 Abs. 3 Buchst. e DSGVO |
| **2** | **Reduzierter Nachweis** — Name der minderjährigen Person, Veranstaltung, Datum, Vermerk „Zustimmung lag vor" und „selbstständiges Verlassen gestattet/nicht gestattet" | **weitere 7 Jahre** (bis 10 Jahre gesamt) | Art. 6 Abs. 1 Buchst. f DSGVO, abnehmende Rechtfertigung nach Art. 17 Abs. 3 Buchst. e DSGVO |
| **3** | **Veranstaltungscheckliste** — Einweisung, Ablauf, Personal, ohne Teilnehmernamen | **unbefristet** | kein Personenbezug, daher keine Löschpflicht |
| **—** | **Gesundheitsangaben** | **30 Tage** nach Veranstaltungsende | unverändert; bereits geltende Zusage |

**Warum Stufe 2 sieben Jahre und nicht dreißig:** Dreißig Jahre wären
mit der abnehmenden Rechtfertigung nicht zu begründen. Zehn Jahre
gesamt liegen in der Größenordnung der längsten handels- und
steuerrechtlichen Fristen und sind damit ein Maß, das sich erklären
lässt. Es bleibt eine Wertung.

**Warum Stufe 2 überhaupt:** Sie kostet fast nichts — eine Zeile je
Teilnehmer — und deckt den einzigen Fall ab, in dem das Formular
tatsächlich zählt.

---

## 6. Steuerliche Aufbewahrung — ausdrücklich unberührt

> **Anforderung von Adam, wörtlich:** „Alle gesetzlichen
> Aufbewahrungspflichten für Rechnungen, Buchungsbelege und sonstige
> steuerrelevante Unterlagen müssen unabhängig von der Anonymisierung
> der Teilnehmerdaten eingehalten werden."

**Das ist mit dem Konzept vereinbar, und zwar ohne Kompromiss.** Die
beiden Bereiche berühren sich nicht:

| | Anonymisierung der Teilnehmerdaten | Steuerliche Aufbewahrung |
|---|---|---|
| **Betrifft** | `kontaktVorname`, `kontaktNachname`, `kontaktEmail`, `kontaktTelefon`, Teilnehmernamen | Betrag, Datum, Zahlungsstatus, Zahlungsreferenz, Belege, Kontoauszüge, Stripe-Abrechnungen |
| **Frist** | 3 Jahre | **8 Jahre** (Belege, § 147 Abs. 3 AO) bzw. **10 Jahre** (Abschlüsse) |
| **Vorgang** | überschreiben | unverändert behalten |

Die vorhandene Anonymisierungsfunktion fasst **kein einziges**
steuerrelevantes Feld an — geprüft in `app/admin/anmeldungen/aktion.ts`.

> ⚠️ **Eine Ausnahme, die beachtet werden muss:** Enthält ein Dokument
> selbst einen Namen **und ist es zugleich ein Buchungsbeleg** — etwa
> eine ausgestellte Rechnung —, dann gilt für dieses Dokument die
> steuerliche Frist **mitsamt dem Namen.** Die Anonymisierung darf es
> nicht erfassen.
>
> `[VOR VERWENDUNG KLÄREN (L-2): Stellt VERA überhaupt Rechnungen mit
> Namen aus? Gegenüber Privatpersonen besteht dafür in der Regel keine
> Pflicht. Falls nein, tritt dieser Fall nicht ein und die Trennung ist
> vollständig sauber.]`

---

## 7. Was jetzt zu tun ist — und was ausdrücklich nicht

| | |
|---|---|
| ✅ **Getan** | fachliche Einschätzung mit Quellen, gestuftes Konzept vorgeschlagen |
| ⛔ **Nicht getan, wie angewiesen** | keine Frist gesetzt, keine automatische Löschung eingerichtet, kein Code geändert |
| ⚖️ **Vor der Umsetzung** | Bestätigung der Stufen 1 und 2 durch die fachkundige Prüfung — insbesondere der Abwägung nach Art. 17 Abs. 3 Buchst. e DSGVO und der Frage, ob der reduzierte Nachweis in dieser Form ausreicht |
| 📋 **Danach** | Löschkonzept nach DIN 66398 als eigenes Dokument, mit den Löschklassen aus Teil II |

**Die Formulare werden bis dahin unverändert aufbewahrt.** Es wird
nichts vernichtet, solange die Frist nicht bestätigt ist — das ist die
sichere Richtung, weil eine zu lange Aufbewahrung sich heilen lässt, eine
zu frühe Vernichtung nicht.
