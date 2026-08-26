# Stripe einrichten — Schritt für Schritt

Diese Anleitung führt vom leeren Bildschirm bis zur funktionierenden
Testzahlung. Sie ist für das **iPad** geschrieben: jeder Schritt sagt,
welche Seite du öffnest, wo du tippst — und was du **nicht** anfassen
sollst.

> **Es geht ausschließlich um den Testmodus.** Die Seite weist jeden
> Schlüssel ab, der nicht mit `sk_test_` beginnt (`lib/zahlung.ts`).
> Echtes Geld kann in diesem Zustand nicht fließen, auch nicht aus
> Versehen.

---

## Die Reihenfolge auf einen Blick

| # | Schritt | Wann möglich |
|---|---|---|
| 1 | Stripe-Konto anlegen | jetzt |
| 2 | Testmodus einschalten | jetzt |
| 3 | Zahlungsarten einstellen: PayPal an, Link aus | jetzt |
| 4 | Testschlüssel heraussuchen und sicher ablegen | jetzt |
| 5 | Webhook eintragen | **erst mit Domain** |
| 6 | Werte beim Hoster hinterlegen und prüfen | **erst mit Hosting** |
| 7 | Testzahlung durchklicken | **erst mit Hosting** |
| 8 | Geschäftskonto als Auszahlungskonto | **erst nach der Gewerbeanmeldung** |

Die Schritte 1–4 kosten nichts und brauchen keine Unternehmensdaten.

---

## 1. Konto anlegen

1. Safari öffnen, `stripe.com` eingeben
2. Oben rechts auf **„Jetzt starten"** (oder „Sign up")
3. E-Mail-Adresse, Name und ein Passwort eingeben. **Nimm ein
   Passwort, das du sonst nirgends benutzt** — an diesem Konto hängt
   später echtes Geld.
4. Als Land **Deutschland** wählen
5. Die Bestätigungs-E-Mail öffnen und den Link darin antippen

Stripe fragt danach nach Angaben zum Unternehmen. **Das kannst du
überspringen** oder erst einmal offen lassen: Für den Testmodus wird
nichts davon gebraucht. Vollständig ausgefüllt werden muss es erst,
wenn echtes Geld fließen soll — also nach der Gewerbeanmeldung.

Aktiviere die **Zwei-Faktor-Anmeldung**, wenn Stripe danach fragt. Es
ist derselbe Schutz wie beim Online-Banking, und hier gilt derselbe
Grund.

---

## 2. Testmodus einschalten

1. Im Stripe-Dashboard oben rechts den Schalter **„Testmodus"** suchen
2. Einschalten

**Woran du erkennst, dass er wirklich an ist:** Die Seite bekommt einen
farbigen Rand oder Balken mit dem Wort „Test", und in der Adresszeile
taucht `/test/` auf. Ist das nicht so, ist der Schalter nicht umgelegt.

> Alles, was du ab hier tust, passiert in einer getrennten Welt:
> eigene Schlüssel, eigene Zahlungen, eigene Kunden. Nichts davon
> berührt den Echtbetrieb.

---

## 3. Zahlungsarten einstellen

Gewünscht sind vier Möglichkeiten: **Kredit-/Debitkarte, Apple Pay,
Google Pay und PayPal.**

**Wichtig zu wissen:** Apple Pay und Google Pay sind bei Stripe *keine
eigenen Zahlarten zum Anschalten*. Sie sind die Kartenzahlung — auf
einem iPhone erscheint sie als Apple-Pay-Knopf, auf einem
Android-Gerät als Google Pay. Es gibt also nur **zwei** Schalter für
**vier** sichtbare Möglichkeiten. Das ist genau das gewünschte
Ergebnis.

So gehst du vor:

1. Links im Menü auf **„Einstellungen"** (Zahnrad), dann
   **„Zahlungsmethoden"**
2. **Karten** — muss **an** sein (ist es normalerweise schon)
3. **PayPal** — auf **„Aktivieren"** tippen
4. **Link** — auf **„Deaktivieren"** tippen

Warum Link aus? Link ist Stripes eigener Schnellbezahl-Dienst. Er ist
oft vorausgewählt und erschiene als fünfte Möglichkeit, die du nicht
angeboten hast.

**Nicht anfassen:** alle übrigen Zahlarten (Klarna, SEPA-Lastschrift,
Sofort, Giropay …). Sie bleiben aus. Der Code fragt ohnehin nur
`card` und `paypal` an — was hier zusätzlich anginge, würde nie
angezeigt.

