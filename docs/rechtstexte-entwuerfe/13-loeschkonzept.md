# 13 — Löschkonzept

> **Stand: 17.09.2026, Entwurf.** Aufgebaut nach der Systematik von
> **DIN 66398** (Löschklassen, Aussonderungsprüffrist, Löschfrist).
>
> ⛔ **Nichts implementiert.** Keine Frist ist gesetzt, kein Code
> geändert, keine automatische Löschung eingerichtet.
>
> ⚠️ **Quellenlage:** `gesetze-im-internet.de` und `dejure.org` sind aus
> dieser Arbeitsumgebung gesperrt. Alle Normangaben stammen aus
> Suchergebnissen und Fachbeiträgen, nicht aus dem abgerufenen amtlichen
> Text. **Jede Frist ist vor der Umsetzung im Original nachzulesen.**
>
> *(Die Veranstaltungscheckliste, zuvor als Dokument 12 und dann 13
> vorgesehen, wird dadurch zu Dokument 14.)*

---

## Vorbemerkung: eine Korrektur

**In Dokument 12, Teil III hatte ich geschrieben, die
Veranstaltungscheckliste enthalte keine personenbezogenen Daten und
könne unbefristet aufbewahrt werden. Das war falsch.**

Sie enthält **Mitarbeiterkürzel** — und ein Kürzel, das VERA einer
Person zuordnen kann, ist ein personenbezogenes Datum nach Art. 4 Nr. 1
DSGVO. Pseudonymisierung ist keine Anonymisierung.

Die Einzelheiten und die Folge daraus stehen in **Klasse 5**.

---

## 1. Die Systematik

Drei Begriffe, die im Konzept durchgehend getrennt bleiben:

| Begriff | Bedeutung |
|---|---|
| **Startzeitpunkt** | das Ereignis, ab dem gerechnet wird — maschinell auswertbar |
| **Aussonderungsprüffrist** | wann geprüft wird, ob noch ein Grund zur Aufbewahrung besteht |
| **Löschfrist** | wann spätestens gelöscht oder anonymisiert wird |

**Warum die Prüffrist wichtig ist:** Nach Art. 17 Abs. 3 Buchst. e DSGVO
wird die Rechtfertigung für eine Aufbewahrung mit zunehmendem
Zeitablauf schwächer. Eine Prüffrist bildet das ab, statt bis zum Ende
stillzuhalten.

---

## 2. Die Löschsperre

Dreh- und Angelpunkt des Konzepts. **Ohne sie darf keine automatische
Löschung scharf geschaltet werden** — sonst vernichtet der nächtliche
Lauf genau die Unterlagen, die im Streitfall gebraucht werden.

### Was sie tut

Sie setzt die Löschung **für einzelne Datensätze** aus — nicht für
ganze Klassen und nicht für die ganze Veranstaltung.

### Wann sie gesetzt wird

| Anlass | Umfang |
|---|---|
| **Unfall oder Verletzung** | die betroffene Anmeldung samt Teilnehmern, die Checkliste der Veranstaltung, alle Gesundheitsangaben dieser Person |
| **Beschwerde** | die betroffene Anmeldung |
| **Rückbuchung oder Zahlungsstreit** | die betroffene Anmeldung und ihre Zahlungsdaten |
| **Versicherungsfall** | wie bei Unfall, zusätzlich die Vorfallakte |
| **Drohender oder laufender Rechtsstreit** | alles, was der Gegenstand berührt |

### Vorgeschlagene technische Form

```
model Loeschsperre {
  id            String    @id @default(cuid())
  zielArt       String    // "Registration" | "Veranstaltung" | "Vorfall"
  zielId        String
  grund         String    // Unfall | Beschwerde | Rueckbuchung |
                          // Versicherung | Rechtsstreit
  gesetztAm     DateTime  @default(now())
  gesetztVon    String    // Admin-Kennung
  aufgehobenAm  DateTime?
  notiz         String?   @db.Text

  @@index([zielArt, zielId, aufgehobenAm])
}
```

**Regel für jeden Löschlauf:** Existiert zu einem Datensatz eine
Löschsperre ohne `aufgehobenAm`, wird er übersprungen und im Protokoll
vermerkt. Kein Datensatz wird stillschweigend ausgelassen.

