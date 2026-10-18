# Life Ledger Produktübersicht

[English](SHOWCASE.md) · [简体中文](SHOWCASE.zh-CN.md) · [Deutsch](SHOWCASE.de-DE.md) · [Zur deutschen README](../README.de-DE.md)

Life Ledger verbindet tägliche Gewohnheiten, konkrete Planung und ausführliche Reflexion in einem lokalen, selbstbestimmten Arbeitsbereich. Alle Screenshots enthalten ausschließlich fiktive Beispieldaten. Version 3.6 führt ein modulares natives Dashboard ein: anpassbare und einklappbare Blasen-Karten in Heute und Woche, ein Monatsgitter für Gewohnheiten, Wochen-Insights und Haarlinien-Grafiken.

## Desktop

16. Oktober, nur Heute: originale Website-Farben, maximal 1236px Zeichenfläche, quadratische Größen und kompakte Vier-Gewohnheiten-Vorgabe. Die Galerie enthält neue 1920px-/1000px-Belege. Isolierte Webansichten, keine Abnahme einer installierten Mac-App; visuelle Bestätigung steht aus.

**Web-Heute-Raster (18. Oktober):** einrastende Karten, per Ziehen sortierbar, Größen nur wo sich der Inhalt ändert; die Monatskarte zeigt die Stimmung. Fiktive Daten, nur Web. <img src="today-widgets/grid/today-de-desktop-light.png" alt="Deutsches Web-Heute-Raster"><img src="today-widgets/grid/today-de-mobile.png" width="300" alt="Handy: eine Spalte, gleiche Reihenfolge">

**Heute-Korrektur:** [Echte Standardanordnung, Größen-/Drag-Aufnahme und Prüfungen](local-web/today-repair/index.html). Keine nur für Screenshots gesetzten Positionen. <img src="local-web/today-repair/today-1440-de-light.png" alt="Deutsche Heute-Standardanordnung"><img src="local-web/today-repair/today-390-de-light.png" width="300" alt="Mobile Leseansicht mit fiktiven Einträgen">

**Korrektur schmaler Fenster:** Bei 800px bleiben Seitenleiste und Inhalt nebeneinander; Aktionen und Datum stehen in getrennten Zeilen. [Desktop](local-web/breakpoints/today-800-de-light.png) · [Mobile Grenze](local-web/breakpoints/today-760-de-light.png) · [Regression](local-web/breakpoints/results.json). Isolierte Browserprüfung, keine Abnahme einer installierten macOS-App.

