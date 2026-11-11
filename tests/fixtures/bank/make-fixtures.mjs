// Regenerates the synthetic bank CSVs in this folder (Windows-1252, like the real exports).
// Run: node tests/fixtures/bank/make-fixtures.mjs
// Scenario: one owner, five own accounts. Transfer pairs: Sparkasse→Kreditkarte (250),
// ING→DKB (500), Sparkasse→N26 (100). Each bank: an October file and an overlapping
// 25.10–30.11 file, two identical same-day rows, and one pending row.
import fs from "node:fs";

const dir = new URL("./", import.meta.url);
const enc1252 = s => Buffer.from([...s].map(ch => (ch === "€" ? 0x80 : ch === "–" ? 0x96 : ch.charCodeAt(0) & 0xff)));
const write = (name, lines) => fs.writeFileSync(new URL(name, dir), enc1252(lines.join("\r\n") + "\r\n"));
const de = minor => {
  const s = (Math.abs(minor) / 100).toFixed(2).split(".");
  return `${minor < 0 ? "-" : ""}${s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${s[1]}`;
};
const dmy = (iso, short) => { const [y, m, d] = iso.split("-"); return `${d}.${m}.${short ? y.slice(2) : y}`; };
const q = v => `"${String(v).replace(/"/g, '""')}"`;
const inRange = (rows, from, to) => rows.filter(r => r.d >= from && r.d <= to);
const booked = rows => rows.filter(r => !r.pending);
const sum = rows => booked(rows).reduce((s, r) => s + r.a, 0);
const newestFirst = rows => [...rows].sort((a, b) => (a.d < b.d ? 1 : a.d > b.d ? -1 : 0));

// ---------- Sparkasse (CSV-CAMT V2, all quoted, dd.mm.yy, no balance) ----------
const spk = [
  { d: "2026-10-01", p: "ACME GmbH", t: "Lohn/Gehalt 10/2026", a: 285000, k: "GUTSCHR. UEBERWEISUNG" },
  { d: "2026-10-02", p: "Hausverwaltung Schröder", t: "Miete Oktober Wohnung 3.OG", a: -98000, k: "DAUERAUFTRAG" },
  { d: "2026-10-05", p: "REWE Markt GmbH", t: "Kartenzahlung girocard; REWE Köln Filiale 4711", a: -4567, k: "KARTENZAHLUNG" },
  { d: "2026-10-12", p: "Stadtwerke München", t: "Strom Abschlag\nKundennr. 123456", a: -6200, k: "LASTSCHRIFT" },
  { d: "2026-10-27", p: "Bäckerei Müller", t: "Kartenzahlung girocard", a: -320, k: "KARTENZAHLUNG" },
  { d: "2026-10-27", p: "Bäckerei Müller", t: "Kartenzahlung girocard", a: -320, k: "KARTENZAHLUNG" },
  { d: "2026-10-28", p: "Visa Kreditkarte", t: "Ausgleich Kreditkarte 10/2026", a: -25000, k: "UEBERWEISUNG" },
  { d: "2026-10-29", p: "Max Müller", t: "Umbuchung auf N26", a: -10000, k: "UEBERWEISUNG" },
  { d: "2026-10-30", p: "AMAZON EU S.A R.L.", t: "Bestellung 302-1234567", a: -1999, k: "LASTSCHRIFT", pending: true },
  { d: "2026-10-31", p: "AMAZON EU S.A R.L.", t: "Bestellung 302-1234567", a: -1999, k: "LASTSCHRIFT", m2only: true },
  { d: "2026-11-02", p: "Hausverwaltung Schröder", t: "Miete November Wohnung 3.OG", a: -98000, k: "DAUERAUFTRAG" },
  { d: "2026-11-10", p: "dm-drogerie markt", t: "Kartenzahlung girocard", a: -1235, k: "KARTENZAHLUNG" },
  { d: "2026-11-30", p: "ACME GmbH", t: "Lohn/Gehalt 11/2026", a: 285000, k: "GUTSCHR. UEBERWEISUNG" },
  { d: "2026-11-28", p: "Bauhaus", t: "Kartenzahlung girocard", a: -4990, k: "KARTENZAHLUNG", pending: true },
];
function sparkasse(rows) {
  const head = ["Auftragskonto", "Buchungstag", "Valutadatum", "Buchungstext", "Verwendungszweck", "Glaeubiger ID", "Mandatsreferenz", "Kundenreferenz (End-to-End)", "Sammlerreferenz", "Lastschrift Ursprungsbetrag", "Auslagenersatz Ruecklastschrift", "Beguenstigter/Zahlungspflichtiger", "Kontonummer/IBAN", "BIC (SWIFT-Code)", "Betrag", "Waehrung", "Info"];
  return [head.map(q).join(";"), ...newestFirst(rows).map(r => [
    "DE44700500000012345678", dmy(r.d, true), dmy(r.d, true), r.k, r.t, "", "", "NOTPROVIDED", "", "", "", r.p, "DE02100100100006820101", "PBNKDEFFXXX", de(r.a), "EUR", r.pending ? "Umsatz vorgemerkt" : "Umsatz gebucht",
  ].map(q).join(";"))];
}
write("sparkasse-2026-10.csv", sparkasse(inRange(spk.filter(r => !r.m2only), "2026-10-01", "2026-10-31")));
write("sparkasse-2026-11.csv", sparkasse(inRange(spk.filter(r => !(r.pending && r.d < "2026-11-01")), "2026-10-25", "2026-11-30")));

