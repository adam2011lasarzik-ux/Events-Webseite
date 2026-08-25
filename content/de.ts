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
    event: "Event",
    schulen: "Für Schulen",
    ueber: "Über VERA",
    faq: "Fragen",
    kontakt: "Kontakt",
  },

  aktion: {
    anmelden: "Jetzt anmelden",
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
    ueberschrift: "Unsere Veranstaltungen",
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
      "Alle Preise gelten pro Person und Veranstaltungstag, inklusive Mehrwertsteuer. " +
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
    inklMwst: "inkl. MwSt.",
    keineAuswahl: "Wähle oben aus, wer mitkommt.",

    nochNichtTitel: "Die Anmeldung öffnet in Kürze",
    nochNichtText:
      "Datum und Uhrzeit stehen noch nicht fest. Deshalb kannst du dich hier zwar den Preis " +
      "ansehen, aber noch nicht verbindlich anmelden — es wird nichts abgeschickt und nichts " +
      "gespeichert. Schreib uns, wenn wir dir Bescheid geben sollen, sobald es losgeht.",
    nochNichtAktion: "Schreib uns",

    minderjaehrigTitel: "Bei Teilnehmern unter 18",
    minderjaehrigText:
      "Meldet ein Elternteil an, gilt die Anmeldung für das Kind. Die Einwilligung der " +
      "Erziehungsberechtigten wird bei der Anmeldung abgefragt.",

    formular: {
      ueberschrift: "Deine Angaben",
      hinweis:
        "Wir fragen nur, was wir für die Veranstaltung wirklich brauchen. " +
        "Deine Daten werden nicht weitergegeben.",
      freiwillig: "(freiwillig)",
      einwilligungVormund:
        "Ich bin erziehungsberechtigt und melde die genannten minderjährigen Personen " +
        "verbindlich an.",
      einwilligungFotos:
        "Bei der Veranstaltung dürfen Fotos gemacht und für VERA verwendet werden.",
      absenden: "Anmeldung abschicken",
      laeuft: "Wird gesendet …",
      zahlungHinweis:
        "Nach dem Abschicken ist der Platz reserviert. Die Bezahlung richten wir gerade " +
        "ein — wir melden uns dazu bei dir.",
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

  danke: {
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
      "Die Online-Bezahlung richten wir gerade ein. Sobald sie bereitsteht, melden wir uns " +
      "bei dir unter der angegebenen E-Mail-Adresse.",
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

  recht: {
    impressum: "Impressum",
    datenschutz: "Datenschutz",
    impressumTitel: "Impressum",
    datenschutzTitel: "Datenschutzerklärung",
    platzhalterTitel: "Diese Seite ist noch nicht ausgefüllt",
    impressumText:
      "Hier stehen später die gesetzlich vorgeschriebenen Angaben: Name und Anschrift des " +
      "Anbieters, Kontaktdaten und, falls zutreffend, Rechtsform, Vertretungsberechtigte " +
      "und Registereintrag.",
    datenschutzText:
      "Hier steht später, welche Daten bei einer Anmeldung erhoben werden, wozu sie verwendet " +
      "werden, wie lange sie gespeichert bleiben und welche Rechte Besucher haben.",
    hinweisJurist:
      "Beide Texte sollten vor der Veröffentlichung von einer fachkundigen Person geprüft " +
      "werden. Das gilt besonders, weil Minderjährige teilnehmen und später Zahlungen " +
      "abgewickelt werden.",
    keineCookies:
      "Diese Seite setzt keine Cookies, zählt keine Besucher und lädt nichts von fremden " +
      "Servern nach. Deshalb gibt es hier auch kein Zustimmungsfenster.",
  },

  platzhalter: {
    markierung: "Platzhalter",
    datum: "Datum wird noch bekannt gegeben",
    datumKurz: "Termin folgt",
    zeit: "Uhrzeit folgt",
    adresse: "Genaue Adresse folgt",
    email: "kontakt@beispiel.de",
    telefon: "Telefonnummer folgt",
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
