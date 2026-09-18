# 03 — Teilnahmebedingungen für Veranstaltungen (B2C) — Entwurf

> **Status:** Entwurf, Version 1 vom 16.09.2026. **Nicht anwaltlich geprüft,
> nicht rechtssicher, nicht garantiert wirksam.** Neu für VERA formuliert;
> es wurden keine fremden AGB und keine Kanzleimuster übernommen.
>
> **Gilt nur für Verbraucher.** Aufträge von Unternehmen, Schulen und
> anderen Organisationen regelt Dokument **04**. Die beiden Texte dürfen
> nicht vermischt werden — der Prüfmaßstab ist ein anderer
> (§ 310 Abs. 1 BGB).

---

## Hinweise zum Entwurf (nicht Teil des Vertragstexts)

**Was durch Code belegt ist**, steht ohne Markierung. **Was noch zu
entscheiden ist**, trägt `[VOR VERWENDUNG KLÄREN: …]`. **Was die Technik
heute nicht kann**, ist mit ⚠️ gekennzeichnet — dort würde der Text etwas
versprechen, das die Seite nicht einlöst.

**Die Vertragstypfrage ist bewusst offen gelassen.** Ob die Teilnahme an
einer Veranstaltung ein Dienstvertrag, ein Werkvertrag oder ein Vertrag
eigener Art ist, entscheidet über § 648 BGB und damit über die
Stornoregelung. Der Entwurf ist so formuliert, dass er in beiden
Richtungen trägt; die Einordnung gehört in die fachliche Prüfung.

---

# Teilnahmebedingungen für Veranstaltungen von VERA

## 1. Geltungsbereich und Begriffe