// ---------- ING (info block above header, running Saldo, pending marked in Buchungstext) ----------
const ingOpen = 120000;
const ing = [
  { d: "2026-10-01", p: "Netflix International B.V.", k: "Lastschrift", t: "Netflix Monatsabo", a: -1399 },
  { d: "2026-10-03", p: "Lidl sagt Danke", k: "Lastschrift", t: "Lidl Filiale Düsseldorf", a: -2345 },
  { d: "2026-10-15", p: "Max Müller", k: "Gutschrift/Dauerauftrag", t: "Sparen DKB", a: -50000 },
  { d: "2026-10-20", p: "Apotheke am Markt", k: "Lastschrift", t: "Kartenzahlung", a: -890 },
  { d: "2026-10-26", p: "Café Größenwahn", k: "Lastschrift", t: "Kartenzahlung", a: -380 },
  { d: "2026-10-26", p: "Café Größenwahn", k: "Lastschrift", t: "Kartenzahlung", a: -380 },
  { d: "2026-10-30", p: "Deutsche Bahn", k: "Vorgemerkt", t: "Fahrkarte", a: -1500, pending: true },
  { d: "2026-11-01", p: "Netflix International B.V.", k: "Lastschrift", t: "Netflix Monatsabo", a: -1399 },
  { d: "2026-11-05", p: "Lidl sagt Danke", k: "Lastschrift", t: "Lidl Filiale Düsseldorf", a: -2899 },
  { d: "2026-11-18", p: "Müller Drogerie", k: "Lastschrift", t: "Kartenzahlung", a: -1150 },
];
function ingFile(rows, from, to, opening) {
  let bal = opening;
  const withBal = [...booked(rows)].sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0)).map(r => ({ ...r, bal: (bal += r.a) }));
  const pend = rows.filter(r => r.pending).map(r => ({ ...r, bal: bal }));
  const lines = [
    `Umsatzanzeige;Datei erstellt am: ${dmy(to)} 09:12`,
    ";Letztes Update: aktuell",
    "",
    "IBAN;DE12 5001 0517 0123 4567 89",
    "Kontoname;Girokonto",
    "Bank;ING",
    "Kunde;Max Müller",
    `Zeitraum;${dmy(from)} - ${dmy(to)}`,
    `Saldo;${de(bal)};EUR`,
    "",
    "Sortierung;Datum absteigend",
    "",
    "In der CSV-Datei finden Sie alle bereits gebuchten Umsätze. Die vorgemerkten Umsätze werden nicht aufgenommen, auch wenn sie in Ihrem Internetbanking angezeigt werden.",
    "",
    "Buchung;Wertstellungsdatum;Auftraggeber/Empfänger;Buchungstext;Verwendungszweck;Saldo;Währung;Betrag;Währung",
    ...newestFirst([...withBal, ...pend]).map(r => [dmy(r.d), dmy(r.d), r.p, r.k, r.t, de(r.bal), "EUR", de(r.a), "EUR"].join(";")),
  ];
  return lines;
}
write("ing-2026-10.csv", ingFile(inRange(ing, "2026-10-01", "2026-10-31"), "2026-10-01", "2026-10-31", ingOpen));
const ingBefore25 = ingOpen + sum(inRange(ing, "2026-10-01", "2026-10-24"));
write("ing-2026-11.csv", ingFile(inRange(ing.filter(r => !r.pending), "2026-10-25", "2026-11-30"), "2026-10-25", "2026-11-30", ingBefore25));

