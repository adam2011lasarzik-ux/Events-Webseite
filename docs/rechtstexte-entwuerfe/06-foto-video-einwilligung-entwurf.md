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
✅ **Entschieden am 18.09.2026 (Frage 4.3): VERA **und** der jeweilige
Veranstaltungsort dürfen aufnehmen und die Aufnahmen jeweils für
**eigene** Werbezwecke verwenden.**

> ⚠️ **Das ist die folgenreichste Entscheidung dieses Dokuments** — sie
> macht aus einem Verantwortlichen **zwei**. Drei Dinge folgen daraus
> zwingend; ohne sie wäre die Einwilligung angreifbar.

### 1. Zwei Zwecke, zwei Verantwortliche — zwei Häkchen

**Erwägungsgrund 43 Satz 2 DSGVO:** Eine Einwilligung gilt **nicht als
freiwillig**, wenn zu verschiedenen Verarbeitungsvorgängen nicht
gesondert eingewilligt werden kann, obwohl das im Einzelfall angebracht
wäre. Genau dieser Fall liegt hier vor: Jemand kann gute Gründe haben,
VERA ein Bild zu erlauben, der Halle aber nicht — die beiden verfolgen
**eigene** Zwecke und sind **getrennt** verantwortlich.

**Deshalb: zwei getrennte, nicht vorausgewählte Häkchen**, nicht eines
für beides:

> ☐ VERA darf Foto- und Videoaufnahmen (ohne Ton) von mir für eigene
> Werbezwecke verwenden.
>
> ☐ Die Veranstaltungslocation **{Firmierung, Anschrift}** darf Foto-
> und Videoaufnahmen (ohne Ton) von mir für **ihre eigenen**
> Werbezwecke verwenden.

### 2. Die Location muss namentlich genannt werden — je Event

„Der jeweilige Veranstaltungsort" genügt für eine informierte
Einwilligung **nicht**. Wer einwilligt, muss wissen, **wem gegenüber**.
Da VERA in wechselnden Hallen veranstaltet, muss die konkrete
Gesellschaft samt Anschrift **pro Event** in den Einwilligungstext
eingesetzt werden.

⚠️ **Dafür fehlt heute das Datenfeld.** `Event` kennt nur `ortName`,
`strasse`, `plz`, `stadt` (`prisma/schema.prisma:108–111`) — also den
Anzeigenamen der Halle, **nicht** deren rechtliche Firmierung. Siehe
Dokument 15, Punkt B-11.

### 3. Der Widerruf erreicht nicht automatisch beide

Nach Art. 7 Abs. 3 DSGVO muss der Widerruf so einfach sein wie die
Erteilung. Wird die Einwilligung gegenüber VERA widerrufen, endet damit
**nicht** die Erlaubnis der Halle — sie ist eigenständig
verantwortlich. Der Text muss das sagen, und VERA sollte sich
verpflichten, einen Widerruf **unverzüglich an die Location
weiterzugeben**. Andernfalls läuft die betroffene Person zwei getrennte
Widerrufe hinterher, was dem Gebot der Einfachheit widerspricht.

### Empfehlung zur praktischen Umsetzung: nur VERA fotografiert

Adams Ziel — die Halle darf die Bilder für ihre Werbung nutzen — lässt
sich auf zwei Wegen erreichen:

| Weg | Was passiert | Bewertung |
|---|---|---|
| **(a) Beide fotografieren selbst vor Ort** | Das Hallenpersonal muss **im Moment der Aufnahme** wissen, wer eingewilligt hat — VERA müsste dafür die Einwilligungsliste an die Halle weitergeben, eine zusätzliche Datenübermittlung | organisatorisch fragil, zusätzliche Übermittlung |
| **(b) Nur VERA fotografiert, gibt ausgewählte Aufnahmen an die Halle weiter** | Nur VERA braucht die Liste. Die Halle erhält ausschließlich Material, das bereits freigegeben ist | **empfohlen** — gleiches Ergebnis, deutlich weniger Risiko |

**Bei Weg (b)** lautet das zweite Häkchen sinngemäß: „VERA darf
ausgewählte Aufnahmen an die Veranstaltungslocation **{Firmierung}**
weitergeben, die diese für eigene Werbezwecke verwenden darf."