**Aufhebung** nur von Hand, mit Grund und Zeitpunkt. Nach der Aufhebung
greift die reguläre Frist — gerechnet ab dem ursprünglichen
Startzeitpunkt, nicht ab der Aufhebung.

`[VOR VERWENDUNG KLÄREN: Soll nach Aufhebung eine Mindestnachlauffrist
gelten, etwa 12 Monate? Dafür spricht, dass ein gerade abgeschlossener
Streit wieder aufleben kann.]`

---

## 3. Die sieben Datenklassen

### Klasse 1 — Gesundheits- und Notfallangaben

| | |
|---|---|
| **Umfasst** | freiwillige Angaben zu Allergien, Erkrankungen, Notfallmedikamenten auf der Einverständniserklärung; Notfallkontakt, soweit gesondert erfasst |
| **Wo** | Papierformular |
| **Startzeitpunkt** | **Ende der Veranstaltung** (`Event.endAt`, ersatzweise `startAt`) |
| **Prüffrist** | keine — es wird direkt gelöscht |
| **Löschfrist** | siehe Varianten |
| **Rechtsgrundlage** | Art. 9 Abs. 2 Buchst. a DSGVO i. V. m. Art. 6 Abs. 1 Buchst. a; Art. 5 Abs. 1 Buchst. e DSGVO |
| **Aktion** | **vernichten** (Papier: Aktenvernichter oder Dienstleister) |
| **Ausnahme** | Löschsperre bei Unfall, Versicherungsfall oder Rechtsstreit — dann wandern die Angaben in Klasse 6 |

**Zwei Varianten:**

| | Frist | Für | Gegen |
|---|---|---|---|
| **A ⭐** | **7 Tage** nach Veranstaltungsende | Gesundheitsdaten sind die sensibelste Kategorie überhaupt; sieben Tage genügen, um einen Vorfall zu bemerken und die Sperre zu setzen | knapp, wenn eine Beschwerde erst später eingeht |
| **B** | 30 Tage nach Veranstaltungsende | mehr Puffer; entspricht dem heutigen Wortlaut | hält besonders schutzwürdige Daten dreimal so lange |

> **Empfehlung: A.** Der heutige Text sagt „**spätestens** 30 Tage" —
> sieben Tage sind damit bereits gedeckt und erfordern **keine
> Textänderung**. Und Adams Vorgabe lautet ausdrücklich „möglichst früh".
>
> ✅ **Rechtsgrundlage belegt.** Diese Klasse kann ohne weitere Klärung
> umgesetzt werden.

---

### Klasse 2 — Vollständige Minderjährigen- und Einverständniserklärungen

| | |
|---|---|
| **Umfasst** | das vollständige Papierformular: Name und Geburtsdatum der minderjährigen Person, Name und Mobilnummer der erziehungsberechtigten Person, deren E-Mail, Zustimmungen, Unterschrift |
| **Wo** | Papier |
| **Startzeitpunkt** | **31.12. des Jahres der Veranstaltung** |
| **Prüffrist** | — |
| **Löschfrist** | **3 Jahre** ab Startzeitpunkt |
| **Rechtsgrundlage** | Art. 17 Abs. 3 Buchst. e DSGVO; §§ 195, 199 Abs. 1 BGB (regelmäßige Verjährung) |
| **Aktion** | **vernichten**, zuvor reduzierten Nachweis nach Klasse 3 anlegen |
| **Ausnahme** | Löschsperre |

> ✅ **Rechtsgrundlage ausreichend belegt.** Die Frist entspricht der
> regelmäßigen Verjährung; die Fälle, für die das Formular das
> Beweismittel ist, werden zeitnah geltend gemacht (Begründung in
> Dokument 12, Teil III).

---

### Klasse 3 — Reduzierter Zustimmungsnachweis