**Echte lokale Website:** Nach `npm run preview:local` [direkt ausprobieren](http://127.0.0.1:43117/?mode=local&lang=de&preview=local). Gemeinsame Seiten/Karten mit Tauri, keine simulierte native Titelleiste. [Aufnahme und Prüfung](local-web/index.html). Nur die Bilder nutzen fiktive Daten; die lokale App speichert getrennte Browserdaten.

<img src="local-web/today-de-light.png" alt="Deutsche lokale Website mit gemeinsamem Arbeitsbereich" />
<img src="local-web/habits-390-de.png" width="300" alt="Deutsche mobile Website mit erreichbaren Einstellungen" />

**Integrierter Fensterrahmen:** [Aufnahme und Prüfung](integrated-shell/index.html). Einheitliche Titelleiste, abgerundeter Rahmen, einklappbare Navigation und lokale Profileinstellungen. Native macOS-Knöpfe werden in Chromium nicht imitiert; nicht paketiert oder installiert.

<img src="integrated-shell/today-de-light.png" alt="Deutscher integrierter Desktop-Rahmen" />
<img src="integrated-shell/habits-390-de.png" width="300" alt="Deutsches mobiles Layout ohne Desktop-Titelleiste" />

**Horizont / Gewohnheiten:** [Aufnahme und Vergleich](horizon-habits/index.html). Angehefteter Phasenfokus, datierte Planschritte, Archiv-Momentaufnahmen, Monatsrückblick und einheitliche Gewohnheitsbibliothek. Vorhandene Daten/Symbole bleiben; fiktive Beispiele, nicht installiert.

<img src="horizon-habits/horizon-de-dark.png" alt="Deutscher Horizont mit angeheftetem Phasenfokus und Plankarten" />
<img src="horizon-habits/habits-de-dark.png" alt="Deutsche Gewohnheitsbibliothek mit Suche und Einstellungen" />

**Zeitleiste / Einblicke:** [Aufnahme und Vergleich](timeline-insights/index.html). Tages-, Wochen- und Monatsansicht auf einer vertikalen Achse, Texte zuerst und Wochenfotos auf Wunsch. Einblicke zeigen Erfassung, erkundbare Trends, vorhandene Gewohnheitssymbole und separate Periodenziele. Fiktive Daten; Bestätigung ausstehend, nicht installiert.

<img src="timeline-insights/insights-de-dark.png" alt="Deutsche Einblicke mit Erfüllung, Erfassung und nachvollziehbaren Beobachtungen" />

**Aktueller Woche-/Zeitleiste-Prüfstand:** [Aufnahme und Sprachvergleich](week-reflection/index.html). Wochenreflexion, schreibgeschützter Wochenkalender, Einblicke und Ziele; Zeitleiste mit Wochentexten und passenden Fotos. Begrüßung fest breit, Stimmung klein und quadratisch. Fiktive Kalender-/Bilddaten, noch nicht installiert oder visuell bestätigt.

<img src="week-reflection/timeline-de-light.png" alt="Wochenzeitleiste mit vorhandenen Texten und gleichwöchigen Bildbeispielen" />

**Aktuelle Wochenansicht/gemeinsame Oberflächen:** [Aufnahme und mehrsprachige helle/dunkle Bilder](week-polish/index.html). Sieben-Tage-Auswahl, ursprüngliche Symbole, Ziele und Reflexion ohne verschachteltes Scrollen; Today nutzt dieselbe neue äußere Gestaltung. Fiktive Daten; noch nicht installiert oder visuell bestätigt.

<img src="week-polish/week-de-light.png" alt="Echte Wochenansicht mit Tagesauswahl und ursprünglichen Gewohnheitssymbolen" />

**Aktueller Prüfstand: Wetter und Widget-Bibliothek.** [Echte Interaktionsaufnahme und helle/dunkle Ansichten](today-widgets/weather-gallery/index.html). Temperatur- und Zeitachsen mit Maus-/Tastatursteuerung; aktuelles Wetter bleibt separat. Alle 11 vorhandenen Widgets stehen im Katalog, nicht hinzugefügte Karten belegen keinen Platz im Bearbeitungsraster. Noch keine installierte Veröffentlichung; Stimmung und Monats-Heatmap folgen später.

<img src="today-widgets/weather-gallery/today-de-light.png" alt="Aktueller Prüfstand mit Temperaturkurve, Wetterchip und separater Widget-Bibliothek" />

**Optionaler Widget-Prüfstand:** Stimmung, achtstufige Gewohnheits-Heatmap, lokale Foto/GIF/Videowand und stündliches Wetter; einheitliche S/M/L-Querformate plus quadratisches L. Neue Widgets sind zunächst ausgeblendet; bestehende Layouts bleiben erhalten. [Größen und Grenzen](today-widgets/README.md). Das Wetter im Bild ist simuliert, nicht live. Noch nicht paketiert oder vom Nutzer visuell bestätigt.

[Echte Bearbeitungsaufnahme ansehen](today-widgets/edit-cards/index.html): feste Karten im Normalmodus, karteneigene Einstellungen nur beim Bearbeiten, vollständiger Monat und kleine Heatmap-Punkte.

<img src="today-widgets/edit-cards/normal-de-light.png" alt="Deutsches Today mit Monats-Heatmap ohne dauerhafte Einstellungen" />

### Heute: planen und reflektieren

<img src="today-web-parity/screens/today-desktop-1440-de-light.png" alt="Heute-Entwurf mit vorhandenen Symbolen und drei Widget-Größen" />

Heute 2.0 führt die modulare Widget-Plattform ein: ein responsives 12-Spalten-Raster mit Übersicht, Gewohnheiten, Kalender, Fokus, Fotos, Reflexion und Kontext, diskreten Größen S, M und L mit jeweils eigener Inhaltshierarchie, direktem Drag-and-Drop ohne Easing, Tastaturnavigation und Transaktions-Undo.

**Heute-Prüfstand:** Die Desktop-Ansicht verwendet die Web-Farben und vorhandenen Symbole. S zeigt eine priorisierte Gewohnheit, M vier Gewohnheiten und L die vollständige horizontale Liste. Ein Klick auf die Kachel markiert sie als erledigt. Die Screenshots stammen aus einem isolierten Headless-Browser mit fiktiven Daten; dieser Stand ist noch nicht paketiert oder vom Nutzer visuell bestätigt.

### Tagesrückblick

<img src="images/demo-preview/de-desktop/de-02-daily-review-v5.png" alt="Gewohnheiten, Stimmung und Journal im Tagesrückblick" />

Öffne einen vergangenen oder den aktuellen Tag, um Gewohnheiten, Stimmung und Notizen zu ergänzen, ohne den Monat zu verlassen.

### Woche: Vorhaben und Rückblick

<img src="images/demo-preview/de-desktop/de-03-weekly-plan-v5.png" alt="Wochenziele und Wochenrückblick auf dem Desktop" />

Erledigte Wochenziele bleiben als sichtbarer Fortschritt erhalten. Der Rückblick bietet ausreichend Raum für zusammenhängende Gedanken.

### Monatsrückblick: ein geschriebener Monat

<img src="images/demo-preview/de-desktop/de-04-monthly-review-v5.png" alt="Monatsrückblick als Dokument mit kurzem Erledigungstrend" />

Der Monat beginnt mit einer 7/30/90-Tage-Erledigungsquote, Serien und einem Trend, danach die Reflexion. Gewohnheitswerte bleiben im Inspektor. Heute ist zweispaltig, die Zeitleiste legt die Journalseite neben den Monat. Bis zu drei private Fotos eines Tages bleiben auf diesem Gerät.

### Fokus: sehen, wohin die Zeit geflossen ist

<img src="images/demo-preview/de-desktop/de-05-focus-month-v5.png" alt="Monatliche Fokuszeit-Auswertung auf dem Desktop" />

Vergleiche Fokusminuten nach Thema und erkenne deinen Rhythmus in einer Monats-Heatmap – ohne Fortschritt auf Session-Zahlen zu reduzieren.

### Zeitleiste: gelebte Tage wiedersehen

<img src="images/demo-preview/de-desktop/de-07-timeline-v5.png" alt="Stimmung, Reflexion und private Fotoerinnerungen in der Life-Ledger-Zeitleiste" />

Durchlaufe eine private Chronik aus Stimmungen, Gründen, Journal-Kontext und komprimierten Fotoerinnerungen. Beispieldaten und Bild sind vollständig fiktiv.

### Gewohnheiten: Regeln dürfen sich entwickeln

<img src="images/demo-preview/de-desktop/de-06-habit-settings-v5.png" alt="Gewohnheitseinstellungen auf dem Desktop" />

Gewohnheiten können täglich, wöchentlich oder monatlich gelten, in die Tageswertung einfließen oder davon ausgenommen werden und sich ab einem gewählten Datum ändern, ohne die Historie umzuschreiben.

## Mobil

<img src="horizon-habits/longrange-390-de.png" width="390" alt="Deutscher mobiler Horizont mit kompakter angehefteter Phase" />

<img src="timeline-insights/timeline-390-de.png" width="390" alt="Deutsche mobile Wochenzeitleiste" />

Die mobile Oberfläche verwendet eine feste Navigation am unteren Rand und macht den Tagesrückblick zu einem fokussierten, nahezu bildschirmfüllenden Bereich.

<table>
  <tr>
    <td width="33%"><img src="today-web-parity/screens/today-mobile-390-de-light.png" alt="Tagesplanung auf dem Smartphone" /></td>
    <td width="33%"><img src="images/demo-preview/de-mobile/de-02-daily-review-v5.png" alt="Tagesrückblick auf dem Smartphone" /></td>
    <td width="33%"><img src="images/demo-preview/de-mobile/de-03-weekly-plan-v5.png" alt="Wochenplanung auf dem Smartphone" /></td>
  </tr>
  <tr>
    <td align="center"><strong>Heute</strong></td>
    <td align="center"><strong>Tagesrückblick</strong></td>
    <td align="center"><strong>Woche</strong></td>
  </tr>
  <tr>
    <td width="33%"><img src="images/demo-preview/de-mobile/de-04-monthly-review-v5.png" alt="Monatsrückblick auf dem Smartphone" /></td>
    <td width="33%"><img src="images/demo-preview/de-mobile/de-05-focus-month-v5.png" alt="Fokusauswertung auf dem Smartphone" /></td>
    <td width="33%"><img src="images/demo-preview/de-mobile/de-06-habit-settings-v5.png" alt="Gewohnheitseinstellungen auf dem Smartphone" /></td>
  </tr>
  <tr>
    <td align="center"><strong>Rückblick</strong></td>
    <td align="center"><strong>Fokus</strong></td>
    <td align="center"><strong>Gewohnheiten</strong></td>
  </tr>
</table>

<p align="center">
  <img src="images/demo-preview/de-mobile/de-07-timeline-v5.png" width="33%" alt="Life-Ledger-Zeitleiste auf dem Smartphone" />
</p>
<p align="center"><strong>Zeitleiste</strong> · Stimmung, Kontext und Fotoerinnerungen bleiben auch auf kleinen Bildschirmen gut lesbar.</p>

## Weiter

- [Life Ledger jetzt auf Deutsch verwenden](https://zubin-li.github.io/life-ledger-deep-review/?mode=local&lang=de)
- [Auf Cloudflare selbst hosten](self-hosting.md)
- [Cloudflare Access konfigurieren](cloudflare-access.md)
