# 08 — Rechtstexte im Bestellvorgang (Entwurf)

> **Status:** Entwurf, Version 1 vom 16.09.2026. **Nicht anwaltlich geprüft.**
>
> **Stand 18.09.2026:** inhaltlich unverändert — die Bestellknopf- und
> Checkbox-Formulierungen hängen an den offenen Fragen 2.2–2.4 und
> 2.12–2.14 aus Dokument 11 (gesammelt in Dokument 15, Abschnitt B).
>
> Dieses Dokument ist das praktischste der zehn: Es enthält konkrete
> Textvorschläge für Bildschirmelemente und benennt die Stelle im Code,
> an der sie stehen müssten. **Nichts davon wurde eingebaut** — der
> Auftrag verlangt ausdrücklich, noch nichts auf der Website zu ändern.

---

## Der heutige Ablauf — nachgezeichnet aus dem Code

```
/events/<slug>/anmeldung
  │
  ├─ Wen meldest du an?        Mich selbst · Mein Kind · Familienpaket
  ├─ Anzahl und Art            Zähler, Preis rechnet live mit
  ├─ Deine Angaben             Vorname, Nachname, E-Mail, Telefon (freiwillig)
  ├─ Häkchen                   Einwilligung Erziehungsberechtigte (Pflicht bei Kind/Familie)
  │                            Einwilligung Fotos (freiwillig)
  ├─ Zusammenfassung           Einzelposten, Gesamtsumme
  ├─ [ Zur Bezahlung – 50,00 € ]        ← components/PreisRechner.tsx:337
  └─ Hinweis                   „Es geht weiter zur gesicherten Bezahlseite …"
        │
        └─ Stripe (gehostete Seite)
              ├─ bezahlt     → Webhook → BESTÄTIGT → Bestätigungsmail
              └─ abgebrochen → /anmeldung/danke?zahlung=abgebrochen
```

**Was fehlt, auf einen Blick:**

| | vorhanden? |
|---|---|
| Bestellübersicht mit Einzelposten | ✅ ja |
| Gesamtpreis vor dem Absenden | ✅ ja |
| Hinweis, dass Zahlungsdaten nicht bei VERA ankommen | ✅ ja |
| Getrennte, freiwillige Fotoeinwilligung | ✅ ja (Text unzureichend, siehe Dokument 06) |
| Einwilligung Erziehungsberechtigte | ✅ ja |
| **Eindeutig beschrifteter Bestellbutton** | ⚠️ **fraglich** |
| **Hinweis auf und Bestätigung der AGB** | ❌ nein (noch nicht deployt) — ✅ Wortlaut entschieden, siehe C-2 |
| **Link zu Datenschutz und Widerruf beim Bestellvorgang** | ❌ nur in der Fußzeile |
| **Angabe der wesentlichen Merkmale der Leistung im Bestellvorgang** | ⚠️ zu prüfen |

---

## C-1 ⚠️ Die Beschriftung der Bestellschaltfläche

### Die Norm

**§ 312j Abs. 3 BGB:** Bei einem Verbrauchervertrag im elektronischen
Geschäftsverkehr über eine entgeltliche Leistung muss der Unternehmer
die Bestellsituation so gestalten, dass der Verbraucher mit seiner
Bestellung ausdrücklich bestätigt, dass er sich zu einer Zahlung
verpflichtet. Erfolgt die Bestellung über eine Schaltfläche, ist diese
Pflicht **nur dann** erfüllt, wenn die Schaltfläche gut lesbar mit
nichts anderem als den Wörtern **„zahlungspflichtig bestellen"** oder
mit einer **entsprechend eindeutigen Formulierung** beschriftet ist.

**§ 312j Abs. 4 BGB:** Wird gegen Absatz 3 verstoßen, **kommt der
Vertrag nicht zustande.**

### Der heutige Wortlaut

