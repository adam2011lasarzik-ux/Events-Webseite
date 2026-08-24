/* All English texts. Mirrors content/de.ts exactly. */

import type { Woerterbuch } from "./de";

export const en: Woerterbuch = {
  meta: {
    marke: "VERA",
    markeLang: "VERAnstaltung",
    beschreibung:
      "VERA runs sports and networking events. First up: a padel afternoon in Falkensee " +
      "for students, teachers and parents.",
    spracheName: "English",
    spracheKurz: "EN",
  },

  nav: {
    sprungmarke: "Skip to content",
    hauptmenue: "Main menu",
    menueOeffnen: "Open menu",
    menueSchliessen: "Close menu",
    event: "Event",
    schulen: "For schools",
    ueber: "About VERA",
    faq: "Questions",
    kontakt: "Contact",
    spracheWechseln: "Auf Deutsch wechseln",
  },

  aktion: {
    anmelden: "Register now",
    schuelerAnmelden: "Register a student",
    familieAnmelden: "Register a family",
    detailsAnsehen: "All event details",
    zumEvent: "See the event",
    eventAnsehen: "View event",
    zurueck: "Back to the home page",
  },

  startseite: {
    ueberschrift: "Our events",
    einleitung: "Sports and networking events where you try something new and meet people.",
    weitereFolgen: "More events are coming soon.",
  },

  hero: {
    augenbraue: "Padel · Falkensee",
    titelZeile1: "Never played?",
    titelZeile2: "That's exactly the point.",
    text:
      "An afternoon of padel for students, teachers and parents. Rackets are provided on " +
      "site — and a coach is there too, happy to answer questions, explain the sport, and " +
      "run a few first exercises with you if you'd like.",
    hinweisFoto: "A photo of the court goes here later",
    videoBeschreibung: "Short video from the padel court",
  },

  plaetze: {
    ueberschrift: "Places",
    wenigeEiner: "Only 1 place left",
    wenigeMehrere: "Only {n} places left",
    ausgebucht: "Sold out",
    gesamt: "{n} places",
  },

  preise: {
    ueberschrift: "What it costs",
    einleitung:
      "All prices are per person for the day and include VAT. Rackets, balls and coaching " +
      "are included. Food and drinks can be bought separately on site.",
    schueler: "Students",
    schuelerHinweis: "Children and teens",
    erwachsener: "Adults",
    erwachsenerHinweis: "Parents and guests",
    familie: "Family",
    familieHinweis: "2 adults + 1 student",
    familieZusatz: "each additional student {betrag}",
    ab: "from",
    proPerson: "per person",
  },

  padel: {
    ueberschrift: "So what is padel?",
    absaetze: [
      "Padel is tennis's easy-going cousin. You always play four to a court roughly a third " +
        "the size of a tennis court — enclosed by glass walls the ball bounces off and stays " +
        "in play.",
      "You serve underarm, the racket has no strings, and the walls are part of the game " +
        "rather than the end of it. That's why most people get into a real rally within " +
        "minutes of starting.",
      "Alongside the doubles courts (4 players, 20 × 10 metres) we also have 2 single " +
        "courts, where 2 players go head-to-head on a 6 × 10 metre court.",
    ],
    fakten: [
      { zahl: "4", text: "players, always" },
      { zahl: "20 × 10", text: "metres of court" },
      { zahl: "0", text: "experience needed" },
    ],
  },

  ablauf: {
    ueberschrift: "How the day works",
    schritte: [
      {
        titel: "Register",
        text:
          "Pick who's coming and sign up. Places are limited, and you see the full price " +
          "before you commit.",
      },
      {
        titel: "Arrive",
        text:
          "Rackets and balls are ready for you. There's a short introduction, then everyone " +
          "is put into groups of four.",
      },
      {
        titel: "Play",
        text:
          "You play in groups while coaches give tips. Break at the buffet in between — " +
          "then back on court.",
      },
    ],
  },

  schulen: {
    ueberschrift: "For schools",
    kurz:
      "Would you like to bring a class or a course? Send us an email — we'll work out the " +
      "date, group size and schedule individually with you.",
    mehr: "More for schools",
    titel: "Padel for school groups",
    absaetze: [
      "The padel afternoon works well for PE lessons, project days and class trips. The " +
        "sport is quick to explain, physically manageable for everyone, and works in mixed " +
        "groups with very different ability levels.",
      "A session takes place during school hours, between 8am and 3pm, and lasts 90 " +
        "minutes. Up to 20 people play on the court at the same time.",
      "For school groups, booking doesn't happen through the website: date, number of " +
        "participants and every other detail are arranged individually by email. Just get " +
        "in touch at the address below.",
    ],
    punkte: [
      "No experience required",
      "Equipment provided",
      "90 minutes, during school hours (8am–3pm)",
      "Up to 20 people on the court at once",
    ],
  },

  ueber: {
    ueberschrift: "About VERA",
    absaetze: [
      "VERA is short for VERAnstaltung, the German word for event. The name is deliberately " +
        "plain, because the idea is too: we run days where people try something they wouldn't " +
        "otherwise have tried.",
      "It starts with padel in Falkensee — for students and their parents, with no experience, " +
        "no gear of your own and no club membership needed.",
      "More events will follow: other sports, and later networking events too. The idea stays " +
        "the same.",
    ],
  },

  faq: {
    ueberschrift: "Common questions",
    eintraege: [
      {
        frage: "I've never played padel. Is that a problem?",
        antwort:
          "Quite the opposite — that's what the day is for. Most people arrive with no " +
          "experience at all, and coaches explain everything from scratch.",
      },
      {
        frage: "What do I need to bring?",
        antwort:
          "Sportswear, clean indoor shoes and a towel. Rackets and balls are provided on site.",
      },
      {
        frage: "My child is under 18. Who registers?",
        antwort:
          "A parent or legal guardian registers and confirms the participation. From 18 " +
          "onwards you can register yourself.",
      },
      {
        frage: "Can parents play too?",
        antwort:
          "Yes, absolutely. There's a separate adult price and a cheaper family package. " +
          "Watching from the side is of course also fine.",
      },
      {
        frage: "How do I pay?",
        antwort:
          "We're settling that right now and will announce it well before registration opens. " +
          "The full price is already visible to you here.",
      },
      {
        frage: "When does registration open?",
        antwort:
          "As soon as the date and time are fixed. Drop us a line and we'll let you know.",
      },
    ],
  },

  cta: {
    ueberschrift: "Ready for your first rally?",
    text: "Pick who's coming and see what it costs.",
  },

  anmeldung: {
    titel: "Registration",
    einleitung:
      "Put together who's coming. The price updates instantly below — so you know exactly " +
      "where you stand before you commit.",
    frageWen: "Who are you registering?",
    wahlSelbst: "Myself",
    wahlSelbstHinweis: "18 and over",
    wahlKind: "My child",
    wahlKindHinweis: "As parent or guardian",
    wahlFamilie: "Family package",
    wahlFamilieHinweis: "2 adults + students",

    selbstFrage: "Which applies to you?",
    selbstSchueler: "I'm a student",
    selbstErwachsener: "I'm an adult",

    kindFrage: "How many students under 18 are you registering?",
    kindMitkommen: "I'm coming along too",

    familieFrage: "How many students are coming?",
    familieEnthalten: "2 adults are included in the package",

    anzahlErhoehen: "One more",
    anzahlVerringern: "One fewer",
    anzahlSchueler: "Number of students",

    summe: "Total",
    personEiner: "1 person",
    personMehrere: "{n} people",
    inklMwst: "incl. VAT",
    keineAuswahl: "Choose above who's coming along.",

    nochNichtTitel: "Registration opens shortly",
    nochNichtText:
      "The date and time aren't fixed yet. So you can look at the price here, but not yet " +
      "register bindingly — nothing is sent and nothing is stored. Write to us if you'd like " +
      "us to tell you when it opens.",
    nochNichtAktion: "Write to us",

    minderjaehrigTitel: "For participants under 18",
    minderjaehrigText:
      "When a parent registers, the registration covers the child. Guardian consent is " +
      "collected during registration.",

    vorschau: {
      ueberschrift: "What the later form will look like",
      hinweis:
        "A preview of what you'll be asked for later. The fields can't be filled in yet — " +
        "nothing is saved or sent.",
      labelVorname: "First name",
      labelNachname: "Last name",
      labelEmail: "Email address",
      labelTelefon: "Phone number",
      gruppeMeineAngaben: "Your details",
      gruppeEltern: "Parent's / guardian's details",
      gruppeErwachsenerN: "Adult {n}",
      gruppeSchuelerN: "Student {n}",
    },
  },

  kontakt: {
    ueberschrift: "Contact",
    einleitung:
      "Questions about the event, about registering, or about bringing a school class? " +
      "Just write to us.",
    email: "Email",
    telefon: "Phone",
    ort: "Location",
  },

  event: {
    wann: "When",
    wo: "Where",
    preis: "Price",
    dabei: "What's included",
    mitbringen: "What to bring",
    naechstesEvent: "Next event",
    fotoAlt: "A player with a racket on the padel court",
  },

  recht: {
    impressum: "Legal notice",
    datenschutz: "Privacy",
    impressumTitel: "Legal notice",
    datenschutzTitel: "Privacy policy",
    platzhalterTitel: "This page hasn't been filled in yet",
    impressumText:
      "The legally required details go here later: the provider's name and address, contact " +
      "details and, where applicable, legal form, authorised representatives and register entry.",
    datenschutzText:
      "This will later explain which data is collected during registration, what it is used " +
      "for, how long it is kept and what rights visitors have.",
    hinweisJurist:
      "Both texts should be reviewed by a qualified professional before going live. That " +
      "matters especially because minors take part and payments will be handled later.",
    keineCookies:
      "This site sets no cookies, counts no visitors and loads nothing from third-party " +
      "servers. That's why there's no consent banner here.",
  },

  platzhalter: {
    markierung: "Placeholder",
    datum: "Date to be announced",
    datumKurz: "Date to follow",
    zeit: "Time to follow",
    adresse: "Exact address to follow",
    email: "contact@example.com",
    telefon: "Phone number to follow",
  },

  footer: {
    claim: "Sports and networking events.",
    seiten: "Pages",
    rechtliches: "Legal",
    kontaktUeberschrift: "Contact",
    rechte: "© {jahr} VERA. All rights reserved.",
  },
};