> ### PayPal ist keine Kür — ohne PayPal geht gar nichts
>
> Der Code fordert die Zahlarten **fest** an (`lib/zahlung.ts`):
>
> ```ts
> payment_method_types: ["card", "paypal"],
> ```
>
> Das ist Absicht: Nur so erscheinen genau die gewünschten
> Möglichkeiten und nicht alles, was im Dashboard zufällig
> angeschaltet ist. Es hat aber eine Folge, die man kennen muss:
>
> **Ist PayPal nicht aktiviert, lehnt Stripe die Erzeugung der
> Bezahlseite komplett ab — dann funktioniert auch die Kartenzahlung
> nicht.**
>
> Der Ablauf bleibt dabei sauber: Die Anmeldung ist längst gespeichert,
> der Besucher landet auf der Abschluss-Seite mit „noch nicht
> abgeschlossen" und einem Knopf „Jetzt bezahlen". Es geht nichts
> verloren — bezahlen könnte er trotzdem nicht.
>
> Woran du es erkennst: Im Serverprotokoll steht
> `Bezahlseite konnte nicht erzeugt werden:` und darunter die Meldung
> von Stripe, sinngemäß „The payment method type `paypal` is not
> activated".
>
> **Und: Diese Einstellung gilt je Sandbox.** Im allgemeinen Testmodus
> aktiviert heißt nicht in deiner Sandbox aktiviert.

---

## 4. Testschlüssel heraussuchen

1. Links im Menü auf **„Entwickler"**
2. Dann auf **„API-Schlüssel"**
3. Dort stehen zwei Werte:

| Name | Beginnt mit | Wozu |
|---|---|---|
| Veröffentlichbarer Schlüssel | `pk_test_…` | **wird hier nicht gebraucht** |
| Geheimer Schlüssel | `sk_test_…` | den brauchen wir |

4. Beim geheimen Schlüssel auf **„Anzeigen"** tippen, dann kopieren

### Wo dieser Schlüssel hingehört — und wo nicht

Drei Orte, sauber getrennt:

| | Ort | Wann |
|---|---|---|
| **Heute** | Passwort-Manager auf dem iPad (iCloud-Schlüsselbund oder eine Passwort-App) | sofort |
| **Später** | Umgebungsvariablen beim Hoster | mit dem Hosting |
| **Nie** | Quelltext · GitHub · Chatverlauf · die Umgebungsvariablen von Claude Code | — |

Der letzte Punkt überrascht und ist deshalb wichtig. Es liegt nahe, den
Schlüssel in die **Umgebungsvariablen einer Claude-Code-Cloud-Umgebung**
einzutragen — dafür sind sie schließlich da. Anthropics eigene
Dokumentation sagt dazu aber ausdrücklich:

