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

✅ **Entschieden am 18.09.2026 (Frage 4.2): Fotografien und
Videoaufnahmen ohne Ton.**

> Bei unseren Veranstaltungen entstehen Fotografien und Videoaufnahmen
> **ohne Tonaufzeichnung**. Aufgenommen werden das Geschehen auf der
> Anlage, einzelne Spielszenen und Gruppensituationen.

> **Warum der Ton bewusst ausgenommen ist.** Tonaufnahmen sind nicht
> nur datenschutzrechtlich ein eigener Eingriff, sondern berühren
> zusätzlich **§ 201 StGB** (Verletzung der Vertraulichkeit des
> Wortes): Das Aufnehmen des **nichtöffentlich gesprochenen Wortes**
> ist strafbewehrt. Auf einer Veranstaltung unterhalten sich Menschen
> privat — ein offenes Mikrofon nimmt auch Personen auf, die weder im
> Bild noch in der Einwilligungsliste stehen. Ohne Ton entfällt dieses
> Risiko vollständig, und für Bewegtbild vom Sport ist der
> Originalton ohnehin entbehrlich (Musik lässt sich nachträglich
> unterlegen).
>
> **Wenn später einmal O-Töne gebraucht werden** — ein Statement, ein
> Trainer-Interview —, sind das **gezielte Einzelaufnahmen mit der
> betreffenden Person**, angekündigt und einzeln dokumentiert. Dafür
> braucht es keine pauschale Ton-Einwilligung von allen Teilnehmenden.
> **Diese Fassung deckt solche Aufnahmen nicht ab.**
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

---

## Teil V — Neubewertung vom 18.09.2026

Anlass sind zwei Vorgaben von Adam vom selben Tag.

### Vorgabe 1: keine allein teilnehmenden Minderjährigen beim ersten Event

Minderjährige nehmen beim ersten Event **ausschließlich über ein
Familienticket gemeinsam mit anwesenden Erziehungsberechtigten** teil.

**Das entschärft den heikelsten Teil dieses Dokuments.** Die
Einwilligung für ein Kind muss nach § 22 KunstUrhG von den
Erziehungsberechtigten kommen — und die sind hier **persönlich vor Ort
und ansprechbar**. Eine vor Ort erteilte, dokumentierte Einwilligung
ist der sauberere Weg als ein Häkchen, das Wochen vorher im
Buchungsformular gesetzt wurde: Der Elternteil sieht die Situation, um
die es geht, und kann für sein Kind konkret entscheiden.

### Vorgabe 2: keine automatische Kopplung an den Ticketkauf

**Rechtlich ist das genau richtig gedacht.** Nach Art. 7 Abs. 4 DSGVO
(Kopplungsverbot, dazu Erwägungsgrund 43) ist bei der Beurteilung der
Freiwilligkeit zu berücksichtigen, ob die Erfüllung eines Vertrags von
einer Einwilligung abhängig gemacht wird, die für diesen Vertrag gar
nicht erforderlich ist. Eine Fotoeinwilligung ist für die Durchführung
einer Veranstaltung **nicht erforderlich** — sie darf den Ticketkauf
deshalb weder blockieren noch stillschweigend mit ihm mitlaufen.
Zusätzlich verlangt Art. 7 Abs. 2 DSGVO, dass eine Einwilligung von
anderen Sachverhalten **klar unterscheidbar** erteilt wird.

