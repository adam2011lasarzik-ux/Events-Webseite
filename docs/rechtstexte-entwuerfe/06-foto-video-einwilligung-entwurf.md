# 06 — Einwilligung in Foto- und Videoaufnahmen (Entwurf)

> **Status:** Entwurf, Version 1 vom 16.09.2026. **Nicht anwaltlich geprüft.**
>
> **Stand 18.09.2026:** inhaltlich unverändert — alle 8 zugrunde
> liegenden Fragen aus Dokument 11, Gruppe 4, sind weiterhin offen
> (gesammelt in Dokument 15, Abschnitt C). Das betrifft auch das
> einzige Foto-Häkchen im heutigen Online-Anmeldeformular, das ohne
> Zweck, Kanal oder Dauer auskommt (siehe Dokument 02, Ziffer 5).
>
> ⚠️ **Dieser Entwurf ist unvollständig — notwendigerweise.** Eine
> Einwilligung muss *bestimmt* sein: Sie muss sagen, wofür genau,
> auf welchen Kanälen und wie lange. Diese Angaben kann nur der
> Unternehmer machen. Die Platzhalter sind hier keine Nachlässigkeit,
> sondern der Kern der Aufgabe.

---

## Teil I — Der Befund

### Was heute da ist

Ein einziger Satz im Anmeldeformular
(`content/de.ts` → `anmeldung.formular.einwilligungFotos`):

> „Bei der Veranstaltung dürfen Fotos gemacht und für VERA verwendet
> werden."

Technisch korrekt umgesetzt: freiwillig, von der Vormund-Einwilligung
getrennt, nicht vorangekreuzt, und die Anmeldung geht auch ohne
(`lib/anmeldung.ts` prüft `einwilligungFotos` nicht als Pflichtfeld).
**Das ist die gute Nachricht — die Mechanik stimmt.**

### Was daran nicht genügt

| Anforderung | im Satz enthalten? |
|---|---|
| Wer verarbeitet? | nein |
| Welche Aufnahmen? (Foto, Video, Ton?) | nur „Fotos" |
| Zu welchem Zweck? | „für VERA verwendet" — das ist kein Zweck |
| Wo veröffentlicht? (Website, Instagram, Druck?) | nein |
| Wie lange? | nein |
| Freiwilligkeit ausdrücklich? | nein |
| Widerruf und wie? | nein |
| Folgen des Widerrufs? | nein |

Art. 4 Nr. 11 DSGVO verlangt eine „in informierter Weise und
unmissverständlich abgegebene Willensbekundung ... **für den bestimmten
Fall**". Art. 7 Abs. 3 DSGVO verlangt, dass über den Widerruf **vor**
der Abgabe informiert wird. Für die Veröffentlichung von Bildnissen
kommt § 22 KunstUrhG hinzu.

### Der eigentliche Fund: das Schutzniveau steht auf dem Kopf

- Auf den Anmeldewegen **„Mein Kind"** und **„Familienpaket"** setzt die
  erziehungsberechtigte Person dieses Häkchen **für das Kind**.
- Das Papierformular stellt ausdrücklich klar, dass es **keine**
  Foto-Einwilligung enthält.
- Datenschutz Abschnitt 2 (acht Absätze über Minderjährige) erwähnt
  Fotos **mit keinem Wort**.

Ergebnis: Die Aufnahme eines Kindes — der sensiblere Fall — steht auf
der dünnsten Grundlage, während die freiwilligen Gesundheitsangaben auf
Papier einen vollständigen Informationsblock mit Rechtsgrundlagen,
Löschfrist und Widerrufshinweis haben.

---

## Teil II — Entwurf der Einwilligung

> **Aufbau:** Der kurze Text steht am Häkchen. Die Einzelheiten stehen
> auf einer eigenen, verlinkten Seite. So bleibt das Formular lesbar,
> ohne dass die Einwilligung uninformiert wird.

### II.1 Text am Häkchen (im Anmeldeformular)

> ☐ **Foto- und Videoaufnahmen (freiwillig)**
> Ich bin damit einverstanden, dass bei der Veranstaltung Foto- und
> Videoaufnahmen entstehen, auf denen ich beziehungsweise die von mir
> angemeldeten Personen erkennbar sind, und dass VERA diese Aufnahmen
> wie [in den Einzelheiten beschrieben](/fotoeinwilligung) verwendet und
> veröffentlicht.
>
> Diese Einwilligung ist freiwillig. **Die Teilnahme ist ohne sie
> uneingeschränkt möglich.** Ich kann sie jederzeit mit Wirkung für die
> Zukunft widerrufen — eine formlose Nachricht an kontakt@veraevents.de
> genügt.

**Bei den Wegen „Mein Kind" und „Familienpaket" zusätzlich:**

> Ich gebe diese Einwilligung zugleich für die von mir angemeldeten
> minderjährigen Personen ab.

> ⚠️ **Der Zusatz fehlt heute.** Ohne ihn erklärt die
> erziehungsberechtigte Person der Sache nach etwas für das Kind, ohne
> dass der Text das sagt.

