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

**Weitere Fälle, die einzeln zu prüfen sind:**

| Angebot | Freizeitbetätigung? | Spezifischer Termin? |
|---|---|---|
| Padel-Nachmittag mit Datum und Uhrzeit | ja | ja → Ausnahme greift wahrscheinlich |
| Veranstaltung mit „Termin folgt" | ja | **nein** → Ausnahme greift wahrscheinlich nicht |
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
> Beginn der Veranstaltung kostenlos stornieren.** Erstattet wird der
> volle Betrag, ohne Abzug.
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
> **2.4** Solange für eine Veranstaltung noch kein Termin feststeht, ist
> eine Stornierung jederzeit möglich.
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
> **3.2 Verlegung.** `[VOR VERWENDUNG KLÄREN: siehe Dokument 03,
> Ziffer 8.4. Es gibt heute keinen technischen Ablauf dafür — die
> Software kennt nur „absagen und erstatten". Entweder wird eine
> Verlegung eingeführt (dann braucht es Software **und** Klausel), oder
> der Abschnitt entfällt und eine Verlegung wird als Absage mit
> anschließender Neuanmeldung behandelt.]`
>
> **3.3 Nachträgliche Bekanntgabe eines Termins.** Steht bei der
> Anmeldung noch kein Termin fest, teilen wir ihn mit, sobald er
> feststeht. Bis dahin können Sie jederzeit kostenlos stornieren
> (Abschnitt 2.4).
>
> `[VOR VERWENDUNG KLÄREN: Soll nach der Bekanntgabe eine gesonderte
> Frist gelten, innerhalb derer noch kostenlos storniert werden kann,
> auch wenn der Termin weniger als 24 Stunden entfernt liegt? Das wäre
> die faire Lösung — sonst könnte ein Termin bekannt gegeben werden,
> der bereits innerhalb der Frist liegt, und die Stornierung wäre nie
> möglich gewesen.]`

> ⚠️ **3.3 ist ein echter Ablauffehler, nicht nur eine Textlücke.**
> `lib/storno.ts` rechnet die Frist ab `startAt`. Wird `startAt`
> nachträglich auf einen Zeitpunkt in weniger als 24 Stunden gesetzt,
> ist die Selbstbedienungs-Stornierung ab diesem Moment gesperrt — für
> Buchungen, die zu einer Zeit abgeschlossen wurden, als es gar keinen
> Termin gab. Siehe Prüfprotokoll, Befund T-1.

---

## 4. Wie das Geld zurückkommt

> **4.1** Erstattet wird immer auf demselben Weg, über den bezahlt
> wurde. Eine abweichende Auszahlung ist nicht möglich.
>
> **4.2** Die Rückzahlung wird unmittelbar nach der Stornierung
> angewiesen. Wie lange es bis zur Gutschrift dauert, hängt vom
> Zahlungsdienstleister und Ihrer Bank ab; einige Werktage sind üblich.
>
> **4.3** Für Sie fallen keine Kosten an. VERA behält bei einer
> fristgerechten Stornierung nichts ein — auch keine Gebühren des
> Zahlungsdienstleisters.

> ✅ **4.1 bis 4.3 sind im Code belegt.** Die Erstattung läuft über die
> ursprüngliche Zahlung (`lib/stornoAusfuehren.ts`), und es gibt keinen
> Abzug.
>
> `[VOR VERWENDUNG KLÄREN zu 4.3: Behält der Zahlungsdienstleister bei
> einer Erstattung seine Gebühr ein? Falls ja, trägt VERA diese Kosten
> — das ist eine unternehmerische Entscheidung, die man kennen sollte,
> bevor viele Stornierungen zusammenkommen. Sie ändert nichts am Text,
> aber etwas an der Kalkulation.]`

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
| W-a | Entscheidung zu Fund W-1: greift die Ausnahme, und für welche Veranstaltungen? | fachliche Prüfung | — |
| W-b | Fassung A oder B in Abschnitt 1 einsetzen | W-a | klein |
| W-c | Falls B: vollständige Musterbelehrung + Muster-Widerrufsformular | W-a, fachliche Prüfung | mittel |
| W-d | Falls B: elektronische Widerrufsfunktion nach § 356a BGB | W-a | **groß** |
| W-e | Falls Widerrufsrecht je Event unterschiedlich: Feld am Event + Anzeige im Bestellvorgang | W-a | **groß** |
| W-f | Storno-Abschnitt 2.5 austauschen | Entscheidung des Unternehmers | klein |
| W-g | Frist-Fehler bei nachträglichem Termin beheben (Befund T-1) | — | klein bis mittel |
| W-h | Verlegung: Ablauf entscheiden | Entscheidung des Unternehmers | klein bis groß |

**W-d ist der größte Einzelposten dieses gesamten Dokumentensatzes.**
Er entfällt vollständig, wenn W-a ergibt, dass die Freizeitausnahme für
alle angebotenen Veranstaltungen greift — und dafür müsste unter anderem
sichergestellt sein, dass keine Veranstaltung ohne feststehenden Termin
mehr verkauft wird.