1.1 Diese Teilnahmebedingungen gelten für alle Verträge über die
Teilnahme an Veranstaltungen, die Adam Maurice Lasarzik, Mühlenstr. 8a,
14167 Berlin (im Folgenden „VERA") mit Verbraucherinnen und Verbrauchern
schließt.

1.2 Verbraucher ist, wer den Vertrag zu Zwecken abschließt, die
überwiegend weder der gewerblichen noch der selbständigen beruflichen
Tätigkeit zugerechnet werden können (§ 13 BGB). Für Aufträge von
Unternehmen, Schulen und anderen Organisationen gelten gesonderte
Bedingungen.

1.3 „Veranstaltung" ist das jeweils auf der Website beschriebene
Angebot. „Anmeldung" ist die Buchung eines oder mehrerer Plätze durch
eine Person. „Teilnehmende" sind die in der Anmeldung namentlich
benannten Personen.

1.4 Abweichende Bedingungen der anmeldenden Person werden nicht
Vertragsbestandteil, es sei denn, VERA stimmt ihnen ausdrücklich in
Textform zu.

---

## 2. Welche Leistung geschuldet ist

2.1 Was eine Veranstaltung umfasst, ergibt sich **ausschließlich aus der
Beschreibung auf der jeweiligen Eventseite** zum Zeitpunkt der
Anmeldung. Diese Beschreibung ist maßgeblich.

2.2 Leistungen wie Betreuung durch einen Trainer, die Bereitstellung von
Schlägern und Bällen oder Speisen und Getränke sind **nur dann im Preis
enthalten, wenn die Eventseite sie ausdrücklich als enthalten
ausweist.** Sind sie dort nicht genannt, sind sie nicht geschuldet.

2.3 Allgemeine Darstellungen auf der Startseite, in Kurztexten oder in
Werbematerial beschreiben das Angebot, begründen aber für sich genommen
keinen Anspruch auf eine bestimmte Einzelleistung.

2.4 Steht für eine Veranstaltung noch kein Termin fest, ist das auf der
Eventseite als solches gekennzeichnet. Der Termin wird nachträglich
mitgeteilt. **Ziffer 8.4 gilt dann besonders.**

> **Warum das so formuliert ist.** Die Eventdaten liegen je Veranstaltung
> in der Datenbank (`prisma/schema.prisma` → `Event`), einschließlich der
> Abschnitte „Das ist dabei" und „Mitbringen"
> (`EventAbschnitt`). Der Preis wird serverseitig aus denselben Werten
> berechnet. Der Text verweist deshalb auf genau die Stelle, die auch
> technisch die Quelle ist.

---

## 3. Wie der Vertrag zustande kommt

3.1 Die Darstellung der Veranstaltungen auf der Website ist kein
bindendes Angebot, sondern eine Aufforderung zur Anmeldung.

3.2 Die Anmeldung läuft über diese Schritte:

1. Auswahl der Veranstaltung und der Teilnehmenden; der Gesamtpreis
   wird dabei laufend angezeigt.
2. Eingabe der Kontakt- und Teilnehmerdaten.
3. Anzeige einer Übersicht mit allen Einzelposten und dem Gesamtbetrag.
4. Absenden der Anmeldung über die Schaltfläche
   `[VOR VERWENDUNG KLÄREN: endgültige Beschriftung — siehe Dokument 08,
   Befund C-1. Die derzeitige Beschriftung „Zur Bezahlung – {Betrag}"
   ist auf ihre Vereinbarkeit mit § 312j Abs. 3 BGB zu prüfen.]`
5. Weiterleitung auf die gesicherte Bezahlseite des
   Zahlungsdienstleisters.
6. Nach erfolgreicher Zahlung: Bestätigung der Anmeldung per E-Mail.

3.3 **Mit dem Absenden der Anmeldung geben Sie ein verbindliches Angebot
auf Abschluss des Teilnahmevertrags ab.** Der Vertrag kommt zustande,
sobald VERA die Anmeldung bestätigt. Die Bestätigung erfolgt bei
kostenpflichtigen Veranstaltungen nach Eingang der Zahlung, bei
kostenlosen Veranstaltungen unmittelbar nach dem Absenden.

3.4 Der Eingang der Anmeldung wird unverzüglich elektronisch bestätigt.
Diese Eingangsbestätigung ist noch keine Annahme des Angebots.

3.5 **Der Platz wird ab dem Absenden für 30 Minuten reserviert**, damit
die Zahlung abgeschlossen werden kann. Wird in dieser Zeit nicht bezahlt,
verfällt die Reservierung und der Platz steht wieder zur Verfügung. Die
Anmeldung bleibt gespeichert und kann über den Link auf der
Abschluss-Seite fortgesetzt werden, solange Plätze frei sind.

3.6 Der Vertragstext wird bei VERA gespeichert. Die Bestätigungsmail
enthält die Daten der Anmeldung. Die Teilnahmebedingungen sind jederzeit
auf der Website abrufbar.

3.7 Der Vertrag wird in deutscher Sprache geschlossen.

3.8 Eine Anmeldung ist erst mit vollständiger Zahlung verbindlich
angenommen. Solange nicht bezahlt ist, besteht kein Anspruch auf einen
Platz — auch nicht während der Reservierungszeit nach Ziffer 3.5, wenn
diese abgelaufen ist.

> ✅ **Deckt sich mit dem Code.** Reservierung 30 Minuten, Bestätigung
> erst über die signaturgeprüfte Rückmeldung des Zahlungsdienstleisters
> (`app/zahlung/rueckmeldung/route.ts`), Platzprüfung in einer
> Transaktion (`app/(seite)/anmeldung/aktion.ts`). Die Formulierung
> beschreibt den tatsächlichen Ablauf.

---

## 4. Preise und Zahlung

4.1 Es gelten die auf der jeweiligen Eventseite angegebenen Preise zum
Zeitpunkt der Anmeldung.

4.2 **VERA ist Kleinunternehmen im Sinne von § 19 UStG.** Es wird keine
Umsatzsteuer berechnet und daher auch keine ausgewiesen. Die angegebenen
Preise sind Endpreise.

4.3 Der Gesamtpreis wird vor dem Absenden der Anmeldung vollständig
angezeigt. Zusätzliche Kosten fallen nicht an; insbesondere werden keine
Buchungs-, Service- oder Zahlungsgebühren erhoben.

4.4 Die Zahlung erfolgt über den auf der Bezahlseite angebotenen Weg.
Die Zahlungsdaten geben Sie unmittelbar beim Zahlungsdienstleister ein;
sie erreichen die Website von VERA zu keinem Zeitpunkt.

4.5 Der Gesamtbetrag ist mit dem Absenden der Anmeldung fällig.

> **Zu 4.2:** Die Angabe deckt sich mit `content/de.ts`. **Wichtig:** Der
> frühere Zusatz „inkl. MwSt." wurde im Projekt bereits an allen fünf
> Fundstellen ersetzt. Sollte die Kleinunternehmerregelung entfallen,
> müssen diese Stellen **und** Ziffer 4.2 gemeinsam geändert werden.

---

## 5. Wer teilnehmen darf

5.1 Die Teilnahme setzt eine wirksame Anmeldung und die vollständige
Zahlung voraus.

5.2 Für einzelne Veranstaltungen können auf der Eventseite besondere
Voraussetzungen genannt sein, etwa ein Mindestalter oder eine
Zielgruppe. Diese Angaben sind verbindlich.

5.3 Die Teilnahme setzt eine dem Angebot entsprechende gesundheitliche
Eignung voraus. Siehe Ziffer 10.

---

## 6. Anmeldung Minderjähriger

6.1 Minderjährige dürfen nur mit Zustimmung einer erziehungsberechtigten
Person teilnehmen. Die anmeldende Person bestätigt bei der Anmeldung,
erziehungsberechtigt und zur Abgabe der erforderlichen Erklärungen
berechtigt zu sein. Soweit die Zustimmung einer weiteren
sorgeberechtigten Person erforderlich ist, muss auch diese vorliegen.

6.2 **Vertragspartner ist die anmeldende erziehungsberechtigte Person**,
nicht die minderjährige teilnehmende Person.

6.3 Es gibt zwei Wege der Teilnahme: **begleitet**, wenn eine
erziehungsberechtigte Person während der gesamten Veranstaltung
persönlich anwesend ist, oder **unbegleitet**. Für den unbegleiteten
Weg muss die von VERA bereitgestellte Einverständniserklärung
vollständig ausgefüllt, unterschrieben und beim Ankommen abgegeben
werden. Liegt sie bei Veranstaltungsbeginn nicht vor, kann die
Teilnahme abgelehnt werden. Gesetzliche und vertragliche
Erstattungsansprüche bleiben unberührt.

6.4 **VERA übernimmt keine Aufsicht über unbegleitete minderjährige
Teilnehmende.** Es gibt kein von VERA festgelegtes Mindestalter für die
Teilnahme oder für das selbstständige Kommen und Gehen — die
erziehungsberechtigte Person entscheidet beides mit ihrer Unterschrift
auf der Einverständniserklärung. VERA erfasst beim Ankommen, wer
erschienen ist, überwacht aber nicht, wer das Gelände wann verlässt.
Für die Organisation des Hin- und Rückwegs ist die
erziehungsberechtigte Person verantwortlich.

6.5 Die erziehungsberechtigte Person muss während der gesamten
Veranstaltung unter der angegebenen Mobilnummer erreichbar sein. Hat sie
das selbstständige Verlassen des Geländes nicht erlaubt, weist VERA die
minderjährige Person nicht des Geländes; eine Beaufsichtigung während
der Zeit bis zur Abholung übernimmt VERA nicht.

6.6 Statt einer Aufsichtsübernahme schuldet VERA jeder teilnehmenden
Person eine Sicherheitseinweisung vor dem ersten Spielen (siehe Ziffer
11.2) sowie erkennbare Ansprechpersonen, die bei einer erkannten Gefahr
eingreifen. Weitere Einzelheiten regelt die Einverständniserklärung
(Dokument 05) und die Hausordnung (Dokument 09).

> ⚠️ **Geändert am 18.09.2026.** Die Ziffern 6.3 bis 6.6 wurden an das
> **Anlagenmodell** angepasst, für das sich Adam nach einem
> ausführlichen Entscheidungsprozess entschieden hat (Dokument 11,
> Entscheidung 3.20, bestätigt am 18.09.2026). Die frühere Fassung
> („Betreuung durch VERA beginnt mit dem Check-in und endet mit dem
> offiziellen Ende") hätte eine Aufsichtsübernahme zugesagt, die so
> nicht mehr gilt. **Diese Einordnung — ob das Anlagenmodell bei einem
> gezielt an Schüler vermarkteten Format ohne Mindestalter trägt —
> gehört ausdrücklich in die fachliche Prüfung** (siehe Dokument 05,
> Teil III).

---

## 7. Stornierung durch Teilnehmende

> **Konstruktion dieser Ziffer.** 7.1 bis 7.3 sind eine **freiwillige
> Besserstellung**: VERA räumt ein Lösungsrecht ein, das ohne diese
> Regelung so nicht bestünde. Eine Besserstellung ist unbedenklich.
> Heikel ist 7.5 — der Einbehalt. Er ist hier bewusst **mit dem
> Nachweisvorbehalt** formuliert, der in der bisherigen Fassung fehlte.

7.1 Sie können eine Buchung **bis 24 Stunden vor dem angekündigten
Beginn der Veranstaltung kostenlos stornieren.** Erstattet wird der
volle Betrag, ohne Abzug.

7.2 Die Stornierung erfolgt über den Link in der Bestätigungsmail. Er
führt zu einer Seite, die die Buchung anzeigt; storniert wird erst mit
einem Klick auf die dortige Schaltfläche. Der volle Betrag wird
unmittelbar zur Rückerstattung angewiesen — auf demselben Weg, über den
gezahlt wurde. Je nach Zahlungsdienstleister und Bank kann die
Gutschrift einige Werktage dauern. Der Platz wird sofort wieder frei.

7.3 Ist die Bestätigungsmail nicht mehr auffindbar, genügt eine
Nachricht an kontakt@veraevents.de.

7.4 Solange für eine Veranstaltung noch kein Termin feststeht, ist eine
Stornierung jederzeit möglich.

7.5 **Nach Ablauf der Frist nach Ziffer 7.1 und bei Nichterscheinen**
bleibt der Anspruch von VERA auf die vereinbarte Vergütung bestehen.
VERA muss sich anrechnen lassen, was an Aufwendungen erspart oder durch
anderweitige Vergabe des Platzes erlangt wird.

**Ihnen bleibt ausdrücklich der Nachweis vorbehalten, dass VERA kein
oder ein wesentlich geringerer Schaden entstanden ist.** In diesem Fall
ermäßigt sich der einbehaltene Betrag entsprechend.

7.6 VERA kann im Einzelfall eine kulantere Lösung anbieten. Ein Anspruch
darauf besteht nicht. Wenden Sie sich in jedem Fall an
kontakt@veraevents.de — auch nach Ablauf der Frist.

7.7 Ein gebuchter Platz kann nicht auf eine andere Person übertragen
werden. Das ist auch nicht erforderlich: Wer verhindert ist, storniert
nach Ziffer 7.1 kostenlos; die andere Person meldet sich selbst an,
solange Plätze frei sind.

7.8 Diese Bedingungen legt VERA selbst fest. Ein etwaiges gesetzliches
Widerrufsrecht (siehe Ziffer 13) besteht unabhängig davon und wird durch
sie nicht eingeschränkt.

> ⚠️ **Was sich gegenüber der bisherigen Fassung ändert — und warum.**
> Die bisherige Fassung lautete: „Bei einer Absage weniger als 24 Stunden
> vor Beginn und bei Nichterscheinen besteht grundsätzlich kein Anspruch
> auf Erstattung." Drei Probleme:
>
> 1. **Volleinbehalt ohne Anrechnung.** § 309 Nr. 5 Buchst. a BGB
>    verlangt, dass eine Pauschale den typischerweise zu erwartenden
>    Schaden nicht übersteigt.
> 2. **Kein Nachweisvorbehalt.** § 309 Nr. 5 Buchst. b BGB verlangt
>    ausdrücklich, dass dem Kunden der Nachweis eines geringeren Schadens
>    offensteht. Er fehlte.
> 3. **„grundsätzlich" und „wir finden eine Lösung" waren intransparent.**
>    Die Kundin konnte ihrer Rechtslage nicht entnehmen, ob sie etwas
>    zurückbekommt. Jetzt steht die Regel in 7.5, die Kulanz getrennt
>    davon in 7.6.
>
> **Gegenargument, das mitgeprüft gehört:** 24 Stunden sind kurz, der
> Platz ist in dieser Zeit kaum neu zu vergeben, und die Beträge sind
> klein. Es ist vertretbar, die Klausel nicht als Schadenspauschale zu
> verstehen, sondern als Vorbehalt der gesetzlichen Lage — dann wäre
> § 309 Nr. 5 BGB gar nicht einschlägig. Die hier gewählte Fassung
> funktioniert in **beiden** Lesarten und ist deshalb die vorsichtigere.
>
> ⚠️ **Technischer Abgleich nötig:** Ziffer 7.5 beschreibt eine
> Anrechnung. Die Software rechnet heute nichts an — sie verweigert nach
> Fristablauf schlicht die Selbstbedienungs-Stornierung
> (`lib/storno.ts`). Das ist kein Widerspruch (die Anrechnung geschieht
> auf Anfrage von Hand), muss aber bewusst so gewollt sein.

---

## 8. Absage, Verlegung und Programmänderungen

8.1 Muss eine Veranstaltung ausfallen, wird allen Angemeldeten
automatisch der volle Betrag erstattet, ohne dass dafür etwas beantragt
werden muss. Die Absage wird so früh wie möglich per E-Mail mitgeteilt.

8.2 VERA kann eine Veranstaltung absagen, wenn die Durchführung aus
Gründen unmöglich oder unzumutbar wird, die VERA nicht zu vertreten hat
— insbesondere bei Ausfall der Veranstaltungsstätte, behördlichen
Anordnungen, Unwetter oder sonstigen Ereignissen höherer Gewalt. Es
gilt Ziffer 8.1.

8.3 `[VOR VERWENDUNG KLÄREN: Mindestteilnehmerzahl.]`

> ⚠️ **Hier fehlt die technische Grundlage.** Das Datenmodell kennt
> **kein Feld für eine Mindestteilnehmerzahl** (`prisma/schema.prisma`
> → `Event` hat `maxPersonen`, aber kein Gegenstück). Eine Klausel, die
> eine Absage wegen Unterschreitung einer Mindestteilnehmerzahl erlaubt,
> setzt voraus, dass diese Zahl **vor der Anmeldung bekannt gegeben
> wird** — sonst wäre sie schon deshalb angreifbar.
>
> **Zwei Wege, beide vertretbar:**
>
> **(a) Keine Mindestteilnehmerzahl.** Ziffer 8.3 entfällt ersatzlos.
> VERA führt jede Veranstaltung durch oder sagt nach 8.2 ab. Erfordert
> keine Änderung an der Software.
>
> **(b) Mindestteilnehmerzahl einführen.** Dann ist erforderlich:
> ein Feld im Datenmodell, die Anzeige auf der Eventseite **vor** der
> Anmeldung, eine Absagefrist, und folgender Klauselentwurf:
>
> > Ist für eine Veranstaltung auf der Eventseite eine
> > Mindestteilnehmerzahl angegeben und wird diese nicht erreicht, kann
> > VERA die Veranstaltung bis spätestens `[Frist]` vor dem Beginn
> > absagen. Der volle Betrag wird erstattet; weitergehende Ansprüche
> > bestehen nicht, soweit VERA die Absage nicht zu vertreten hat.
>
> **Ohne Entscheidung darf Ziffer 8.3 nicht veröffentlicht werden.**

8.4 **Verlegung.** `[VOR VERWENDUNG KLÄREN: Soll eine Verlegung möglich
sein, und mit welcher Folge?]`

> ⚠️ **Auch hier fehlt die technische Grundlage.** Die Software kennt
> heute nur „absagen und erstatten" (`lib/stornoAusfuehren.ts`). Eine
> Verlegung mit Fortbestand der Buchung ist nicht gebaut.
>
> **Besonders wichtig wegen Ziffer 2.4:** Veranstaltungen ohne
> feststehenden Termin sind ausdrücklich vorgesehen (`startAt` ist
> nullable, die Seite zeigt „Termin folgt"). Die spätere Bekanntgabe
> eines Termins ist **keine Verlegung**, sondern die Konkretisierung
> einer von Anfang an offenen Leistungszeit — und sie hat erhebliche
> Folgen für das Widerrufsrecht (Ziffer 13 und Dokument 07).
>
> **Klauselentwurf, falls Verlegung gewollt ist:**
>
> > Muss eine Veranstaltung verlegt werden, teilt VERA den neuen Termin
> > unverzüglich mit. Sie können die Buchung auf den neuen Termin
> > übernehmen oder innerhalb von `[Frist]` nach der Mitteilung ohne
> > Angabe von Gründen stornieren; in diesem Fall wird der volle Betrag
> > erstattet. Weitergehende Ansprüche bleiben unberührt.

8.5 **Programmänderungen.** VERA kann den Ablauf einer Veranstaltung
ändern, soweit die Änderung den Gesamtcharakter der Veranstaltung nicht
beeinträchtigt und für Sie zumutbar ist. Das gilt insbesondere für die
zeitliche Einteilung, die Reihenfolge der Programmpunkte und den Wechsel
einzelner Betreuungspersonen.

8.6 **Ausfall einzelner Leistungen.** Fällt eine auf der Eventseite
ausdrücklich als enthalten ausgewiesene Einzelleistung ersatzlos aus,
können Sie eine angemessene Minderung des Preises verlangen.
Weitergehende Ansprüche richten sich nach Ziffer 11.

> **Zu 8.5 — warum diese Fassung und keine weitere.** Ein
> Änderungsvorbehalt in AGB ist an § 308 Nr. 4 BGB zu messen: Die
> Änderung muss unter Berücksichtigung der Interessen von VERA für die
> Kundin zumutbar sein. Eine Klausel, die Änderungen ohne diese Grenze
> erlaubte („VERA behält sich Programmänderungen vor"), wäre angreifbar.
> Die Grenze ist deshalb im Text selbst genannt, nicht bloß gemeint.

---

## 9. Ihre Pflichten vor Ort

9.1 Den Anweisungen des Veranstaltungs-, Betreuungs- und Hallenpersonals
ist Folge zu leisten, soweit sie der Sicherheit, dem geordneten Ablauf
oder dem Schutz anderer dienen.

9.2 Es gilt die Hausordnung der jeweiligen Veranstaltungsstätte. Sie ist
vor Ort aushängend oder auf Nachfrage einsehbar. Bei Widersprüchen
zwischen diesen Teilnahmebedingungen und der Hausordnung gilt für die
Nutzung der Räume und Anlagen die Hausordnung.

9.3 Sportgeräte und Einrichtungen sind bestimmungsgemäß und sorgfältig
zu benutzen.

9.4 Ergänzende Verhaltensregeln enthält Dokument 09
(Hausordnung und Teilnahmehinweise).

9.5 Bei erheblichen oder wiederholten Verstößen gegen Ziffern 9.1 bis
9.4, insbesondere bei Gefährdung anderer Personen, kann VERA Sie von der
weiteren Teilnahme ausschließen. Ein Anspruch auf Erstattung besteht in
diesem Fall nicht, soweit der Ausschluss berechtigt war. Ziffer 7.5
Satz 3 gilt entsprechend.

---

## 10. Gesundheitliche Eigenverantwortung

10.1 Die Teilnahme an sportlichen Veranstaltungen setzt eine
entsprechende gesundheitliche Eignung voraus. Sie entscheiden
eigenverantwortlich, ob Sie an einer Veranstaltung teilnehmen. VERA
führt keine Gesundheitsprüfung durch und schuldet keine solche.

10.2 Bestehen Zweifel an der eigenen Belastbarkeit, sollte vor der
Teilnahme ärztlicher Rat eingeholt werden.

10.3 Gesundheitliche Einschränkungen, die für die Sicherheit während der
Veranstaltung erheblich sind, sollten dem Betreuungspersonal vor Beginn
mitgeteilt werden. Die Mitteilung ist freiwillig.

10.4 Ziffer 10 schränkt die Haftung von VERA nicht ein. Insbesondere
bleiben die Pflichten von VERA zur Verkehrssicherung, zur ordnungsgemäßen
Einweisung und zur Bereitstellung geeigneter Ausrüstung unberührt.

> **Warum Ziffer 10.4 unbedingt dort steht.** Ohne sie läse sich Ziffer
> 10 wie ein versteckter Haftungsausschluss („Handeln auf eigene
> Gefahr"). Eine solche Klausel wäre gegenüber Verbrauchern an
> § 309 Nr. 7 BGB zu messen und für Körperschäden von vornherein
> unwirksam — und sie würde dabei die daneben stehende, saubere
> Haftungsregel in Ziffer 11 beschädigen. Eigenverantwortung und
> Haftungsverteilung sind zwei Dinge; sie werden hier bewusst
> auseinandergehalten.

---

## 11. Haftung

> **Aufbau dieser Ziffer.** Erst die zwingenden Ausnahmen, dann die
> Begrenzung — nicht umgekehrt. Eine Begrenzung, die vor ihren Ausnahmen
> steht, wird beim Lesen zuerst als Ausschluss verstanden. Die geschützte
> Kernpflicht wird **konkret benannt**, nicht nur als „wesentliche
> Vertragspflicht" umschrieben.

11.1 **VERA haftet unbeschränkt**

- für Schäden aus der Verletzung des Lebens, des Körpers oder der
  Gesundheit, die auf einer Pflichtverletzung von VERA oder einer
  Person beruhen, deren VERA sich zur Erfüllung bedient,
- für sonstige Schäden, die auf Vorsatz oder grober Fahrlässigkeit von
  VERA oder einer Person beruhen, deren VERA sich zur Erfüllung
  bedient,
- bei Übernahme einer Garantie,
- nach den Vorschriften des Produkthaftungsgesetzes.

11.2 **Bei einfacher Fahrlässigkeit** haftet VERA nur für die
Verletzung einer Pflicht, deren Erfüllung die ordnungsgemäße
Durchführung des Vertrags überhaupt erst ermöglicht und auf deren
Einhaltung Sie regelmäßig vertrauen dürfen. Solche Pflichten sind
insbesondere:

- die Veranstaltung zum angekündigten Zeitpunkt am angekündigten Ort
  durchzuführen,
- die auf der Eventseite als enthalten ausgewiesenen Leistungen zu
  erbringen,
- die Veranstaltungsfläche und die bereitgestellte Ausrüstung in
  verkehrssicherem Zustand zur Verfügung zu stellen,
- in die Nutzung der Anlage und der Ausrüstung ordnungsgemäß
  einzuweisen — bei Veranstaltungen im Anlagenmodell (Ziffer 6.4, 6.6)
  insbesondere die **Sicherheitseinweisung** vor dem ersten Spielen
  (Dokument 09, Ziffer 4.8), die dort ausdrücklich an die Stelle einer
  Aufsichtsübernahme tritt,
- den gezahlten Betrag nach Ziffer 7 und 8 zurückzuerstatten.

In diesen Fällen ist die Haftung auf den bei Vertragsschluss
vorhersehbaren, vertragstypischen Schaden begrenzt.

11.3 Im Übrigen ist die Haftung von VERA für einfache Fahrlässigkeit
ausgeschlossen.

11.4 Die Ziffern 11.1 bis 11.3 gelten auch zugunsten der Mitarbeitenden,
Betreuungspersonen und sonstigen Erfüllungsgehilfen von VERA.

11.5 Eine Änderung der gesetzlichen Beweislast zu Ihrem Nachteil ist mit
diesen Bedingungen nicht verbunden.

> `[VOR VERWENDUNG KLÄREN: Soll Ziffer 11.2 und 11.3 überhaupt gelten?]`
>
> Die **bisherige** AGB-Fassung enthält keine Begrenzung: Sie verweist
> auf das Gesetz und stellt nur klar, dass für Leben, Körper, Gesundheit
> sowie Vorsatz und grobe Fahrlässigkeit nichts beschränkt wird. Das ist
> die sicherste denkbare Fassung — sie kann nicht unwirksam sein, weil
> sie nichts beschränkt.
>
> **Der Entwurf oben geht bewusst einen Schritt weiter** und begrenzt die
> Haftung für einfache Fahrlässigkeit außerhalb der Kernpflichten. Das
> ist rechtlich möglich und bei einer Sportveranstaltung wirtschaftlich
> naheliegend. Es ist aber eine **Entscheidung des Unternehmers**, keine
> technische Notwendigkeit. Wird sie nicht getroffen, bleibt die
> bisherige Fassung stehen — dann entfallen 11.2 und 11.3, und 11.1
> wird um den Satz ergänzt: „Im Übrigen gelten die gesetzlichen
> Vorschriften."
>
> **Ausdrücklich kein Argument für die Begrenzung ist eine bestehende
> Versicherung.** Eine Versicherungssumme belegt die Wirksamkeit einer
> Haftungsbegrenzung nicht. Beides ist getrennt zu prüfen.
>
> `[VOR VERWENDUNG KLÄREN: Besteht eine Veranstalter- oder
> Betriebshaftpflichtversicherung, und welche Veranstaltungsarten deckt
> sie? Das ist für das tatsächliche Risiko wichtiger als jede Klausel.]`

---

## 12. Veranstaltungsstätte und weitere Beteiligte

12.1 Veranstaltungen finden in Räumen und auf Anlagen statt, die VERA
nicht selbst betreibt. Betreiberpflichten der jeweiligen Anlage —
insbesondere die Verkehrssicherungspflicht für Gebäude, Bodenbeläge und
fest installierte Einrichtungen — treffen den Betreiber der Anlage.

12.2 VERA bleibt verantwortlich für die eigene Leistung: Organisation
und Durchführung der Veranstaltung, Auswahl geeigneter Anlagen und
Betreuungspersonen, Einweisung und die von VERA bereitgestellte
Ausrüstung.

12.3 Ziffer 12.1 stellt die Verantwortungsbereiche klar; sie beschränkt
die Haftung von VERA nach Ziffer 11 nicht.

> ⚠️ **Der heikelste Punkt des gesamten Entwurfs.** Die Abgrenzung
> zwischen Veranstalter- und Betreiberpflichten lässt sich nicht durch
> AGB regeln — sie folgt aus dem Deliktsrecht und aus dem Vertrag
> zwischen VERA und der Anlage. Ziffer 12 **beschreibt** die Verteilung,
> sie **verschiebt** sie nicht. Eine Klausel, die versuchte, die Haftung
> auf den Anlagenbetreiber abzuwälzen, wäre gegenüber Verbrauchern
> angreifbar und ist hier bewusst nicht formuliert.
>
> `[VOR VERWENDUNG KLÄREN: Was steht im Vertrag zwischen VERA und der
> jeweiligen Veranstaltungslocation? Wer stellt die Ausrüstung? Wer stellt den Trainer — VERA,
> die Halle oder ein selbständiger Dritter? Davon hängt ab, ob der
> Trainer Erfüllungsgehilfe von VERA nach § 278 BGB ist. Diese Frage
> ist für die Haftung wichtiger als jede Formulierung in Ziffer 11.]`

---

## 13. Widerrufsrecht

13.1 Ob Ihnen ein gesetzliches Widerrufsrecht zusteht, hängt von der
jeweiligen Veranstaltung ab. Die Einzelheiten stehen in der gesonderten
Information „Widerruf und Stornierung".

13.2 Das freiwillige Stornierungsrecht nach Ziffer 7 besteht unabhängig
davon und wird durch ein etwaiges Widerrufsrecht nicht berührt.

> **Warum hier nur ein Verweis steht.** Die Frage ist nicht einheitlich
> zu beantworten — siehe Dokument 07. Eine Belehrung in den AGB, die für
> alle Veranstaltungen dasselbe behauptete, wäre für einen Teil des
> Angebots falsch.

---

## 14. Vertragsdauer

Der Vertrag ist auf die Teilnahme an der jeweiligen Veranstaltung
gerichtet und endet mit deren Durchführung, mit einer wirksamen
Stornierung oder mit einer Absage. Ein Dauerschuldverhältnis entsteht
nicht; eine Kündigung ist daher nicht erforderlich.

> **Praktische Folge:** Weil kein Dauerschuldverhältnis entsteht, greift
> die Pflicht zur Kündigungsschaltfläche nach § 312k BGB nicht. Das ist
> die gute Nachricht. Die **Widerrufsschaltfläche** nach § 356a BGB ist
> davon zu unterscheiden — siehe Dokument 07 und 08.

---

## 15. Anwendbares Recht und Gerichtsstand

15.1 Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss
des UN-Kaufrechts. Haben Sie Ihren gewöhnlichen Aufenthalt in einem
anderen Staat, bleiben die zwingenden Verbraucherschutzvorschriften
dieses Staates unberührt.

15.2 **Eine Gerichtsstandsvereinbarung wird nicht getroffen.** Es gelten
die gesetzlichen Vorschriften.

> **Warum keine Gerichtsstandsklausel.** Gegenüber Verbrauchern ist eine
> solche Vereinbarung nur in den engen Grenzen von § 38 Abs. 3 ZPO
> zulässig — insbesondere nach Entstehen der Streitigkeit oder bei
> Wohnsitzverlegung ins Ausland. Eine allgemeine Klausel „Gerichtsstand
> ist Berlin" wäre unwirksam und würde zudem den Eindruck erwecken, die
> Kundin müsse dort klagen. Sie wegzulassen ist die bessere Lösung als
> sie einzuschränken.

---

## 16. Verbraucherstreitbeilegung

`[VOR VERWENDUNG KLÄREN: Formulierung erst nach der Entscheidung aus
Dokument 01, Abschnitt 4.2.]`

**Geprüfter Stand (16.09.2026):** Die EU-Plattform für
Online-Streitbeilegung wurde zum 20.07.2025 eingestellt (Verordnung
(EU) 2024/3228). Ein Hinweis auf sie darf **nicht** aufgenommen werden.

---

## 17. Schlussbestimmungen

17.1 Sollte eine Bestimmung dieser Teilnahmebedingungen unwirksam sein
oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
An die Stelle der unwirksamen Bestimmung treten die gesetzlichen
Vorschriften.

17.2 Änderungen dieser Teilnahmebedingungen gelten nur für Anmeldungen,
die nach ihrem Inkrafttreten abgegeben werden. Für bereits geschlossene
Verträge gilt die bei der Anmeldung einbezogene Fassung.

17.3 Stand dieser Bedingungen: `[VOR VERWENDUNG KLÄREN: Datum des
Inkrafttretens eintragen.]`

> **Zu 17.1 — was bewusst NICHT dort steht.** Die verbreitete
> „salvatorische Klausel" mit dem Zusatz, die Parteien würden die
> unwirksame Bestimmung durch eine wirtschaftlich gleichwertige
> ersetzen, ist in Verbraucher-AGB problematisch: Sie läuft auf eine
> geltungserhaltende Reduktion hinaus, die § 306 Abs. 2 BGB gerade nicht
> vorsieht. Der Entwurf verweist deshalb schlicht auf das Gesetz.

---

# Anhang: Einbeziehung — der wichtigste offene Punkt

Diese Bedingungen gelten nur, wenn sie nach **§ 305 Abs. 2 BGB** wirksam
einbezogen werden. Erforderlich ist ein **ausdrücklicher Hinweis** bei
Vertragsschluss und die Möglichkeit zumutbarer Kenntnisnahme.

**Heutiger Stand:** Die Rechtstexte sind ausschließlich über den
Fußbereich erreichbar. Ein Hinweis unmittelbar beim Bestellvorgang und
eine Bestätigung fehlen. Ein Fußzeilen-Link wird verbreitet **nicht** als
ausdrücklicher Hinweis angesehen.

**Folge, wenn die Einbeziehung ausfällt:** Keine der Ziffern 1 bis 17
gilt. An ihre Stelle tritt das Gesetz — einschließlich der Ziffern, die
VERA schützen sollen (7.5, 8, 9.5, 11.2, 11.3).

**Umsetzung: siehe Dokument 08, Abschnitt C-2.** Dort steht der konkrete
Vorschlag für Platzierung und Wortlaut der Bestätigung.