### Was VERA der Location nicht abnehmen kann

Die Halle bleibt für ihre eigene Nutzung **selbst verantwortlich** —
eigene Informationspflichten nach Art. 13 DSGVO, eigene
Datenschutzerklärung, eigene Rechtsgrundlage. VERAs Einwilligungsformular
verschafft ihr eine tragfähige Grundlage, **entbindet sie aber nicht**
von ihren eigenen Pflichten. Das gehört in die Absprache mit der Halle,
nicht in den Einwilligungstext.

`[VOR VERWENDUNG KLÄREN: Mit der Location vereinbaren — wer fotografiert
während der VERA-Veranstaltung, wie wird mit Personen umgegangen, die
nicht eingewilligt haben, und wie erreicht ein Widerruf die Halle?]`

## Wozu wir die Aufnahmen verwenden

> ✅ **Entschieden am 18.09.2026 (Frage 4.4).** Abgedeckt sind genau vier
> Veröffentlichungswege, in zwei getrennten Einwilligungen:
>
> | Einwilligung | Kanäle |
> |---|---|
> | **1 — VERA** | Website `veraevents.de` **und** der offizielle Instagram-Kanal von VERA |
> | **2 — Veranstaltungsort** | Website **und** offizieller Instagram-Kanal der jeweiligen Location |
>
> **Ausdrücklich nicht abgedeckt:** Flyer, Plakate, Programmhefte und
> sonstige Druckerzeugnisse, Facebook, TikTok, YouTube, LinkedIn, Presse,
> Kooperationspartner. Beide Einwilligungen bleiben **getrennt und
> freiwillig** (Entscheidung 4.1 und 4.3).

`[VOR FREISCHALTUNG EINSETZEN: die genauen Kontonamen und Links der
beiden Instagram-Konten — @handle und https://www.instagram.com/… für
VERA und für die jeweilige Location. Ohne diese Angaben darf der Text
nicht live gehen: „unser Instagram-Kanal" ohne Kontobezeichnung ist
keine bestimmte Angabe im Sinne von Art. 4 Nr. 11 DS-GVO.]`

**Einwilligung 1 — VERA:**

> - zur Darstellung unserer Veranstaltungen auf **veraevents.de**
> - auf unserem offiziellen Instagram-Kanal
>   `[VOR FREISCHALTUNG EINSETZEN: @handle und Link]`

**Einwilligung 2 — Veranstaltungsort:**

> - auf der Website von `[Firmierung und Anschrift der Location je Event
>   — siehe B-11]`
> - auf dem offiziellen Instagram-Kanal dieser Location
>   `[VOR FREISCHALTUNG EINSETZEN: @handle und Link]`

### Der Instagram-Hinweis ist Pflichtbestandteil, nicht Beiwerk

Instagram gehört zu **Meta**. Wer dort veröffentlicht, muss das in der
Einwilligung offenlegen, sonst ist sie für diesen Zweck nicht
„informiert" im Sinne von Art. 4 Nr. 11 und Art. 7 Abs. 2 DS-GVO. Drei
Punkte gehören in den Text:

1. **Kontrollverlust.** Einmal veröffentlichte Aufnahmen können von
   Dritten heruntergeladen, gespeichert und weiterverbreitet werden. Ein
   Widerruf entfernt den Beitrag aus unserem Kanal — er holt keine Kopie
   zurück, die jemand vorher gesichert hat.
2. **Nutzungsrechte der Plattform.** Meta lässt sich mit dem Hochladen
   weitreichende Nutzungsrechte an den Inhalten einräumen.