| | |
|---|---|
| **Umfasst** | Name der minderjährigen Person, Veranstaltung, Datum, Vermerk „Zustimmung lag vor", Vermerk „selbstständiges Verlassen gestattet / nicht gestattet". **Kein** Geburtsdatum, **keine** Mobilnummer, **keine** Gesundheitsangaben |
| **Wo** | Datenbank oder eine Liste je Veranstaltung |
| **Startzeitpunkt** | 31.12. des Jahres der Veranstaltung (derselbe wie Klasse 2) |
| **Prüffrist** | **3 Jahre** — fällt mit dem Anlegen zusammen |
| **Löschfrist** | siehe Varianten |
| **Rechtsgrundlage** | Art. 6 Abs. 1 Buchst. f DSGVO; Art. 17 Abs. 3 Buchst. e DSGVO mit abnehmender Rechtfertigung |
| **Aktion** | **löschen** |
| **Ausnahme** | Löschsperre |

**Zwei Varianten:**

| | Gesamtdauer | Für | Gegen |
|---|---|---|---|
| **A ⭐** | **10 Jahre** (3 + 7) | liegt in der Größenordnung der längsten steuerlichen Fristen und ist damit erklärbar | 10 Jahre sind für einen Zustimmungsvermerk lang |
| **B** | 6 Jahre (3 + 3) | orientiert an der kürzesten Frist des § 147 Abs. 3 AO; deutlich datensparsamer | deckt weniger ab |

> ⚖️ **Rechtsgrundlage nicht abschließend belegt — keine endgültige
> Frist.** Für den reduzierten Nachweis gibt es keine gesetzliche
> Aufbewahrungspflicht; er stützt sich allein auf eine
> Interessenabwägung. **Empfehlung A**, aber die Dauer gehört
> ausdrücklich in die fachliche Prüfung.

---

### Klasse 4 — Check-in-Daten

> **Hinweis:** Nach Entscheidung 3.20 (Anlagenmodell) gibt es **keinen
> Check-out**. Diese Klasse umfasst nur die Ankunftserfassung.

| | |
|---|---|
| **Umfasst** | ausgedruckte Anwesenheitsliste mit Häkchen; bei begleiteten Minderjährigen der Name der Begleitperson; heruntergeladene CSV-Dateien |
| **Wo** | Papier und Gerät des Betreibers — **außerhalb der Anwendung** |
| **Startzeitpunkt** | Ende der Veranstaltung |
| **Prüffrist** | — |
| **Löschfrist** | siehe Varianten |
| **Rechtsgrundlage** | Art. 6 Abs. 1 Buchst. b und f DSGVO |
| **Aktion** | **vernichten** bzw. Datei löschen |
| **Ausnahme** | Löschsperre — dann in die Vorfallakte übernehmen |

**Zwei Varianten:**

| | Frist | Für | Gegen |
|---|---|---|---|
| **A ⭐** | **3 Jahre zum Jahresende** | gleicher Lauf wie Klasse 2; die Liste belegt, **wer tatsächlich anwesend war** — bei einem Vorfall die zentrale Frage | Papier muss drei Jahre geordnet gelagert werden |
| **B** | **direkt nach der Veranstaltung** vernichten | maximal datensparsam, kein Lager | bei einer Beschwerde nach Wochen ist nicht mehr belegbar, wer da war |

> **Empfehlung A.** Die Anwesenheit ist genau die Tatsache, die sich
> später nicht mehr rekonstruieren lässt — die Buchung sagt nur, wer
> gebucht hat.
>
> ⚠️ **Nicht automatisierbar.** Papier und heruntergeladene Dateien
> liegen außerhalb der Anwendung. Gehört als Punkt in die
> Veranstaltungscheckliste.

---

### Klasse 5 — Allgemeine Veranstaltungs- und Sicherheitschecklisten

> **Die korrigierte Klasse.**

| | |
|---|---|
| **Umfasst** | Datum und Uhrzeit, Veranstaltungsbezeichnung oder Event-ID, Vermerk über die Sicherheitseinweisung, **Kürzel der durchführenden Person**, Vermerke zum Ablauf, eingesetzte Ausrüstung |
| **Wo** | Papier, künftig ggf. Datenbank |

**Prüfung des Personenbezugs — wie verlangt:**