### II.2 Die verlinkte Seite: Einzelheiten

---

# Foto- und Videoaufnahmen bei VERA-Veranstaltungen

## Wer ist verantwortlich

Adam Maurice Lasarzik, Mühlenstr. 8a, 14167 Berlin,
kontakt@veraevents.de

## Welche Aufnahmen

`[VOR VERWENDUNG KLÄREN: Zutreffendes festlegen.]`

> Bei unseren Veranstaltungen entstehen Fotografien und
> Videoaufnahmen `[VOR VERWENDUNG KLÄREN: auch Tonaufnahmen? Wenn ja,
> ausdrücklich nennen — Ton ist datenschutzrechtlich ein eigener
> Eingriff.]`. Aufgenommen werden das Geschehen auf der Anlage, einzelne
> Spielszenen und Gruppensituationen.
>
> `[VOR VERWENDUNG KLÄREN: Wer nimmt auf — VERA selbst, eine beauftragte
> Person, oder auch die Veranstaltungslocation? Wird ein externer
> Fotograf eingesetzt, ist dessen Rolle gesondert zu regeln.]`

## Wozu wir die Aufnahmen verwenden

`[VOR VERWENDUNG KLÄREN: Nur ankreuzen, was wirklich vorgesehen ist.
Jeder nicht gebrauchte Zweck macht die Einwilligung angreifbarer, nicht
sicherer.]`

> - zur Darstellung unserer Veranstaltungen auf **veraevents.de**
> - in **Druckerzeugnissen** wie Flyern, Plakaten und Programmheften
> - in **sozialen Netzwerken**: `[VOR VERWENDUNG KLÄREN: welche genau?
>   Instagram? Facebook? LinkedIn? Jedes Netzwerk einzeln benennen —
>   „Social Media" ist keine bestimmte Angabe.]`
> - `[VOR VERWENDUNG KLÄREN: Weitergabe an Presse? An
>   Kooperationspartner? An die Veranstaltungslocation für deren eigene
>   Werbung? Jede dieser Weitergaben ist ein eigener Zweck und braucht
>   eine eigene Zeile.]`

> ⚠️ **Zu sozialen Netzwerken.** Wird dort veröffentlicht, ist der
> Hinweis aufzunehmen, dass die Aufnahmen dabei den Bereich der EU
> verlassen können und von dort nur begrenzt zurückzuholen sind. Ohne
> diesen Hinweis ist die Einwilligung für diesen Zweck nicht informiert.
>
> **Wird nicht in sozialen Netzwerken veröffentlicht, ist die Zeile
> ersatzlos zu streichen.** Sie „für später" stehen zu lassen wäre der
> typische Fehler.

## Wie lange

`[VOR VERWENDUNG KLÄREN: eine der beiden Varianten wählen.]`

> **Variante 1 — feste Frist:**
> Wir verwenden die Aufnahmen für `[Zeitraum, z. B. drei Jahre]` ab der
> Veranstaltung. Danach nehmen wir sie von unseren eigenen Kanälen und
> löschen sie.
>
> **Variante 2 — zweckgebunden:**
> Wir verwenden die Aufnahmen, solange sie für die Darstellung unserer
> Tätigkeit erforderlich sind, längstens jedoch bis zum Widerruf. Wir
> prüfen `[Rhythmus, z. B. jährlich]`, ob ältere Aufnahmen noch benötigt
> werden.

## Freiwilligkeit

> Die Einwilligung ist **vollständig freiwillig**. Sie ist keine
> Voraussetzung für die Teilnahme, und die Teilnahme ist ohne sie
> uneingeschränkt und zum selben Preis möglich. Aus einer Verweigerung
> entstehen keinerlei Nachteile.

> ✅ **Das trifft heute bereits zu und ist im Code belegt.** Die
> Teilnahme hängt technisch nicht am Häkchen. Die sogenannte
> Koppelung — Leistung nur gegen Werbeeinwilligung — findet nicht
> statt.

## Widerruf und seine Folgen

> Sie können Ihre Einwilligung **jederzeit und ohne Angabe von Gründen
> widerrufen**, mit Wirkung für die Zukunft. Eine formlose Nachricht an
> kontakt@veraevents.de genügt. Die Rechtmäßigkeit der bis dahin
> erfolgten Verwendung bleibt unberührt.
>
> Nach Ihrem Widerruf nehmen wir die betreffenden Aufnahmen
> unverzüglich von unserer Website und aus unseren Profilen in sozialen
> Netzwerken.
>
> **Bereits gedruckte Materialien** — Flyer, Plakate, Programmhefte —
> können wir nicht zurückrufen. Bereits verteilte Exemplare bleiben im
> Umlauf. Wir verwenden die Aufnahme jedoch **in keinem neuen
> Druckerzeugnis** mehr und drucken vorhandene Vorlagen nicht nach.
>
> Auch bei Inhalten, die Dritte bereits kopiert oder geteilt haben,
> ist die Reichweite eines Widerrufs tatsächlich begrenzt. Wir weisen
> darauf hin, damit Sie das bei Ihrer Entscheidung berücksichtigen
> können.

