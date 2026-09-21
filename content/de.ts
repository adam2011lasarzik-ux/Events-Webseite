/* Alle deutschen Texte der Seite. */

export const de = {
  meta: {
    marke: "VERA",
    markeLang: "VERAnstaltung",
    beschreibung:
      "VERA veranstaltet Sport- und Netzwerkevents. Den Anfang macht ein Padel-Nachmittag " +
      "in Falkensee für Schüler, Lehrer und Eltern.",
  },

  nav: {
    sprungmarke: "Zum Inhalt springen",
    hauptmenue: "Hauptmenü",
    menueOeffnen: "Menü öffnen",
    menueSchliessen: "Menü schließen",
    events: "Events",
    schulen: "Für Schulen",
    ueber: "Über VERA",
    faq: "Fragen",
    kontakt: "Kontakt",
  },

  aktion: {
    /* Der EINSTIEG zur Anmeldung, nicht die Bestellung selbst — er
       löst keine Zahlungspflicht aus. „Jetzt anmelden" war hier
       trotzdem unglücklich: Es klang nach dem verbindlichen Schritt
       und ist als Bestellknopf-Beschriftung ausdrücklich verworfen
       worden. „Zu den Tickets" beschreibt, was der Klick tut. */
    anmelden: "Zu den Tickets",
    schuelerAnmelden: "Schüler anmelden",
    familieAnmelden: "Familie anmelden",
    detailsAnsehen: "Alle Infos zum Event",
    zumEvent: "Zum Event",
    eventAnsehen: "Event ansehen",
    zurueck: "Zurück zur Startseite",
  },

  /**
   * Die Kategorien als deutsche Wörter — an genau einer Stelle.
   *
   * Wird auf der Übersichtskarte UND im Adminbereich benutzt. Zwei
   * getrennte Listen liefen früher oder später auseinander, und dann
   * hiesse dieselbe Veranstaltung vorne „Netzwerken" und hinten
   * „Networking".
   */
  kategorie: {
    sport: "Sport",
    business: "Business",
    networking: "Netzwerken",
    schule: "Schule",
    community: "Community",
    workshop: "Workshop",
    freizeit: "Freizeit",
    sonstiges: "Veranstaltung",
  } as Record<string, string>,

  startseite: {
    ueberschrift: "Unsere Veran­stal­tungen",
    einleitung:
      "Sport- und Netzwerkevents, bei denen du Neues ausprobierst und Leute kennenlernst.",
    weitereFolgen: "Weitere Veranstaltungen folgen in Kürze.",
  },

  /**
   * Vom Kopfbereich bleiben nur die Bildbeschreibungen. Überschrift,
   * Augenbraue und Text kommen seit dem Theme-Umbau vom Event selbst —
   * sonst stünde über jeder Veranstaltung „Nie gespielt?".
   */
  hero: {
    hinweisFoto: "Hier kommt später ein Foto vom Court",
    videoBeschreibung: "Kurzes Video vom Padel-Court",
  },

  plaetze: {
    ueberschrift: "Plätze",
    wenigeEiner: "Nur noch 1 freier Platz",
    wenigeMehrere: "Nur noch {n} freie Plätze",
    ausgebucht: "Ausgebucht",
    gesamt: "{n} Plätze",
  },

  preise: {
    ueberschrift: "Was es kostet",
    einleitung:
      "Alle Preise gelten pro Person und Veranstaltungstag. Es sind Endpreise; gemäß " +
      "§ 19 UStG wird keine Umsatzsteuer berechnet. " +
      "Schläger, Bälle und Betreuung sind im Preis enthalten. Essen und Getränke können " +
      "vor Ort separat erworben werden.",
    schueler: "Schüler",
    schuelerHinweis: "Kinder und Jugendliche",
    erwachsener: "Erwachsene",
    erwachsenerHinweis: "Eltern und Begleitung",
    familie: "Familie",
    familieHinweis: "2 Erwachsene + 1 Schüler",
    familieZusatz: "jeder weitere Schüler {betrag}",
    ab: "ab",
    proPerson: "pro Person",
  },



  schulen: {
    ueberschrift: "Für Schulen",
    kurz:
      "Sie möchten mit einer Klasse oder einem Kurs vorbeikommen? Schreiben Sie uns eine " +
      "E-Mail — Termin, Gruppengröße und Ablauf stimmen wir individuell ab.",
    mehr: "Mehr für Schulen",
    titel: "Padel für Schulklassen",
    absaetze: [
      "Der Padel-Nachmittag eignet sich gut für Sportunterricht, Projekttage und " +
        "Klassenausflüge. Die Sportart ist schnell erklärt, körperlich für alle machbar und " +
        "funktioniert auch in gemischten Gruppen mit sehr unterschiedlichem Können.",
      "Eine Einheit findet während der Schulzeit statt, zwischen 08:00 und 15:00 Uhr, und " +
        "dauert 90 Minuten. Auf dem Platz spielen jeweils bis zu 20 Personen gleichzeitig.",
      "Für Schulklassen läuft die Anmeldung nicht über die Webseite: Termin, Teilnehmerzahl " +
        "und alle weiteren Details sprechen wir individuell per E-Mail ab. Melden Sie sich " +
        "einfach unter der unten stehenden Adresse.",
    ],
    punkte: [
      "Keine Vorkenntnisse nötig",
      "Ausrüstung wird gestellt",
      "90 Minuten, während der Schulzeit (08:00–15:00 Uhr)",
      "Bis zu 20 Personen gleichzeitig auf dem Platz",
    ],
  },

  ueber: {
    ueberschrift: "Über VERA",
    absaetze: [
      "VERA steht für VERAnstaltung. Der Name ist bewusst schlicht, weil die Sache es auch " +
        "sein soll: Wir organisieren Tage, an denen Menschen etwas ausprobieren, das sie sonst " +
        "nicht ausprobiert hätten.",
      "Den Anfang macht Padel in Falkensee — für Schüler und ihre Eltern, ohne Vorkenntnisse, " +
        "ohne eigene Ausrüstung, ohne Vereinsmitgliedschaft.",
      "Danach kommen weitere Events dazu: andere Sportarten, später auch Veranstaltungen zum " +
        "Netzwerken. Der Gedanke bleibt derselbe.",
    ],
  },

  faq: {
    ueberschrift: "Häufige Fragen",
    eintraege: [
      {
        frage: "Ich habe noch nie Padel gespielt. Ist das ein Problem?",
        antwort:
          "Im Gegenteil, dafür ist der Tag gemacht. Die meisten kommen ohne jede Erfahrung. " +
          "Betreuer erklären alles von Anfang an.",
      },
      {
        frage: "Was muss ich mitbringen?",
        antwort:
          "Sportkleidung, saubere Hallenschuhe und ein Handtuch. Schläger und Bälle bekommst " +
          "du vor Ort.",
      },
      {
        frage: "Mein Kind ist unter 18. Wer meldet an?",
        antwort:
          "Ein Elternteil oder eine erziehungsberechtigte Person meldet an und bestätigt die " +
          "Teilnahme. Ab 18 kann man sich selbst anmelden.",
      },
      {
        frage: "Können Eltern mitspielen?",
        antwort:
          "Ja, ausdrücklich. Es gibt einen eigenen Preis für Erwachsene und ein günstigeres " +
          "Familienpaket. Zuschauen ist natürlich auch möglich.",
      },
      {
        frage: "Wie bezahle ich?",
        antwort:
          "Das legen wir gerade fest und geben es rechtzeitig vor der Anmeldung bekannt. " +
          "Der Preis steht dir aber jetzt schon vollständig vor Augen.",
      },
      {
        frage: "Wann startet die Anmeldung?",
        antwort:
          "Sobald Datum und Uhrzeit feststehen. Schreib uns gern, dann sagen wir dir Bescheid.",
      },
    ],
  },

  /**
   * Der Abschluss-Aufruf, wenn eine Veranstaltung keinen eigenen
   * mitbringt. Bewusst neutral formuliert: Der padel-typische Satz
   * („Bereit für den ersten Ballwechsel?") gehört zum Padel-Event und
   * steht deshalb dort, nicht hier.
   */
  cta: {
    ueberschrift: "Bereit mitzumachen?",
    text: "Such dir aus, wer mitkommt, und sieh dir an, was es kostet.",
  },

  anmeldung: {
    titel: "Anmeldung",

    /**
     * Veranstaltung ohne feststehenden Termin (Entscheidung 2.5).
     *
     * Solche Events werden nur angekündigt und haben keinen Kaufknopf.
     * Wer die Adresse trotzdem direkt aufruft, bekommt diese Erklärung
     * statt eines Formulars, das ohnehin abgelehnt würde.
     */
    keinTerminTitel: "Termin folgt",
    keinTerminText:
      "Für diese Veranstaltung stehen Datum und Uhrzeit noch nicht fest. " +
      "Eine Anmeldung ist erst möglich, sobald der Termin veröffentlicht ist — " +
      "schau einfach später noch einmal vorbei.",
    einleitung:
      "Stell zusammen, wer mitkommt. Der Preis rechnet sich unten sofort mit — " +
      "so weißt du vorher genau, woran du bist.",
    frageWen: "Wen meldest du an?",
    wahlSelbst: "Mich selbst",
    wahlSelbstHinweis: "Ab 18 Jahren",
    wahlKind: "Mein Kind",
    wahlKindHinweis: "Als Erziehungsberechtigte:r",
    wahlFamilie: "Familienpaket",
    wahlFamilieHinweis: "2 Erwachsene + Schüler",

    selbstFrage: "Was trifft auf dich zu?",
    selbstSchueler: "Ich bin Schüler",
    selbstErwachsener: "Ich bin erwachsen",

    kindFrage: "Wie viele Schüler unter 18 meldest du an?",
    kindMitkommen: "Ich komme selbst mit",

    familieFrage: "Wie viele Schüler kommen mit?",
    familieEnthalten: "2 Erwachsene sind im Paket enthalten",

    anzahlErhoehen: "Einen mehr",
    anzahlVerringern: "Einen weniger",
    anzahlSchueler: "Anzahl Schüler",

    summe: "Gesamt",
    personEiner: "1 Person",
    personMehrere: "{n} Personen",
    /* Hiess einmal "inklMwst". Als Kleinunternehmer nach § 19 UStG
       weist VERA keine Umsatzsteuer aus — der alte Name hätte eine
       Aussage behauptet, die der Wert nicht mehr macht. */
    preisHinweis: "Gesamtpreis",
    keineAuswahl: "Wähle oben aus, wer mitkommt.",

    nochNichtTitel: "Die Anmeldung öffnet in Kürze",
    nochNichtText:
      "Datum und Uhrzeit stehen noch nicht fest. Deshalb kannst du dich hier zwar den Preis " +
      "ansehen, aber noch nicht verbindlich anmelden — es wird nichts abgeschickt und nichts " +
      "gespeichert. Schreib uns, wenn wir dir Bescheid geben sollen, sobald es losgeht.",
    nochNichtAktion: "Schreib uns",

    /* Der Wortlaut ist vom Betreiber vorgegeben und stimmt mit der
       Einverständniserklärung (public/dokumente/) und dem AGB-Abschnitt
       „Teilnahme Minderjähriger" wörtlich überein.

       Hier stand einmal „Eine von VERA Events angebotene elektronische
       Übermittlung bleibt möglich." Der Satz ist gestrichen: Es gibt
       keinen elektronischen Weg — weder eine Upload-Funktion noch eine
       Einreichung per Mail. Er hätte Eltern nach etwas suchen lassen,
       das es nicht gibt. Die Erklärung wird ausgedruckt, unterschrieben
       und am Empfang der Veranstaltungslocation abgegeben. */
    minderjaehrigTitel: "Einverständniserklärung für Minderjährige erforderlich",
    minderjaehrigText:
      "Für minderjährige Teilnehmer muss die Einverständniserklärung vollständig ausgefüllt " +
      "und von einer erziehungsberechtigten Person unterschrieben werden. Sie muss spätestens " +
      "beim Check-in abgegeben werden. Die Online-Anmeldung allein ersetzt die unterschriebene " +
      "Erklärung nicht.",
    minderjaehrigDownload: "Einverständniserklärung herunterladen",

    formular: {
      ueberschrift: "Deine Angaben",
      hinweis:
        "Wir fragen nur, was wir für die Veranstaltung wirklich brauchen. " +
        "Deine Daten werden nicht weitergegeben.",
      freiwillig: "(freiwillig)",
      einwilligungVormund:
        "Ich bin erziehungsberechtigt und melde die genannten minderjährigen Personen " +
        "verbindlich an.",
      /* Zwei Pflichthaken. Der erste ist eine Vertragsannahme, der
         zweite eine Kenntnisnahme — sie dürfen sprachlich nicht
         ineinanderlaufen, sonst sieht die Kenntnisnahme aus wie eine
         Einwilligung, und eine Pflicht-Einwilligung wäre nach
         Art. 7 Abs. 4 DS-GVO unwirksam. */
      agbTeil1: "Ich akzeptiere die",
      agbLinktext: "Teilnahmebedingungen",
      agbTeil2: "von VERA.",
      aufnahmenTeil1:
        "Ich habe zur Kenntnis genommen, dass bei der Veranstaltung Foto-, Video- " +
        "und allgemeine Tonaufnahmen entstehen können",
      aufnahmenLinktext: "(Hinweise zu Aufnahmen)",
      aufnahmenTeil2: ".",
      widerspruchTitel: "Sie möchten nicht abgebildet werden?",
      widerspruchText:
        "Dann sagen Sie es uns — beim Ankommen oder jederzeit während der Veranstaltung. " +
        "Ein Widerspruch ist formlos möglich, muss nicht begründet werden und hat keinerlei " +
        "Nachteile für Ihre Teilnahme. Wir informieren die fotografierende Person und prüfen " +
        "vor jeder Veröffentlichung, ob widersprechende Personen erkennbar sind.",
      /* ── Der Bestellknopf. Der Wortlaut ist NICHT frei wählbar ──
         § 312j Abs. 3 BGB verlangt, dass die Schaltfläche mit nichts
         anderem als „zahlungspflichtig bestellen" oder einer
         entsprechend eindeutigen Formulierung beschriftet ist. Die
         Rechtsfolge eines Verstoßes steht in § 312j Abs. 4 BGB: Der
         Vertrag kommt NICHT ZUSTANDE.

         Die Gerichte prüfen dabei ausschließlich die Beschriftung der
         Schaltfläche selbst — was darüber oder daneben steht, zählt
         nicht. Als unzureichend verworfen wurden unter anderem
         „Bestellung aufgeben", „Senden" und „Jetzt anmelden"; die
         frühere Fassung „Zur Bezahlung" beschrieb einen
         Navigationsschritt und war damit ebenfalls zu schwach.

         Der Betrag steht deshalb NEBEN dem Knopf statt darin: Er ist
         eine nützliche Information, aber jedes zusätzliche Wort auf
         der Schaltfläche schwächt die gesetzlich geforderte
         Eindeutigkeit. */
      absenden: "Zahlungspflichtig bestellen",
      absendenBetrag: "Gesamtbetrag: {betrag}",
      absendenKostenlos: "Jetzt verbindlich anmelden",
      laeuft: "Einen Moment …",
      zahlungHinweis:
        "Es geht weiter zur gesicherten Bezahlseite. Kartendaten kommen nie bei uns an. " +
        "Erst nach erfolgreicher Zahlung ist die Anmeldung bestätigt.",
    },

    vorschau: {
      ueberschrift: "So sieht das spätere Formular aus",
      hinweis:
        "Eine Vorschau der Angaben, die später abgefragt werden. Die Felder lassen sich noch " +
        "nicht ausfüllen — es wird nichts gespeichert oder übertragen.",
      labelVorname: "Vorname",
      labelNachname: "Nachname",
      labelEmail: "E-Mail-Adresse",
      labelTelefon: "Telefonnummer",
      gruppeMeineAngaben: "Deine Angaben",
      gruppeEltern: "Angaben des Elternteils / Erziehungsberechtigten",
      gruppeErwachsenerN: "Erwachsener {n}",
      gruppeSchuelerN: "Schüler {n}",
    },
  },

  storno: {
    titel: "Buchung stornieren",
    /* Der Link steht ausschliesslich in der Bestaetigungsmail. Passt
       der Schluessel nicht, wird bewusst NICHT verraten, ob es die
       Buchung ueberhaupt gibt — sonst liesse sich durch Probieren
       herausfinden, wer angemeldet ist. */
    unbekanntTitel: "Diese Buchung können wir nicht öffnen",
    unbekanntText:
      "Der Link ist unvollständig oder gilt nicht mehr. Den gültigen Link findest du in " +
      "deiner Bestätigungsmail. Wenn du nicht weiterkommst, schreib uns.",

    veranstaltung: "Veranstaltung",
    termin: "Termin",
    personen: "Angemeldete Personen",
    betrag: "Gezahlter Betrag",
    nummer: "Anmeldenummer",

    frageTitel: "Möchtest du diese Buchung stornieren?",
    frageErstattung:
      "Der volle Betrag wird zurückerstattet — auf dem Weg, über den du bezahlt hast. " +
      "Je nach Bank dauert das einige Werktage.",
    frageOhneErstattung:
      "Für diese Buchung wurde noch nichts bezahlt. Es wird also auch nichts erstattet.",
    frageEndgueltig: "Das lässt sich nicht rückgängig machen. Dein Platz wird sofort wieder frei.",
    knopf: "Buchung jetzt stornieren",

    erfolgTitel: "Deine Buchung ist storniert",
    erfolgErstattung:
      "Der volle Betrag ist zur Rückerstattung angewiesen. Je nach Bank dauert es einige " +
      "Werktage, bis er wieder bei dir ankommt. Eine Bestätigung schicken wir dir per E-Mail.",
    erfolgOhneErstattung:
      "Dein Platz ist wieder frei. Eine Bestätigung schicken wir dir per E-Mail.",

    /* Für jeden Grund ein eigener, ehrlicher Satz — „das hat nicht
       geklappt" hilft niemandem weiter. */
    zuSpaetTitel: "Dafür ist es zu spät",
    zuSpaetText:
      "Selbst stornieren geht bis 24 Stunden vor Beginn der Veranstaltung. Dieser Zeitpunkt " +
      "ist vorbei. Schreib uns trotzdem, wenn du nicht kommen kannst — dann finden wir eine " +
      "Lösung.",
    bereitsStorniertTitel: "Diese Buchung ist bereits storniert",
    bereitsStorniertText: "Es gibt nichts mehr zu tun. Dein Platz ist frei.",
    bereitsErstattetTitel: "Für diese Buchung läuft bereits eine Erstattung",
    bereitsErstattetText:
      "Hier wurde schon etwas zurückerstattet. Damit nicht versehentlich ein zweites Mal Geld " +
      "fließt, übernehmen wir das von Hand — schreib uns kurz.",
    anbieterTitel: "Die Erstattung hat nicht geklappt",
    anbieterText:
      "Wir konnten die Rückerstattung gerade nicht auslösen. An deiner Buchung hat sich " +
      "nichts geändert. Versuch es später noch einmal oder schreib uns.",
    gebremstTitel: "Zu viele Versuche",
    gebremstText:
      "Zum Schutz vor Missbrauch sind nur wenige Versuche je Stunde möglich. Bitte versuch es in etwa einer Stunde noch einmal — oder schreib uns kurz, dann stornieren wir für dich.",
  },

  danke: {
    /* ZWEI Zustände, mehr nicht:
         bezahlt        → Anmeldung bestätigt
         nicht bezahlt  → Anmeldung NICHT abgeschlossen
       Eine Zwischenbestätigung („Danke, wir haben deine Anmeldung")
       vor der Bezahlung wäre irreführend — sie klingt nach fertig. */
    /* Überschrift und Unterzeile ergeben zusammen den Satz
       „Zahlung erfolgreich — deine Anmeldung ist bestätigt".
       Getrennt, weil der ganze Satz als Überschrift auf einem Handy
       fünf Zeilen lang wäre und dann eher erschlägt als beruhigt. */
    bezahltTitel: "Zahlung erfolgreich",
    bezahltEinleitung:
      "Deine Anmeldung ist bestätigt. Hier steht noch einmal, was wir aufgenommen haben.",
    bezahltEinleitungMehrere:
      "Ihr seid für das Event angemeldet. Hier steht noch einmal, was wir aufgenommen haben.",
    offenTitel: "Deine Anmeldung ist noch nicht abgeschlossen",
    offenEinleitung:
      "Der Kauf ist noch nicht abgeschlossen. Schließe die Zahlung ab, dann ist dein Platz " +
      "gebucht.",
    ueberschrift: "Danke — wir haben deine Anmeldung",
    einleitung:
      "Deine Anmeldung ist gespeichert. Hier steht noch einmal, was wir aufgenommen haben.",
    nummer: "Anmeldenummer",
    veranstaltung: "Veranstaltung",
    personen: "Angemeldete Personen",
    betrag: "Gesamtbetrag",
    zahlungOffen: "Noch offen",
    zahlungTitel: "Bezahlung",
    zahlungText:
      "Bezahlt wird auf der gesicherten Seite unseres Zahlungsdienstleisters. Kartendaten " +
      "kommen nie bei uns an.",
    /** Zustände nach der Rückkehr von der Bezahlseite. */
    zahlungBezahlt: "Bezahlt",
    zahlungBezahltText:
      "Deine Zahlung ist eingegangen und dein Platz ist fest gebucht.",
    /** Gruppe hat keinen Platz mehr — die Zahlung wird gar nicht erst gestartet. */
    zahlungKeinePlaetze:
      "Es sind nur noch {frei} Plätze frei — für {personen} Personen reicht das nicht. " +
      "Deine Anmeldung ist deshalb nicht zustande gekommen. Schreib uns, wir suchen eine Lösung.",
    /** Kein Termin: Buchung und Zahlung sind gesperrt (Entscheidung 2.5). */
    zahlungKeinTermin:
      "Für diese Veranstaltung steht noch kein Termin fest. Sobald Datum und " +
      "Uhrzeit feststehen, ist die Buchung wieder möglich. Es wurde nichts " +
      "abgebucht.",

    zahlungAusgebucht:
      "Die Veranstaltung ist inzwischen ausgebucht. Deine Anmeldung ist deshalb nicht " +
      "zustande gekommen. Schreib uns, wir suchen eine Lösung.",
    zahlungAbgelaufen: "Zahlung nicht abgeschlossen",
    zahlungAbgelaufenText:
      "Die Zahlung wurde nicht rechtzeitig abgeschlossen. Du kannst sie jederzeit neu " +
      "starten — wir prüfen dann, ob noch genug Plätze frei sind.",
    zahlungLaeuft: "Zahlung wird geprüft",
    zahlungLaeuftText:
      "Die Bestätigung deiner Zahlung steht noch aus. Das dauert meist nur wenige Augenblicke — " +
      "lade die Seite gleich noch einmal.",
    zahlungNochOffen: "Zahlung noch offen",
    /* Hier stand "Wir halten deinen Platz {minuten} Minuten lang frei."
       Zwei Fehler in einem Satz: Er stellte das Halten des Platzes als
       zugesagte Leistung dar (VERA bietet keine Reservierung an), und
       {minuten} wurde nirgends ersetzt — der Platzhalter stand wörtlich
       auf der Seite. */
    zahlungNochOffenText:
      "Schließe die Zahlung jetzt ab — danach ist dein Platz verbindlich gebucht.",
    zahlungAbgebrochen:
      "Es wurde nichts gekauft und nichts abgebucht. Du kannst die Zahlung jederzeit " +
      "abschließen.",
    zahlungFehlerAnbieter:
      "Die Bezahlseite lässt sich gerade nicht öffnen. Deine Anmeldung ist gespeichert; " +
      "versuche es in ein paar Minuten noch einmal.",
    zahlungFehlerEingerichtet:
      "Die Online-Bezahlung ist noch nicht freigeschaltet. Deine Anmeldung ist gespeichert — " +
      "wir melden uns bei dir unter der angegebenen E-Mail-Adresse.",
    zahlungKnopf: "Bezahlen",
    zahlungWege: "Karte, Apple Pay, Google Pay oder PayPal",
    emailTitel: "Bestätigung per E-Mail",
    emailText:
      "Eine automatische Bestätigungsmail gibt es noch nicht. Bitte notiere dir bis dahin " +
      "deine Anmeldenummer.",
    nichtGefunden: "Diese Anmeldung konnten wir nicht finden.",
  },

  kontakt: {
    ueberschrift: "Kontakt",
    einleitung:
      "Fragen zum Event, zur Anmeldung oder für eine Schulklasse? Schreib uns einfach.",
    email: "E-Mail",
    telefon: "Telefon",
    ort: "Ort",
  },

  event: {
    wann: "Wann",
    wo: "Wo",
    preis: "Preis",
    dabei: "Das ist dabei",
    mitbringen: "Das bringst du mit",
    naechstesEvent: "Nächstes Event",
    fotoAlt: "Eine Spielerin mit Schläger auf dem Padel-Court",
  },

  /* ── Hinweise zu Aufnahmen (Seite /aufnahmen) ──────────────────
     Ersetzt die früher geplante Einwilligungsseite. Seit Entscheidung
     4.8 gibt es keine Foto-Einwilligung mehr: Es entstehen nur
     Übersichtsaufnahmen auf Grundlage von Art. 6 Abs. 1 Buchst. f
     DS-GVO, und wer nicht abgebildet werden möchte, widerspricht nach
     Art. 21 DS-GVO.

     Die Firmierung der Veranstaltungsstätte (B-11) steht NICHT mehr
     hier, sondern am jeweiligen Event (`Event.ortFirma`) und wird von
     der Seite aus der Datenbank geholt. Ein fest eingetippter
     Firmenname wäre beim zweiten Veranstaltungsort stillschweigend
     falsch geworden — und gerade die Empfängerangabe darf nicht
     falsch sein (Art. 13 Abs. 1 Buchst. e DS-GVO).

     ⚠️ Ein Platzhalter ist noch offen und bewusst als solcher
     formuliert: die Instagram-Kanäle (B-12). */
  aufnahmen: {
    titel: "Hinweise zu Foto-, Video- und Tonaufnahmen",
    fusszeile: "Aufnahmen",
    einleitung:
      "Bei VERA-Veranstaltungen entstehen Aufnahmen für die Öffentlichkeitsarbeit. " +
      "Hier steht, welche das sind, was damit geschieht und wie Sie widersprechen können.",
    abschnitte: [
      {
        id: "was",
        titel: "Was aufgenommen wird",
        absaetze: [
          "Wir machen ausschliesslich Übersichtsaufnahmen der Veranstaltung: " +
            "Weitwinkelbilder und kurze Videos vom Spielbetrieb und von der Atmosphäre. " +
            "Gezielte Porträts und Nahaufnahmen einzelner Personen machen wir nicht.",
          "Die Videos können allgemeinen Umgebungston enthalten — Spielgeräusche, Applaus, " +
            "Hallengeräusche. Einzelne Gespräche, Interviews oder private Äusserungen werden " +
            "nicht gezielt aufgenommen und nicht veröffentlicht. Ist ein persönliches Gespräch " +
            "deutlich verständlich, wird der Ton vor einer Veröffentlichung entfernt oder " +
            "bearbeitet.",
        ],
      },
      {
        id: "verwendung",
        titel: "Wofür wir sie verwenden",
        absaetze: [
          "Die Aufnahmen erscheinen auf der Website von VERA und auf dem offiziellen " +
            "Instagram-Kanal von VERA. Zusätzlich können sie an die jeweilige " +
            "Veranstaltungsstätte weitergegeben werden, die sie auf ihrer eigenen Website und " +
            "ihrem eigenen Instagram-Kanal verwenden darf.",
          "[PLATZHALTER: Hier stehen vor der Freischaltung die Kontonamen und Links der " +
            "beiden Instagram-Kanäle.]",
          "Eine Weitergabe an Presse, Sponsoren, Kooperationspartner oder sonstige Dritte " +
            "findet nicht statt. Auch für Flyer, Plakate, Facebook oder TikTok verwenden wir " +
            "die Aufnahmen nicht.",
        ],
      },
      {
        id: "grundlage",
        titel: "Auf welcher Grundlage",
        absaetze: [
          "Rechtsgrundlage ist unser berechtigtes Interesse nach Art. 6 Abs. 1 Buchst. f " +
            "DS-GVO: Wir möchten zeigen, wie unsere Veranstaltungen aussehen. Wir holen dafür " +
            "bewusst keine Einwilligung ein — eine Einwilligung, ohne die man nicht teilnehmen " +
            "könnte, wäre nicht freiwillig und damit unwirksam.",
          "Ihre Teilnahme hängt deshalb nicht davon ab, ob Sie mit Aufnahmen einverstanden " +
            "sind. Sie hängt nur davon ab, dass Sie diesen Hinweis gelesen haben.",
        ],
      },
      {
        id: "dauer",
        titel: "Wie lange",
        absaetze: [
          "Die Aufnahmen bleiben veröffentlicht, solange der genannte Zweck fortbesteht. " +
            "Einmal im Jahr prüfen wir dokumentiert, ob das noch der Fall ist.",
        ],
      },
    ],
    /* Die Empfänger der Aufnahmen, Art. 13 Abs. 1 Buchst. e DS-GVO.
       Die Namen selbst stehen NICHT hier, sondern am Event — die Seite
       holt sie aus der Datenbank. */
    staettenTitel: "Diese Veranstaltungsstätten erhalten Aufnahmen",
    staettenEinleitung:
      "Für die Veranstaltungen, die derzeit angekündigt sind, ist das im Einzelnen:",
    staettenLeer:
      "Derzeit ist keine Veranstaltung angekündigt. Die jeweilige Veranstaltungsstätte " +
      "wird auf der Seite der Veranstaltung mit vollständiger Firmierung genannt.",
    widerspruchTitel: "Ihr Widerspruchsrecht",
    widerspruchAbsaetze: [
      "Sie können der Anfertigung und Veröffentlichung von Aufnahmen, auf denen Sie " +
        "erkennbar sind, jederzeit widersprechen — nach Art. 21 DS-GVO.",
      "Ein Widerspruch ist formlos möglich: beim Ankommen, jederzeit während der " +
        "Veranstaltung oder später per E-Mail. Er muss nicht begründet werden und hat " +
        "keinerlei Nachteile für Ihre Teilnahme.",
      "Wir kennzeichnen widersprechende Personen nicht sichtbar. Stattdessen informieren wir " +
        "die fotografierende Person, und während angekündigter Aufnahmezeiten steht " +
        "gegebenenfalls ein aufnahmefreier Bereich zur Verfügung. Vor jeder Veröffentlichung " +
        "und vor jeder Weitergabe an die Veranstaltungsstätte prüfen wir, ob widersprechende " +
        "Personen erkennbar sind.",
    ],
  },

  recht: {
    impressum: "Impressum",
    datenschutz: "Datenschutz",
    impressumTitel: "Impressum",
    datenschutzTitel: "Daten­schutz­erklärung",
    platzhalterTitel: "Diese Seite ist noch nicht ausgefüllt",
    /* Beschriftungen des Impressums. Der frühere `impressumText`
       („Hier stehen später die vorgeschriebenen Angaben …") ist
       entfallen: Die Angaben stehen jetzt wirklich dort. */
    impressumAngaben: "Angaben gemäß § 5 DDG",
    impressumAnschrift: "Anschrift",
    impressumKontakt: "Kontakt",
    impressumUmsatzsteuer: "Umsatzsteuer",
    /* Wie bei den AGB: Seit die Seite einen verbindlichen Abschnitt
       enthält, gehört die Platzhalter-Markierung an den offenen Teil
       und nicht mehr über die ganze Seite. */
    datenschutzAllgemeinUeberschrift: "1. Allgemeine Erklärung",
    /* ­ ist eine WEICHE Trennstelle: unsichtbar, solange das Wort
       passt, und ein Bindestrich, sobald umgebrochen werden muss. Ohne
       sie bricht „Einverständniserklärungen" auf dem Handy mitten im
       Wort ohne Bindestrich um — dasselbe Mittel steht schon im Titel
       der Seite (`datenschutzTitel`). Wer den Wortlaut vergleicht,
       entfernt sie vorher mit ohneTrennstellen() aus lib/formate.ts. */
    datenschutzOffenMarke: "Dieser Abschnitt ist noch nicht ausgefüllt",
    datenschutzText:
      "Hier steht später, welche Daten bei einer Anmeldung erhoben werden, wozu sie verwendet " +
      "werden, wie lange sie gespeichert bleiben und welche Rechte Besucher haben.",
    /* Keine Rechtsformulierung, sondern eine Tatsache aus dem eigenen
       Code (lib/zahlung.ts). Sie steht hier, damit sie beim späteren
       Ausformulieren nicht vergessen wird — sie ist der einzige Punkt,
       an dem Daten das Haus verlassen. */
    /* Vollständig aufgezählt nach lib/zahlung.ts und
       lib/zahlungRegeln.ts — der Titel der Veranstaltung und die
       Personenzahl gehen als Beschriftung des Postens mit. */
    datenschutzZahlung:
      "Beim Bezahlen werden an den Zahlungsanbieter Stripe übermittelt: der Betrag, die " +
      "Anmeldenummer, die E-Mail-Adresse sowie der Titel der Veranstaltung und die Anzahl " +
      "der Personen. Bezahlt wird ausschließlich auf der gesicherten Seite von Stripe. " +
      "Kartennummern und Bankdaten erreichen diese Seite zu keinem Zeitpunkt — sie werden " +
      "hier weder entgegengenommen noch gespeichert. Welche Rechtsgrundlage gilt, wie lange " +
      "gespeichert wird und wie der Auftragsverarbeitungsvertrag mit Stripe einzuordnen ist, " +
      "gehört in die fertige Erklärung.",
    /* Die frühere Fassung sagte pauschal „diese Seite setzt keine
       Cookies". Das stimmt nicht: lib/adminAuth.ts setzt für die
       Anmeldung am Adminbereich das Cookie `vera_admin`. Besucher
       bekommen keines, und ein technisch notwendiges Sitzungscookie
       ist auch nicht einwilligungspflichtig — eine absolute Aussage,
       die nachweislich falsch ist, gehört auf eine Datenschutzseite
       trotzdem nicht. */
    keineCookies:
      "Diese Seite zählt keine Besucher, verfolgt niemanden über andere Seiten hinweg und " +
      "lädt keine Inhalte von fremden Servern nach — auch die Schriften liegen auf dieser " +
      "Domain. Es gibt keine Werbe- oder Statistik-Cookies und deshalb auch kein " +
      "Zustimmungsfenster. Das einzige Cookie entsteht, wenn sich der Betreiber am " +
      "Verwaltungsbereich anmeldet; es hält nur diese Anmeldung und ist technisch notwendig.",

    /* ── Einverständniserklärungen für Minderjährige ────────────────
       KEIN Platzhalter: Dieser Abschnitt beschreibt eine Verarbeitung,
       die tatsächlich stattfindet, und ist mit der
       Datenschutzinformation auf Seite 2 der Einverständniserklärung
       (public/dokumente/) wörtlich abgestimmt. Die beiden dürfen nur
       gemeinsam geändert werden — stünde auf dem Formular etwas
       anderes als hier, wäre eine der beiden Angaben falsch.

       Der Einleitungssatz grenzt den Abschnitt bewusst auf das
       Papierformular ein: Geburtsdatum, Mobilnummer und
       Gesundheitsangaben werden dort erhoben, NICHT im
       Online-Anmeldeformular (siehe lib/anmeldung.ts — dieses kennt
       nur Vorname, Nachname, E-Mail und Telefon). Ohne die Eingrenzung
       behauptete die Erklärung eine Erhebung, die es online nicht
       gibt. */
    datenschutzMinderjaehrigUeberschrift:
      "2. Einverständnis­erklärungen für minderjährige Teilnehmer",
    datenschutzMinderjaehrigEinleitung:
      "Dieser Abschnitt betrifft die Angaben auf der Einverständniserklärung, die für " +
      "minderjährige Teilnehmer abgegeben wird.",
    datenschutzMinderjaehrigAbsaetze: [
      "Bei der Anmeldung und Teilnahme minderjähriger Personen verarbeitet VERA Events " +
        "insbesondere den Namen und das Geburtsdatum des minderjährigen Teilnehmers, den " +
        "Namen und die Mobilnummer der erziehungsberechtigten Person, gegebenenfalls deren " +
        "E-Mail-Adresse, Angaben zur Veranstaltung sowie freiwillige Angaben zu Allergien, " +
        "Erkrankungen oder erforderlichen Notfallmedikamenten.",
      "Die Verarbeitung erfolgt zur Entgegennahme des Formulars am Empfang, zur Organisation " +
        "und Durchführung der Veranstaltung, zur Prüfung der Teilnahmeberechtigung, zur " +
        "Kontaktaufnahme während der Veranstaltung, zur Gewährleistung der Sicherheit, zur " +
        "Notfallhilfe und zur Dokumentation der erteilten Einverständniserklärung.",
      "Rechtsgrundlagen für die teilnahmebezogenen Daten sind Art. 6 Abs. 1 Buchst. b DSGVO " +
        "und, hinsichtlich Erreichbarkeit, Sicherheit und Dokumentation, Art. 6 Abs. 1 " +
        "Buchst. f DSGVO. In einem akuten Notfall kann die Verarbeitung außerdem auf Art. 6 " +
        "Abs. 1 Buchst. d DSGVO gestützt werden.",
      "Angaben zu Allergien, Erkrankungen oder erforderlichen Notfallmedikamenten sind " +
        "freiwillig. Soweit solche Gesundheitsdaten angegeben werden, erfolgt ihre " +
        "Verarbeitung aufgrund einer ausdrücklichen Einwilligung gemäß Art. 9 Abs. 2 " +
        "Buchst. a in Verbindung mit Art. 6 Abs. 1 Buchst. a DSGVO. In einem akuten Notfall " +
        "kann Art. 9 Abs. 2 Buchst. c DSGVO Anwendung finden. Die Einwilligung kann jederzeit " +
        "mit Wirkung für die Zukunft widerrufen werden.",
      "Mitarbeiter der jeweiligen Veranstaltungslocation dürfen die Formulare am Empfang " +
        "ausschließlich für VERA Events entgegennehmen, kurzfristig sicher verwahren und " +
        "vollständig an VERA Events weitergeben. Die Veranstaltungslocation behält keine " +
        "Kopie und verwendet die Angaben nicht für eigene Zwecke.",
      "Zugriff erhalten im Übrigen nur Personen, die die Daten für die " +
        "Veranstaltungsdurchführung benötigen. Im Notfall können erforderliche Angaben an " +
        "Rettungsdienst oder medizinisches Personal weitergegeben werden. Eine sonstige " +
        "Weitergabe erfolgt nur, wenn hierfür eine gesetzliche Verpflichtung besteht.",
      /* Hier stand „spätestens 30 Tage". Das Löschkonzept setzt SIEBEN
         Tage um (lib/loeschfristen.ts → GESUNDHEIT_TAGE). Sieben Tage
         sind kein Widerspruch zu einer Obergrenze von dreißig — sie
         liegen darunter, und weniger ist bei Gesundheitsdaten die
         richtige Richtung. Eine Erklärung, die eine längere Frist
         nennt als die, die tatsächlich gilt, ist aber ungenau, und
         Ungenauigkeit gehört hier nicht hin.

         ACHTUNG BEIM NÄCHSTEN ÄNDERN: Das unterschriebene Formular
         (public/dokumente/einverstaendniserklaerung-minderjaehrige.pdf)
         nennt weiterhin dreißig Tage. Beides ist zugleich zutreffend,
         weil sieben innerhalb von dreißig liegen — beim nächsten
         Neusatz des Formulars gehört die Zahl trotzdem angeglichen. */
      "Freiwillige Gesundheitsangaben werden spätestens sieben Tage nach Veranstaltungsende " +
        "gelöscht oder vernichtet, sofern kein Vorfall dokumentiert ist, der eine längere " +
        "Aufbewahrung erforderlich macht. Die übrigen Angaben werden gelöscht, " +
        "sobald sie für die genannten Zwecke nicht mehr erforderlich sind. Eine längere " +
        "Speicherung erfolgt nur, soweit sie zur Geltendmachung, Ausübung oder Verteidigung " +
        "von Rechtsansprüchen erforderlich ist oder gesetzliche Aufbewahrungspflichten " +
        "bestehen.",
      "Die erforderlichen Pflichtangaben werden für die Teilnahme Minderjähriger benötigt. " +
        "Die E-Mail-Adresse und Gesundheitsangaben sind freiwillig. Ohne erforderliche " +
        "Pflichtangaben kann die Teilnahme abgelehnt werden. Im Übrigen gelten die in der " +
        "Datenschutzerklärung aufgeführten Rechte der betroffenen Personen.",
    ],

    /* ── Speicherdauer und Löschung ────────────────────────────────
       KEIN Platzhalter. Dieser Abschnitt beschreibt, was der Code
       wirklich tut: die Fristen aus lib/loeschfristen.ts, den
       nächtlichen Lauf aus lib/loeschlauf.ts und die Löschsperren aus
       der Tabelle Loeschsperre. Ändert sich dort eine Zahl, gehört sie
       hier mitgeändert — sonst behauptet die Erklärung etwas, das
       nachweisbar nicht stimmt.

       Bewusst OHNE juristische Würdigung der einzelnen Fristen: Was
       hier steht, ist die Beschreibung der tatsächlichen Verarbeitung.
       Ob jede Frist rechtlich die richtige ist, gehört fachkundig
       geprüft — das steht so auch in docs/rechtliches.md. */
    datenschutzLoeschungUeberschrift: "3. Speicherdauer und Löschung",
    datenschutzLoeschungEinleitung:
      "Daten werden nicht länger gespeichert, als es der jeweilige Zweck und die gesetzlichen " +
      "Aufbewahrungspflichten erfordern. Welche Frist gilt, hängt von der Art der Angaben ab; " +
      "die Löschung läuft automatisch.",
    datenschutzLoeschungAbsaetze: [
      "Gesundheits- und Notfallangaben auf der Einverständniserklärung werden spätestens " +
        "sieben Tage nach Ende der Veranstaltung vernichtet.",
      "Vollständige Einverständniserklärungen für minderjährige Teilnehmer werden drei Jahre " +
        "ab dem Ende des Kalenderjahres der Veranstaltung aufbewahrt und danach vernichtet. " +
        "Anschließend kann ein reduzierter Nachweis darüber aufbewahrt werden, dass eine " +
        "Zustimmung vorlag; er enthält kein Geburtsdatum, keine Mobilnummer und keine " +
        "Gesundheitsangaben.",
      "Anmeldedaten sowie Anwesenheitsangaben zu An- und Abmeldung werden drei Jahre ab dem " +
        "Ende des Kalenderjahres der Veranstaltung aufbewahrt. Danach werden Name, " +
        "E-Mail-Adresse und Telefonnummer überschrieben; die Buchung selbst bleibt ohne " +
        "Personenbezug bestehen, weil Betrag und Datum zu den steuerlichen Unterlagen gehören.",
      "Veranstaltungs- und Sicherheitschecklisten werden drei Jahre ab dem Ende des " +
        "Kalenderjahres aufbewahrt. Danach werden alle personenbezogenen und mittelbar " +
        "zuordenbaren Angaben — insbesondere Mitarbeiterkürzel und Freitextnotizen — " +
        "unwiderruflich entfernt. Nur die dann tatsächlich anonyme Sicherheitsdokumentation " +
        "bleibt erhalten.",
      "Unterlagen zu einem Vorfall, einer Beschwerde oder einem Versicherungsfall werden " +
        "nicht automatisch gelöscht, solange der Vorgang offen ist. Nach seinem Abschluss " +
        "werden sie zehn Jahre aufbewahrt; bei schweren Personen- oder Gesundheitsschäden " +
        "höchstens dreißig Jahre.",
      "Rechnungen, Buchungsbelege und sonstige steuerrelevante Unterlagen unterliegen den " +
        "gesetzlichen Aufbewahrungsfristen nach § 147 der Abgabenordnung. Sie werden von der " +
        "automatischen Löschung ausdrücklich nicht erfasst und bleiben unabhängig davon " +
        "erhalten, ob die übrigen Angaben zu derselben Anmeldung bereits gelöscht wurden.",
      "Einzelne Datensätze können von der automatischen Löschung ausgenommen werden, wenn " +
        "ein Unfall, eine Beschwerde, eine Rückbuchung, ein Versicherungsfall oder ein " +
        "dokumentierter Rechtsstreit dies erfordert. Eine solche Sperre wird mit Grund, " +
        "Datum und verantwortlicher Person festgehalten und wieder aufgehoben, sobald der " +
        "Grund entfallen ist.",
      "Zur Ausfallsicherheit werden verschlüsselte Sicherungen der Datenbank erstellt. Sie " +
        "werden nach spätestens 180 Tagen automatisch gelöscht. Muss eine Sicherung " +
        "eingespielt werden, wird die Löschung unmittelbar danach erneut ausgeführt, damit " +
        "bereits gelöschte Daten nicht dauerhaft wieder in Gebrauch kommen.",
      "Über jeden Löschlauf wird ein Protokoll geführt. Es enthält bewusst keine Namen, " +
        "E-Mail-Adressen oder Telefonnummern, sondern nur die Kennung des betroffenen " +
        "Datensatzes, die Datenart und die durchgeführte Maßnahme.",
    ],

    /* ── AGB und Widerruf ──────────────────────────────────────────
       Beide werden Pflicht, sobald online bezahlt wird. Sie stehen
       hier bewusst NUR als sichtbar markierte Platzhalter: Was
       rechtlich gilt, schreibt eine fachkundige Person, nicht ich.
       Ein Platzhalter, den man für echten Inhalt halten kann, geht
       irgendwann versehentlich online. */
    agb: "AGB",
    agbTitel: "Allgemeine Geschäftsbedingungen",
    /* Die frühere Fassung las sich, als seien AGB Pflicht. Sind sie
       nicht — ohne eigene AGB gilt schlicht das Gesetz. Pflicht sind
       dagegen bestimmte Informationen VOR Vertragsschluss im
       Fernabsatz. Welche das hier sind, entscheidet keine
       Programmiererin. */
    /* Die Überschrift kam mit dem Abschnitt „Teilnahme Minderjähriger"
       dazu: Sobald eine Seite einen verbindlichen und einen offenen
       Teil hat, muss erkennbar sein, welcher welcher ist. */
    /* Weiche Trennstelle wie bei der Datenschutzseite — siehe dort. */
    agbAllgemeinUeberschrift: "1. Allgemeine Vertrags­bedingungen",
    agbOffenMarke: "Dieser Abschnitt ist noch nicht ausgefüllt",
    /* Endete früher auf „… und die Besonderheiten bei Minderjährigen".
       Das steht seit Abschnitt 2 wirklich dort — der Satz hätte es
       weiterhin als offen ausgewiesen und der eigenen Seite
       widersprochen. */
    agbText:
      "Eigene Geschäftsbedingungen sind nicht für jede Webseite vorgeschrieben. Ohne sie " +
      "gilt das Gesetz. Wenn VERA eigene verwenden soll, gehören sie zum tatsächlichen " +
      "Ablauf: wer Vertragspartner ist, wann eine Anmeldung verbindlich wird, welche " +
      "Leistung eine Veranstaltung umfasst, wie und wann bezahlt wird, was bei Verhinderung " +
      "gilt, was bei Ausfall oder Verlegung passiert, die Haftung und die Regeln vor Ort. " +
      "Die Teilnahme Minderjähriger ist bereits in Abschnitt 2 geregelt.",
    agbHinweisPflichtinfos:
      "Unabhängig davon gibt es beim Verkauf über das Internet Angaben, die vor dem " +
      "Absenden der Bestellung erscheinen müssen. Welche das für dieses Eventmodell sind " +
      "und wo sie stehen müssen, gehört fachkundig geprüft.",
    agbStorno:
      "In denselben Text gehören die Stornobedingungen: ob und bis wann eine Buchung " +
      "abgesagt werden kann, welche Gebühr dann anfällt und wie Erstattungen ablaufen. Das " +
      "ist eine vertragliche Regelung und etwas anderes als das gesetzliche Widerrufsrecht " +
      "(siehe „Widerruf und Stornierung“). Sie bekommen bewusst keine eigene Seite — sie " +
      "gehören dorthin, wo auch der Rest des Vertrags steht.",

    /* ── Teilnahme Minderjähriger ───────────────────────────────────
       KEIN Platzhalter: Das sind vom Betreiber festgelegte Bedingungen.
       Sie beschreiben denselben Ablauf wie die Einverständniserklärung
       (public/dokumente/) und der Hinweis im Anmeldebereich — die drei
       Stellen sind wörtlich aufeinander abgestimmt und dürfen nur
       gemeinsam geändert werden.

       Der letzte Absatz ist die EINZIGE Haftungsregelung im Projekt.
       Er schliesst nichts aus, sondern verweist auf das Gesetz und
       stellt klar, dass für Leben, Körper, Gesundheit sowie Vorsatz und
       grobe Fahrlässigkeit nichts beschränkt wird. Ein pauschaler
       Haftungsausschluss stand hier nie und gehört auch nicht her. */
    agbMinderjaehrigUeberschrift: "2. Teilnahme Minderjähriger",
    agbMinderjaehrigAbsaetze: [
      "Minderjährige dürfen an einer Veranstaltung nur mit Zustimmung einer " +
        "erziehungsberechtigten Person teilnehmen. Die anmeldende beziehungsweise " +
        "unterschreibende Person bestätigt, erziehungsberechtigt und zur Abgabe der " +
        "erforderlichen Erklärungen berechtigt zu sein. Soweit die Zustimmung einer weiteren " +
        "sorgeberechtigten Person erforderlich ist, muss diese ebenfalls vorliegen.",
      "Die von VERA Events bereitgestellte Einverständniserklärung muss vollständig " +
        "ausgefüllt, unterschrieben und spätestens beim Check-in abgegeben werden. Liegt die " +
        "erforderliche Erklärung bei Veranstaltungsbeginn nicht vor, kann die Teilnahme des " +
        "Minderjährigen abgelehnt werden. Gesetzliche und vertragliche Erstattungsansprüche " +
        "bleiben unberührt.",
      "Für die Organisation des Hin- und Rückwegs ist die erziehungsberechtigte Person " +
        "verantwortlich. Die Betreuung durch VERA Events beginnt mit dem vereinbarten " +
        "Check-in und endet mit dem offiziellen Veranstaltungsende, soweit nicht " +
        "ausdrücklich etwas anderes vereinbart wurde.",
      "Minderjährige Teilnehmer müssen die Sicherheits-, Verhaltens- und Hausregeln sowie " +
        "die Anweisungen des Veranstaltungs-, Betreuungs- und Hallenpersonals beachten. Bei " +
        "erheblichen oder wiederholten Regelverstößen kann der Teilnehmer von der weiteren " +
        "Teilnahme ausgeschlossen werden. Die erziehungsberechtigte Person muss während der " +
        "Veranstaltung unter der angegebenen Mobilnummer erreichbar sein und den " +
        "Minderjährigen erforderlichenfalls zeitnah abholen.",
      "Bei einem Unfall oder akuten gesundheitlichen Problem dürfen angemessene " +
        "Erste-Hilfe-Maßnahmen eingeleitet und bei Bedarf Rettungsdienst oder ärztliche " +
        "Hilfe verständigt werden. Die erziehungsberechtigte Person beziehungsweise der " +
        "angegebene Notfallkontakt wird schnellstmöglich informiert.",
      "Für die Haftung von VERA Events gelten die gesetzlichen Vorschriften. Insbesondere " +
        "wird die Haftung für Schäden aus der Verletzung des Lebens, des Körpers oder der " +
        "Gesundheit sowie für vorsätzlich oder grob fahrlässig verursachte Schäden nicht " +
        "ausgeschlossen oder beschränkt.",
    ],

    /* Hiess einmal „Widerruf" / „Widerrufsbelehrung". Beides setzt
       voraus, dass es ein Widerrufsrecht überhaupt gibt — und genau
       das steht bei Freizeitveranstaltungen mit festem Termin nicht
       fest. Ein Seitentitel darf die Frage nicht vorwegnehmen, die
       die Seite stellt. */
    widerruf: "Widerruf & Stornierung",
    widerrufTitel: "Widerruf und Stornierung",
    widerrufEinleitung:
      "Zwei Dinge, die oft verwechselt werden — sie haben nichts miteinander zu tun und " +
      "werden hier deshalb getrennt behandelt.",
    widerrufUeberschrift: "1. Das gesetzliche Widerrufsrecht",
    widerrufText:
      "Ob für diese Veranstaltungen ein gesetzliches Widerrufsrecht besteht, ist noch nicht " +
      "geklärt. Deshalb steht hier bewusst KEINE Widerrufsbelehrung: Eine Belehrung über " +
      "ein Recht, das es womöglich gar nicht gibt, wäre irreführend — eine fehlende " +
      "Belehrung über ein Recht, das besteht, wäre ein Fehler mit Folgen.",
    widerrufHinweis:
      "Der Grund für die offene Frage: Bei Verträgen über Dienstleistungen im Zusammenhang " +
      "mit Freizeitbetätigungen, für die ein bestimmter Termin vorgesehen ist, kann das " +
      "Widerrufsrecht nach § 312g Absatz 2 Nummer 9 BGB ausgeschlossen sein. Ein Padel-" +
      "Nachmittag an einem festen Datum fällt möglicherweise darunter. Ob das hier zutrifft " +
      "und wie die Information dann lauten muss, ist eine Rechtsfrage und keine " +
      "Programmierfrage.",
    /* Ab hier KEIN Platzhalter mehr: Das sind die vom Betreiber
       festgelegten Bedingungen, und sie beschreiben genau das, was die
       Seite tatsächlich tut. Ändert sich der Ablauf, ändert sich
       dieser Text mit — sonst steht hier eine Zusage, die die Technik
       nicht einlöst. */
    stornoUeberschrift: "2. Stornierung durch Teilnehmende",
    stornoAbsaetze: [
      "Eine Buchung kann bis 24 Stunden vor Beginn der Veranstaltung kostenlos storniert " +
        "werden. Erstattet wird der volle Betrag, ohne Abzug.",
      "Die Stornierung läuft über den Link in der Bestätigungsmail. Er führt zu einer Seite, " +
        "die die Buchung anzeigt; storniert wird erst mit einem Klick auf den Knopf dort. Der " +
        "volle Betrag wird dann sofort zur Rückerstattung angewiesen — auf dem Weg, über den " +
        "bezahlt wurde. Je nach Bank dauert es einige Werktage, bis er ankommt. Eine " +
        "Bestätigung kommt per E-Mail. Der Platz ist sofort wieder frei.",
      "Ist die Bestätigungsmail nicht mehr auffindbar, genügt eine Nachricht an " +
        "kontakt@veraevents.de.",
      "Bei einer Absage weniger als 24 Stunden vor Beginn und bei Nichterscheinen besteht " +
        "grundsätzlich kein Anspruch auf Erstattung. Die Stornierung über den Link ist dann " +
        "nicht mehr möglich. Wer verhindert ist, schreibt uns trotzdem — wir finden eine Lösung.",
      "Solange für eine Veranstaltung noch kein Termin feststeht, ist eine Stornierung " +
        "jederzeit möglich.",
      "Ein gebuchter Platz kann nicht auf eine andere Person übertragen werden. Das ist auch " +
        "nicht nötig: Wer nicht kann, storniert kostenlos, und die andere Person meldet sich " +
        "selbst an, solange Plätze frei sind.",
      "Diese Bedingungen legt VERA selbst fest. Sollte darüber hinaus ein gesetzliches " +
        "Widerrufsrecht bestehen (siehe Abschnitt 1), gilt es unabhängig davon.",
    ],

    absageUeberschrift: "3. Absage durch VERA",
    absageText:
      "Muss eine Veranstaltung ausfallen, wird allen Angemeldeten automatisch der volle " +
      "Betrag erstattet — ohne dass dafür etwas beantragt werden muss. Die Absage wird so " +
      "früh wie möglich per E-Mail mitgeteilt.",

    /* Die Markierung gilt jetzt nur noch für Abschnitt 1. Sie über die
       ganze Seite zu setzen wäre falsch geworden: Abschnitt 2 und 3
       sind verbindliche Bedingungen, keine Platzhalter. */
    widerrufOffenMarke: "Dieser Abschnitt ist noch nicht ausgefüllt",
    widerrufPruefung:
      "Abschnitt 1 sollte vor der Veröffentlichung von einer fachkundigen Person geprüft " +
      "werden. Die Stornobedingungen in Abschnitt 2 und 3 legt VERA selbst fest; sie gelten " +
      "so, wie sie hier stehen.",
  },

  /**
   * Der Gründerbereich. Nur die festen Beschriftungen stehen hier —
   * Name, Bezeichnung, Text und Foto pflegt der Betreiber selbst im
   * Adminbereich unter „Gründerbereich“ (Tabelle Einstellungen).
   */
  gruender: {
    ueberschrift: "Wer hinter VERA steht",
    augenbraue: "Über den Gründer",
    platzhalterText:
      "Hier stellt sich {name} in zwei bis drei Sätzen vor: warum es VERA gibt und " +
      "was ihn an diesen Veranstaltungen reizt. Dieser Text lässt sich im Adminbereich " +
      "unter „Gründerbereich“ ändern.",
    /** Bildbeschreibung für Screenreader, {name} und {rolle} werden ersetzt. */
    fotoAlt: "{name}, {rolle}",
  },

  /* ── Die echten Anbieterdaten ─────────────────────────────────
     Die EINZIGE Stelle im Projekt, an der Name und Kontaktwege des
     Anbieters stehen. Impressum, Fussbereich und Kontaktseite lesen
     von hier. Vorher lag die Adresse verstreut und war im Fussbereich
     nicht einmal als Platzhalter markiert — sie sah dort aus wie eine
     echte Adresse, obwohl sie erfunden war.

     `null` heisst: liegt noch nicht vor und wird sichtbar als
     Platzhalter angezeigt. NIEMALS einen erfundenen Wert eintragen —
     ein Impressum mit einer falschen Angabe ist schlechter als eines
     mit einer erkennbaren Luecke. */
  anbieter: {
    markeHinweis: "VERA ist ein Angebot von",
    name: "Adam Maurice Lasarzik",

    /* Ladungsfaehige Geschaeftsanschrift, zeilenweise — genau so,
       wie sie im Impressum untereinander stehen soll.

       Der Typ bleibt nullbar, obwohl jetzt ein Wert dasteht: `null`
       heisst weiterhin „liegt nicht vor" und erscheint als sichtbarer
       Platzhalter. Diese Rueckfallebene bleibt bewusst erhalten —
       sie ist es, die eine fehlende Pflichtangabe unmoeglich still
       verschwinden laesst. */
    anschrift: ["Mühlenstr. 8a", "14167 Berlin"] as string[] | null,
    anschriftFolgt: "Geschäftsanschrift folgt",

    /* In der lesbaren Schreibweise, in der sie auch angezeigt wird.
       Die waehlbare Fassung fuer den tel:-Link entsteht daraus in
       lib/formate.ts — ein Telefon kann mit Leerzeichen nichts
       anfangen, ein Mensch liest sie damit aber besser. */
    telefon: "+49 3323 0219825" as string | null,
    telefonFolgt: "Telefonnummer folgt",

    email: "kontakt@veraevents.de",

    /* Es steht bewusst KEINE Umsatzsteuer-Identifikationsnummer hier,
       solange nicht geprueft ist, ob ueberhaupt eine vorliegt. Die
       Steuernummer vom Finanzamt gehoert NICHT ins Impressum — die
       steht nur auf Rechnungen. Beides zu verwechseln ist ein
       haeufiger Fehler. */
    umsatzsteuer:
      "Als Kleinunternehmen nach § 19 UStG wird keine Umsatzsteuer berechnet und daher " +
      "auch keine ausgewiesen.",
  },

  platzhalter: {
    markierung: "Platzhalter",
    datum: "Datum wird noch bekannt gegeben",
    datumKurz: "Termin folgt",
    zeit: "Uhrzeit folgt",
    adresse: "Genaue Adresse folgt",
  },

  footer: {
    claim: "Sport- und Netzwerkevents.",
    seiten: "Seiten",
    rechtliches: "Rechtliches",
    kontaktUeberschrift: "Kontakt",
    rechte: "© {jahr} VERA. Alle Rechte vorbehalten.",
  },
};

/**
 * Der Typ ergibt sich aus dem Wörterbuch selbst. Wird oben ein Eintrag
 * umbenannt oder entfernt, meldet TypeScript sofort jede Stelle, die
 * ihn noch benutzt.
 */
export type Woerterbuch = typeof de;