| Merkmal | Personenbezug? |
|---|---|
| **Mitarbeiterkürzel** | **ja.** Ein Kürzel, das VERA zuordnen kann, ist ein personenbezogenes Datum nach Art. 4 Nr. 1 DSGVO. Pseudonymisierung ist keine Anonymisierung — es sind **Beschäftigtendaten** |
| **Namen von Mitarbeitenden**, falls ausgeschrieben | ja, unmittelbar |
| **Datum und Event-ID** | **mittelbar.** Für sich genommen kein Personenbezug. Zusammen mit der Anwesenheitsliste (Klasse 4) ist der Kreis der Anwesenden bestimmbar — **solange diese existiert** |
| **Vermerke zum Ablauf** | nur, wenn sie einzelne Personen nennen — dann eigener Personenbezug |

**Ergebnis: Die Checkliste ist personenbezogen**, und zwar in erster
Linie bezüglich der **Mitarbeitenden**. Bezüglich der Teilnehmenden ist
sie nur mittelbar zuordenbar, und diese Zuordenbarkeit endet mit der
Löschung von Klasse 4.

| | |
|---|---|
| **Startzeitpunkt** | 31.12. des Jahres der Veranstaltung |
| **Prüffrist** | **3 Jahre** — Prüfung, ob ein Vorfall, eine Beschwerde oder ein Verfahren zu dieser Veranstaltung offen ist |
| **Löschfrist** | siehe Varianten |
| **Rechtsgrundlage** | Art. 6 Abs. 1 Buchst. f DSGVO (Nachweis der Erfüllung von Verkehrssicherungs- und Einweisungspflichten); Art. 17 Abs. 3 Buchst. e DSGVO |
| **Aktion** | **löschen bzw. vernichten** |
| **Ausnahme** | Löschsperre |

**Zwei Varianten:**

| | Vorgehen | Für | Gegen |
|---|---|---|---|
| **A ⭐** | Prüffrist 3 Jahre, **Löschfrist 10 Jahre**, Kürzel bleibt erhalten | der Nachweiswert liegt gerade darin, **wer** eingewiesen hat; ohne Kürzel ist die Checkliste als Beweismittel wenig wert | Beschäftigtendaten liegen 10 Jahre |
| **B** | Nach 3 Jahren **Kürzel entfernen** und durch „durch eingewiesenes Personal" ersetzen, Rest unbefristet | danach kein Personenbezug mehr, keine Löschpflicht | der Beweiswert sinkt erheblich: Dass „irgendjemand" eingewiesen hat, hilft im Streitfall kaum |

> **Empfehlung A.** Zehn Jahre fügen sich in die übrigen Fristen ein und
> lassen sich erklären. Die Alternative opfert genau das, wofür die
> Checkliste da ist.
>
> **Warum nicht unbefristet — die Korrektur ausdrücklich:** Ein
> berechtigtes Interesse an Beweisvorsorge rechtfertigt keine zeitlich
> unbegrenzte Speicherung von Beschäftigtendaten. Nach zehn Jahren ohne
> jeden Vorfall ist die Rechtfertigung erschöpft; besteht ein Vorfall,
> greift ohnehin die Löschsperre und die Unterlage wandert in Klasse 6.
>
> ⚖️ **Rechtsgrundlage tragfähig, Dauer zu bestätigen.**

---

### Klasse 6 — Vorfall- und Versicherungsunterlagen

| | |
|---|---|
| **Umfasst** | Unfallmeldungen, Erste-Hilfe-Dokumentation, Schriftwechsel mit Versicherung, Beschwerden und ihre Bearbeitung, Unterlagen zu Rückbuchungen, alles zu einem Rechtsstreit |
| **Wo** | Papier und E-Mail-Postfach |
| **Startzeitpunkt** | **Abschluss des Vorgangs** — nicht das Veranstaltungsdatum |
| **Prüffrist** | 3 Jahre nach Abschluss |
| **Löschfrist** | siehe Varianten |
| **Rechtsgrundlage** | Art. 6 Abs. 1 Buchst. f, Art. 17 Abs. 3 Buchst. e DSGVO; §§ 195, 199 BGB |
| **Aktion** | löschen bzw. vernichten |
| **Ausnahme** | solange ein Verfahren läuft, keine Löschung |

**Zwei Varianten:**

