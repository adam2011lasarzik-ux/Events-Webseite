# 00 — Übersicht: was hier liegt und was du entscheiden musst

**Stand: 16.09.2026**

Dieser Ordner enthält **Entwürfe** für alle Rechtstexte, die VERA
braucht. Sie sind neu für VERA geschrieben — es wurde nichts von
fremden Seiten kopiert.

> ## ⚠️ Das Wichtigste zuerst
>
> **Diese Texte sind noch nicht benutzbar.** Sie sind nicht
> rechtssicher, nicht von einem Anwalt geprüft und nicht garantiert
> wirksam. Sie sind Arbeitsmaterial — gut genug, um es einem
> Rechtstexte-Service oder einem Anwalt vorzulegen, und **nicht** gut
> genug, um es auf die Website zu stellen.
>
> **Auf der Website wurde nichts geändert.** Nichts wurde
> veröffentlicht, nichts deployed, keine Zahlung ausgelöst.

---

## 1. Was erstellt wurde

| Datei | Worum es geht | Kann verwendet werden, wenn … |
|---|---|---|
| **01 Impressum** | die Pflichtangaben | zwei Kleinigkeiten geklärt sind (Steuernummer, Schlichtung) — **fast fertig** |
| **02 Datenschutz** | wer welche Daten bekommt und wie lange | die Anbieterdaten abgelesen und die Löschfrist festgelegt sind |
| **03 AGB für Tickets** | Vertrag mit Privatpersonen | du die Haftungs- und Stornofragen entschieden hast |
| **04 B2B-Bedingungen** | Aufträge von Firmen und Schulen | du weißt, ob und wie du solche Aufträge annehmen willst |
| **05 Minderjährige** | das Formular für Eltern | **du entschieden hast, wer die Aufsicht führt** |
| **06 Foto-Einwilligung** | Bilder und Videos | du sagst, wofür du die Bilder brauchst |
| **07 Widerruf & Storno** | die 14-Tage-Frage und dein 24-Stunden-Angebot | ein Anwalt eine Frage beantwortet hat (siehe unten) |
| **08 Checkout** | Texte im Bestellvorgang | die AGB fertig sind |
| **09 Hausordnung** | Verhalten vor Ort | du die Hausordnung der Halle gelesen hast |
| **10 Prüfprotokoll** | woher jede Aussage stammt | — (nur zum Nachschlagen) |

---

## 2. Was noch fehlt

### 2.1 Zahlen und Namen, die du nur ablesen kannst

Das ist die einfachste Arbeit. Du musst dich irgendwo einloggen und
etwas abschreiben.

- [ ] **Serverstandort** bei Hostinger (im Kundenkonto)
- [ ] **Vollständiger Firmenname und Anschrift** von: Hostinger, Stripe,
      Backblaze, UptimeRobot
- [ ] **Region** deines Backblaze-Speichers (EU oder USA?)
- [ ] Welche **Auftragsverarbeitungsverträge** hast du abgeschlossen?
- [ ] Hast du eine **Umsatzsteuer-Identifikationsnummer**? (Wahrscheinlich
      nein — dann bleibt das Feld einfach leer)
- [ ] **Hausordnung der Veranstaltungslocation** — als Datei oder Foto
- [ ] Wer stellt den **Trainer**: du, die Halle oder jemand Drittes?
- [ ] Hast du eine **Veranstalter-Haftpflichtversicherung**?

> **Warum ich das nicht selbst gemacht habe:** Ich kann mich nicht in
> deine Konten einloggen, und geraten wird nichts. Ein falscher
> Firmenname in der Datenschutzerklärung ist schlimmer als eine
> Lücke.

### 2.2 Entscheidungen, die nur du treffen kannst

Diese sind wichtiger als die Zahlen oben — an ihnen hängen ganze Texte.

- [ ] **Willst du überhaupt eigene AGB?** Ohne sie gilt das Gesetz. Mit
      ihnen kannst du Storno, Ausschluss und Haftung selbst regeln.
- [ ] **Wer beaufsichtigt Minderjährige während der Veranstaltung?**
      Du und dein Team — oder bleibt die Verantwortung bei den Eltern?
      *(Dokument 05 hat für beide Antworten einen fertigen Text.)*
- [ ] **Was machst du mit Fotos?** Website? Instagram? Flyer? Oder gar
      keine erkennbaren Personen?