```
content/de.ts → anmeldung.formular.absenden
  "Zur Bezahlung – {betrag}"

content/de.ts → anmeldung.formular.absendenKostenlos
  "Jetzt verbindlich anmelden"          ← nur bei kostenlosen Veranstaltungen

content/de.ts → danke.zahlungKnopf
  "Bezahlen"                            ← zweiter Anlauf auf der Abschluss-Seite
```

### Bewertung

**„Zur Bezahlung – 50,00 €" ist als Bestellbutton zweifelhaft.**

Die Formulierung beschreibt einen **Navigationsschritt** („es geht
weiter zur Bezahlung"), nicht die **Abgabe einer zahlungspflichtigen
Bestellung**. Das ist genau die Unterscheidung, auf die es ankommt: Die
Beurteilung richtet sich nach dem geprüften Stand ausschließlich nach
dem Wortlaut der Schaltfläche.

Nach den recherchierten Entscheidungen wurden unter anderem als **nicht
ausreichend** angesehen: „Bestellung aufgeben", „Bestellen" (allein),
„Senden" sowie Beschriftungen der Form „mit … bezahlen". Die letzte
Gruppe liegt „Zur Bezahlung" und „Bezahlen" sprachlich nahe.

Als **ausreichend** angesehen wurde beispielsweise „Jetzt verbindlich
anmelden! (zahlungspflichtiger Reisevertrag)" — weil daraus die
Zahlungspflicht hervorgeht.

> **Zur Einordnung:** Diese Recherche stützt sich auf zusammenfassende
> Fachbeiträge, nicht auf die Entscheidungen im Volltext — der Zugriff
> auf die amtlichen Quellen war aus dieser Arbeitsumgebung gesperrt
> (siehe Prüfprotokoll, Abschnitt „Grenzen der Quellenprüfung").
> **Die Bewertung ist als Prüfauftrag zu lesen, nicht als Ergebnis.**

**Der frühere Wortlaut war näher an der Anforderung:** „Jetzt anmelden &
bezahlen – 50,00 €". Die Änderung auf „Zur Bezahlung" war eine bewusste
Entscheidung des Unternehmers und wird hier **nicht eigenmächtig
rückgängig gemacht** — sie wird vorgelegt.

### ✅ Entschieden von Adam am 18.09.2026

**Der verbindliche Bestellknopf erhält den Wortlaut „Zahlungspflichtig
bestellen"** — das ist wortwörtlich die im Gesetz selbst genannte
Formulierung (§ 312j Abs. 3 BGB: „nichts anderem als den Wörtern
‚zahlungspflichtig bestellen'") und damit die sicherste denkbare Wahl,
noch vorsichtiger als die zuvor empfohlenen Varianten V1–V4. Ersetzt
den bisherigen Text „Zur Bezahlung – {betrag}"
(`content/de.ts → anmeldung.formular.absenden`).

**Für kostenlose Veranstaltungen** bleibt „Jetzt verbindlich anmelden"
richtig — ohne Entgelt greift § 312j Abs. 3 BGB nicht, und ein
Zahlungshinweis wäre dort falsch. **Unverändert.**

**Für die Schaltfläche auf der Abschluss-Seite** (`danke.zahlungKnopf`,
bisher „Bezahlen", zweiter Anlauf): Sollte konsequent ebenfalls
„Zahlungspflichtig bestellen" erhalten, damit ein zweiter Bestellversuch
demselben Maßstab genügt wie der erste — unabhängig davon, ob er
rechtlich eine neue Bestellung oder nur die Fortsetzung der ersten ist,
schadet die einheitliche, sichere Formulierung nicht. `[Noch offen: ob
das rechtlich zwingend ist oder nur vorsorglich sinnvoll — fachlich zu
bestätigen, ändert aber nichts an der Empfehlung.]`

### ✅ Verwandte, aber eigenständige Entscheidung: die Einstiegsschaltfläche

**Nicht Teil der ursprünglichen § 312j-Frage, aber im selben Zuge
entschieden:** Die Schaltfläche, die von der Startseite/Eventseite zur
Anmeldung **führt** (nicht die verbindliche Bestellung selbst — dort
wird noch nichts gekauft), erhält den Wortlaut **„Zu den Tickets"**.

Das ist **derselbe** Textbaustein `content/de.ts → aktion.anmelden`
(bisher „Jetzt anmelden"), der an **sechs Stellen** im Code verwendet
wird: `components/Header.tsx` (zweimal, Desktop und Mobilmenü),
`components/Hero.tsx`, `components/HeroPremium.tsx`,
`components/CtaBand.tsx`, `app/(seite)/event/[slug]/page.tsx`. Eine
Änderung wäre also **eine** Textzeile mit **sechsfacher** Wirkung —
gut kontrollierbar, aber der Umfang gehört vorher klar benannt, bevor
es umgesetzt wird. Rechtlich unproblematisch, da diese Schaltfläche
selbst keine Bestellung auslöst (§ 312j Abs. 3 BGB betrifft nur den
tatsächlichen Bestellabschluss).

### Umsetzung

```
content/de.ts → anmeldung.formular.absenden      (eine Zeile)
content/de.ts → danke.zahlungKnopf               (eine Zeile)
pruefung/K/k-browser.mjs, pruefung/J/j-browser.mjs   ← Prüfskripte
                                                      suchen nach dem
                                                      alten Text und
                                                      müssen mitgeändert
                                                      werden
```

> ⚠️ **Die beiden Prüfskripte nicht vergessen.** Sie sind bei der
> letzten Umbenennung bereits einmal stehen geblieben und haben die
> Testläufe zum Absturz gebracht.

---

## C-2 ❌ Hinweis auf und Bestätigung der Teilnahmebedingungen

### Warum das der wichtigste Punkt ist

**§ 305 Abs. 2 BGB** verlangt für die Einbeziehung von AGB einen
**ausdrücklichen Hinweis** bei Vertragsschluss und die Möglichkeit
zumutbarer Kenntnisnahme. Die Rechtstexte stehen heute ausschließlich in
der Fußzeile. Ein Fußzeilenlink wird verbreitet **nicht** als
ausdrücklicher Hinweis angesehen.

**Folge:** Es gelten die Teilnahmebedingungen nicht — auch nicht die
Ziffern, die VERA schützen sollen (Storno, Ausschluss bei Fehlverhalten,
Haftungsbegrenzung).

### Warum es heute bewusst fehlt

Ein Pflichthäkchen, das auf eine Platzhalterseite zeigt, wäre eine
Attrappe. Die bisherige Entscheidung, es wegzulassen, war richtig —
**solange** Abschnitt 1 der AGB ein Platzhalter ist.

**Sie ist falsch, sobald der vollständige Text steht.**

### ✅ Entschieden von Adam am 18.09.2026

**Pflicht-Häkchen, nicht vorangekreuzt:**

> ☐ Ich akzeptiere die [AGB](/agb).

Das Wort „AGB" verlinkt direkt auf die vollständigen Teilnahme­
bedingungen. **Ohne gesetztes Häkchen darf die Bestellung nicht
abgeschlossen werden** — serverseitig zu prüfen, nicht nur im Browser
(dasselbe Muster wie bei `einwilligungVormund`, das ebenfalls
serverseitig erzwungen wird, nicht nur per `required`-Attribut).

**Zwei Anmerkungen dazu, ohne die Entscheidung infrage zu stellen:**

1. **Nicht vorangekreuzt** — erfüllt, siehe oben.
2. Die kurze Fassung erwähnt Widerruf/Storno und Datenschutz nicht
   gesondert. Das ist unproblematisch: Widerrufs- und Stornoregeln
   gehören inhaltlich in die AGB selbst bzw. in eine dort verlinkte
   Seite, und die Datenschutzerklärung ist ohnehin nur eine
   **Information** nach Art. 13 DSGVO (keine Vereinbarung) — sie
   braucht rechtlich kein eigenes Häkchen, nur einen erreichbaren Link,
   den die Fußzeile bereits bietet.

**Link öffnet in einem neuen Tab**, damit die ausgefüllten Formular­
daten nicht verloren gehen.

### Umsetzung

```
components/FormularVorschau.tsx     neues Häkchen, Muster: einwilligungVormund
lib/anmeldung.ts                    Feld + Pflichtprüfung
                                    (Zeilen 37–38, 203–205, 224–227 zeigen
                                     das Muster; ein drittes Feld fügt sich
                                     ohne Umbau ein)
prisma/schema.prisma                Feld an Registration + Migration
                                    — damit die Zustimmung nachweisbar ist
content/de.ts                       Text
```

> ✅ **Der Platz ist bereits vorbereitet.** Die Struktur mit
> `einwilligungVormund` und `einwilligungFotos` nimmt ein drittes Feld
> ohne Umbau auf.

---

## C-3 ⚠️ Wesentliche Merkmale der Leistung im Bestellvorgang

**§ 312j Abs. 2 BGB** verlangt, dass der Unternehmer dem Verbraucher
bestimmte Informationen **unmittelbar bevor** dieser seine Bestellung
abgibt, klar und hervorgehoben zur Verfügung stellt — insbesondere die
wesentlichen Merkmale der Leistung und den Gesamtpreis.

**Heutiger Stand:** Die Zusammenfassung zeigt Einzelposten und
Gesamtsumme. Was die Veranstaltung **inhaltlich** umfasst, steht auf der
Eventseite — also eine Ebene davor.

✅ **Entschieden und geprüft am 18.09.2026** (Skill
`agb-pruefung-kaltstart`, dazu Websuche — Quellen unten).

**Ergebnis: Ja, die wesentlichen Merkmale gehören in die
Zusammenfassung.** Die Eventseite eine Ebene davor genügt nach der
recherchierten Rechtsprechung **nicht**. Das **OLG Nürnberg** hat
entschieden, dass die wesentlichen Eigenschaften dem Verbraucher
**unmittelbar vor Abgabe der Bestellung** klar, verständlich und in
hervorgehobener Weise zur Verfügung stehen müssen — maßgeblich ist die
Bestellübersicht bzw. Checkout-Seite, also genau die Seite, die der
Verbraucher direkt vor dem Klick sieht. Eine Information, die er drei
Klicks vorher einmal gesehen hat, erfüllt das nicht.

**Der Aufwand ist gering:** Titel, `startAt`, `endAt`, `ortName`,
`stadt` und die Abschnitte vom Typ „dabei" liegen alle bereits am Event
und lassen sich ohne neues Datenfeld anzeigen. Der wirtschaftliche
Nutzen kommt obendrauf — wer direkt vor dem Bezahlen noch einmal sieht,
was er bucht, bricht seltener ab und beschwert sich seltener hinterher.

**Umzusetzender Textbaustein** — eine kompakte Zeile über der
Zusammenfassung:

> **Ihre Anmeldung**
> {Titel der Veranstaltung}
> {Datum}, {Uhrzeit} · {Ort}
> Enthalten: {die auf der Eventseite als enthalten ausgewiesenen
> Leistungen}

**Technisch verfügbar:** Titel, `startAt`, `endAt`, `ortName`, `stadt`
und die Abschnitte vom Typ „dabei" liegen alle am Event
(`prisma/schema.prisma`). Die Zeile ließe sich ohne neue Datenfelder
erzeugen.

---

## C-4 Bestellbestätigung (E-Mail)

**Heutiger Stand** (`lib/mailVorlagen.ts`):

| Mail | Betreff | Wann |
|---|---|---|
| Anmeldung bestätigt | `Anmeldung bestätigt: {Titel}` | nur bei kostenlosen Veranstaltungen |
| Zahlung erhalten | `Zahlung erhalten: {Titel}` | nach geprüfter Rückmeldung |
| Stornierung bestätigt | — | nach Stornierung |

> ✅ **Der Ablauf ist richtig gebaut.** Bei kostenpflichtigen
> Veranstaltungen kommt die Bestätigung **erst**, wenn die Zahlung
> bestätigt ist — nicht schon beim Absenden. Alles andere wäre eine
> Bestätigung, bevor feststeht, dass bezahlt wurde.

### ⚠️ Zweiter Prüfdurchgang: die Mails wurden Zeile für Zeile gelesen

**Ergebnis — der erste Entwurf war hier zu vorsichtig. Es ist keine
Prüffrage, sondern ein bestätigter Befund:**

| Was | in `bestaetigungsMail` | in `zahlungsBestaetigungsMail` |
|---|---|---|
| Anrede, Eventtitel, Termin, Ort | ✅ | ✅ |
| angemeldete Personen | ✅ | ✅ |
| Anmeldenummer | ✅ | ✅ |
| Stornolink | ✅ | ✅ |
| Gesamtbetrag | ❌ **fehlt** | ✅ |
| **Anbieterangaben** (Name, Anschrift) | ❌ **fehlt** | ❌ **fehlt** |
| **Teilnahmebedingungen** | ❌ **fehlt** | ❌ **fehlt** |
| **Informationen zu Widerruf/Stornierung** | ❌ **fehlt** | ❌ **fehlt** |
| Hinweis Kleinunternehmerregelung | ❌ fehlt | ❌ fehlt |
| Stornofrist im Klartext | ❌ fehlt | ❌ fehlt |

Beide Mails enden mit „Bis bald, das VERA-Team". Eine Volltextsuche nach
`Lasarzik`, `Mühlenstr`, `Impressum`, `AGB`, `Teilnahmebedingungen` und
`Widerruf` in `lib/mailVorlagen.ts` ergibt **keinen einzigen Treffer.**

**Warum das wiegt:** Nach **§ 312f Abs. 2 BGB** hat der Unternehmer dem
Verbraucher bei Fernabsatzverträgen eine Bestätigung des Vertrags **auf
einem dauerhaften Datenträger** zur Verfügung zu stellen, die die
Vertragsbestimmungen einschließlich der einbezogenen AGB und die nach
Art. 246a EGBGB geschuldeten Informationen enthält. Eine E-Mail ist ein
dauerhafter Datenträger — die heutigen Mails enthalten diese Angaben
aber nicht.

**Was in die Bestätigungsmail gehört:**

- [ ] vollständige Anbieterangaben (Name, Anschrift, E-Mail)
- [x] Veranstaltung, Datum, Uhrzeit, Ort — *vorhanden*
- [x] alle angemeldeten Personen — *vorhanden*
- [ ] Einzelposten und Gesamtbetrag (**in der kostenlosen Fassung fehlt
      der Betrag ganz** — bei 0,00 € verschmerzbar, aber inkonsistent)
- [ ] Hinweis auf die Kleinunternehmerregelung
- [ ] **die Teilnahmebedingungen im Volltext oder als Anlage**
- [ ] **Informationen zu Widerruf und Stornierung**
- [ ] Stornofrist im Klartext („kostenlos bis TT.MM. HH:MM")
- [x] Stornolink — *vorhanden*
- [ ] Kontaktweg für Rückfragen

✅ **Entschieden und geprüft am 18.09.2026** (Skill
`agb-pruefung-kaltstart`, dazu Websuche — Quellen unten).

**Ergebnis: Volltext in der Mail oder PDF-Anhang — ein bloßer Link
genügt nicht.** § 312f Abs. 2 BGB verlangt eine Bestätigung des
Vertrags auf einem dauerhaften Datenträger, die den **gesamten
Vertragsinhalt einschließlich der einbezogenen AGB** sowie die
Informationen nach Art. 246a EGBGB enthält. Eine E-Mail ist ein
dauerhafter Datenträger — ein Link auf die Website ist es **nicht**:
Der Inhalt hinter dem Link kann sich jederzeit ändern, und genau das
soll die Bestätigung verhindern.

**Empfehlung: Volltext in der Mail**, nicht PDF-Anhang. Gründe: Ein PDF
muss erzeugt, gespeichert und versioniert werden (zusätzlicher
Bauaufwand); Anhänge erhöhen außerdem die Spam-Wahrscheinlichkeit, und
die Mails gehen über dasselbe Postfach, dessen Zustellbarkeit für die
Zahlungsbestätigungen gebraucht wird. Ein Volltext am Ende der Mail
kostet nichts und ist unkaputtbar.

**Zur Einbeziehung (§ 305 Abs. 2 BGB) — wichtige Abgrenzung:** Die
Einbeziehung ist mit dem Pflicht-Häkchen im Bestellvorgang (Befund C-2)
**bereits abgeschlossen**. Die Bestätigungsmail holt das nicht nach und
muss es nicht — sie erfüllt eine **eigene, nachvertragliche** Pflicht
(Dokumentation nach § 312f Abs. 2 BGB). Die beiden Anforderungen werden
oft verwechselt: Wer die AGB erst in der Bestätigungsmail schickt, hat
sie **nicht** wirksam einbezogen; wer sie nur im Bestellvorgang zeigt
und nicht in der Bestätigung mitschickt, hat sie zwar einbezogen, aber
die Bestätigungspflicht verletzt. **VERA braucht beides.**

**Reihenfolge:** Dieser Punkt ist erst umsetzbar, wenn die
Teilnahmebedingungen fertig sind — vorher gäbe es nichts mitzuschicken.

---

## C-5 Storno- und Absage-E-Mail

**Entwurf Storno-Bestätigung:**

> **Betreff:** Stornierung bestätigt: {Titel}
>
> Hallo {Vorname},
>
> Ihre Anmeldung zu **{Titel}** am {Datum} ist storniert.
>
> **Erstattet werden {Betrag}** — der volle Betrag, ohne Abzug. Die
> Rückzahlung ist angewiesen und läuft auf demselben Weg zurück, über
> den Sie bezahlt haben. Je nach Bank dauert die Gutschrift einige
> Werktage.
>
> Der Platz ist wieder frei. Wenn Sie es sich anders überlegen, können
> Sie sich jederzeit neu anmelden, solange Plätze verfügbar sind.
>
> Viele Grüße
> VERA
>
> —
> Adam Maurice Lasarzik · Mühlenstr. 8a · 14167 Berlin
> kontakt@veraevents.de

**Entwurf Absage durch VERA:**

> **Betreff:** Abgesagt: {Titel} am {Datum}
>
> Hallo {Vorname},
>
> **{Titel} am {Datum} muss leider ausfallen.** Das tut uns leid.
>
> {Grund der Absage in einem Satz — siehe die Bewertung unterhalb
> dieses Entwurfs.}
>
> **Ihr Geld bekommen Sie automatisch zurück.** Wir haben die
> Erstattung von {Betrag} bereits angewiesen — Sie müssen nichts tun.
> Die Rückzahlung läuft auf demselben Weg zurück, über den Sie bezahlt
> haben, und braucht je nach Bank einige Werktage.
>
> Sobald ein Ersatztermin feststeht, melden wir uns.
>
> Viele Grüße
> VERA
>
> —
> Adam Maurice Lasarzik · Mühlenstr. 8a · 14167 Berlin
> kontakt@veraevents.de

> **Zum Ton:** Die wichtigste Information — das Geld kommt automatisch
> zurück — steht fett und weit oben. Wer eine Absage liest, will genau
> das wissen, und zwar sofort.

✅ **Zum Absagegrund: entschieden und geprüft am 18.09.2026** (Skill
`agb-pruefung-kaltstart`).

**Ergebnis: Ja, den Grund nennen — aber nur den zutreffenden, und
niemals einen erfundenen.**

**Eine Rechtspflicht dazu besteht nicht.** Weder § 312f noch § 312j BGB
verlangen eine Begründung der Absage; auch Ziffer 8.1 der
Teilnahmebedingungen sieht sie nicht vor. Es gibt jedoch einen
konkreten rechtlichen **Vorteil**, der erst durch die heutigen
Entscheidungen entstanden ist:

**Ziffer 8.3 (Mindestteilnehmerzahl) ist ein Rücktrittsvorbehalt nach
§ 308 Nr. 3 BGB.** Ein solcher Vorbehalt greift nur, wenn der im
Vertrag benannte Grund **tatsächlich vorliegt**. Wer bei der Absage
schreibt „die Mindestteilnehmerzahl von X wurde bis zum {Datum} nicht
erreicht", dokumentiert damit, dass genau dieses vereinbarte
Lösungsrecht ausgeübt wurde — und nicht ein beliebiges. Das ist im
Streitfall der Unterschied zwischen einer vertraglich gedeckten und
einer freihändigen Absage.

⚠️ **Der Preis dieser Empfehlung, offen benannt:** Ein genannter Grund
bindet. Sagt VERA aus einem Grund ab, der **nicht** von Ziffer 8.1, 8.2
oder 8.3 gedeckt ist, und schreibt ihn in die Mail, ist das ein
schriftliches Eingeständnis einer nicht gedeckten Absage. Die Antwort
darauf ist aber nicht, den Grund zu verschweigen — sondern nur eine
Absage auszusprechen, die auch gedeckt ist. **Ein unzutreffender oder
beschönigter Grund wäre der schlechteste aller Wege** und könnte
zusätzlich als Irreführung gewertet werden.

**Praktische Folge:** Im Adminbereich wird bei einer Absage ein
Grund erfasst. Sinnvoll wäre eine Auswahl der in den
Teilnahmebedingungen vorgesehenen Fälle (Mindestteilnehmerzahl nicht
erreicht · höhere Gewalt / Ausfall der Veranstaltungsstätte /
behördliche Anordnung · Terminänderung) plus ein Freitextfeld für
Einzelheiten. Das gehört zur Sammelabsage-Funktion aus Dokument 15,
Punkt B-7 — beides sollte zusammen gebaut werden.

---

## C-6 Übersicht der Änderungen im Bestellvorgang

| # | Änderung | Datei | Abhängig von | Aufwand |
|---|---|---|---|---|
| 1 | Beschriftung der Bestellschaltfläche | `content/de.ts` + 2 Prüfskripte | fachliche Prüfung C-1 | klein |
| 2 | Häkchen/Hinweis zu den Teilnahmebedingungen | `FormularVorschau.tsx`, `lib/anmeldung.ts`, Schema, `content/de.ts` | **fertige AGB** | mittel |
| 3 | Fotoeinwilligung: neuer Text | `content/de.ts` | Dokument 06 | klein |
| 4 | Fotoeinwilligung: Zusatz bei Minderjährigen | `FormularVorschau.tsx` | Dokument 06 | klein |
| 5 | Wesentliche Merkmale in der Zusammenfassung | `PreisRechner.tsx` | fachliche Prüfung C-3 | mittel |
| 6 | Teilnahmebedingungen in die Bestätigungsmail | `lib/mailVorlagen.ts` | **fertige AGB** | mittel |
| 7 | Stornofrist im Klartext in die Mail | `lib/mailVorlagen.ts` | — | klein |
| 8 | Falls Widerrufsrecht besteht: Belehrung im Bestellvorgang und Widerrufsfunktion | mehrere | Dokument 07, W-a | **groß** |

**Nichts davon wurde umgesetzt.** Punkt 2, 6 und 8 hängen an
Entscheidungen, die noch nicht getroffen sind.