3. **Verarbeitung außerhalb der EU.** Die Aufnahmen können in die USA
   übermittelt werden. Grundlage ist derzeit der
   EU-US-Angemessenheitsbeschluss („Data Privacy Framework").

> ⚠️ **Prüfauftrag für die fachkundige Kontrolle, mit Stand 18.09.2026.**
> Der Angemessenheitsbeschluss ist formal weiter in Kraft, steht aber
> unter Druck: Nach der Entscheidung des US Supreme Court in
> *Trump v. Slaughter* vom 29.06.2026 zur Unabhängigkeit der FTC hat der
> Europäische Datenschutzausschuss am 31.07.2026 eine Überprüfung
> verlangt. Fällt der Beschluss, braucht die Instagram-Zeile eine andere
> Grundlage — dann trägt sie nur noch die ausdrückliche Einwilligung nach
> **Art. 49 Abs. 1 lit. a DS-GVO**, und die verlangt einen zusätzlichen
> Hinweis auf die **fehlenden Garantien** im Drittland. Dieser Satz ist
> vor der Freischaltung zu prüfen und danach im Blick zu behalten.
> *Quelle: Websuche, keine amtliche Primärquelle — siehe Dokument 14.*

### Warum Druck bewusst draußen bleibt — und was das erspart

Ein Widerruf wirkt nach Art. 7 Abs. 3 DS-GVO nur für die Zukunft.
Digitale Kanäle lassen sich daraufhin tatsächlich bereinigen: Beitrag
löschen, Bild von der Website nehmen. **Verteilte Flyer und aufgehängte
Plakate nicht.** Hätte VERA Druckerzeugnisse mit aufgenommen, müsste der
Einwilligungstext genau das vorher offenlegen („bereits verteilte
Exemplare können wir nicht zurückholen") — ein Satz, der die Einwilligung
für viele Eltern unattraktiver macht, ohne dass VERA derzeit einen Nutzen
davon hätte. Der Verzicht ist damit nicht nur die vorsichtigere, sondern
auch die praktischere Wahl.

### Ein neuer Kanal ist ein neuer Zweck

Kommt später Facebook, TikTok, YouTube, eine Pressemappe oder ein
gedruckter Flyer dazu, ist das **kein Detail, sondern ein neuer
Verarbeitungszweck**. Er braucht eine **neue Einwilligung** der
betroffenen Personen. Die vorhandenen Einwilligungen still zu erweitern
oder den verlinkten Text nachträglich zu ändern wäre unwirksam — und
zugleich ein Verstoß gegen die Nachweispflicht aus Art. 7 Abs. 1 DS-GVO,
weil dann nicht mehr belegbar wäre, **welchem Text** die Person zugestimmt
hat. Genau dafür ist das Feld `fotoEinwilligungFassung` in B-10
vorgesehen.

### Keine Weitergabe an Dritte

> ✅ **Entschieden am 18.09.2026 (Frage 4.5).** Die Aufnahmen werden
> **nicht** an Presse, Sponsoren, Kooperationspartner oder sonstige
> Dritte weitergegeben. Entsteht später ein konkreter Presse- oder
> Partnerkontakt, wird dafür eine **gesonderte Einwilligung** der
> abgebildeten Personen eingeholt.
>
> **Nicht betroffen ist die Veranstaltungslocation.** Deren eigene
> Nutzung ist keine Weitergabe im Sinne dieser Frage, sondern ein eigener
> Verarbeitungszweck eines eigenständig Verantwortlichen — geregelt über
> das zweite, getrennte und freiwillige Häkchen (Entscheidungen 4.3 und
> 4.4).

**Formulierung für den Einwilligungstext:**

> Wir geben die Aufnahmen nicht an Dritte weiter — insbesondere nicht an
> Presse, Sponsoren oder Kooperationspartner. Ausgenommen ist
> ausschließlich die Veranstaltungslocation, und auch nur dann, wenn Sie
> dafür gesondert zugestimmt haben.

**Warum das die tragfähigere Entscheidung ist:**

1. **Der Widerruf bliebe sonst eine leere Zusage.** Website und
   Instagram kann VERA bereinigen; eine an eine Redaktion gegebene
   Aufnahme nicht. Sie steht danach im Online-Artikel, im Archiv und
   gegebenenfalls bei einer Bildagentur. Ein Widerruf nach Art. 7 Abs. 3
   DS-GVO liefe dort praktisch ins Leere — und VERA hätte den Eltern
   etwas versprochen, das es nicht halten kann.
2. **Das Medienprivileg entzieht VERA die Steuerung.** Redaktionelle
   Veröffentlichungen unterliegen nach § 19 BDSG und den
   Landespressegesetzen eigenen Regeln; die Redaktion ist dann selbst
   verantwortlich. VERA könnte weder Umfang noch Dauer noch Löschung
   zusagen.
   `[Prüfauftrag: Reichweite des Medienprivilegs im konkreten Fall —
   amtlicher Wortlaut aus dieser Arbeitsumgebung nicht abrufbar.]`
3. **Ein ungenutzter Zweck schadet doppelt.** Es gibt heute keinen
   Presse- oder Partnerkontakt, für den die Zeile gebraucht würde. Sie
   stehen zu lassen hieße, einen Hinweis auf den faktisch wirkungslosen
   Widerruf in den Text aufzunehmen — und damit ausgerechnet die
   unproblematischen Kanäle Website und Instagram mit zu gefährden, weil
   Eltern dann eher ganz ablehnen.

**Für den Einzelfall später:** Berichtet eine Lokalzeitung über eine
Veranstaltung, betrifft das erfahrungsgemäß eine Handvoll Aufnahmen und
wenige Personen. Eine anlassbezogene Einzelzustimmung ist dort praktisch
gut machbar und rechtlich deutlich sauberer als eine Vorratseinwilligung,
die beim Ticketkauf Monate vorher erteilt wurde.

## Wie lange

> ✅ **Entschieden am 19.09.2026 (Frage 4.6): Variante 2 — zweckgebunden,
> ohne feste Frist.** VERA und die jeweilige Veranstaltungslocation dürfen
> die Aufnahmen zeitlich unbefristet auf ihrer Website und ihrem
> Instagram-Kanal verwenden, solange der jeweils genannte Werbezweck
> fortbesteht oder bis die betroffene Person ihre jeweilige Einwilligung
> widerruft. Die Erforderlichkeit wird **jährlich dokumentiert geprüft**.
> Nach Widerruf oder Wegfall des Zwecks werden die betroffenen Aufnahmen
> entfernt und gelöscht. Einwilligungen und Widerrufe für VERA und für die
> Location bleiben **getrennt**.

**Vorgeschlagener Wortlaut für den Einwilligungstext:**

> Wir verwenden die Aufnahmen **ohne feste zeitliche Begrenzung**, solange
> der oben genannte Werbezweck fortbesteht — längstens jedoch bis Sie Ihre
> Einwilligung widerrufen. Einmal im Jahr prüfen wir, ob ältere Aufnahmen
> noch gebraucht werden, und halten das Ergebnis fest. Entfällt der Zweck,
> oder widerrufen Sie, nehmen wir die betroffenen Aufnahmen von unseren
> Kanälen und löschen sie.
>
> Ihre beiden Einwilligungen sind getrennt. Widerrufen Sie nur gegenüber
> VERA, nehmen wir die Aufnahmen von **veraevents.de** und unserem
> Instagram-Kanal; die Veranstaltungslocation ist dadurch nicht
> automatisch erreicht. Wir leiten Ihren Widerruf an sie weiter, und Sie
> können sich zusätzlich unmittelbar an sie wenden.

### Rechtliche Prüfung der Entscheidung (19.09.2026)

**Geprüft mit:** `klauseltransparenz-pruefen` (Prüffragen und Grenzen aus
`references/transparenz.md`) und, soweit einschlägig,
`klauselinhalt-und-verbote-pruefen`. **Ergebnis: Die Entscheidung ist
tragfähig.** Drei Feststellungen, eine Beanstandung am Wortlaut und drei
Folgen, die ohne Umsetzung zu einem echten Problem werden.

#### 1. Eine unbefristete Einwilligung ist nicht per se unzulässig

Die DS-GVO verlangt **keine** Verfallsfrist für eine Einwilligung. Sie
bleibt wirksam, solange der Zweck besteht. **Art. 13 Abs. 2 Buchst. a
DS-GVO** lässt ausdrücklich zu, statt einer Dauer die **Kriterien** für
ihre Festlegung anzugeben — genau das tut Variante 2. Die Grenze zieht
**Art. 5 Abs. 1 Buchst. e DS-GVO** (Speicherbegrenzung): nicht länger als
erforderlich. Die jährliche dokumentierte Prüfung ist die passende
Antwort darauf und zugleich die Erfüllung der Rechenschaftspflicht aus
**Art. 5 Abs. 2 DS-GVO**.

**Damit ist Variante 2 nicht der laxere, sondern der ehrlichere Weg** —
vorausgesetzt, die Prüfung findet wirklich statt. Eine nie durchgeführte
Jahresprüfung wäre ein Verstoß gegen die eigene Zusage und gegen Art. 5
Abs. 2 DS-GVO. Sie ist deshalb als wiederkehrender Termin zu führen, mit
schriftlichem Ergebnis, auch wenn dieses lautet: „weiterhin erforderlich,
keine Änderung".

#### 2. Vorformulierte Einwilligungen unterliegen der Transparenzkontrolle

Eine für eine Vielzahl von Verträgen vorformulierte Einwilligung ist
zugleich eine Allgemeine Geschäftsbedingung. Der BGH hat in der
*Payback*-Entscheidung (Urteil vom 16.07.2008, Az. VIII ZR 348/06) eine
solche Einwilligung an §§ 305 ff. BGB gemessen. Für die **Inhalts**­
kontrolle gilt dabei eine Einschränkung: Soweit die Einwilligung nicht
von Rechtsvorschriften abweicht, ist sie nach § 307 Abs. 3 Satz 1 BGB der
Inhaltskontrolle entzogen — maßgeblich ist dann allein das
Datenschutzrecht. **Das Transparenzgebot des § 307 Abs. 1 Satz 2 BGB
greift jedoch über § 307 Abs. 3 Satz 2 BGB auch dort.** Die
Verständlichkeit des Wortlauts ist also unabhängig von der DS-GVO
zusätzlich justiziabel.

*Prüfauftrag: Aktenzeichen und Randnummern der Payback-Entscheidung sind
über eine Websuche ermittelt; der amtliche Volltext ist aus dieser
Arbeitsumgebung nicht abrufbar — siehe Dokument 14.*

#### 3. Beanstandung am Wortlaut: „soweit keine andere Rechtsgrundlage besteht"

Adams Formulierung enthält den Vorbehalt „…müssen die betroffenen
Aufnahmen entfernt und gelöscht werden, **soweit keine andere
Rechtsgrundlage besteht**". Das ist der Typ Formulierung, den die
Transparenzprüfung ausdrücklich in den Blick nimmt (vgl.
`references/transparenz.md`, Abschnitt 2.1: „soweit gesetzlich zulässig").

Die Prüffrage lautet: **Welche Folge hat der Widerruf konkret?** Für die
betroffene Person ist nach diesem Satz nicht erkennbar, ob ihre Aufnahme
nun verschwindet oder nicht — der Satz gibt VERA einen Beurteilungs­
spielraum, dessen Grenzen der Leser nicht überprüfen kann. Ein
Beurteilungsspielraum ist nicht automatisch unzulässig; unzulässig ist
der **ungerechtfertigte** Spielraum. Hier fehlt die Rechtfertigung:

> **Für Aufnahmen, die ausschließlich zu Werbezwecken veröffentlicht
> wurden, gibt es realistisch keine andere Rechtsgrundlage.** Ein
> berechtigtes Interesse nach Art. 6 Abs. 1 Buchst. f DS-GVO an der
> Weiterverwendung gerade der Aufnahme einer Person, die widersprochen
> hat, wäre nach Art. 21 DS-GVO kaum durchsetzbar. Denkbar bleibt allein
> die **Aufbewahrung des Einwilligungsnachweises selbst** (Art. 7 Abs. 1
> DS-GVO) — das betrifft aber die Erklärung, nicht das Bild.

**Empfehlung:** Den Vorbehalt aus dem an den Verbraucher gerichteten Text
**streichen** und die Rechtsfolge klar zusagen („wir nehmen die Aufnahmen
von unseren Kanälen und löschen sie"). Der Vorbehalt gehört — mit
benanntem Fall — in das interne Löschkonzept, nicht in die Einwilligung.
Eine Zusage, die man einhalten kann, ist wertvoller als ein Vorbehalt,
den niemand versteht.

`[ENTSCHEIDUNG OFFEN: Adam bestätigt die Streichung des Vorbehalts aus
dem Verbrauchertext — oder benennt den konkreten Fall, für den er
gebraucht wird.]`

#### 4. Der Widerruf muss ausführbar sein — heute ist er es nicht

Eine unbefristete Nutzung verschiebt das gesamte Gewicht auf den
Widerruf. Der ist nach **Art. 7 Abs. 3 DS-GVO** jederzeit und ohne
Begründung möglich; die Löschpflicht folgt aus **Art. 17 Abs. 1
Buchst. b DS-GVO**. Praktisch setzt beides voraus, dass VERA **weiß,
welche Aufnahme welche Person zeigt**. Eine solche Zuordnung existiert
heute nicht — weder in der Datenbank noch im Dateiablage-Verzeichnis.

**Ohne sie ist der Widerruf eine leere Zusage**, und zwar dauerhaft,
weil die Nutzung kein Ablaufdatum mehr hat. Das ist die eigentliche
Folge dieser Entscheidung und steht als **B-13** auf der Bauliste.

**Zweite Pflicht aus Art. 17 Abs. 2 DS-GVO:** Wer Aufnahmen öffentlich
gemacht hat, muss angemessene Maßnahmen ergreifen, um andere
Verantwortliche über den Löschwunsch zu informieren. Das trifft hier die
Weitergabe des Widerrufs an die Location — die bereits aus Entscheidung
4.3 folgt, hier aber eine **zweite, unabhängige** Rechtsgrundlage
bekommt.

#### 5. Getrennte Einwilligungen heißt: getrennte Widerrufe

Aus der Trennung folgt zwingend, dass eine Person **nur gegenüber VERA**
oder **nur gegenüber der Location** widerrufen kann. Die Speicherung
braucht deshalb **zwei getrennte Zustände je Teilnehmer**, jeweils mit
Zeitpunkt und Textfassung, und die Möglichkeit, einen Widerruf **später**
festzuhalten — nicht nur beim Check-in. Das erweitert B-10 und wird dort
vermerkt.

#### 6. Konflikt mit dem bestehenden Löschkonzept — belegt

Zwei Punkte, die ohne Anpassung auseinanderlaufen:

| Fund | Warum das ein Problem ist |
|---|---|
| **Die veröffentlichten Aufnahmen haben keine Löschklasse.** K1–K7 decken Gesundheitsangaben, Einverständniserklärungen, Zustimmungsnachweise, Anmeldedaten, Checklisten, Vorfallakten und Steuerunterlagen ab — **die Bilddateien und die Beiträge auf den Kanälen sind in keiner Klasse enthalten.** | Die Jahresprüfung ist damit ein rein manueller Vorgang ohne technischen Anker. Der automatische Löschlauf (`vera-loeschlauf.timer`) wird hier nie etwas tun. Das ist vertretbar, muss aber **bewusst** so dokumentiert sein, statt stillschweigend zu unterstellen, der Löschlauf kümmere sich darum. |
| **K3 löscht den reduzierten Zustimmungsnachweis nach 10 Jahren** — die Nutzung der Aufnahme ist jetzt aber **unbefristet**. | Steht die Aufnahme im elften Jahr noch online, kann VERA die Einwilligung **nicht mehr nachweisen** und verstößt gegen Art. 7 Abs. 1 DS-GVO. Der Nachweis muss mindestens **so lange** aufbewahrt werden, wie die Aufnahme genutzt wird. Auflösung: entweder eine eigene Löschklasse für Foto-Einwilligungen mit Frist „Ende der Nutzung + Verjährungspuffer", oder eine Löschsperre, solange die Aufnahme veröffentlicht ist. |

`[FACHLICHE PRÜFUNG: Der Zuschnitt der neuen Löschklasse und die Länge
des Verjährungspuffers gehören in die anwaltliche Kontrolle. Die hier
genannten Normen sind Prüfauftrag, kein nachgewiesenes Ergebnis —
gesetze-im-internet.de und dejure.org sind aus dieser Arbeitsumgebung
gesperrt.]`

#### 7. Was die Prüfung ausdrücklich NICHT beanstandet

- **Die fehlende Höchstdauer als solche.** Art. 13 Abs. 2 Buchst. a
  DS-GVO lässt Kriterien statt einer Frist zu; das Wort „unbefristet"
  allein macht die Einwilligung nicht unwirksam.
- **Den Begriff „Werbezweck".** Er ist durch die in 4.4 benannten vier
  Kanäle konkretisiert und damit überprüfbar. Ein
  Auslegungsspielraum bleibt, aber ein gerechtfertigter.
- **Die jährliche Prüfung als Mechanismus.** Sie ist die richtige Antwort
  auf Art. 5 Abs. 1 Buchst. e DS-GVO — solange sie stattfindet und
  festgehalten wird.

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

> ✅ **Entschieden am 19.09.2026 (Frage 4.7): Altersgrenze 14 Jahre.**

**Vorgeschlagener Wortlaut für den Einwilligungstext:**

> **Unter 14 Jahren** entscheiden die Erziehungsberechtigten. Zeigt Ihr
> Kind vor Ort erkennbar, dass es nicht aufgenommen werden möchte,
> respektieren wir das immer — unabhängig davon, was Sie hier angekreuzt
> haben.
>
> **Von 14 bis einschließlich 17 Jahren** brauchen wir zwei Zustimmungen:
> Ihre beim Ticketkauf und die der minderjährigen Person selbst beim
> Check-in. Diese Bestätigung ist freiwillig. Fehlt eine der beiden
> Zustimmungen, behandeln wir die Person als **nicht eingewilligt**.
>
> Die auf Papier abgegebene Einverständniserklärung für Minderjährige
> enthält **keine** Einwilligung in Foto- oder Videoaufnahmen. Die
> Einwilligung wird ausschließlich hier erteilt.

> ℹ️ **Für das erste Event gilt zusätzlich:** Minderjährige nehmen
> ausschließlich gemeinsam mit ihren anwesenden Erziehungsberechtigten
> teil (Familienticket). Die zweite Zustimmung wird also in Anwesenheit
> der Eltern eingeholt — das ist der einfachste denkbare Fall und
> zugleich der beweissicherste.

### Rechtliche Prüfung der Entscheidung (19.09.2026)

**Geprüft mit** `klauseltransparenz-pruefen` (Prüffragen aus
`references/transparenz.md`) und `klauselinhalt-und-verbote-pruefen`
(Kontrollmaßstab). **Ergebnis: Die Regel ist tragfähig und liegt auf der
sicheren Seite.** Im Einzelnen:

- **Maßstab ist die Einsichtsfähigkeit, nicht die Geschäftsfähigkeit.**
  Entscheidend ist, ob die Person begreift, was die Veröffentlichung
  ihres Bildes bedeutet. Die Aufsichtspraxis nimmt das ab etwa 14 Jahren
  an; liegt Einsichtsfähigkeit vor, wird eine **Doppelzustimmung**
  verlangt. Die gewählte Grenze entspricht damit der verbreiteten
  Behördenauffassung.
- **Art. 8 DS-GVO greift hier nicht.** Er betrifft Dienste, die einem
  Kind **unmittelbar** angeboten werden; bei VERA kauft der
  Erziehungsberechtigte. Die dort genannten 16 Jahre sind deshalb nicht
  der Maßstab — was die Frage nicht entschärft, sondern sie auf die
  Einsichtsfähigkeit zurückführt.
- **Die Sicherheitsregel ist richtig herum gebaut.** „Fehlt eine
  Zustimmung, gilt die Person als nicht eingewilligt" ist der sichere
  Grundzustand. Der umgekehrte Weg — annehmen, es sei erlaubt, solange
  niemand widerspricht — wäre mit Art. 4 Nr. 11 DS-GVO unvereinbar, weil
  Schweigen keine Einwilligung ist.
- **Die Freiwilligkeit der zweiten Zustimmung ist nicht nur eine
  Höflichkeit.** Ein 15-Jähriger, der vor seinen Eltern am Eingang
  gefragt wird, steht unter Erwartungsdruck. Deshalb muss die Frage
  neutral gestellt werden („möchtest du, dass Fotos von dir
  veröffentlicht werden dürfen?"), ein Nein muss folgenlos bleiben, und
  ein Nein darf nicht durch die Eltern überschrieben werden können.
- **Der Widerspruch des Kindes unter 14 gehört in den Text, nicht nur in
  die Praxis.** Er ist die Zusage, die aus einer formal wirksamen
  Elterneinwilligung eine auch praktisch akzeptable macht. Ohne sie wäre
  der häufigste Konfliktfall — das Kind will nicht, die Eltern haben
  zugestimmt — ungeregelt.

### Welches Altersmerkmal dafür wirklich nötig ist

Adams Vorgabe lautet, **nur das erforderliche Altersmerkmal** zu
erfassen. Das ist zugleich die Anforderung aus Art. 5 Abs. 1 Buchst. c
DS-GVO (Datenminimierung). Dazu drei belegte Feststellungen:

- **Der vorhandene Teilnehmertyp reicht nicht.** `Participant.typ`
  unterscheidet `SCHUELER` und `ERWACHSENER`
  (`prisma/schema.prisma`) — das ist eine **Preiskategorie**, keine
  Altersangabe. Ein Schüler kann 19 sein, und seit Schritt S kann ein
  Event die Schülerkategorie ganz abschalten.
- **Das Feld `geburtsjahr` existiert, wird aber nirgends erhoben.**
  `Participant.geburtsjahr Int?` steht im Schema, kommentiert mit „nur
  das Jahr, nicht das volle Geburtsdatum". Eine Volltextsuche über
  `lib/`, `components/`, `app/` und `content/` findet dazu **keine
  einzige Erfassungsstelle** — der einzige Treffer ist
  `lib/anonymisieren.ts:60`, das es beim Löschen auf `null` setzt. Das
  Feld ist also seit jeher tot.
- **Das Geburtsjahr ist hier zugleich zu viel und zu wenig.** Zu viel,
  weil es mehr aussagt als gebraucht wird. Zu wenig, weil es an genau der
  entscheidenden Grenze mehrdeutig ist: Wer 2012 geboren ist, kann am
  Veranstaltungstag 13 oder 14 sein. Ein Merkmal, das die eine Frage
  nicht beantwortet, für die es erhoben würde, ist das falsche Merkmal.

**Empfehlung: ein grobes Altersmerkmal je Teilnehmer, mehr nicht.** Drei
Werte genügen — `UNTER_14`, `VIERZEHN_BIS_17`, `AB_18` —, angegeben von
der buchenden erwachsenen Person. Eine Altersprüfung findet nicht statt
und ist für diesen Zweck auch nicht verlangt; die Angabe ist eine
Selbstauskunft, und das genügt. `geburtsjahr` bleibt dabei ungenutzt und
sollte entweder entfernt oder ausdrücklich als „nicht erhoben"
dokumentiert werden — ein totes Feld im Schema lädt dazu ein, später
doch befüllt zu werden.

`[ALTERNATIVE, die noch weniger speichert — für die fachliche Prüfung
festgehalten: Das Altersmerkmal ließe sich vollständig vermeiden, indem
die Altersgruppe erst beim Check-in mündlich geklärt und nur auf der
Papierliste vermerkt wird. Für das erste Event mit anwesenden Eltern
wäre das tragfähig. Dagegen spricht, dass die Check-in-Liste dann nicht
vorab ausweisen kann, bei wem eine zweite Zustimmung einzuholen ist, und
dass am Eingang nach dem Alter gefragt werden müsste. Die Entscheidung
zwischen beiden Wegen gehört in die anwaltliche Kontrolle.]`

### Was daraus für den Ablauf folgt

- Die Check-in-Liste weist bei Minderjährigen von 14 bis 17 aus, dass
  eine zweite Zustimmung fehlt, und bietet die Möglichkeit, sie dort
  festzuhalten.
- Der gespeicherte Status je Person lautet erst dann „eingewilligt", wenn
  **beide** Zustimmungen vorliegen. Das ist eine Verknüpfung, keine
  zweite Spalte — und es ist die Stelle, an der ein Denkfehler teuer
  würde.
- Unter 14 bleibt der Status allein von der Elternzustimmung abhängig;
  ein Widerspruch vor Ort wird als **Widerruf** festgehalten und wirkt
  wie jeder andere Widerruf (Art. 7 Abs. 3 DS-GVO).

`[FACHLICHE PRÜFUNG: Die Altersgrenze von 14 Jahren stammt aus
Behördenpraxis und Fachliteratur, nicht aus dem Gesetzeswortlaut. Sie
ist Prüfauftrag, kein nachgewiesenes Ergebnis — gesetze-im-internet.de
und dejure.org sind aus dieser Arbeitsumgebung gesperrt. Quellen siehe
Dokument 14.]`

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