> „Anyone who uses the environment can read the values, and cloud
> environments have **no dedicated secrets store**, so **don't add API
> keys or other credentials**."
>
> — [Configure cloud environments](https://code.claude.com/docs/en/cloud-environments#set-environment-variables)

Es ist also kein Geheimnis-Tresor, sondern eine Konfigurationsliste. Sie
ist der richtige Ort für `NODE_ENV` — und der falsche für einen
Schlüssel.

Dasselbe gilt für die Datei `.env` in einer Claude-Code-Sitzung: Der
Arbeitsbehälter wird nach einiger Zeit ohnehin verworfen, und der
Schlüssel wäre dort nutzlos, weil `api.stripe.com` aus dieser Umgebung
netzseitig gesperrt ist. In dieser Datei stehen deshalb nur
Attrappen-Werte für die automatischen Prüfungen.

**Der Notausgang:** Sollte der Schlüssel doch einmal irgendwo landen, wo
er nicht hingehört — im Stripe-Dashboard unter **Entwickler →
API-Schlüssel** lässt er sich mit einem Tipp **neu erzeugen**. Der alte
gilt dann nicht mehr. Das Konto muss dafür nicht angefasst werden.

> Ein Testschlüssel kann kein echtes Geld bewegen. Trotzdem gilt für
> ihn dieselbe Sorgfalt wie für den echten — sonst gewöhnt man sich das
> Falsche an.

### Wenn du in einer Sandbox arbeitest

Stripe bietet neben dem einfachen Testmodus auch **Sandboxes** an —
getrennte Testumgebungen mit eigenen Einstellungen. Die Schlüssel
beginnen genauso mit `sk_test_`, und der Code nimmt sie unverändert an.

Zwei Dinge sind dort aber anders, und beide fallen sonst erst spät auf:

- **Zahlungsmethoden gelten je Sandbox.** PayPal muss *in dieser*
  Sandbox aktiviert und Link *in dieser* Sandbox deaktiviert werden.
  Was im allgemeinen Testmodus eingestellt ist, zählt hier nicht.
- **Webhooks gelten je Sandbox.** Der Endpunkt aus Schritt 5 wird
  später in derselben Sandbox eingetragen, aus der auch der Schlüssel
  stammt. Sonst kommt nie eine Rückmeldung an.

Merke dir also, **in welcher Sandbox** der Schlüssel entstanden ist.

---

## 5. Webhook eintragen — **erst mit Domain**

Ein Webhook ist die Nachricht, die Stripe an **deinen Server** schickt,
sobald jemand bezahlt hat. Sie ist der einzige gültige Nachweis: Die
Rückleitung im Browser („…?bezahlt=1") kann sich jeder selbst in die
Adresszeile tippen.

Dafür muss deine Seite von außen erreichbar sein. Solange sie das nicht
ist, gibt es hier nichts einzurichten.

Wenn die Domain steht:

1. **Entwickler → Webhooks → „Endpunkt hinzufügen"**
2. Als Adresse eintragen:
   `https://DEINE-DOMAIN/zahlung/rueckmeldung`
3. Als Ereignisse **genau diese fünf** auswählen:

   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
   - `charge.refunded`

4. Speichern
5. Bei **„Signing secret"** auf **„Anzeigen"** tippen und den Wert
   kopieren — er beginnt mit `whsec_`

Auch dieser Wert ist ein Geheimnis und wird genauso behandelt wie der
Schlüssel aus Schritt 4.

---

## 6. Werte beim Hoster hinterlegen

Drei Umgebungsvariablen:

```
ZAHLUNG_GEHEIMSCHLUESSEL   sk_test_…    (aus Schritt 4)
ZAHLUNG_WEBHOOK_GEHEIMNIS  whsec_…      (aus Schritt 5)
OEFFENTLICHE_ADRESSE       https://deine-domain.de
```

Bei `OEFFENTLICHE_ADRESSE` **kein** Schrägstrich am Ende.

Danach auf dem Server:

```
npm run zahlung:pruefen
```

Der Befehl sagt in Klartext, ob alles vollständig ist und was
gegebenenfalls fehlt. Er greift **nicht** auf das Netz zu, sendet
nichts und zeigt keinen Schlüssel im Klartext an.

---

## 7. Testzahlung durchklicken

Auf der Bezahlseite von Stripe im Testmodus:

| Karte | Was passiert |
|---|---|
| `4242 4242 4242 4242` | Zahlung gelingt |
| `4000 0000 0000 0002` | Karte wird abgelehnt |
| `4000 0025 0000 3155` | fragt zusätzlich nach Bestätigung (3-D Secure) |

Ablaufdatum: irgendein Datum in der Zukunft. Prüfziffer: drei
beliebige Ziffern. Name und Adresse: frei erfunden.

**Was geprüft werden soll:**

1. Einzelperson zahlt → Anmeldung ist bestätigt und bezahlt
2. Familienbuchung (mehrere Personen) → richtige Personenzahl belegt,
   richtiger Betrag
3. Zahlung abbrechen → Seite sagt „noch nicht abgeschlossen", **kein**
   „Danke"
4. Abgelehnte Karte → Anmeldung bleibt unbezahlt
5. Danach „Jetzt bezahlen" → führt zurück zur Bezahlseite, ohne dass
   die Daten neu eingegeben werden müssen
6. Zweimal schnell tippen → nur **eine** Bezahlseite, keine doppelte
   Abbuchung

---

## 8. Auszahlungskonto — erst nach der Gewerbeanmeldung

Im Testmodus fließt kein Geld, es gibt also nichts auszuzahlen. Sobald
das Gewerbe angemeldet und das Geschäftskonto eröffnet ist:

**Einstellungen → Geschäftsdaten** vervollständigen, danach
**Einstellungen → Bankkonten und Währungen** → Geschäftskonto
hinterlegen.

Erst danach lässt sich der Echtbetrieb freischalten. Dafür muss
zusätzlich der Riegel in `lib/zahlung.ts` bewusst gelöst werden — das
ist Absicht: Der Echtbetrieb soll eine Entscheidung sein, keine
vergessene Einstellung.

**Vorher zu klären, und zwar fachkundig:** AGB, Widerrufsrecht und
Stornoregeln werden mit Online-Zahlung zur Pflicht, dazu die
steuerliche Behandlung der Einnahmen. Das ist keine Programmierfrage.

---

## Wenn etwas nicht klappt

| Was du siehst | Woran es meistens liegt |
|---|---|
| „Es ist kein Testschlüssel hinterlegt" | `sk_live_…` statt `sk_test_…` eingetragen |
| Zahlung geht durch, Anmeldung bleibt offen | Webhook fehlt, falsche Adresse oder falsches `whsec_` |
| „Ungültige Unterschrift" im Protokoll | `ZAHLUNG_WEBHOOK_GEHEIMNIS` gehört zu einem anderen Endpunkt |
| Nach dem Bezahlen landet man auf einer falschen Seite | `OEFFENTLICHE_ADRESSE` stimmt nicht oder endet auf `/` |

Erste Anlaufstelle ist immer `npm run zahlung:pruefen`. Danach im
Stripe-Dashboard unter **Entwickler → Webhooks** auf den Endpunkt
tippen: Dort steht bei jedem Versuch, ob er angekommen ist und was der
Server geantwortet hat.
