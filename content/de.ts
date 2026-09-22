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
    unternehmen: "Für Unternehmen",
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

  /* Neu am 22.09.2026, Nutzer-Entscheidung: Firmenveranstaltungen laufen
     ausschließlich über eine Anfrage, es gibt keine Online-Buchung.
     Preis, Termin, Ort und Leistungsumfang werden im individuellen
     Angebot festgelegt — genau wie AGB Ziffer 1.3 es bereits vorsieht.

     Die hier genannte Abschlags-, Zusatzleistungs- und Ausfallstaffel
     ist die vom Nutzer bestätigte Zahlungsmechanik aus dem B2B-Entwurf
     (docs/rechtstexte-entwuerfe/04-b2b-eventbedingungen-entwurf.md,
     Ziffern 9.3a, 10.3a, 11.2). Dieser Entwurf trägt selbst den
     Vermerk "nicht anwaltlich geprüft, nicht rechtssicher" — deshalb
     wird die Staffel hier als informative Beschreibung dargestellt,
     nicht als bereits geprüfte AGB-Klausel. Die verbindliche Fassung
     steht im jeweiligen Angebot und wird vor dem ersten echten
     Firmenauftrag vom Rechtstext-Prüfer kontrolliert. */
  unternehmen: {
    ueberschrift: "Für Unternehmen",
    kurz:
      "Sie planen ein Firmenevent oder Teamevent? Schreiben Sie uns eine Anfrage — Termin, " +
      "Ort, Teilnehmerzahl und Leistungsumfang stimmen wir individuell in einem Angebot ab.",
    titel: "Firmenveranstaltungen bei VERA",
    absaetze: [
      "Für Unternehmen gibt es keine direkte Online-Buchung über den Ticketshop. Am Anfang " +
        "steht eine formlose Anfrage per E-Mail: Anlass, ungefährer Zeitraum, gewünschter " +
        "Ort und die ungefähre Teilnehmerzahl genügen.",
      "Auf dieser Grundlage erstellt VERA ein individuelles Angebot. Erst darin werden " +
        "Preis, verbindlicher Termin, Ort und der genaue Leistungsumfang festgelegt — ein " +
        "Vertrag kommt erst mit der beiderseitigen Bestätigung dieses Angebots zustande. " +
        "Die allgemeinen Teilnahmebedingungen für Einzeltickets gelten für Firmenaufträge " +
        "ausdrücklich nicht; es gelten die im Angebot mitgeteilten, gesondert vereinbarten " +
        "Bedingungen.",
      "Zur Orientierung, wie Anzahlung, Zusatzleistungen und eine Absage seitens des " +
        "Unternehmens abgerechnet werden — die endgültige Formulierung steht im jeweiligen " +
        "Angebot:",
    ],
    punkte: [
      "Ab einem Auftragswert von 1.000 € wird eine Anzahlung von 50 % fällig",
      "Zusätzliche, nicht im Angebot enthaltene Leistungen: 60 € je Stunde, je angefangene halbe Stunde",
      "Absage 28 Tage oder mehr vor dem Termin: keine Ausfallgebühr, gebundene Fremdkosten werden erstattet",
      "Absage 14 bis 27 Tage vorher: 25 % des Auftragswerts",
      "Absage 4 bis 13 Tage vorher: 50 % des Auftragswerts",
      "Absage bis 3 Tage vorher oder Nichterscheinen: 80 % des Auftragswerts",
    ],
    hinweis:
      "Keine Umsatzsteuer, § 19 UStG. Diese Übersicht ersetzt kein individuelles Angebot " +
      "und keine geprüften Vertragsbedingungen — beides folgt nach Ihrer Anfrage.",
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

     B-12 (Instagram-Kanäle) ist seit 21.09.2026 geklärt: VERA hat
     aktuell KEINEN eigenen Instagram-Kanal. Instagram wird deshalb
     hier nicht als aktiver Veröffentlichungsweg VERAs genannt, bis ein
     offizielles Konto eingerichtet ist — vorher zu schreiben, es gäbe
     einen, wäre schlicht falsch.

     B-14 (21.09.2026, Entscheidung 4.4a): Der Kanal-Umfang der
     Veranstaltungsstätte wurde bewusst breiter gefasst als VERAs
     eigener — sie darf ihre Website UND ihre offiziellen
     Social-Media-Kanäle nutzen (z.B. Instagram oder TikTok), weil sie
     dafür als eigenständige Verantwortliche auftritt (Phasenmodell,
     Entscheidung 4.3 / EuGH Fashion ID).

     Dokument 16, Frage 5 ist seit 21.09.2026 beantwortet: Die
     Veranstaltungsstätte fertigt AUCH eigene Aufnahmen an, unabhängig
     von VERA — nicht nur Weitergabe von VERAs Material. Das ändert
     die Einordnung in Dokument 06, Teil VIII.5 grundlegend (dort
     „VERA allein verantwortlich für die Anfertigung" ausdrücklich nur
     unter Vorbehalt). VERAs Prüfung vor Veröffentlichung (Entscheidung
     4.8) greift für die eigenen Aufnahmen der Veranstaltungsstätte
     NICHT — ein Widerspruch dagegen lässt sich nur über die
     Veranstaltungsstätte selbst durchsetzen, deshalb der eigene Hinweis
     unten im Abschnitt „Ihr Widerspruchsrecht". Die schriftliche
     Vereinbarung nach B-18 (eigener Vor-Ort-Hinweis und eigenes
     Widerspruchsverfahren der Veranstaltungsstätte) ist dadurch
     zwingend geworden und bleibt offen — siehe Dokument 15, B-18. */
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
          "Während der Veranstaltung können sowohl VERA Events als auch die jeweilige " +
            "Veranstaltungsstätte Übersichtsaufnahmen des Spiel- und Veranstaltungsgeschehens " +
            "anfertigen: Weitwinkelbilder und kurze Videos vom Spielbetrieb und von der " +
            "Atmosphäre. Gezielte Porträts und Nahaufnahmen einzelner Personen erfolgen nur " +
            "mit gesonderter Zustimmung.",
          "Für VERAs eigene Aufnahmen gilt zusätzlich: Die Videos können allgemeinen " +
            "Umgebungston enthalten — Spielgeräusche, Applaus, Hallengeräusche. Einzelne " +
            "Gespräche, Interviews oder private Äusserungen werden nicht gezielt aufgenommen " +
            "und nicht veröffentlicht. Ist ein persönliches Gespräch deutlich verständlich, " +
            "wird der Ton vor einer Veröffentlichung entfernt oder bearbeitet.",
          "Für ihre eigenen Aufnahmen ist die Veranstaltungsstätte selbst verantwortlich, " +
            "einschliesslich der Frage, welche Praxis sie dabei anwendet.",
        ],
      },
      {
        id: "verwendung",
        titel: "Wofür wir sie verwenden",
        absaetze: [
          "VERA verwendet die eigenen Aufnahmen auf der Website von VERA. Einen eigenen " +
            "Instagram-Kanal hat VERA derzeit nicht; sobald einer eingerichtet ist, wird " +
            "diese Seite ergänzt und der Kanal hier verlinkt. Zusätzlich können von VERA " +
            "erstellte Aufnahmen an die jeweilige Veranstaltungsstätte weitergegeben werden, " +
            "die sie dann für ihre eigene Öffentlichkeitsarbeit nutzen darf.",
          "Die Veranstaltungsstätte kann ihre eigenen Aufnahmen auf ihrer eigenen Website " +
            "und ihren offiziellen Social-Media-Kanälen veröffentlichen, zum Beispiel " +
            "Instagram oder TikTok.",
          "Für ihre jeweils selbst erstellten und veröffentlichten Aufnahmen sind VERA " +
            "Events und die Veranstaltungsstätte eigenständig verantwortlich — Einzelheiten " +
            "dazu stehen in der Datenschutzerklärung.",
          "Eine Weitergabe an Presse, Sponsoren, Kooperationspartner oder sonstige Dritte " +
            "außerhalb der Veranstaltungsstätte findet nicht statt. Auch für Flyer, Plakate " +
            "oder eigene Social-Media-Kanäle wie Facebook oder TikTok verwendet VERA die " +
            "eigenen Aufnahmen nicht.",
        ],
      },
      {
        id: "grundlage",
        titel: "Auf welcher Grundlage",
        absaetze: [
          "Rechtsgrundlage für VERAs eigene Aufnahmen ist unser berechtigtes Interesse " +
            "nach Art. 6 Abs. 1 Buchst. f DS-GVO: Wir möchten zeigen, wie unsere " +
            "Veranstaltungen aussehen. Wir holen dafür bewusst keine Einwilligung ein — eine " +
            "Einwilligung, ohne die man nicht teilnehmen könnte, wäre nicht freiwillig und " +
            "damit unwirksam.",
          "Für die eigenen Aufnahmen der Veranstaltungsstätte gilt deren eigene " +
            "Rechtsgrundlage und Verantwortlichkeit — nähere Angaben dazu finden Sie " +
            "gegebenenfalls in ihren eigenen Datenschutzhinweisen.",
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
      "Dieses Verfahren deckt VERAs eigene Aufnahmen sowie deren Weitergabe an die " +
        "Veranstaltungsstätte ab. Für die eigenen Aufnahmen der Veranstaltungsstätte gilt " +
        "Ihr Widerspruchsrecht ebenso — wir haben darauf aber keinen unmittelbaren Zugriff. " +
        "Bitte teilen Sie einen Widerspruch deshalb nach Möglichkeit zusätzlich direkt dem " +
        "Personal der Veranstaltungsstätte vor Ort mit.",
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
    /* ── Allgemeine Erklärung ───────────────────────────────────────
       Seit 21.09.2026 KEIN Platzhalter mehr. Der frühere Platzhaltertext
       ("Hier steht später...") plus die daneben stehende Platzhalter-
       Markierung widersprachen sich mit den bereits verbindlichen
       Nachbarabschnitten (Zahlung, Cookies) auf derselben Seite — genau
       die Mischung, die im Projekt als Fehler gilt. Ersetzt durch die
       tatsächliche Verantwortlicher- und Online-Anmeldungs-Angabe,
       Grundlage: docs/rechtstexte-entwuerfe/02-datenschutzerklaerung-
       entwurf.md (Ziffer 1 und 4) und lib/anmeldung.ts (die einzigen
       Felder, die das Online-Formular tatsächlich abfragt: Vorname,
       Nachname, E-Mail, Telefon optional; bei Minderjährigen zusätzlich
       die Angaben aus Abschnitt 2). */
    datenschutzAllgemeinUeberschrift: "1. Allgemeine Erklärung",
    datenschutzVerantwortlicher:
      "Verantwortlicher für die Datenverarbeitung auf dieser Website ist VERA Events, " +
      "Inhaber Adam Lasarzik. Die vollständige Anschrift steht im Impressum " +
      "(veraevents.de/impressum), Kontakt: kontakt@veraevents.de.",
    datenschutzText:
      "Bei einer Online-Anmeldung erheben wir Vorname, Nachname, E-Mail-Adresse und, wenn " +
      "angegeben, Telefonnummer der anmeldenden Person sowie Vorname und Nachname jeder " +
      "teilnehmenden Person. Meldet eine erziehungsberechtigte Person ein minderjähriges " +
      "Kind an, gelten zusätzlich die Angaben aus Abschnitt 2. Die Verarbeitung dient dem " +
      "Zustandekommen und der Durchführung der Anmeldung, der Platzverwaltung und, soweit " +
      "bezahlt wird, der Zuordnung der Zahlung; Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. b " +
      "DSGVO (Erfüllung des Vertrags). Beim Aufruf der Website verarbeitet der Hosting-" +
      "Anbieter zudem die für den technischen Betrieb erforderlichen Server-Protokolldaten " +
      "(unter anderem IP-Adresse, Zeitpunkt, aufgerufene Seite); Rechtsgrundlage ist Art. 6 " +
      "Abs. 1 Buchst. f DSGVO (sicherer Betrieb der Website).",
    /* Keine Rechtsformulierung, sondern eine Tatsache aus dem eigenen
       Code (lib/zahlung.ts). Sie steht hier, damit sie beim späteren
       Ausformulieren nicht vergessen wird — sie ist der einzige Punkt,
       an dem Daten das Haus verlassen. */
    /* Vollständig aufgezählt nach lib/zahlung.ts und
       lib/zahlungRegeln.ts — der Titel der Veranstaltung und die
       Personenzahl gehen als Beschriftung des Postens mit. */
    datenschutzZahlung:
      "Bezahlt werden kann mit Kredit- oder Debitkarte (auf unterstützten Geräten als " +
      "Apple Pay oder Google Pay), oder mit PayPal — alle vier Wege laufen technisch über " +
      "den Zahlungsanbieter Stripe. Beim Bezahlen werden an Stripe übermittelt: der Betrag, " +
      "die Anmeldenummer, die E-Mail-Adresse sowie der Titel der Veranstaltung und die " +
      "Anzahl der Personen. Bezahlt wird ausschließlich auf der gesicherten Seite von " +
      "Stripe. Kartennummern und Bankdaten erreichen diese Seite zu keinem Zeitpunkt — sie " +
      "werden hier weder entgegengenommen noch gespeichert. Rechtsgrundlage ist Art. 6 " +
      "Abs. 1 Buchst. b DSGVO. Weitere Einzelheiten zu Stripe und, bei Auswahl dieser " +
      "Zahlungsart, zu PayPal stehen im nächsten Abschnitt „Empfänger und " +
      "Auftragsverarbeiter“.",
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

    /* ── Empfänger und Auftragsverarbeiter ──────────────────────────
       KEIN Platzhalter. Nennt nur Dienstleister, deren Rolle und
       Anschrift bereits recherchiert und bestätigt sind (siehe
       docs/rechtstexte-entwuerfe/02-datenschutzerklaerung-entwurf.md,
       Ziffer 14, und Dokument 15, Punkt 1.5 — dort als "erledigt"
       vermerkt am 20.09.2026). Die Hostinger-DPA-Angaben (gilt für
       VPS, elektronische Annahme, englische Fassung maßgeblich, Stand
       15.09.2026) sind Angaben des Nutzers vom 22.09.2026, keine
       eigene Recherche. Bewusst NICHT genannt: eine Anschrift für
       PayPal (weiterhin nicht bestätigt) und eine feste Firmierung der
       Veranstaltungsstätte — die steht je Event auf /aufnahmen (siehe
       dort), nicht pauschal auf dieser Seite, weil sie sich mit jedem
       Veranstaltungsort ändern kann. */
    datenschutzEmpfaengerUeberschrift: "3. Empfänger und Auftragsverarbeiter",
    datenschutzEmpfaengerEinleitung:
      "Wir geben personenbezogene Daten nur an die folgenden Empfänger weiter, soweit dies " +
      "für den jeweiligen Zweck erforderlich ist. Weitere Empfänger gibt es nicht — " +
      "insbesondere keine Werbenetzwerke und keine Analysedienste.",
    datenschutzEmpfaengerAbsaetze: [
      "Hostinger International Ltd., 61 Lordou Vironos Street, 6023 Larnaca, Zypern, " +
        "betreibt den Server dieser Website — auch als virtuellen Server (VPS) — und das " +
        "E-Mail-Postfach, über das automatische Bestätigungsmails versendet werden " +
        "(Serverstandort Frankreich). Hostinger ist dabei Auftragsverarbeiter, VERA " +
        "Events Verantwortlicher; der Auftragsverarbeitungsvertrag gilt nach den " +
        "Nutzungsbedingungen von Hostinger durch deren elektronische Annahme als " +
        "abgeschlossen (maßgeblich ist die englische Fassung, Dokumentstand 15.09.2026).",
      "Stripe Payments Europe, Limited, One Wilton Park, Wilton Place, Dublin 2, D02 FX04, " +
        "Irland (bei bestimmten Zahlungsdiensten zusätzlich Stripe Technology Europe, " +
        "Limited, unter derselben Anschrift), wickelt Zahlungen ab; Einzelheiten stehen im " +
        "vorherigen Abschnitt.",
      "Wird beim Bezahlen PayPal gewählt, verarbeitet PayPal als eigenständig " +
        "Verantwortlicher nach eigener Datenschutzerklärung die dafür erforderlichen " +
        "Zugangs- und Zahlungsdaten — die Zahlung läuft dabei über die Verbindung von " +
        "Stripe zu PayPal, es gibt keine eigene PayPal-Anbindung von VERA.",
      "Backblaze, Inc., 500 Ben Franklin Ct, San Mateo, CA 94401, USA, speichert " +
        "verschlüsselte Sicherungskopien der Datenbank in einem Rechenzentrum in der EU. " +
        "Backblaze erhält ausschließlich die verschlüsselte Datei, keinen lesbaren Inhalt.",
      "UptimeRobot s. r. o., Obchodná 507/2, 811 06 Bratislava, Slowakei, ruft in " +
        "regelmäßigen Abständen die öffentliche Startseite auf, um die Erreichbarkeit der " +
        "Website zu prüfen. Dabei fallen keine Besucher- oder Teilnehmerdaten an.",
      "Mitarbeiter der jeweiligen Veranstaltungsstätte dürfen die Papierformulare für " +
        "minderjährige Teilnehmer am Empfang ausschließlich für VERA Events entgegennehmen " +
        "und weitergeben; Einzelheiten stehen in Abschnitt 2. Wer die Veranstaltungsstätte " +
        "einer konkreten Veranstaltung ist, steht auf /aufnahmen.",
      "In einem akuten Notfall können erforderliche Angaben an Rettungsdienst oder " +
        "ärztliches Personal weitergegeben werden.",
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
    datenschutzLoeschungUeberschrift: "4. Speicherdauer und Löschung",
    datenschutzLoeschungEinleitung:
      "Daten werden nicht länger gespeichert, als es der jeweilige Zweck und die gesetzlichen " +
      "Aufbewahrungspflichten erfordern. Welche Frist gilt, hängt von der Art der Angaben ab; " +
      "die Löschung läuft automatisch.",
    datenschutzLoeschungAbsaetze: [
      "Gesundheits- und Notfallangaben auf der Einverständniserklärung werden spätestens " +
        "sieben Tage nach Ende der Veranstaltung vernichtet.",
      "Vollständige Einverständniserklärungen für minderjährige Teilnehmer werden drei Jahre " +
        "ab dem Ende des Kalenderjahres der Veranstaltung aufbewahrt und danach vernichtet. " +
        "Anschließend wird ein reduzierter Nachweis darüber aufbewahrt, dass eine Zustimmung " +
        "vorlag; er enthält kein Geburtsdatum, keine Mobilnummer und keine " +
        "Gesundheitsangaben und wird zehn Jahre ab dem Ende des Kalenderjahres der " +
        "Veranstaltung aufbewahrt und danach gelöscht.",
      "Anmeldedaten (Vor- und Nachname, E-Mail-Adresse, Telefonnummer der anmeldenden " +
        "Person sowie die Namen der Teilnehmenden) werden drei Jahre ab dem Ende des " +
        "Kalenderjahres der Veranstaltung aufbewahrt und danach automatisch überschrieben; " +
        "die Buchung selbst bleibt ohne Personenbezug bestehen, weil Betrag und Datum zu " +
        "den steuerlichen Unterlagen gehören. Ein Check-out oder eine Abmeldung beim " +
        "Verlassen der Veranstaltung ist nicht vorgesehen — VERA erhebt und speichert dafür " +
        "keinen Zeitpunkt.",
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
      "Der Nachweis über einen erklärten Widerspruch gegen Foto- oder Videoaufnahmen (siehe " +
        "„Ihr Widerspruchsrecht“ auf /aufnahmen) wird aufbewahrt, solange Aufnahmen dieser " +
        "Veranstaltung noch veröffentlicht sind, und danach weitere drei Jahre ab dem Ende " +
        "des betreffenden Kalenderjahres. Die veröffentlichten Aufnahmen selbst unterliegen " +
        "keiner automatischen Löschfrist; ihre Entfernung wird von Hand veranlasst und " +
        "dokumentiert.",
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

    /* ── Ihre Rechte ─────────────────────────────────────────────────
       KEIN Platzhalter. Reine Aufzählung der gesetzlichen Rechte nach
       Art. 15-21 und Art. 7 Abs. 3 DSGVO sowie des Beschwerderechts
       nach Art. 77 DSGVO.

       Zuständige Behörde seit 22.09.2026: die Landesbeauftragte für
       den Datenschutz und für das Recht auf Akteneinsicht Brandenburg
       — vom Nutzer bestätigt, NICHT selbst recherchiert (Zugriff auf
       Behördenseiten ist aus dieser Arbeitsumgebung blockiert). Grund:
       Das Einzelunternehmen ist in Brandenburg angemeldet und wird von
       dort geführt; die Berliner Anschrift ist eine gemietete
       Post-/Impressumsadresse und ändert die Hauptniederlassung nicht.
       Vorher stand hier die Berliner Beauftragte, mit Namen und
       Website ohne Anschrift, weil die vollständige Anschrift damals
       nicht selbst nachprüfbar war. Diese Einschränkung entfällt jetzt
       nicht durch eigene Prüfung, sondern weil der Nutzer die
       Brandenburger Anschrift direkt mitgeteilt hat. */
    datenschutzRechteUeberschrift: "5. Ihre Rechte",
    datenschutzRechteEinleitung: "Sie haben das Recht,",
    datenschutzRechtePunkte: [
      "Auskunft über die von uns verarbeiteten Daten zu verlangen (Art. 15 DSGVO),",
      "deren Berichtigung zu verlangen (Art. 16 DSGVO),",
      "deren Löschung zu verlangen (Art. 17 DSGVO),",
      "die Einschränkung der Verarbeitung zu verlangen (Art. 18 DSGVO),",
      "die Sie betreffenden Daten in einem übertragbaren Format zu erhalten (Art. 20 DSGVO),",
      "der Verarbeitung zu widersprechen, soweit sie auf Art. 6 Abs. 1 Buchst. f DSGVO " +
        "beruht (Art. 21 DSGVO),",
      "eine erteilte Einwilligung jederzeit mit Wirkung für die Zukunft zu widerrufen, ohne " +
        "dass die Rechtmäßigkeit der bis dahin erfolgten Verarbeitung berührt wird " +
        "(Art. 7 Abs. 3 DSGVO).",
    ],
    datenschutzRechteKontakt: "Wenden Sie sich dafür an kontakt@veraevents.de.",
    datenschutzRechteBeschwerde:
      "Ihnen steht außerdem ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde zu " +
      "(Art. 77 DSGVO). Für uns zuständig ist die Landesbeauftragte für den Datenschutz " +
      "und für das Recht auf Akteneinsicht Brandenburg, Stahnsdorfer Damm 77, 14532 " +
      "Kleinmachnow, Poststelle@LDA.Brandenburg.de.",
    datenschutzRechteAutomatisiert:
      "Es findet keine automatisierte Entscheidungsfindung im Sinne von Art. 22 DSGVO statt.",

    /* ── AGB — vollständige Teilnahmebedingungen (Stand 22.09.2026) ──
       Erstfassung 21.09.2026; am 22.09.2026 um Ziffer 9.4 bis 9.6
       erweitert, Stand-Datum in Ziffer 17.3 entsprechend nachgezogen.
       KEIN Platzhalter mehr. Textgrundlage: die mit Adam abgestimmten
       und mit den AGB-Prüf-Skills (haftungsbegrenzung-pruefen-und-
       formulieren, klauselinhalt-und-verbote-pruefen,
       klauseltransparenz-pruefen) geprüften Ziffern aus
       docs/rechtstexte-entwuerfe/03-agb-b2c-events-entwurf.md.

       Bewusst NICHT übernommen, weil technisch nicht eingelöst:
       - Mindestteilnehmerzahl/Entscheidungsfrist (Doc03 Ziffer 8.3) —
         Event kennt dafür noch kein Datenmodell-Feld.
       - Stornoentgelt 0,35 € (Doc03 Ziffer 7.1/7.1a) — der Code
         erstattet heute den vollen Betrag; die Reihenfolge "erst Code,
         dann Text" aus Doc03 gilt weiter.
       - Abbruch-/Unterbrechungsregel mit Zeitschwelle (Vorschlag vom
         22.09.2026) — es gibt weder einen Event-Status "abgesagt" noch
         eine Sammelerstattung, die eine solche Schwelle einlösen
         könnte (Dokument 15, B-7; dort am 22.09.2026 bewusst als
         spätere Erweiterung zurückgestellt).

       Bewusst NICHT übernommen, weil es eine Tatsache wäre, die
       niemand festgelegt hat (Entscheidung vom 22.09.2026):
       - eine allgemeine Veranstaltungsdauer ("regulär etwa X
         Stunden"). Die Dauer steht ausschließlich beim konkreten
         Event auf dessen Eventseite, nicht in den Rechtstexten. Ein
         in den AGB genannter Richtwert würde für jede künftige
         Veranstaltung mitgelten, auch wenn sie ganz anders angelegt
         ist.
       Ziffer 7 beschreibt deshalb bewusst den tatsächlichen (kostenlosen)
       Stornoweg, nur die frühere unwirksame Pauschal-Verweigerung nach
       Fristablauf (§ 309 Nr. 5 BGB: fehlende Anrechnung, fehlender
       Nachweisvorbehalt) ist korrigiert.

       Ziffer 6 (Minderjährige) übernimmt NICHT Doc03 wortwörtlich,
       sondern die bereits gewachsene, mit der Einverständniserklärung
       und dem Anmeldeformular abgestimmte Fassung — nur auf das
       Anlagenmodell (Entscheidung 3.20) korrigiert: VERA sagt keine
       Betreuung/Aufsicht mehr zu. Diese drei Stellen (hier, die
       Einverständniserklärung unter public/dokumente/ und der Hinweis
       im Anmeldebereich) dürfen nur gemeinsam geändert werden.

       Ziffer 11 (Haftung) ist ab jetzt die EINZIGE Haftungsregelung im
       Projekt — die frühere pauschale "Haftung gilt uneingeschränkt
       nach Gesetz" in Ziffer 6 verweist jetzt hierher, statt sich zu
       wiederholen.

       Bewusst weiterhin offen (siehe Prüfbericht): Ziffer 12 beschreibt
       nur die Verantwortungsbereiche, entscheidet aber NICHT
       abschließend, ob der von der Halle gestellte Trainer
       Erfüllungsgehilfe von VERA ist — das hängt vom tatsächlichen
       Vertrag zwischen VERA und der Halle ab und ist als eigener Punkt
       vor der ersten echten Veranstaltung zu bestätigen.

       Seit 22.09.2026 (Padel-Event Falkensee bestätigt): Trainer und
       Einweisung werden dort von der Halle gestellt, nicht von VERA
       beschäftigt. Ziffer 12.2 nennt deshalb keine "von VERA
       eingesetzten" Trainer mehr, sondern hält offen, wer sie je
       Veranstaltung stellt — die rechtliche Einordnung als
       Erfüllungsgehilfe bleibt weiterhin offen, siehe oben. Die
       Haftpflichtversicherung der Halle soll für dieses Event gelten,
       ist aber schriftlich noch nicht bestätigt (Dokument 16, Frage 6)
       — deshalb wird an keiner Stelle ein Versicherungsschutz zugunsten
       von VERA behauptet. */
    agb: "AGB",
    agbTitel: "Allgemeine Geschäftsbedingungen",

    agbGeltungsbereichUeberschrift: "1. Geltungsbereich und Begriffe",
    agbGeltungsbereichAbsaetze: [
      "1.1 Diese Teilnahmebedingungen gelten für alle Verträge über die Teilnahme an " +
        "öffentlich angebotenen Veranstaltungen, die Adam Maurice Lasarzik, Mühlenstr. 8a, " +
        "14167 Berlin (im Folgenden „VERA“) über den Ticketshop auf veraevents.de schließt. " +
        "Sie gelten unabhängig davon, ob die buchende Person als Verbraucher oder als " +
        "Unternehmer handelt; Unternehmen, Schulen und andere Organisationen können Tickets " +
        "für öffentlich angebotene Veranstaltungen zu diesen Bedingungen erwerben.",
      "1.2 Verbraucher ist, wer den Vertrag zu Zwecken abschließt, die überwiegend weder der " +
        "gewerblichen noch der selbständigen beruflichen Tätigkeit zugerechnet werden können " +
        "(§ 13 BGB). Unternehmer ist, wer bei Abschluss des Vertrags in Ausübung seiner " +
        "gewerblichen oder selbständigen beruflichen Tätigkeit handelt (§ 14 BGB). Einzelne " +
        "Regelungen dieser Bedingungen gelten nur gegenüber Verbrauchern; sie sind jeweils " +
        "ausdrücklich als solche gekennzeichnet. Im Übrigen gelten diese Bedingungen für alle " +
        "Buchenden gleichermaßen.",
      "1.3 Für individuell beauftragte Veranstaltungen — insbesondere Firmen- und " +
        "Schulveranstaltungen, die auf Anfrage geplant und abgestimmt werden — gelten nicht " +
        "diese Bedingungen, sondern gesonderte, im Einzelfall vereinbarte Bedingungen. Solche " +
        "Veranstaltungen werden nicht über den Ticketshop gebucht, sondern auf Anfrage per " +
        "E-Mail vereinbart (siehe „Für Unternehmen“ bzw. „Für Schulen“).",
      "1.4 „Veranstaltung“ ist das jeweils auf der Website beschriebene Angebot. „Anmeldung“ " +
        "ist die Buchung eines oder mehrerer Plätze durch eine Person. „Teilnehmende“ sind " +
        "die in der Anmeldung namentlich benannten Personen.",
      "1.5 Abweichende Bedingungen der anmeldenden Person werden nicht Vertragsbestandteil, " +
        "es sei denn, VERA stimmt ihnen ausdrücklich in Textform zu.",
    ],

    agbLeistungUeberschrift: "2. Welche Leistung geschuldet ist",
    agbLeistungAbsaetze: [
      "2.1 Was eine Veranstaltung umfasst, ergibt sich ausschließlich aus der Beschreibung " +
        "auf der jeweiligen Eventseite zum Zeitpunkt der Anmeldung. Diese Beschreibung ist " +
        "maßgeblich.",
      "2.2 Leistungen wie Betreuung durch einen Trainer, die Bereitstellung von Schlägern " +
        "und Bällen oder Speisen und Getränke sind nur dann im Preis enthalten, wenn die " +
        "Eventseite sie ausdrücklich als enthalten ausweist. Sind sie dort nicht genannt, " +
        "sind sie nicht geschuldet.",
      "2.3 Allgemeine Darstellungen auf der Startseite, in Kurztexten oder in Werbematerial " +
        "beschreiben das Angebot, begründen aber für sich genommen keinen Anspruch auf eine " +
        "bestimmte Einzelleistung.",
      "2.4 Steht für eine Veranstaltung noch kein Termin fest, ist das auf der Eventseite " +
        "als solches gekennzeichnet. Eine solche Veranstaltung ist eine reine Ankündigung: " +
        "Sie kann noch nicht gebucht werden. Erst wenn Datum und Uhrzeit feststehen und auf " +
        "der Eventseite angegeben sind, ist eine Anmeldung möglich.",
    ],

    agbVertragsschlussUeberschrift: "3. Wie der Vertrag zustande kommt",
    agbVertragsschlussAbsaetze: [
      "3.1 Die Darstellung der Veranstaltungen auf der Website ist kein bindendes Angebot, " +
        "sondern eine Aufforderung zur Anmeldung.",
      "3.2 Die Anmeldung läuft über diese Schritte: Auswahl der Veranstaltung und der " +
        "Teilnehmenden, wobei der Gesamtpreis laufend angezeigt wird; Eingabe der Kontakt- " +
        "und Teilnehmerdaten; Anzeige einer Übersicht mit allen Einzelposten und dem " +
        "Gesamtbetrag; Absenden der Anmeldung über die Schaltfläche „Zahlungspflichtig " +
        "bestellen“, nachdem das Häkchen „Ich akzeptiere die AGB.“ gesetzt wurde; " +
        "Weiterleitung auf die gesicherte Bezahlseite des Zahlungsdienstleisters; nach " +
        "erfolgreicher Zahlung die Bestätigung der Anmeldung per E-Mail.",
      "3.3 Mit dem Absenden der Anmeldung geben Sie ein verbindliches Angebot auf Abschluss " +
        "des Teilnahmevertrags ab. Der Vertrag kommt zustande, sobald VERA die Anmeldung " +
        "bestätigt. Die Bestätigung erfolgt bei kostenpflichtigen Veranstaltungen nach " +
        "Eingang der Zahlung, bei kostenlosen Veranstaltungen unmittelbar nach dem Absenden.",
      "3.4 Der Eingang der Anmeldung wird unverzüglich elektronisch bestätigt. Diese " +
        "Eingangsbestätigung ist noch keine Annahme des Angebots.",
      "3.5 Der Platz wird ab dem Absenden für 30 Minuten reserviert, damit die Zahlung " +
        "abgeschlossen werden kann. Wird in dieser Zeit nicht bezahlt, verfällt die " +
        "Reservierung und der Platz steht wieder zur Verfügung. Die Anmeldung bleibt " +
        "gespeichert und kann über den Link auf der Abschluss-Seite fortgesetzt werden, " +
        "solange Plätze frei sind.",
      "3.6 Der Vertragstext wird bei VERA gespeichert. Die Bestätigungsmail enthält die " +
        "Daten der Anmeldung. Diese Teilnahmebedingungen sind jederzeit auf der Website " +
        "abrufbar.",
      "3.7 Der Vertrag wird in deutscher Sprache geschlossen.",
      "3.8 Eine Anmeldung ist erst mit vollständiger Zahlung verbindlich angenommen. " +
        "Solange nicht bezahlt ist, besteht kein Anspruch auf einen Platz — auch nicht " +
        "während der Reservierungszeit nach Ziffer 3.5, wenn diese abgelaufen ist.",
    ],

    agbPreiseUeberschrift: "4. Preise und Zahlung",
    agbPreiseAbsaetze: [
      "4.1 Es gelten die auf der jeweiligen Eventseite angegebenen Preise zum Zeitpunkt der " +
        "Anmeldung.",
      "4.2 VERA ist Kleinunternehmen im Sinne von § 19 UStG. Es wird keine Umsatzsteuer " +
        "berechnet und daher auch keine ausgewiesen. Die angegebenen Preise sind Endpreise.",
      "4.3 Der Gesamtpreis wird vor dem Absenden der Anmeldung vollständig angezeigt. " +
        "Zusätzliche Kosten fallen nicht an; insbesondere werden keine Buchungs-, Service- " +
        "oder Zahlungsgebühren erhoben.",
      "4.4 Die Zahlung erfolgt über den auf der Bezahlseite angebotenen Weg. Die " +
        "Zahlungsdaten geben Sie unmittelbar beim Zahlungsdienstleister ein; sie erreichen " +
        "die Website von VERA zu keinem Zeitpunkt.",
      "4.5 Der Gesamtbetrag ist mit dem Absenden der Anmeldung fällig.",
    ],

    agbTeilnahmeUeberschrift: "5. Wer teilnehmen darf",
    agbTeilnahmeAbsaetze: [
      "5.1 Die Teilnahme setzt eine wirksame Anmeldung und die vollständige Zahlung voraus.",
      "5.2 Für einzelne Veranstaltungen können auf der Eventseite besondere Voraussetzungen " +
        "genannt sein, etwa ein Mindestalter oder eine Zielgruppe. Diese Angaben sind " +
        "verbindlich.",
      "5.3 Die Teilnahme setzt eine dem Angebot entsprechende gesundheitliche Eignung " +
        "voraus. Siehe Ziffer 10.",
    ],

    /* ── Anmeldung Minderjähriger ───────────────────────────────────
       KEIN Platzhalter: Das sind vom Betreiber festgelegte Bedingungen.
       Sie beschreiben denselben Ablauf wie die Einverständniserklärung
       (public/dokumente/) und der Hinweis im Anmeldebereich — die drei
       Stellen sind wörtlich aufeinander abgestimmt und dürfen nur
       gemeinsam geändert werden.

       Seit 21.09.2026 auf das Anlagenmodell (Entscheidung 3.20)
       korrigiert: Die frühere Fassung sagte eine Betreuung/Aufsicht
       durch VERA zu ("Betreuung beginnt mit dem Check-in..."), die es
       nach dieser Entscheidung nicht mehr gibt. VERA schuldet
       stattdessen eine Sicherheitseinweisung und erkennbare
       Ansprechpersonen. Der letzte Absatz verweist jetzt auf Ziffer 11
       statt die Haftung ein zweites Mal (und unvollständig) zu
       beschreiben. */
    agbMinderjaehrigUeberschrift: "6. Anmeldung Minderjähriger",
    agbMinderjaehrigAbsaetze: [
      "Minderjährige dürfen an einer Veranstaltung nur mit Zustimmung einer " +
        "erziehungsberechtigten Person teilnehmen. Die anmeldende beziehungsweise " +
        "unterschreibende Person bestätigt, erziehungsberechtigt und zur Abgabe der " +
        "erforderlichen Erklärungen berechtigt zu sein. Soweit die Zustimmung einer weiteren " +
        "sorgeberechtigten Person erforderlich ist, muss diese ebenfalls vorliegen. " +
        "Vertragspartner ist die anmeldende erziehungsberechtigte Person, nicht die " +
        "minderjährige teilnehmende Person.",
      "Die von VERA Events bereitgestellte Einverständniserklärung muss vollständig " +
        "ausgefüllt, unterschrieben und spätestens beim Check-in abgegeben werden. Liegt die " +
        "erforderliche Erklärung bei Veranstaltungsbeginn nicht vor, kann die Teilnahme des " +
        "Minderjährigen abgelehnt werden. Gesetzliche und vertragliche Erstattungsansprüche " +
        "bleiben unberührt.",
      "VERA übernimmt keine Aufsicht über unbegleitete minderjährige Teilnehmende. Es gibt " +
        "kein von VERA festgelegtes Mindestalter für die Teilnahme oder für das " +
        "selbstständige Kommen und Gehen — das entscheidet die erziehungsberechtigte Person " +
        "mit ihrer Unterschrift auf der Einverständniserklärung. VERA erfasst beim Ankommen, " +
        "wer erschienen ist, überwacht aber nicht, wer das Gelände wann verlässt. Für die " +
        "Organisation des Hin- und Rückwegs ist die erziehungsberechtigte Person " +
        "verantwortlich; sie muss während der gesamten Veranstaltung unter der angegebenen " +
        "Mobilnummer erreichbar sein und den Minderjährigen erforderlichenfalls zeitnah " +
        "abholen.",
      "Statt einer Aufsichtsübernahme schuldet VERA jeder teilnehmenden Person eine " +
        "Sicherheitseinweisung vor dem ersten Spielen sowie erkennbare Ansprechpersonen, die " +
        "bei einer erkannten Gefahr eingreifen.",
      "Minderjährige Teilnehmer müssen die Sicherheits-, Verhaltens- und Hausregeln sowie " +
        "die Anweisungen des Veranstaltungs-, Betreuungs- und Hallenpersonals beachten. Bei " +
        "erheblichen oder wiederholten Regelverstößen kann der Teilnehmer von der weiteren " +
        "Teilnahme ausgeschlossen werden.",
      "Bei einem Unfall oder akuten gesundheitlichen Problem dürfen angemessene " +
        "Erste-Hilfe-Maßnahmen eingeleitet und bei Bedarf Rettungsdienst oder ärztliche " +
        "Hilfe verständigt werden. Die erziehungsberechtigte Person beziehungsweise der " +
        "angegebene Notfallkontakt wird schnellstmöglich informiert.",
      "Für die Haftung von VERA Events gilt Ziffer 11.",
    ],

    /* ── Stornierung durch Teilnehmende ─────────────────────────────
       Beschreibt den tatsächlichen, kostenlosen Stornoweg (volle
       Erstattung bis 24 Stunden vorher). Die frühere Pauschalklausel
       "danach grundsätzlich kein Anspruch auf Erstattung" ist um
       Anrechnung und Nachweisvorbehalt ergänzt (§ 309 Nr. 5 BGB). Die
       frühere, seit Entscheidung 2.5 gegenstandslose Klausel zu
       Veranstaltungen ohne Termin ist ersatzlos entfallen. */
    agbStornoUeberschrift: "7. Stornierung durch Teilnehmende",
    agbStornoAbsaetze: [
      "7.1 Sie können eine Buchung bis 24 Stunden vor dem angekündigten Beginn der " +
        "Veranstaltung kostenlos stornieren. Erstattet wird der vollständige gezahlte " +
        "Betrag.",
      "7.2 Die Stornierung erfolgt über den Link in der Bestätigungsmail. Er führt zu einer " +
        "Seite, die die Buchung anzeigt; storniert wird erst mit einem Klick auf die " +
        "dortige Schaltfläche. Der Betrag wird unmittelbar zur Rückerstattung angewiesen — " +
        "auf demselben Weg, über den gezahlt wurde. Je nach Zahlungsdienstleister und Bank " +
        "kann die Gutschrift einige Werktage dauern. Der Platz wird sofort wieder frei.",
      "7.3 Ist die Bestätigungsmail nicht mehr auffindbar, genügt eine Nachricht an " +
        "kontakt@veraevents.de.",
      "7.4 Nach Ablauf der Frist nach Ziffer 7.1 und bei Nichterscheinen ist eine " +
        "Stornierung über den Link nicht mehr möglich, und es besteht grundsätzlich kein " +
        "Anspruch auf Erstattung. VERA muss sich jedoch anrechnen lassen, was an " +
        "Aufwendungen erspart oder durch anderweitige Vergabe des Platzes erlangt wird. " +
        "Ihnen bleibt der Nachweis vorbehalten, dass VERA kein oder ein wesentlich " +
        "geringerer Schaden entstanden ist; in diesem Fall ermäßigt sich der einbehaltene " +
        "Betrag entsprechend. Wenden Sie sich dafür an kontakt@veraevents.de.",
      "7.5 VERA kann im Einzelfall eine kulantere Lösung anbieten. Ein Anspruch darauf " +
        "besteht nicht. Wenden Sie sich in jedem Fall an kontakt@veraevents.de — auch nach " +
        "Ablauf der Frist.",
      "7.6 Ein gebuchter Platz kann nicht auf eine andere Person übertragen werden. Das ist " +
        "auch nicht erforderlich: Wer verhindert ist, storniert nach Ziffer 7.1 kostenlos; " +
        "die andere Person meldet sich selbst an, solange Plätze frei sind.",
      "7.7 Diese Bedingungen legt VERA selbst fest. Ein etwaiges gesetzliches " +
        "Widerrufsrecht (siehe Ziffer 13) besteht unabhängig davon und wird durch sie nicht " +
        "eingeschränkt.",
    ],

    /* ── Absage und Programmänderungen ──────────────────────────────
       Ohne die Ziffer zur Mindestteilnehmerzahl (Doc03 Ziffer 8.3):
       Event kennt dafür noch kein Datenmodell-Feld, und eine Klausel
       über einen Mechanismus zu veröffentlichen, den es nicht gibt,
       wäre eine Zusage, die die Technik nicht einlöst. */
    agbAbsageUeberschrift: "8. Absage und Programmänderungen",
    agbAbsageAbsaetze: [
      "8.1 Muss eine Veranstaltung ausfallen, wird allen Angemeldeten automatisch der volle " +
        "Betrag erstattet, ohne dass dafür etwas beantragt werden muss. Die Absage wird so " +
        "früh wie möglich per E-Mail mitgeteilt.",
      "8.2 VERA kann eine Veranstaltung absagen, wenn die Durchführung aus Gründen " +
        "unmöglich oder unzumutbar wird, die VERA nicht zu vertreten hat — insbesondere bei " +
        "Ausfall der Veranstaltungsstätte, behördlichen Anordnungen, Unwetter oder sonstigen " +
        "Ereignissen höherer Gewalt. Es gilt Ziffer 8.1.",
      "8.3 Eine Verlegung bereits gebuchter Veranstaltungen auf einen anderen Termin findet " +
        "nicht statt. Kann eine Veranstaltung zum angekündigten Termin nicht stattfinden, " +
        "wird sie nach Ziffer 8.1 abgesagt und der volle Betrag erstattet. Ein neuer Termin " +
        "wird als eigene Veranstaltung veröffentlicht, für die Sie sich freiwillig neu " +
        "anmelden können. Eine Übertragung Ihrer Buchung auf einen anderen Termin erfolgt " +
        "nur mit Ihrer ausdrücklichen Zustimmung.",
      "8.4 VERA kann den Ablauf einer Veranstaltung ändern, soweit die Änderung den " +
        "Gesamtcharakter der Veranstaltung nicht beeinträchtigt und für Sie zumutbar ist. " +
        "Das gilt insbesondere für die zeitliche Einteilung, die Reihenfolge der " +
        "Programmpunkte und den Wechsel einzelner Betreuungspersonen.",
      "8.5 Fällt eine auf der Eventseite ausdrücklich als enthalten ausgewiesene " +
        "Einzelleistung ersatzlos aus, können Sie eine angemessene Minderung des Preises " +
        "verlangen. Weitergehende Ansprüche richten sich nach Ziffer 11.",
    ],

    /* ── Pflichten vor Ort ──────────────────────────────────────────
       Seit 22.09.2026 um zwei Absätze erweitert, beide aus Dokument 09
       (Teilnahmehinweise) übernommen, das dafür NICHT als eigene Seite
       veröffentlicht wird — eine Regel, eine Stelle:

       - 9.4 (persönliche Gegenstände) ist Dokument 09, Ziffer 8 in
         einem Absatz. Bewusst KEINE pauschale Haftungsfreistellung
         ("für abhandengekommene Gegenstände wird keine Haftung
         übernommen") — die erfasste auch Vorsatz und grobe
         Fahrlässigkeit und wäre nach § 309 Nr. 7 Buchst. b BGB
         unwirksam. Stattdessen der Verweis auf Ziffer 11: Zwei
         verschieden formulierte Haftungsaussagen zum selben Vorgang
         gingen nach § 305c Abs. 2 BGB zu Lasten von VERA.
         "VERA nimmt nichts zur Verwahrung an" ist dabei eine
         Leistungsbeschreibung, keine Freizeichnung — ohne Obhut
         entsteht kein Verwahrungsvertrag (§§ 688 ff. BGB).

       - 9.5/9.6 (Ausschluss) ergänzen die frühere Fassung um
         Selbstgefährdung und die Missachtung von Sicherheitsanweisungen
         und benennen die Verweisung vom Gelände.
         9.6 ist der Grund, warum das kein Widerspruch zum
         Anlagenmodell ist: Eine minderjährige Person, die das Gelände
         laut Einverständniserklärung nicht allein verlassen darf, wird
         NICHT hinausgewiesen (Dokument 09, Ziffer 7.3) — beaufsichtigt
         wird sie aber auch nicht, sonst wäre es die Aufsichtsübernahme,
         die Entscheidung 3.20 gerade ausschließt.

       Die Dopplung zu Ziffer 6 Satz 5 (Ausschluss Minderjähriger)
       bleibt bewusst stehen: Dieser Satz ist mit der
       Einverständniserklärung (public/dokumente/) wörtlich abgestimmt
       und dürfte nur gemeinsam mit ihr geändert werden. Er ist enger
       als Ziffer 9.5, aber nicht abschließend formuliert — kein
       Widerspruch. */
    agbPflichtenUeberschrift: "9. Ihre Pflichten vor Ort und persönliche Gegenstände",
    agbPflichtenAbsaetze: [
      "9.1 Den Anweisungen des Veranstaltungs-, Betreuungs- und Hallenpersonals ist Folge " +
        "zu leisten, soweit sie der Sicherheit, dem geordneten Ablauf oder dem Schutz " +
        "anderer dienen.",
      "9.2 Es gilt die Hausordnung der jeweiligen Veranstaltungsstätte. Sie ist vor Ort " +
        "aushängend oder auf Nachfrage einsehbar. Bei Widersprüchen zwischen diesen " +
        "Teilnahmebedingungen und der Hausordnung gilt für die Nutzung der Räume und " +
        "Anlagen die Hausordnung.",
      "9.3 Sportgeräte und Einrichtungen sind bestimmungsgemäß und sorgfältig zu benutzen.",
      "9.4 Für persönliche Gegenstände, Kleidung, Sportausrüstung und Wertsachen sind Sie " +
        "selbst verantwortlich; Wertgegenstände sollten nicht unbeaufsichtigt " +
        "zurückgelassen werden. VERA nimmt keine Gegenstände zur Verwahrung an — es gibt " +
        "weder eine Garderobe noch eine Annahmestelle. Stellt die Veranstaltungsstätte " +
        "Schließfächer bereit, erfolgt deren Nutzung eigenverantwortlich; VERA betreibt sie " +
        "nicht. Für Fundsachen gelten die Regeln der Veranstaltungsstätte. Für die Haftung " +
        "von VERA gilt Ziffer 11.",
      "9.5 Bei erheblichen oder wiederholten Verstößen gegen diese Ziffer, bei Missachtung " +
        "von Sicherheitsanweisungen sowie dann, wenn Sie sich selbst oder andere Personen " +
        "gefährden, kann VERA Sie von der weiteren Teilnahme ausschließen und vom " +
        "Veranstaltungsgelände verweisen. Bei einer Gefährdung kann der Ausschluss ohne " +
        "vorherigen Hinweis erfolgen. Ein Anspruch auf Erstattung besteht in diesem Fall " +
        "nicht, soweit der Ausschluss berechtigt war.",
      "9.6 Bei minderjährigen Teilnehmenden, deren erziehungsberechtigte Person das " +
        "selbstständige Verlassen der Veranstaltung nicht gestattet hat, erfolgt keine " +
        "Verweisung vom Gelände. Stattdessen wird die erziehungsberechtigte Person " +
        "unverzüglich unter der angegebenen Mobilnummer informiert. Eine Beaufsichtigung " +
        "bis zu deren Eintreffen übernimmt VERA nicht (siehe Ziffer 6).",
    ],

    agbGesundheitUeberschrift: "10. Gesundheitliche Eigenverantwortung",
    agbGesundheitAbsaetze: [
      "10.1 Die Teilnahme an sportlichen Veranstaltungen setzt eine entsprechende " +
        "gesundheitliche Eignung voraus. Sie entscheiden eigenverantwortlich, ob Sie an " +
        "einer Veranstaltung teilnehmen. VERA führt keine Gesundheitsprüfung durch und " +
        "schuldet keine solche.",
      "10.2 Bestehen Zweifel an der eigenen Belastbarkeit, sollte vor der Teilnahme " +
        "ärztlicher Rat eingeholt werden.",
      "10.3 Gesundheitliche Einschränkungen, die für die Sicherheit während der " +
        "Veranstaltung erheblich sind, sollten dem Betreuungspersonal vor Beginn mitgeteilt " +
        "werden. Die Mitteilung ist freiwillig.",
      "10.4 Diese Ziffer schränkt die Haftung von VERA nicht ein. Insbesondere bleiben die " +
        "Pflichten von VERA zur Verkehrssicherung, zur ordnungsgemäßen Einweisung und zur " +
        "Bereitstellung geeigneter Ausrüstung unberührt.",
    ],

    /* ── Haftung ─────────────────────────────────────────────────────
       Von Adam am 18.09.2026 entschieden ("Ja, die begrenzte Fassung
       gilt") und mit den drei installierten AGB-Skills geprüft. Erst
       die zwingenden Ausnahmen, dann die Begrenzung — nicht umgekehrt,
       sonst liest sich die Klausel beim ersten Blick als Ausschluss.
       Diese Ziffer ist ab jetzt die EINZIGE Haftungsregelung im
       Projekt; Ziffer 6 verweist hierher. */
    agbHaftungUeberschrift: "11. Haftung",
    agbHaftungAbsaetze: [
      "11.1 VERA haftet unbeschränkt für Schäden aus der Verletzung des Lebens, des " +
        "Körpers oder der Gesundheit, die auf einer Pflichtverletzung von VERA oder einer " +
        "Person beruhen, deren VERA sich zur Erfüllung bedient, für sonstige Schäden, die " +
        "auf Vorsatz oder grober Fahrlässigkeit von VERA oder einer solchen Person beruhen, " +
        "bei Übernahme einer Garantie sowie nach den Vorschriften des " +
        "Produkthaftungsgesetzes.",
      "11.2 Bei einfacher Fahrlässigkeit haftet VERA nur für die Verletzung einer Pflicht, " +
        "deren Erfüllung die ordnungsgemäße Durchführung des Vertrags überhaupt erst " +
        "ermöglicht und auf deren Einhaltung Sie regelmäßig vertrauen dürfen. Solche " +
        "Pflichten sind insbesondere: die Veranstaltung zum angekündigten Zeitpunkt am " +
        "angekündigten Ort durchzuführen; die auf der Eventseite als enthalten " +
        "ausgewiesenen Leistungen zu erbringen; eine für die Veranstaltung geeignete " +
        "Veranstaltungslocation sorgfältig auszuwählen und bekannt gewordene Mängel an " +
        "Fläche oder Ausrüstung nicht zu verschweigen — die Verkehrssicherungspflicht für " +
        "Gebäude, Bodenbeläge, fest installierte Einrichtungen sowie für die von der " +
        "Location gestellte Ausrüstung liegt beim Betreiber der Anlage (Ziffer 12.1); in " +
        "die Nutzung der Anlage und der Ausrüstung ordnungsgemäß einzuweisen, insbesondere " +
        "durch eine Sicherheitseinweisung vor dem ersten Spielen; den gezahlten Betrag nach " +
        "Ziffer 7 und 8 zurückzuerstatten. In diesen Fällen ist die Haftung auf den bei " +
        "Vertragsschluss vorhersehbaren, vertragstypischen Schaden begrenzt.",
      "11.3 Im Übrigen ist die Haftung von VERA für einfache Fahrlässigkeit " +
        "ausgeschlossen.",
      "11.4 Diese Ziffer 11 gilt auch zugunsten der Mitarbeitenden, Betreuungspersonen und " +
        "sonstigen Erfüllungsgehilfen von VERA.",
      "11.5 Eine Änderung der gesetzlichen Beweislast zu Ihrem Nachteil ist mit diesen " +
        "Bedingungen nicht verbunden.",
    ],

    /* ── Veranstaltungsstätte und weitere Beteiligte ────────────────
       Beschreibt nur die Verantwortungsbereiche, entscheidet NICHT
       abschließend die Erfüllungsgehilfen-Frage zum Trainer — siehe
       Kommentar am Anfang dieses Abschnitts. */
    agbVeranstaltungsstaetteUeberschrift: "12. Veranstaltungsstätte und weitere Beteiligte",
    agbVeranstaltungsstaetteAbsaetze: [
      "12.1 Veranstaltungen finden in Räumen und auf Anlagen statt, die VERA nicht selbst " +
        "betreibt. Betreiberpflichten der jeweiligen Anlage — insbesondere die " +
        "Verkehrssicherungspflicht für Gebäude, Bodenbeläge und fest installierte " +
        "Einrichtungen — treffen den Betreiber der Anlage.",
      "12.2 VERA bleibt verantwortlich für die eigene Leistung: Organisation und " +
        "Durchführung der Veranstaltung sowie die sorgfältige Auswahl einer geeigneten " +
        "Veranstaltungsstätte. Trainer-, Einweisungs- und Betreuungspersonal vor Ort kann " +
        "je nach Veranstaltung von VERA oder von der Veranstaltungsstätte gestellt werden; " +
        "die Eventseite der jeweiligen Veranstaltung weist das aus. VERA schuldet die " +
        "Sicherheitseinweisung als Ergebnis, unabhängig davon, wer sie durchführt.",
      "12.3 Diese Ziffer stellt die Verantwortungsbereiche klar; sie beschränkt die " +
        "Haftung von VERA nach Ziffer 11 nicht.",
    ],

    agbWiderrufsrechtUeberschrift: "13. Widerrufsrecht",
    agbWiderrufsrechtAbsaetze: [
      "13.1 Ob Ihnen ein gesetzliches Widerrufsrecht zusteht, hängt von der jeweiligen " +
        "Veranstaltung ab. Die Einzelheiten stehen in der gesonderten Information „Widerruf " +
        "und Stornierung“.",
      "13.2 Das freiwillige Stornierungsrecht nach Ziffer 7 besteht unabhängig davon und " +
        "wird durch ein etwaiges Widerrufsrecht nicht berührt.",
    ],

    agbVertragsdauerUeberschrift: "14. Vertragsdauer",
    agbVertragsdauerText:
      "Der Vertrag ist auf die Teilnahme an der jeweiligen Veranstaltung gerichtet und " +
      "endet mit deren Durchführung, mit einer wirksamen Stornierung oder mit einer " +
      "Absage. Ein Dauerschuldverhältnis entsteht nicht; eine Kündigung ist daher nicht " +
      "erforderlich.",

    agbRechtGerichtsstandUeberschrift: "15. Anwendbares Recht und Gerichtsstand",
    agbRechtGerichtsstandAbsaetze: [
      "15.1 Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des " +
        "UN-Kaufrechts. Haben Sie Ihren gewöhnlichen Aufenthalt in einem anderen Staat, " +
        "bleiben die zwingenden Verbraucherschutzvorschriften dieses Staates unberührt.",
      "15.2 Eine Gerichtsstandsvereinbarung wird nicht getroffen. Es gelten die " +
        "gesetzlichen Vorschriften.",
    ],

    /* Nicht-Teilnahme an einer Verbraucherschlichtungsstelle ist keine
       Rechtsformulierung, sondern eine Tatsache: Es gibt keine solche
       Mitgliedschaft. § 36 Abs. 1 VSBG verlangt genau diese Angabe,
       unabhängig davon, wie sie ausfällt. */
    agbStreitbeilegungUeberschrift: "16. Verbraucherstreitbeilegung",
    agbStreitbeilegungText:
      "VERA nimmt nicht an einem Streitbeilegungsverfahren vor einer " +
      "Verbraucherschlichtungsstelle teil und ist hierzu auch nicht verpflichtet.",

    agbSchlussUeberschrift: "17. Schlussbestimmungen",
    agbSchlussAbsaetze: [
      "17.1 Sollte eine Bestimmung dieser Teilnahmebedingungen unwirksam sein oder werden, " +
        "bleibt die Wirksamkeit der übrigen Bestimmungen unberührt. An die Stelle der " +
        "unwirksamen Bestimmung treten die gesetzlichen Vorschriften.",
      "17.2 Änderungen dieser Teilnahmebedingungen gelten nur für Anmeldungen, die nach " +
        "ihrem Inkrafttreten abgegeben werden. Für bereits geschlossene Verträge gilt die " +
        "bei der Anmeldung einbezogene Fassung.",
      "17.3 Stand dieser Bedingungen: 22. September 2026.",
    ],

    /* ── Foto- und Videoaufnahmen — nur ein kurzer Verweis ───────────
       KEIN Platzhalter, aber auch keine eigene Regelung: Die
       Einzelheiten (was aufgenommen wird, wofür, Rechtsgrundlage,
       Widerspruch) stehen bereits ausführlich auf /aufnahmen und in
       der Datenschutzerklärung — sie hier zu wiederholen würde nur
       eine dritte Stelle schaffen, die aus dem Takt geraten kann. */
    agbAufnahmenUeberschrift: "18. Foto- und Videoaufnahmen",
    agbAufnahmenText:
      "Bei Veranstaltungen können VERA Events und die jeweilige Veranstaltungsstätte " +
      "Übersichtsaufnahmen anfertigen und veröffentlichen. Was das im Einzelnen bedeutet, " +
      "wer dafür verantwortlich ist und wie Sie widersprechen können, steht auf der Seite " +
      "„Hinweise zu Aufnahmen“ sowie in der Datenschutzerklärung.",

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
    widerrufTerminHinweis:
      "Tickets über den Ticketshop verkauft VERA ausschließlich für Veranstaltungen mit " +
      "bereits feststehendem Termin; ohne Termin ist keine Buchung möglich. Bei individuell " +
      "beauftragten Firmenveranstaltungen wird der Termin im jeweiligen Angebot vereinbart, " +
      "bevor der Vertrag zustande kommt (siehe „Für Unternehmen“).",
    /* Ab hier KEIN Platzhalter mehr: Das sind die vom Betreiber
       festgelegten Bedingungen, und sie beschreiben genau das, was die
       Seite tatsächlich tut. Ändert sich der Ablauf, ändert sich
       dieser Text mit — sonst steht hier eine Zusage, die die Technik
       nicht einlöst.

       Zwei Korrekturen vom 21.09.2026, deckungsgleich mit AGB Ziffer 7:
       - Die frühere Klausel "Solange für eine Veranstaltung noch kein
         Termin feststeht, ist eine Stornierung jederzeit möglich" ist
         ersatzlos entfallen. Seit Entscheidung 2.5 lässt sich ohne
         feststehenden Termin gar nicht erst buchen — die Klausel regelte
         einen Fall, den es nicht mehr geben kann.
       - Die pauschale Formulierung "besteht grundsätzlich kein Anspruch
         auf Erstattung" ist um Anrechnung und Nachweisvorbehalt ergänzt.
         Ohne beides wäre eine solche Klausel an § 309 Nr. 5 BGB gemessen
         angreifbar (Pauschale ohne Anrechnung ersparter Aufwendungen,
         kein Vorbehalt eines geringeren Schadens). */
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
      "Nach Ablauf dieser Frist und bei Nichterscheinen ist eine Stornierung über den Link " +
        "nicht mehr möglich, und es besteht grundsätzlich kein Anspruch auf Erstattung. VERA " +
        "muss sich jedoch anrechnen lassen, was an Aufwendungen erspart oder durch " +
        "anderweitige Vergabe des Platzes erlangt wird. Ihnen bleibt der Nachweis " +
        "vorbehalten, dass VERA kein oder ein wesentlich geringerer Schaden entstanden ist; " +
        "in diesem Fall ermäßigt sich der einbehaltene Betrag entsprechend. Wer verhindert " +
        "ist, schreibt uns trotzdem an kontakt@veraevents.de — wir finden eine Lösung.",
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