// ---------- DKB (2023+ format, info lines, Status column, dd.mm.yy) ----------
const dkbOpen = 300000;
const dkb = [
  { d: "2026-10-08", s: "Edeka Center", r: "Max Müller", t: "Kartenzahlung Edeka Grünstraße", a: -3110, k: "Ausgang" },
  { d: "2026-10-16", s: "Max Müller", r: "Max Müller", t: "Sparen DKB", a: 50000, k: "Eingang" },
  { d: "2026-10-22", s: "Max Müller", r: "Rundfunk ARD, ZDF, DRadio", t: "Rundfunkbeitrag Q4", a: -5508, k: "Ausgang" },
  { d: "2026-10-28", s: "Max Müller", r: "Späti Kreuzberg", t: "Kartenzahlung", a: -250, k: "Ausgang" },
  { d: "2026-10-28", s: "Max Müller", r: "Späti Kreuzberg", t: "Kartenzahlung", a: -250, k: "Ausgang" },
  { d: "2026-10-31", s: "Max Müller", r: "Spotify AB", t: "Premium", a: -999, k: "Ausgang", pending: true },
  { d: "2026-11-09", s: "Max Müller", r: "Edeka Center", t: "Kartenzahlung Edeka Grünstraße", a: -4420, k: "Ausgang" },
  { d: "2026-11-22", s: "Max Müller", r: "Rundfunk ARD, ZDF, DRadio", t: "Rundfunkbeitrag", a: -1836, k: "Ausgang" },
];
function dkbFile(rows, to, closing) {
  const head = ["Buchungsdatum", "Wertstellung", "Status", "Zahlungspflichtige*r", "Zahlungsempfänger*in", "Verwendungszweck", "Umsatztyp", "IBAN", "Betrag (€)", "Gläubiger-ID", "Mandatsreferenz", "Kundenreferenz"];
  return [
    [q("Konto"), q("Girokonto DE12120300000012345678")].join(";"),
    q(""),
    [q(`Kontostand vom ${dmy(to)}:`), q(`${de(closing)} €`)].join(";"),
    q(""),
    head.map(q).join(";"),
    ...newestFirst(rows).map(r => [dmy(r.d, true), dmy(r.d, true), r.pending ? "Vorgemerkt" : "Gebucht", r.s, r.r, r.t, r.k, "DE89370400440532013000", de(r.a), "", "", ""].map(q).join(";")),
  ];
}
const dkbM1 = inRange(dkb, "2026-10-01", "2026-10-31");
write("dkb-2026-10.csv", dkbFile(dkbM1, "2026-10-31", dkbOpen + sum(dkbM1)));
const dkbM2 = inRange(dkb.filter(r => !r.pending), "2026-10-25", "2026-11-30");
write("dkb-2026-11.csv", dkbFile(dkbM2, "2026-11-30", dkbOpen + sum(inRange(dkb, "2026-10-01", "2026-11-30"))));

// ---------- N26 (comma, ISO dates, dot decimals, foreign columns) ----------
const n26 = [
  { d: "2026-10-10", p: "Taobao.com", t: "Bestellung Hülle", a: -1361, oa: "-100.00", oc: "CNY", fx: "7.3475", k: "Mastercard Payment" },
  { d: "2026-10-21", p: "Döner König", t: "", a: -750, k: "Mastercard Payment" },
  { d: "2026-10-21", p: "Döner König", t: "", a: -750, k: "Mastercard Payment" },
  { d: "2026-10-30", p: "Max Müller", t: "Umbuchung auf N26", a: 10000, k: "Credit Transfer" },
  { d: "2026-10-31", p: "Kino Universum", t: "Tickets", a: -2400, k: "Pending", pending: true },
  { d: "2026-11-04", p: "Kino Universum", t: "Tickets", a: -2400, k: "Mastercard Payment" },
  { d: "2026-11-19", p: "Bäckerei Müller", t: "", a: -455, k: "Mastercard Payment" },
];
function n26File(rows) {
  const head = ["Booking Date", "Value Date", "Partner Name", "Partner Iban", "Type", "Payment Reference", "Account Name", "Amount (EUR)", "Original Amount", "Original Currency", "Exchange Rate"];
  return [head.map(q).join(","), ...[...rows].reverse().reverse().map(r => [r.d, r.d, r.p, "", r.k, r.t, "Hauptkonto", (r.a / 100).toFixed(2), r.oa || "", r.oc || "", r.fx || ""].map(q).join(","))];
}
write("n26-2026-10.csv", n26File(inRange(n26, "2026-10-01", "2026-10-31")));
write("n26-2026-11.csv", n26File(inRange(n26.filter(r => !r.pending), "2026-10-25", "2026-11-30")));