> **Warum dieser Absatz so ausführlich ist.** Ein Widerrufshinweis, der
> die tatsächlichen Grenzen verschweigt, ist selbst irreführend. Der
> ehrliche Hinweis auf Druckerzeugnisse und geteilte Inhalte macht die
> Einwilligung **stärker**, nicht schwächer: Sie ist dann nachweislich
> informiert abgegeben worden.

## Minderjährige

> Für minderjährige Teilnehmende gibt die erziehungsberechtigte Person
> die Einwilligung ab. Ist die minderjährige Person alt genug, die
> Tragweite zu verstehen, beziehen wir sie ein — wir bitten dann auch
> um ihr Einverständnis.
>
> Die auf Papier abgegebene Einverständniserklärung für Minderjährige
> enthält **keine** Einwilligung in Foto- oder Videoaufnahmen. Die
> Einwilligung wird ausschließlich hier erteilt.

`[VOR VERWENDUNG KLÄREN: Ab welchem Alter wird die minderjährige Person
selbst einbezogen? Eine feste Altersgrenze gibt es nicht; maßgeblich ist
die Einsichtsfähigkeit im Einzelfall. Verbreitet ist eine Doppel­
einwilligung ab etwa 14 Jahren. **Das gehört fachlich geprüft** — und es
gehört technisch umgesetzt, wenn es gelten soll.]`

## Wenn keine Einwilligung vorliegt

> Liegt für eine Person keine Einwilligung vor, veröffentlichen wir
> keine Aufnahmen, auf denen sie erkennbar ist. Sagen Sie dem
> Betreuungspersonal vor Ort Bescheid, wenn Sie nicht fotografiert
> werden möchten — wir richten uns danach.

> ⚠️ `[VOR VERWENDUNG KLÄREN: Wie wird das vor Ort tatsächlich
> umgesetzt?]` Bei einer Gruppenveranstaltung ist die Zusage „wir
> veröffentlichen keine Aufnahmen ohne Einwilligung" nur haltbar, wenn
> jemand weiß, wer eingewilligt hat und wer nicht. Der Adminbereich
> zeigt das Häkchen je Anmeldung an — ob das vor Ort abgerufen wird,
> ist eine organisatorische Frage. **Eine Zusage, die nicht eingehalten
> wird, ist schlimmer als keine.**

## Rechtsgrundlagen

> Art. 6 Abs. 1 Buchst. a DSGVO (Einwilligung); für die Veröffentlichung
> von Bildnissen zusätzlich § 22 KunstUrhG.

## Ihre Rechte

> Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit
> und Widerspruch nach Art. 15 bis 21 DSGVO sowie das Beschwerderecht
> bei einer Aufsichtsbehörde nach Art. 77 DSGVO. Einzelheiten stehen in
> unserer Datenschutzerklärung.

---

## Teil III — Was umgesetzt werden muss

| # | Was | Wo | Aufwand |
|---|---|---|---|
| F-1 | Häkchentext ersetzen | `content/de.ts` → `anmeldung.formular.einwilligungFotos` | klein |
| F-2 | Zusatz für „Mein Kind"/„Familienpaket" | `components/FormularVorschau.tsx` — Text abhängig vom Weg | klein |
| F-3 | Neue Seite `/fotoeinwilligung` | neue Route nach dem Muster von `/widerruf` | mittel |
| F-4 | Link in der Fußzeile | `components/Footer.tsx` | klein |
| F-5 | Absatz in Datenschutz Abschnitt 2 | `content/de.ts` | klein |
| F-6 | Hinweis im Papierformular auf die gesonderte Erklärung | PDF neu setzen | mittel |
| F-7 | Organisatorisch: wie wird vor Ort erkannt, wer eingewilligt hat? | Ablauf, keine Software | — |

**F-1 bis F-6 sind erst umsetzbar, wenn die Platzhalter in Teil II
beantwortet sind.** Vorher entstünde eine Einwilligung, die genauso
unbestimmt wäre wie die heutige, nur länger.

---

## Teil IV — Ein Weg, der ganz ohne Einwilligung auskommt

Zur Vollständigkeit, weil er ernsthaft in Betracht kommt:

**VERA veröffentlicht keine Aufnahmen, auf denen Teilnehmende erkennbar
sind.** Stattdessen nur Aufnahmen von der Anlage, von Ausrüstung, von
Spielsituationen aus der Distanz oder von hinten, sowie gezielt
gestellte Aufnahmen mit einzeln eingeholter Zustimmung.

Dann entfallen: die Einwilligung im Formular, die neue Seite, der
Datenschutzabsatz, die Organisationsfrage vor Ort und jeder
Widerrufsfall.

**Der Preis:** deutlich weniger brauchbares Material für die
Außendarstellung — bei einer neuen Marke ein echter Nachteil.

`[VOR VERWENDUNG KLÄREN: Welcher Weg? Diese Entscheidung sollte vor
der ersten Veranstaltung fallen, nicht danach — Aufnahmen ohne
tragfähige Grundlage lassen sich nachträglich nicht heilen.]`
