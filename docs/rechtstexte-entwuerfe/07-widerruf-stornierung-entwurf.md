# 07 — Widerruf und Stornierung (Entwurf)

> **Status:** Entwurf, Version 1 vom 16.09.2026. **Nicht anwaltlich geprüft.**
>
> **Stand 18.09.2026:** § 312g Abs. 2 Nr. 9 BGB und die BGH-Anwendung
> auf Eintrittskarten wurden erneut recherchiert und bestätigen den
> unten dargestellten Befund (Dokument 14). Inhaltlich sonst
> unverändert — die zugrunde liegenden Fragen 2.5–2.7 aus Dokument 11
> sind weiterhin offen (siehe Dokument 15, Abschnitt B). Die freiwillige
> **24-Stunden-Storno-Regel** (kostenlose Stornierung bis 24 Stunden vor
> Veranstaltungsbeginn, volle Erstattung) ist davon unabhängig und
> bleibt unverändert Grundlage von Teil II dieses Dokuments.
>
> **Das ist das rechtlich heikelste der zehn Dokumente.** Es enthält
> zwei Funde, die vor jeder Veröffentlichung entschieden sein müssen.

---

## Teil I — Die beiden Funde

### Fund W-1 ⚠️ Die Freizeitausnahme greift nicht für alle Veranstaltungen

**Die Norm.** Nach **§ 312g Abs. 2 Nr. 9 BGB** besteht kein
Widerrufsrecht bei Verträgen über Dienstleistungen im Zusammenhang mit
Freizeitbetätigungen, **wenn der Vertrag für die Erbringung einen
spezifischen Termin oder Zeitraum vorsieht**. Die Vorschrift setzt
Art. 16 Buchst. l der Verbraucherrechte-Richtlinie (2011/83/EU) um und
ist richtlinienkonform auszulegen.

**Die Bedingung ist der springende Punkt:** *ein spezifischer Termin
oder Zeitraum*. Fehlt er, greift die Ausnahme nicht.

**Und genau das kommt bei VERA vor — belegt im Code:**

```
prisma/schema.prisma → model Event
  startAt DateTime?     // null = "steht noch nicht fest"
  endAt   DateTime?
```