// ---------- Credit card (Soll/Haben, info lines, negative balance) ----------
const ccOpen = -15000;
const cc = [
  { d: "2026-10-03", t: "LUFTHANSA 2201234567890 FRANKFURT", soll: 18900 },
  { d: "2026-10-14", t: "Spotify P1234ABCD Stockholm", soll: 1099 },
  { d: "2026-10-19", t: "ROSSMANN GRÜNWALD", soll: 645 },
  { d: "2026-10-19", t: "ROSSMANN GRÜNWALD", soll: 645 },
  { d: "2026-10-29", t: "Zahlung – Danke", haben: 25000 },
  { d: "2026-10-31", t: "HOTEL ZÜRICHSEE ZÜRICH", soll: 12000, pending: true },
  { d: "2026-11-02", t: "HOTEL ZÜRICHSEE ZÜRICH", soll: 12000 },
  { d: "2026-11-14", t: "Spotify P1234ABCD Stockholm", soll: 1099 },
].map((r, i) => ({ ...r, a: r.haben ? r.haben : -r.soll, ref: `VX${String(77000 + i)}` }));
function ccFile(rows, from, to, closing) {
  const money = v => (v ? de(v) : "");
  return [
    "Kreditkartenumsätze",
    "Karte;Visa Gold **** 4242",
    `Abrechnungszeitraum;${dmy(from)} - ${dmy(to)}`,
    `Neuer Saldo;${de(closing)} EUR`,
    "",
    "Belegdatum;Buchungsdatum;Beschreibung;Soll;Haben;Status;Referenznummer",
    ...newestFirst(rows).map(r => [dmy(r.d), dmy(r.d), r.t, money(r.soll), money(r.haben), r.pending ? "vorgemerkt" : "gebucht", r.ref].join(";")),
  ];
}
const ccM1 = inRange(cc, "2026-10-01", "2026-10-31");
write("kreditkarte-2026-10.csv", ccFile(ccM1, "2026-10-01", "2026-10-31", ccOpen + sum(ccM1)));
const ccM2 = inRange(cc.filter(r => !r.pending), "2026-10-25", "2026-11-30");
write("kreditkarte-2026-11.csv", ccFile(ccM2, "2026-10-25", "2026-11-30", ccOpen + sum(inRange(cc, "2026-10-01", "2026-11-30"))));

// ---------- American Express Germany (comma, DD/MM/YYYY or DD.MM.YYYY, comma decimals; charges are positive) ----------
const amexDe = [
  { d: "2026-10-01", t: "REWE MARKT GMBH", a: 4567, dot: true },
  { d: "2026-10-03", t: "LUFTHANSA", a: 18900 },
  { d: "2026-10-08", t: "AMAZON MARKETPLACE", a: 1999 },
  { d: "2026-10-12", t: "Baeckerei Mueller", a: 320 },
  { d: "2026-10-15", t: "SPOTIFY", a: 1099 },
  { d: "2026-10-18", t: "ERSTATTUNG Baeckerei Mueller", a: -645 },
  { d: "2026-10-22", t: "DM DROGERIE", a: 1235 },
  { d: "2026-10-28", t: "ZAHLUNG ERHALTEN. VIELEN DANK", a: -20183 },
];
function amexDeFile(rows) {
  const head = ["Datum", "Beschreibung", "Betrag", "Karteninhaber", "Konto #", "Erweiterte Details", "Erscheint auf Ihrer Abrechnung als", "Adresse", "Stadt", "PLZ", "Land", "Betreff"];
  const slash = iso => { const [y, m, d] = iso.split("-"); return `${d}/${m}/${y}`; };
  return [
    head.map(q).join(","),
    ...rows.map(r => [r.dot ? dmy(r.d) : slash(r.d), r.t, de(r.a), "Zubin Li", "XXXX-12345", "", r.t, "", "Berlin", "10115", "Deutschland", ""].map(q).join(",")),
  ];
}
write("amex-de-2026-10.csv", amexDeFile(amexDe));

console.log("fixtures written");