**Befund zum heutigen Stand, belegt:** Das Häkchen in
`content/de.ts:258` („Bei der Veranstaltung dürfen Fotos gemacht und
für VERA verwendet werden.") ist zwar **freiwillig** — die Buchung
funktioniert auch ohne — verstößt also nicht gegen das Kopplungsverbot
im engeren Sinn. Es steht aber **mitten im Buchungsvorgang**, ohne
Angabe von Zweck, Kanal, Dauer und Widerrufsrecht. Für eine wirksame
Einwilligung reicht das nicht, und Adams Vorgabe verlangt ohnehin die
Trennung vom Kauf.

### Empfehlung: Weg B, ergänzt um Einzelzustimmung vor Ort

**Für das erste Event: keine Aufnahmen, auf denen Teilnehmende
erkennbar sind — plus gezielte Einzelaufnahmen, für die vor Ort
einzeln zugestimmt wird.**

Das erfüllt alle Vorgaben auf einmal:

| Anforderung | erfüllt durch |
|---|---|
| Keine Kopplung an den Ticketkauf | Im Buchungsvorgang wird **gar nichts** zu Fotos abgefragt — das Häkchen entfällt ersatzlos |
| Wirksame Einwilligung bei Kindern | Der Elternteil ist anwesend und entscheidet konkret für das jeweilige Bild |
| Brauchbares Material für die Marke | Anlage, Ausrüstung, Spielszenen aus der Distanz — plus die Aufnahmen, für die ausdrücklich zugestimmt wurde |
| Kein Widerrufs-Chaos | Wenige, einzeln dokumentierte Einwilligungen statt hundert pauschale |

**Der Preis, offen benannt:** Vor Ort muss jemand daran denken, die
Zustimmung tatsächlich einzuholen und zu dokumentieren, bevor ein
erkennbares Bild entsteht. Ein Zettel mit Name, Datum, Verwendungszweck
und Unterschrift genügt; ohne ihn darf das Bild nicht veröffentlicht
werden. **Aufnahmen ohne tragfähige Grundlage lassen sich
nachträglich nicht heilen.**

**Was bei dieser Wahl entfällt:** die Einwilligung im Anmeldeformular,
der Datenschutzabsatz zur pauschalen Foto-Einwilligung, die
Organisationsfrage „wer hat eingewilligt?" bei 100 Leuten — und die
Fragen 4.2 bis 4.8 dieses Abschnitts reduzieren sich auf die viel
kleinere Frage, was auf dem Einzelzustimmungs-Zettel stehen soll.

---

## Teil VI — Entscheidung von Adam (18.09.2026): Weg A, abgesichert

**Adam hat sich gegen die obige Empfehlung und für Weg A entschieden —
mit vier Auflagen, die den Einwand gegen Weg A gerade auflösen:**

1. Die Foto- und Videoeinwilligung wird als **separates, freiwilliges,
   nicht vorausgewähltes Häkchen vor dem Kauf** eingebaut.
2. **Ticketkauf und Teilnahme müssen auch ohne Zustimmung möglich
   sein.**
3. Der Einwilligungsstatus wird **pro Person nachweisbar gespeichert**.
4. Er wird **beim Check-in angezeigt**.

### Warum das trägt

Mein Haupteinwand gegen Weg A war nicht rechtlicher, sondern
organisatorischer Natur: Bei hundert Leuten muss im Moment des
Fotografierens erkennbar sein, wer eingewilligt hat. **Auflage 4 löst
genau das** — der Status steht auf derselben Liste, die beim Ankommen
ohnehin geführt wird (Entscheidung 3.27).

Rechtlich sind die Auflagen 1 und 2 die richtige Umsetzung von
**Art. 7 Abs. 2 DSGVO** (Einwilligung klar unterscheidbar von anderen
Sachverhalten) und **Art. 7 Abs. 4 DSGVO** (Kopplungsverbot). Auflage 3
entspricht **Art. 7 Abs. 1 DSGVO**, der Nachweispflicht des
Verantwortlichen.

### Was „pro Person nachweisbar" technisch bedeutet — belegt

**Heute ist das nicht möglich.** `Registration.einwilligungFotos`
(`prisma/schema.prisma:238`) ist **ein einziger Boolean für die gesamte
Buchung**. Bei einem Familienticket mit vier Personen gibt es genau
einen Wert für alle vier. `Participant`
(`prisma/schema.prisma:338–352`) hat **kein** Einwilligungsfeld.

**Nötig ist deshalb eine Erweiterung am Teilnehmer**, nicht an der
Buchung. Vorschlag:

| Feld | Zweck |
|---|---|
| `fotoEinwilligung Boolean @default(false)` | der eigentliche Status, je Person |
| `fotoEinwilligungAm DateTime?` | **wann** eingewilligt wurde — ohne Zeitpunkt ist ein Nachweis wenig wert |
| `fotoEinwilligungFassung String?` | **welcher Text** zugestimmt wurde. Ändert sich der Einwilligungstext später, lässt sich sonst nicht mehr sagen, worin eigentlich eingewilligt wurde |

> **Warum die letzten beiden Felder nicht Beiwerk sind:** Art. 7 Abs. 1
> DSGVO verlangt, dass der Verantwortliche die Einwilligung
> **nachweisen** kann. Ein bloßes Häkchen-Ja belegt nur, dass irgendwann
> irgendetwas angekreuzt wurde. Zeitpunkt und Textfassung machen daraus
> einen belastbaren Nachweis — und beides kostet je eine Spalte.

**Bei Minderjährigen** gibt die Einwilligung die anmeldende
erziehungsberechtigte Person ab; sie ist über die Buchung eindeutig
zuordenbar und muss nicht zusätzlich gespeichert werden.

**Der alte Boolean an der Buchung** wird durch die Felder am Teilnehmer
abgelöst. ⬜ **Zu entscheiden bei der Umsetzung:** ob die Werte
bestehender Buchungen auf alle zugehörigen Teilnehmer übertragen werden
oder ob das Feld nur noch als Altbestand stehen bleibt.

### ⚠️ Eine Folge, die zur Anzeige am Check-in zwingend dazugehört

**Wer die Einwilligung vor Ort sichtbar macht, muss sie vor Ort auch
zurücknehmen können.** Art. 7 Abs. 3 DSGVO verlangt, dass der Widerruf
so einfach möglich ist wie die Erteilung. Steht am Check-in „Foto: ja"
und die Person sagt „das möchte ich doch nicht", muss das **sofort**
festhaltbar sein und ab diesem Moment gelten. Ein Widerruf, der erst
per E-Mail nach der Veranstaltung möglich wäre, käme zu spät — die
Aufnahmen gibt es dann schon.

### Was daraus für die übrigen Fragen folgt

Die Fragen **4.2 bis 4.8** sind mit dieser Entscheidung **nicht**
erledigt, sondern werden jetzt erst wirklich gebraucht: Ein
Einwilligungstext muss Aufnahmearten, Zwecke, Veröffentlichungswege,
Dauer und Widerruf konkret benennen, sonst ist die Einwilligung nicht
„informiert" im Sinne der DSGVO. Teil II dieses Dokuments enthält den
Textentwurf dafür; er bleibt bis zur Beantwortung der Fragen 4.2–4.8
unvollständig.

⬜ **Weiterhin offen:** ob dieser Weg nur für das erste Event oder
dauerhaft gilt.