Die Seite zeigt in diesem Fall einen sichtbaren Platzhalter („Termin
folgt", `content/de.ts` → `platzhalter.datumKurz`). Die bestehenden
Stornobedingungen sagen sogar ausdrücklich:

> „Solange für eine Veranstaltung noch kein Termin feststeht, ist eine
> Stornierung jederzeit möglich."

**Eine Veranstaltung ohne feststehenden Termin ist damit der Fall, in
dem die Ausnahme am wenigsten trägt** — und für den es heute keine
Widerrufsbelehrung gibt.

> ✅ **Überholt seit dem 20.09.2026 — der Befund beschreibt den Zustand
> VOR der Terminpflicht.** Die zitierte Klausel ist am 18.09.2026
> gestrichen, und die Software setzt seit dem 20.09.2026 durch, dass
> ohne feststehenden Termin **weder gebucht noch bezahlt** werden kann
> (Bauauftrag **B-5**, Prüfliste `T`). Der Fall, den dieser Befund
> beschreibt, kann bei einer **Buchung** nicht mehr entstehen.
> Veranstaltungen ohne Termin gibt es weiterhin — sie dürfen aber nur
> **angekündigt** werden und haben keinen Kaufknopf; ohne
> Vertragsschluss stellt sich die Widerrufsfrage dort nicht. Der Befund
> bleibt zur Nachvollziehbarkeit stehen. Die Auflösung steht in
> **Abschnitt 5a**.

**Weitere Fälle, die einzeln zu prüfen sind:**

| Angebot | Freizeitbetätigung? | Spezifischer Termin? |
|---|---|---|
| Padel-Nachmittag mit Datum und Uhrzeit | ja | ja → Ausnahme greift wahrscheinlich |
| ~~Veranstaltung ohne feststehenden Termin~~ *(seit 20.09.2026 nicht mehr buchbar, nur ankündbar — B-5)* | ja | **nein**, aber gegenstandslos: ohne Buchung kein Vertrag und keine Widerrufsfrage |
| Unternehmer-Netzwerkabend (Kategorie `BUSINESS` existiert im Datenmodell) | **fraglich** — beruflicher Bezug | ja |
| Büro- und administrative Dienstleistungen an Verbraucher | **nein** | in der Regel nein |

> **Die Aufforderung des Auftrags — „wende die Freizeitausnahme nicht
> pauschal auf sämtliche gegenwärtigen und zukünftigen Angebote an" —
> ist damit nicht nur vorsorglich, sondern durch den Code belegt
> berechtigt.**

### Fund W-2 ⚠️ § 356a BGB — die Widerrufsschaltfläche gilt bereits

**Geprüfter Stand (16.09.2026):** Seit dem **19.06.2026** verlangt
**§ 356a BGB** eine elektronische Widerrufsfunktion auf jeder
Online-Benutzeroberfläche, über die Verbraucher einen Fernabsatzvertrag
schließen können, **für den ein Widerrufsrecht besteht**. Grundlage ist
die Richtlinie (EU) 2023/2673.

**Das ist seit rund drei Monaten in Kraft.**

**Ausgenommen** sind Verträge, für die kein gesetzliches Widerrufsrecht
besteht — also die Fälle des Katalogs in § 312g BGB.

**Damit hängt alles an Fund W-1:**

- Greift die Freizeitausnahme → kein Widerrufsrecht → **keine
  Widerrufsschaltfläche nötig.**
- Greift sie **nicht** (insbesondere bei Veranstaltungen ohne
  feststehenden Termin) → Widerrufsrecht → **Widerrufsschaltfläche
  erforderlich, und sie fehlt.**

**Anforderungen nach dem geprüften Stand:** ständig verfügbar, gut
lesbar und eindeutig beschriftet, nicht hinter einer Anmeldung
versteckt, zweistufig mit Bestätigungsschaltfläche, und mit einer
Eingangsbestätigung unter Angabe von Datum und Uhrzeit.

> **Nicht zu verwechseln mit § 312k BGB** (Kündigungsschaltfläche). Die
> gilt für online geschlossene Dauerschuldverhältnisse. Ein
> Teilnahmevertrag für eine einzelne Veranstaltung ist keines — siehe
> Dokument 03 Ziffer 14. Die Kündigungsschaltfläche ist also **nicht**
> erforderlich.

**Der praktische Trost:** VERA hat bereits eine
Selbstbedienungs-Stornierung über einen Link in der Bestätigungsmail
(`lib/storno.ts`, `lib/stornoAusfuehren.ts`) — zweistufig, mit
Bestätigungsseite und Bestätigungsmail. Die technische Grundform ist
also vorhanden. `[VOR VERWENDUNG KLÄREN: Ob dieser Ablauf die
Anforderungen von § 356a BGB erfüllt — insbesondere „ständig verfügbar"
und „nicht hinter einer Hürde" — ist fachlich zu prüfen. Ein Link, der
nur in einer E-Mail steht, ist möglicherweise nicht „ständig
verfügbar".]`

---

## Teil II — Entwurf der Seite

> **Aufbau:** vier klar getrennte Abschnitte. Was gesetzlich gilt, was
> VERA freiwillig gewährt, was bei einer Absage passiert und wie das
> Geld zurückkommt. Die heutige Seite trennt bereits richtig; dieser
> Entwurf ergänzt den fehlenden Teil.

---

# Widerruf und Stornierung

Zwei Dinge, die oft verwechselt werden — sie haben nichts miteinander zu
tun und werden hier deshalb getrennt behandelt.

---

## 1. Das gesetzliche Widerrufsrecht

✅ **Entschieden von Adam am 18.09.2026: Fassung A gilt durchgehend.**
Ticketverkauf und Buchung sind künftig **nur möglich, wenn Datum und
Uhrzeit feststehen**; Events mit „Termin folgt" dürfen weiterhin
angekündigt werden, bekommen aber **keinen Kaufknopf**. Damit entfällt
die Notwendigkeit für Fassung B/C — sie bleiben unten nur zur
Dokumentation stehen, warum die einfachere Lösung gewählt wurde.

---

### Fassung A — Kein Widerrufsrecht (Veranstaltung mit festem Termin)

> Für die Teilnahme an dieser Veranstaltung besteht **kein gesetzliches
> Widerrufsrecht**.
>
> Der Grund: Bei Verträgen über Dienstleistungen im Zusammenhang mit
> Freizeitbetätigungen, für deren Erbringung ein spezifischer Termin
> vorgesehen ist, ist das Widerrufsrecht nach § 312g Abs. 2 Nr. 9 BGB
> ausgeschlossen. Diese Veranstaltung findet zu einem festen Termin
> statt.
>
> **Unabhängig davon räumt VERA Ihnen ein freiwilliges
> Stornierungsrecht ein** — siehe Abschnitt 2. Es geht in seinen Fristen
> über das hinaus, was gesetzlich vorgeschrieben wäre.

---

### Fassung B — Widerrufsrecht besteht (kein fester Termin, oder Ausnahme greift nicht)

> Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen
> diesen Vertrag zu widerrufen.
>
> `[VOR VERWENDUNG KLÄREN: Vollständige Widerrufsbelehrung. Hier ist
> ausdrücklich das gesetzliche Muster in Anlage 1 zu Art. 246a § 1
> Abs. 2 Satz 2 EGBGB zu verwenden und auf die konkrete Vertragsart
> anzupassen — nicht frei zu formulieren. Eine selbst formulierte
> Belehrung verliert den Schutz der Musterbelehrung. **Diesen Text
> schreibt die fachkundige Prüfung, nicht dieses Dokument.**]`
>
> **Zusätzlich erforderlich, falls diese Fassung gilt:**
> - Muster-Widerrufsformular als Anlage
> - **elektronische Widerrufsfunktion nach § 356a BGB** (siehe Fund W-2)
> - Hinweis auf die Rechtsfolgen, insbesondere Wertersatz, falls die
>   Leistung auf ausdrücklichen Wunsch vor Ablauf der Frist beginnt

---

### Fassung C — Die ehrliche Zwischenfassung

> **Nur verwenden, solange Fund W-1 nicht entschieden ist — und nicht
> im Echtbetrieb mit zahlenden Kunden.**

Die heute auf der Seite stehende Fassung sagt sinngemäß: Ob ein
Widerrufsrecht besteht, ist noch nicht geklärt, deshalb steht hier
bewusst keine Belehrung.

> ✅ **Das war und ist die richtige Zwischenlösung.** Eine Belehrung
> über ein Recht, das es nicht gibt, wäre irreführend; eine fehlende
> Belehrung über ein bestehendes Recht wäre ein Fehler mit Folgen.
>
> ⚠️ **Als Dauerzustand trägt sie nicht.** Besteht ein Widerrufsrecht
> und wird nicht ordnungsgemäß belehrt, beginnt die Frist nicht zu
> laufen; sie erlischt nach § 356 Abs. 3 Satz 2 BGB spätestens zwölf
> Monate und vierzehn Tage nach Vertragsschluss. Jede Buchung bliebe
> bis dahin widerruflich.

---

### Empfehlung zur Umsetzung, falls das Widerrufsrecht je Veranstaltung
### unterschiedlich zu beurteilen ist

Dann genügt **eine** feste Seite nicht. Nötig wäre:

1. ein Feld am Event, das festhält, ob ein Widerrufsrecht besteht,
2. die passende Belehrung **auf der jeweiligen Eventseite und im
   Bestellvorgang**, nicht nur zentral,
3. die Aufnahme in die Bestätigungsmail.

✅ **Beantwortet 18.09.2026:** Die zweite Antwort gilt — ausschließlich
Veranstaltungen mit festem Termin werden zum Kauf angeboten, Fassung A
durchgehend. **Technisch noch nicht umgesetzt** (nichts wurde
deployt): Ein Event ohne `startAt`/`endAt` dürfte künftig keinen
Kaufknopf mehr zeigen — das ist ein Bauauftrag für später, nicht für
diese Dokumentationsrunde. Siehe Dokument 15, Abschnitt G für die
Sammlung solcher technischen Folgen.

---

## 2. Stornierung durch Teilnehmende

> Dies ist eine **freiwillige** Regelung von VERA. Sie besteht
> unabhängig davon, ob ein gesetzliches Widerrufsrecht besteht, und
> schränkt ein solches Recht nicht ein.

> **2.1** Sie können eine Buchung **bis 24 Stunden vor dem angekündigten
> Beginn der Veranstaltung stornieren.** Erstattet wird der gezahlte
> Betrag abzüglich eines **Stornoentgelts von 0,35 € je Buchung**.
>
> **2.1a** Das Stornoentgelt fällt **einmal je Buchung** an, unabhängig
> davon, wie viele Personen gebucht waren und mit welcher Zahlungsart
> bezahlt wurde. Es wird Ihnen vor dem Kauf angezeigt, und vor dem
> endgültigen Stornieren sehen Sie den genauen Betrag, den Sie
> zurückerhalten. **Kein Stornoentgelt** fällt an, wenn VERA die
> Veranstaltung absagt (Ziffer 3.1) oder Ihnen ein zwingender
> gesetzlicher Erstattungsanspruch zusteht; dann erhalten Sie den
> vollen Betrag. **Ihnen bleibt der Nachweis vorbehalten, dass kein
> oder ein wesentlich geringerer Schaden beziehungsweise Aufwand
> entstanden ist.**
>
> **2.2** Die Stornierung läuft über den Link in Ihrer
> Bestätigungsmail. Er führt zu einer Seite, die Ihre Buchung anzeigt;
> storniert wird erst mit einem Klick auf die Schaltfläche dort. Sie
> erhalten anschließend eine Bestätigung per E-Mail. Der Platz wird
> sofort wieder frei.
>
> **2.3** Ist die Bestätigungsmail nicht mehr auffindbar, genügt eine
> Nachricht an kontakt@veraevents.de.
>
> **2.4** ❌ **Am 18.09.2026 gestrichen** — seit Entscheidung 2.5 kann
> eine Veranstaltung ohne feststehenden Termin nicht mehr gebucht
> werden, der Fall entsteht also nicht mehr.
>
> **2.5** Nach Ablauf der Frist und bei Nichterscheinen bleibt der
> Anspruch von VERA auf die vereinbarte Vergütung bestehen. Anzurechnen
> ist, was VERA an Aufwendungen erspart oder durch anderweitige Vergabe
> des Platzes erlangt. **Ihnen bleibt der Nachweis vorbehalten, dass
> kein oder ein wesentlich geringerer Schaden entstanden ist.**
>
> **2.6** Melden Sie sich in jedem Fall — auch nach Ablauf der Frist.
> Wir finden oft eine Lösung. Ein Anspruch darauf besteht nicht.
>
> **2.7** Ein gebuchter Platz kann nicht auf eine andere Person
> übertragen werden. Wer verhindert ist, storniert nach 2.1 kostenlos;
> die andere Person meldet sich selbst an, solange Plätze frei sind.

> **Änderung gegenüber der geltenden Fassung:** 2.5 ersetzt den Satz
> „besteht grundsätzlich kein Anspruch auf Erstattung". Begründung
> vollständig in Dokument 03, Ziffer 7 — kurz: Volleinbehalt ohne
> Anrechnung und ohne Nachweisvorbehalt ist an § 309 Nr. 5 BGB
> angreifbar, und „grundsätzlich" ließ den Kunden über seine Rechtslage
> im Unklaren.

---

## 3. Absage und Verlegung durch VERA

> **3.1 Absage.** Muss eine Veranstaltung ausfallen, wird allen
> Angemeldeten automatisch der volle Betrag erstattet — ohne dass dafür
> etwas beantragt werden muss. Die Absage wird so früh wie möglich per
> E-Mail mitgeteilt.
>
> ✅ **3.2 Verlegung — entschieden am 18.09.2026 (Entscheidung 2.10).**
> Es gibt **keine Verlegung**. Muss ein Termin verschoben werden, wird
> die Veranstaltung **abgesagt**, die Buchung vollständig aufgehoben und
> der gesamte Ticketpreis automatisch über die ursprüngliche Zahlungsart
> erstattet. Der neue Termin wird als **neue Veranstaltung**
> veröffentlicht; die Teilnehmenden können sich freiwillig neu anmelden.
> Eine automatische Umbuchung ohne ausdrückliche Zustimmung findet nicht
> statt. Der Verlegungsfall ist damit ein **Absagefall** und richtet
> sich nach Ziffer 3.1. Einzelheiten in Dokument 03, Ziffer 8.4.
>
> **Dieselbe Linie gilt im B2B** (Dokument 04, Ziffer 11.3): kein
> Ersatztermin, ein späterer Termin ist ein neuer Auftrag.
>
> ❌ **3.3 Nachträgliche Bekanntgabe eines Termins — am 20.09.2026
> gestrichen.** Der Abschnitt setzte voraus, dass eine Anmeldung ohne
> feststehenden Termin möglich ist, und verwies auf den bereits am
> 18.09.2026 gestrichenen Abschnitt 2.4. Seit **Entscheidung 2.5** sind
> Ticketverkauf und Buchung erst möglich, wenn **Datum und Uhrzeit
> feststehen**; Events mit „Termin folgt" dürfen nur angekündigt werden
> und haben keinen Kaufknopf. Damit kann der Fall nicht mehr eintreten.
> ✅ **Erledigt am 20.09.2026.** Der frühere Warnhinweis an dieser
> Stelle lautete: „Der Hinweis bleibt hier stehen, weil die Software es
> noch nicht durchsetzt — bis dahin ist die Gefahr real, dass eine
> Buchung ohne Termin entsteht, für die es dann keine passende Klausel
> gibt." **Das trifft nicht mehr zu.** Die Sperre ist gebaut und
> geprüft (Bauauftrag **B-5**, Prüfliste `T`: 40 Prüfungen, darunter
> der Umgehungsversuch über eine direkte Serveranfrage mit
> getauschter Veranstaltungskennung).
>
> ❌ **Der Klärungsbedarf zur Sonderfrist ist damit ebenfalls
> entfallen.** Er lautete: ob nach einer nachträglichen
> Terminbekanntgabe noch eine eigene Stornofrist gelten soll, falls der
> Termin bereits innerhalb der 24 Stunden liegt. Ohne Buchungen ohne
> Termin gibt es keine Buchung, die von einer solchen Bekanntgabe
> überrascht werden könnte.

> ⚠️ **Ein Rest von Befund T-1 bleibt — und zwar ein anderer als
> ursprünglich beschrieben.** Der alte Befund lautete: `lib/storno.ts`
> rechnet die Frist ab `startAt`, also sei die Selbstbedienung für
> Buchungen gesperrt, die ohne Termin zustande gekommen waren. Diese
> Fallgruppe gibt es nicht mehr.
>
> **Übrig bleibt der Fall, dass ein bereits feststehender Termin
> nachträglich VORVERLEGT wird.** Dann rutscht die 24-Stunden-Frist
> mit, und Buchungen, die vorher komfortabel innerhalb der Frist lagen,
> sind schlagartig außerhalb — ohne dass die Teilnehmenden etwas getan
> haben. Der Adminbereich hindert heute nicht daran (Bauauftrag
> **B-8**). Das ist kein Textproblem, sondern eines der Bedienung: Eine
> Terminänderung mit bestehenden Buchungen gehört nach Entscheidung
> 2.10 ohnehin als **Absage** behandelt, nicht als stille
> Verschiebung.

---

## 4. Wie das Geld zurückkommt

> **4.1** Erstattet wird immer auf demselben Weg, über den bezahlt
> wurde. Eine abweichende Auszahlung ist nicht möglich.
>
> **4.2** Die Rückzahlung wird unmittelbar nach der Stornierung
> angewiesen. Wie lange es bis zur Gutschrift dauert, hängt vom
> Zahlungsdienstleister und Ihrer Bank ab; einige Werktage sind üblich.
>
> **4.3** Außer dem Stornoentgelt nach Ziffer 2.1 fallen für Sie keine
> weiteren Kosten an. Insbesondere werden Ihnen keine Gebühren des
> Zahlungsdienstleisters gesondert berechnet.

> ✅ **4.1 und 4.2 sind im Code belegt.** Die Erstattung läuft über die
> ursprüngliche Zahlung (`lib/stornoAusfuehren.ts`).
>
> ⚠️ **4.3 ist seit dem 20.09.2026 neu gefasst und im Code NOCH NICHT
> umgesetzt.** Die frühere Zusage lautete „Für Sie fallen keine Kosten
> an … auch keine Gebühren des Zahlungsdienstleisters" und passt nicht
> mehr zu Ziffer 2.1. Solange die Software den vollen Betrag erstattet,
> ist das kein Fehler zu Lasten des Kunden — er bekommt mehr, als der
> Entwurf vorsieht. Umgekehrt wäre es einer. **Reihenfolge deshalb
> zwingend: erst der Code (Bauauftrag B-25), dann die Live-Texte
> (B-24)** — niemals umgekehrt, sonst steht auf der Website ein Abzug,
> den die Software nicht vornimmt, oder schlimmer: ein Abzug, den sie
> vornimmt, ohne dass er angekündigt war.

> **Zur Begründung des Betrags.** 0,35 € decken die Kosten ab, die eine
> Stornierung bei VERA auslöst: den beim Zahlungsdienstleister
> verbleibenden Anteil der ursprünglichen Zahlung, den Versand der
> Stornobestätigung und die buchhalterische Erfassung des Vorgangs.
> **Der Betrag ist bewusst nicht die Weitergabe einer einzelnen
> Fremdgebühr.** Er fällt bei jeder Zahlungsart gleich hoch an und
> wäre auch bei einer Barzahlung oder Überweisung geschuldet. Das ist
> der Grund, warum **§ 270a BGB** nicht greift: Diese Vorschrift
> verbietet Entgelte **für die Nutzung** eines bestimmten bargeldlosen
> Zahlungsmittels — ein zahlungsartunabhängiges Entgelt ist keines.

---

## 5a. Das Widerrufsrecht — durchgearbeitet am 20.09.2026

> **Diese Einschätzung ist gut belegt, aber sie ist meine und keine
> anwaltliche.** Sie bleibt deshalb in Dokument 15, Abschnitt F,
> Punkt 2 stehen. Was sie leistet: Sie macht die Entscheidung über das
> Stornoentgelt (Frage 6.5) tragfähig und zeigt, welche der offenen
> Umsetzungspunkte entfallen.

**Die Norm.** § 312g Abs. 2 Nr. 9 BGB nimmt Verträge über
Dienstleistungen im Zusammenhang mit **Freizeitbetätigungen** vom
Widerrufsrecht aus, **wenn der Vertrag für die Erbringung einen
spezifischen Termin oder Zeitraum vorsieht**. Die Vorschrift setzt
Art. 16 Buchst. l der Verbraucherrechte-Richtlinie (2011/83/EU) um und
ist richtlinienkonform auszulegen.

**Die maßgebliche Entscheidung.** Der EuGH hat am **31.03.2022**
(Rs. **C-96/21**, *CTS Eventim*) entschieden, dass beim Online-Kauf von
Eintrittskarten für Kultur- und Sportveranstaltungen **kein**
Widerrufsrecht besteht — und zwar **auch gegenüber einem bloßen
Vermittler**, der im eigenen Namen handelt, solange das wirtschaftliche
Risiko eines Widerrufs den Veranstalter träfe. Der BGH ist dem gefolgt.

**Warum das für VERA erst recht gilt.** Wenn die Ausnahme schon den
Vermittler schützt, der nur dazwischensteht, dann greift sie beim
**Veranstalter selbst** ohne Weiteres — VERA organisiert und führt die
Veranstaltung durch, trägt also genau das wirtschaftliche Risiko, um
dessen Schutz es in der Entscheidung ging. Ein Padel-Schnuppertag ist
eine Freizeitbetätigung; seit **Entscheidung 2.5** kann er ohne
feststehenden Termin gar nicht mehr gebucht werden.

**Und das ist der eigentliche Punkt: Die Sperre aus Entscheidung 2.5
stützt diese Argumentation.** Der Ausschluss hängt am „spezifischen
Termin". Solange Veranstaltungen ohne Datum verkäuflich waren, gab es
Buchungen, bei denen dieses Merkmal fehlte — und für die die Ausnahme
gerade **nicht** gegolten hätte. Seit dem 20.09.2026 setzt die Software
durch, dass ohne feststehenden Termin weder gebucht noch bezahlt werden
kann (Bauauftrag **B-5**, Prüfliste `T`). Damit trägt **jede** Buchung
das Merkmal, auf das es ankommt. Was als Ordnungsmaßnahme begann, ist
nachträglich die Grundlage des Widerrufsausschlusses geworden.

**Was daraus folgt:**

- Für die heutigen Veranstaltungen besteht sehr wahrscheinlich **kein**
  gesetzliches Widerrufsrecht. Der Umsetzungspunkt **W-d**
  (elektronische Widerrufsfunktion nach § 356a BGB) — der größte
  Einzelposten des gesamten Dokumentensatzes — entfällt damit
  voraussichtlich.
- Die freiwillige Stornierung nach Ziffer 2.1 ist damit eine echte
  **Sonderleistung** und kein Ersatz für ein gesetzliches Recht. Genau
  darauf beruht die Zulässigkeit des Stornoentgelts.
- **Die Ausnahme in Ziffer 2.1a bleibt trotzdem stehen.** Sie kostet
  nichts und deckt zwei Fälle ab: dass diese Einschätzung sich als
  falsch erweist, und dass VERA später etwas anbietet, für das der
  Ausschluss **nicht** gilt.

⚠️ **Wofür der Ausschluss ausdrücklich NICHT gilt** — das ist die
Kehrseite und gehört vor jeder Erweiterung geprüft:

- **Gutscheine** ohne festen Termin,
- **Kursreihen oder Abonnements** ohne spezifische Einzeltermine,
- **rein digitale Angebote** (Aufzeichnungen, Online-Kurse),
- der gesamte **B2B-Bereich** — dort gibt es ohnehin kein
  Widerrufsrecht, weil der Auftraggeber kein Verbraucher ist. Die
  Ausnahme wird dort also gar nicht gebraucht.

---

## 5. Hinweis

`[VOR VERWENDUNG KLÄREN: Formulierung zur Verbraucherstreitbeilegung
aus Dokument 01, Abschnitt 4.2 — erst nach der Entscheidung einsetzen.]`

**Kein Hinweis auf die EU-Plattform für Online-Streitbeilegung.** Sie
wurde zum 20.07.2025 eingestellt (Verordnung (EU) 2024/3228). Ein
veralteter Link könnte als irreführende Angabe gewertet werden.

---

## Teil III — Umsetzungsliste

| # | Was | Abhängig von | Aufwand |
|---|---|---|---|
| ~~W-a~~ | ✅ **20.09.2026 durchgearbeitet, Abschnitt 5a:** Die Ausnahme greift für Veranstaltungen mit feststehendem Termin — und seit B-5 gibt es keine anderen mehr. Anwaltlich zu bestätigen. | — | — |
| W-b | Fassung A oder B in Abschnitt 1 einsetzen | W-a | klein |
| W-c | Falls B: vollständige Musterbelehrung + Muster-Widerrufsformular | W-a, fachliche Prüfung | mittel |
| W-d | Falls B: elektronische Widerrufsfunktion nach § 356a BGB | W-a | **groß** |
| W-e | Falls Widerrufsrecht je Event unterschiedlich: Feld am Event + Anzeige im Bestellvorgang | W-a | **groß** |
| W-f | Storno-Abschnitt 2.5 austauschen | Entscheidung des Unternehmers | klein |
| W-i | **Neu 20.09.2026:** Stornoentgelt 0,35 € in Code und Live-Texte bringen | Bauaufträge B-25 (Code, zuerst), dann B-24 (Texte) | mittel |
| W-g | Frist-Fehler bei nachträglichem Termin beheben (Befund T-1) | — | klein bis mittel |
| ~~W-h~~ | ✅ **Verlegung: entschieden 18.09.2026** — es gibt keine; der Verlegungsfall ist ein Absagefall (Ziffer 3.2) | — | — |

**W-d ist der größte Einzelposten dieses gesamten Dokumentensatzes.**
Er entfällt vollständig, wenn W-a ergibt, dass die Freizeitausnahme für
alle angebotenen Veranstaltungen greift — und dafür müsste unter anderem
sichergestellt sein, dass keine Veranstaltung ohne feststehenden Termin
mehr verkauft wird.

> ✅ **Nachtrag 20.09.2026: Beide Bedingungen sind jetzt erfüllt.** W-a
> ist durchgearbeitet (Abschnitt 5a), und die Sperre gegen Buchungen
> ohne feststehenden Termin ist gebaut und geprüft (B-5, Prüfliste `T`).
> **W-d entfällt damit voraussichtlich** — vorbehaltlich der
> anwaltlichen Bestätigung. Das ist die größte Ersparnis, die sich aus
> diesem Prüfdurchgang ergibt.