| | Frist | Für | Gegen |
|---|---|---|---|
| **A ⭐** | **10 Jahre** nach Abschluss im Regelfall | erklärbar, fügt sich in die übrigen Fristen | deckt keinen Spätschaden |
| **B** | 10 Jahre im Regelfall, **30 Jahre bei dokumentiertem Personenschaden** | § 199 Abs. 2 BGB setzt für Verletzungen von Leben, Körper, Gesundheit und Freiheit eine **absolute Höchstfrist von 30 Jahren** — kenntnisunabhängig | 30 Jahre sind eine sehr lange Speicherung und brauchen eine belastbare Begründung |

> **Empfehlung B — und hier gehört die 30-Jahres-Frist tatsächlich hin.**
>
> In Dokument 12, Teil III hatte ich § 199 Abs. 2 BGB als Argument für
> eine lange Aufbewahrung der **Einverständniserklärungen** verworfen,
> weil diese die falsche Tatsache beweisen. **Für die Vorfallakte gilt
> das Gegenteil:** Sie dokumentiert genau den Hergang und die Frage, ob
> eine Pflicht verletzt wurde — also das, worüber nach Jahren gestritten
> wird.
>
> ⚖️ **Nicht abschließend belegt.** Ob 30 Jahre im Einzelfall
> verhältnismäßig sind, ist eine Wertung. **Keine endgültige Frist**,
> bis das geprüft ist.

---

### Klasse 7 — Rechnungen, Zahlungs- und Buchungsbelege

> **Technisch getrennt von allen anderen Klassen.** Der Löschlauf der
> Klassen 1 bis 6 darf diese Daten **nie** erfassen.

| Unterlagenart | Frist | Fundstelle |
|---|---|---|
| Bücher, Aufzeichnungen, Inventare, Jahresabschlüsse, Lageberichte, Eröffnungsbilanz, Organisationsunterlagen | **10 Jahre** | § 147 Abs. 3 S. 1 AO i. V. m. Abs. 1 Nr. 1 und 4a |
| **Buchungsbelege und Rechnungen** | **8 Jahre** | § 147 Abs. 3 S. 1 AO i. V. m. Abs. 1 Nr. 4 — seit 01.01.2025, zuvor 10 Jahre (4. Bürokratieentlastungsgesetz) |
| Empfangene und abgesandte Handels- und Geschäftsbriefe, **einschließlich E-Mails**, sowie sonstige Unterlagen | **6 Jahre** | § 147 Abs. 3 S. 1 AO i. V. m. Abs. 1 Nr. 2, 3 und 5 |

| | |
|---|---|
| **Startzeitpunkt** | **§ 147 Abs. 4 AO:** Ende des Kalenderjahres, in dem der Buchungsbeleg entstanden, der Geschäftsbrief empfangen oder abgesandt, die Aufzeichnung vorgenommen oder die sonstige Unterlage entstanden ist |
| **Aktion bis zum Fristende** | **behalten, unverändert** |
| **Aktion danach** | löschen |

**Zwei Regeln, die davon abhängen:**

**1. Die Anonymisierung fasst keine steuerrelevanten Felder an.**
Geprüft in `app/admin/anmeldungen/aktion.ts`: Überschrieben werden
ausschließlich `kontaktVorname`, `kontaktNachname`, `kontaktEmail`,
`kontaktTelefon` sowie die Teilnehmernamen. `gesamtpreisCents`,
`bezahlterBetragCents`, `bezahltAm`, `angemeldetAm` und
`zahlungsReferenz` bleiben unberührt.

**2. Rechnungen mit Namen werden nicht anonymisiert, solange ihre Frist
läuft.** Ist ein Dokument selbst ein Buchungsbeleg und enthält es einen
Namen, gilt die steuerliche Frist **mitsamt dem Namen**. Der Löschlauf
muss solche Dokumente ausnehmen.

`[VOR VERWENDUNG KLÄREN (L-2): Stellt VERA überhaupt Rechnungen mit
Namen aus? Gegenüber Privatpersonen besteht dafür in der Regel keine
Pflicht. Falls nein, tritt Regel 2 nicht ein.]`

> ✅ **Rechtsgrundlage belegt** — allerdings über Suchergebnisse, nicht
> über den amtlichen Text. Vor der Umsetzung nachlesen.