- [ ] **Gibt es bei deinen Veranstaltungen Alkohol?**
- [ ] **Willst du eine Mindestteilnehmerzahl?** (Also: „Ab 8 Personen,
      sonst sage ich ab.")
- [ ] **Was passiert bei einer Verlegung?** Heute kann die Software nur
      absagen und erstatten.
- [ ] **Sollen Firmen und Schulen künftig online buchen können** — oder
      bleibt das per E-Mail?
- [ ] **Wie lange bewahrst du Anmeldedaten auf?** Es gibt heute keine
      Frist.
- [ ] **Geschäftsbereich „Büro- und Verwaltungsdienstleistungen":
      welche Leistungen genau?** Dafür gibt es bisher nur ein leeres
      Gerüst — absichtlich.

---

## 3. Die fünf riskantesten Stellen

> In der Reihenfolge, in der sie dir schaden können.

### 🔴 1. Der Bestellknopf heißt „Zur Bezahlung"

**Was das Gesetz verlangt:** Der Knopf, mit dem bestellt wird, muss
„zahlungspflichtig bestellen" heißen — oder etwas ähnlich Eindeutiges
(§ 312j Abs. 3 BGB).

**Das Risiko:** Wenn die Beschriftung nicht genügt, **kommt der Vertrag
gar nicht zustande** (§ 312j Abs. 4 BGB). Nicht bei einem Streitfall —
bei **jeder einzelnen Buchung**.

**Was ich gefunden habe:** Gerichte haben „Bestellen", „Senden",
„Bestellung aufgeben" und Knöpfe der Form „mit … bezahlen" als nicht
ausreichend angesehen. „Zur Bezahlung" liegt sprachlich nah daran.

**Ich habe nichts geändert** — die Formulierung war deine Entscheidung.
Vorschläge stehen in Dokument 08.

### 🔴 2. Der Widerrufsbutton ist seit Juni 2026 Pflicht — vielleicht auch für dich

**Neu und wichtig:** Seit dem **19.06.2026** (§ 356a BGB) muss es auf
Websites einen elektronischen Widerrufsbutton geben — **aber nur, wenn
für das Angebot ein Widerrufsrecht besteht.**

**Bei Veranstaltungen mit festem Termin** besteht in der Regel keins
(§ 312g Abs. 2 Nr. 9 BGB). Dann brauchst du auch keinen Button.

**Aber:** Deine Website kann Veranstaltungen **ohne Termin**
veröffentlichen („Termin folgt"). Genau da greift die Ausnahme
wahrscheinlich **nicht** — und dann fehlen dir Widerrufsbelehrung *und*
Button.

**Der einfachste Ausweg:** nur noch Veranstaltungen mit festem Termin
verkaufen. Das müsste dann aber auch in der Software gesperrt werden.

### 🔴 3. Deine AGB gelten vermutlich gar nicht

Deine Regeln — 24-Stunden-Storno, Ausschluss bei Fehlverhalten, die
Minderjährigenregeln — stehen nur im Fußbereich. Das genügt nach
§ 305 Abs. 2 BGB wahrscheinlich nicht.

**Die Folge trifft dich, nicht deine Kunden:** Gilt nichts davon, gilt
das Gesetz — auch dort, wo deine Regeln dich schützen sollten.

**Lösung:** ein Hinweis mit Häkchen direkt über dem Bestellknopf. Der
Platz dafür ist im Code schon vorbereitet. Aber erst, wenn die AGB
fertig sind — ein Häkchen auf einen Platzhalter wäre Augenwischerei.

### 🔴 4. Die Aufsicht über Minderjährige ist nicht geregelt

Im Formular steht heute nur, **wann** die Betreuung anfängt und aufhört
— nicht, **was** sie umfasst. Offen ist: Darf ein Jugendlicher
zwischendurch gehen? Wie viele Betreuer auf wie viele Kinder? Was gilt
in den Pausen?

**Das ist die Frage, bei der im Ernstfall am meisten auf dem Spiel
steht.** Und sie lässt sich nicht mit einer Formulierung lösen, sondern
nur mit einer Entscheidung darüber, was ihr tatsächlich tut.

**Übrigens:** „Eltern haften für ihre Kinder" stimmt nicht und steht
deshalb in keinem dieser Texte. Eltern haften für ihre *eigene*
Aufsichtspflichtverletzung — und wenn du die Aufsicht übernommen hast,
regelmäßig gar nicht.

### 🔴 5. Die Foto-Einwilligung ist ein Satz — auch für Kinder

Heute steht im Formular: „Bei der Veranstaltung dürfen Fotos gemacht und
für VERA verwendet werden."

Das sagt nicht, wofür, wo veröffentlicht, wie lange, und dass man
widerrufen kann. Bei den Wegen „Mein Kind" und „Familienpaket" setzt ein
Elternteil dieses Häkchen **für das Kind**.

**Das Verhältnis ist schief:** Für die harmlosen Gesundheitsangaben auf
dem Papierformular gibt es einen vollständigen Informationsblock. Für
Fotos von Kindern gibt es einen Satz.

---

## 4. Was ein Anwalt prüfen sollte

In dieser Reihenfolge — die ersten drei hängen zusammen:

1. **Was für ein Vertrag ist eine Eventteilnahme?** Dienstvertrag,
   Werkvertrag oder etwas dazwischen? Davon hängt die Stornoregel ab.
2. **Besteht ein Widerrufsrecht?** Für welche deiner Veranstaltungen?
3. **Brauchst du den Widerrufsbutton nach § 356a BGB?** Folgt aus 2.
4. **Reicht „Zur Bezahlung" als Bestellknopf?**
5. **Wie bekommst du deine AGB wirksam einbezogen?**
6. **Haftung und Aufsicht bei Minderjährigen** — inklusive der Frage,
   ob der Trainer dein Erfüllungsgehilfe ist.
7. **Datenschutz:** Rollen der Dienstleister, Daten außerhalb der EU,
   Löschfristen.
8. **Die neue Stornoklausel** (mit Anrechnung und Nachweisvorbehalt).
9. **B2B-Bedingungen**, besonders Haftungsdeckel und Schulen als
   Vertragspartner.
10. **Barrierefreiheit (BFSG):** Greift die Ausnahme für
    Kleinstunternehmen? Wahrscheinlich ja — es sollte belegbar sein.

---

## 5. Welche Texte du erst nach Klärung verwenden darfst

| Text | Freigabe erst wenn |
|---|---|
| **01 Impressum** | Steuernummer-Frage und Schlichtungs-Satz geklärt — **fast fertig** |
| **02 Datenschutz** | alle Anbieterdaten eingesetzt, Löschfrist festgelegt |
| **03 AGB** | Haftung, Mindestteilnehmerzahl, Verlegung entschieden; Widerrufsfrage geklärt |
| **04 B2B** | Auftragsarten und Vertragstyp geklärt |
| **05 Minderjährige** | **Aufsichtsfrage entschieden** — vorher gar nicht |
| **06 Fotos** | Zwecke und Kanäle benannt |
| **07 Widerruf** | Anwalt hat Frage 2 beantwortet |
| **08 Checkout** | AGB fertig |
| **09 Hausordnung** | Hausordnung der Halle gelesen, Alkoholfrage entschieden |

**Kein einziger Text darf so wie er ist online gehen.** Jede Stelle mit
`[VOR VERWENDUNG KLÄREN: …]` ist eine bewusste Lücke.

---

## 6. Was ich beim Prüfen im Code gefunden habe

Vier Dinge, die nichts mit Texten zu tun haben, aber repariert werden
sollten. Einzelheiten in Dokument 10, Abschnitt 5.

| | Was | Aufwand |
|---|---|---|
| **T-1** | Wird ein Termin nachträglich eingetragen und liegt er in weniger als 24 Stunden, können Kunden **nicht mehr stornieren** — obwohl sie nie eine Gelegenheit dazu hatten | klein–mittel |
| **T-3** | Der Spam-Schutz speichert die **volle IP-Adresse im Klartext** (max. 60 Minuten). Die E-Mail-Adresse wird gehasht — die IP könnte es auch | klein |
| **T-4** | Die **Bestätigungsmails enthalten keine Anbieterangaben, keine AGB und keine Widerrufsinformation**. Bei der kostenlosen Variante fehlt sogar der Betrag | mittel |
| **T-6** | Es gibt **keine automatische Löschfrist** für Anmeldedaten — nur eine Funktion, die man von Hand auslösen muss | mittel |

---

## 7. Dein nächster Schritt

**Nimm dir Abschnitt 2.2.** Die Entscheidungen dort blockieren fast
alles andere — besonders die Aufsichtsfrage und die Fotofrage.

Danach sind die Punkte aus 2.1 reine Fleißarbeit: einloggen, abschreiben.

**Und wenn du nur eine einzige Frage weitergibst**, dann diese:

> *Besteht für Veranstaltungen von VERA ein Widerrufsrecht — und gilt
> das auch für Veranstaltungen, deren Termin bei der Buchung noch nicht
> feststeht?*

An ihr hängen Dokument 07, Dokument 08 und die Frage, ob du einen
Widerrufsbutton bauen musst.
