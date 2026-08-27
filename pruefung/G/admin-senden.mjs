/* Hilfsmittel: spricht die Server-Aktionen des Adminbereichs direkt an,
   genau wie ein Browser ohne JavaScript es täte. */
export const BASIS = "http://127.0.0.1:3213";

/**
 * Holt die versteckten Aktions-Felder aus GENAU EINEM Formular.
 *
 * `marker` ist ein Text, der nur in dem gesuchten Formular vorkommt
 * (z. B. `name="titel"`). Ohne diese Einschränkung würden die Felder
 * aller Formulare der Seite vermischt — auf der Bearbeiten-Seite also
 * Speichern, Löschen und Abmelden zusammen. Ein echter Browser sendet
 * immer nur die Felder des einen abgeschickten Formulars.
 */
export function actionFelder(html, marker) {
  const formulare = html.match(/<form[\s\S]*?<\/form>/g) ?? [];
  const passend = marker ? formulare.filter((f) => f.includes(marker)) : formulare;
  if (passend.length === 0) {
    throw new Error(`Kein Formular mit ${JSON.stringify(marker)} gefunden`);
  }
  // Mehrere Treffer sind in Ordnung, solange sie dieselbe Aktion
  // ansprechen — z. B. drei Status-Knöpfe je Anmeldung. Sie tragen
  // dann alle dieselbe Aktions-Kennung.
  const ersteId = (passend[0].match(/name="\$ACTION_ID_[0-9a-f]+"/) ?? [""])[0];
  if (!passend.every((f) => f.includes(ersteId))) {
    throw new Error(`Formulare mit ${JSON.stringify(marker)} sprechen verschiedene Aktionen an`);
  }
  const felder = {};
  const muster = /<input type="hidden" name="(\$ACTION[^"]*)"(?: value="([^"]*)")?\/>/g;
  let t;
  while ((t = muster.exec(passend[0])) !== null) {
    felder[t[1].replace(/&amp;/g, "&")] = (t[2] ?? "").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  }
  return felder;
}

export async function hole(pfad, cookie) {
  const a = await fetch(`${BASIS}${pfad}`, {
    headers: cookie ? { cookie } : {},
    redirect: "manual",
  });
  return { status: a.status, ziel: a.headers.get("location"), html: await a.text(),
           setCookie: a.headers.getSetCookie?.() ?? [] };
}

export async function sende(pfad, felder, werte, cookie, ip = "203.0.113.9") {
  const daten = new FormData();
  for (const [k, v] of Object.entries(felder)) daten.append(k, v);
  for (const [k, v] of Object.entries(werte)) daten.append(k, String(v));

  const kopf = { "x-forwarded-for": ip };
  if (cookie) kopf.cookie = cookie;

  const a = await fetch(`${BASIS}${pfad}`, {
    method: "POST", body: daten, redirect: "manual", headers: kopf,
  });
  return {
    status: a.status,
    ziel: a.headers.get("x-action-redirect") ?? a.headers.get("location"),
    setCookie: a.headers.getSetCookie?.() ?? [],
    text: await a.text(),
  };
}

/** Meldet sich an und liefert den Cookie-Kopf zurück. */
export async function anmelden(email, passwort, ip = "203.0.113.9") {
  const seite = await hole("/admin/login");
  const felder = actionFelder(seite.html, 'name="passwort"');
  const a = await sende("/admin/login", felder, { email, passwort }, null, ip);
  const keks = a.setCookie.find((c) => c.startsWith("vera_admin="));
  return { antwort: a, cookie: keks ? keks.split(";")[0] : null, rohKeks: keks };
}

/**
 * Markup zu lesbarem Text machen.
 *
 * React setzt zwischen zwei Textstuecke einen `<!-- -->`-Trenner. Im
 * Browser sieht man davon nichts, eine Textsuche im Markup findet aber
 * „5 Personen" nicht, weil dort „5<!-- --> Person<!-- -->en" steht.
 */
export function alsText(html) {
  return html
    // Skript- und Stilbloecke MIT Inhalt entfernen. Next.js legt das
    // komplette Woerterbuch als Datenpaket in ein <script> — eine
    // Textsuche im Markup findet darin Woerter, die auf der Seite
    // nirgends stehen. Genau das hat hier einen falschen Alarm erzeugt.
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
}