---

## 4. Übersicht

| Klasse | Prüffrist | Löschfrist | Startzeitpunkt | Aktion | Belegt? |
|---|---|---|---|---|---|
| 1 Gesundheitsangaben | — | **7 Tage** | Veranstaltungsende | vernichten | ✅ |
| 2 Vollständige Erklärungen | — | **3 Jahre** | 31.12. des Jahres | vernichten + Klasse 3 anlegen | ✅ |
| 3 Reduzierter Nachweis | 3 Jahre | **10 Jahre** (A) | 31.12. des Jahres | löschen | ⚖️ Dauer offen |
| 4 Check-in-Daten | — | **3 Jahre** (A) | Veranstaltungsende | vernichten | ⚖️ Dauer offen |
| 5 Checklisten | **3 Jahre** | **10 Jahre** (A) | 31.12. des Jahres | löschen | ⚖️ Dauer offen |
| 6 Vorfallunterlagen | 3 Jahre | **10 / 30 Jahre** (B) | Abschluss des Vorgangs | löschen | ⚖️ offen |
| 7 Steuerunterlagen | — | **10 / 8 / 6 Jahre** | § 147 Abs. 4 AO | behalten, dann löschen | ✅ |

**Nur die Klassen 1, 2 und 7 haben eine ausreichend belegte Grundlage.**
Für 3 bis 6 liegen Empfehlungen vor, aber **keine endgültigen Fristen** —
wie angewiesen.

---

## 5. Was automatisiert werden kann

| Klasse | Automatisierbar | Warum |
|---|---|---|
| 1 | ❌ | Papier |
| 2 | ❌ | Papier — automatisierbar ist nur die **Erinnerung** |
| 3 | ✅ | Datenbank |
| 4 | ❌ | Papier und Gerät des Betreibers |
| 5 | ❌ heute, ✅ wenn digital geführt | — |
| 6 | ❌ | Papier und Postfach |
| 7 | ✅ | Datenbank, aber nur **behalten** — keine Aktion nötig |
| Anmeldedaten (Dok. 12, Nr. 1–3) | ✅ | Datenbank |

### Vorgeschlagener Aufbau

```
täglich 04:15 Uhr   vera-loeschlauf.timer
                      └─ vera-loeschlauf.sh
                           ├─ Klasse 3: fällige reduzierte Nachweise
                           ├─ Anmeldedaten: fällige Anonymisierungen
                           ├─ Adminprotokoll: fällige Einträge
                           ├─ je Datensatz: Löschsperre prüfen → ggf. überspringen
                           ├─ Protokoll schreiben (Anzahl, übersprungen, Gründe)
                           └─ bei Fehler: E-Mail an den Betreiber
```

Muster vorhanden: `vera-sicherung.timer` und `vera-wache.timer` laufen
seit Wochen. Die Anonymisierungsfunktion existiert. **Es fehlen: die
Tabelle `Loeschsperre`, das Skript und der Timer.**

### Was eine Erinnerung statt einer Löschung braucht

Für die Papierklassen 1, 2, 4 und 6: ein monatlicher Hinweis per E-Mail,
welche Unterlagen zur Vernichtung anstehen. Das ist der einzige Weg,
Papier verlässlich zu erfassen — und er gehört in dieselbe Routine.

---

## 6. Offene Punkte

| # | Frage | Klasse |
|---|---|---|
| K-1 | Dauer des reduzierten Nachweises: 10 oder 6 Jahre? | 3 |
| K-2 | Aufbewahrung der Anwesenheitslisten: 3 Jahre oder sofort vernichten? | 4 |
| K-3 | Checklisten: Kürzel behalten (10 Jahre) oder nach 3 Jahren entfernen? | 5 |
| K-4 | Vorfallakten: 30 Jahre bei Personenschaden verhältnismäßig? | 6 |
| K-5 | Mindestnachlauffrist nach Aufhebung einer Löschsperre? | alle |
| K-6 | Stellt VERA Rechnungen mit Namen aus? | 7 |
| K-7 | Wo werden Papierunterlagen gelagert, und wie werden sie vernichtet? | 1, 2, 4, 6 |
