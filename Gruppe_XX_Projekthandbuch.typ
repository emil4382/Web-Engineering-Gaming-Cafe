// =====================================================================
//  PROJEKTHANDBUCH  –  PixelForge (Web-Portal fuer ein Gaming-Cafe)
//  Vorlesung Webengineering / Projektmanagement  –  DHBW
//  Direkt kompilierbar mit:  typst compile Gruppe_XX_Projekthandbuch.typ
// =====================================================================

// ---------- Stammdaten (bitte ausfuellen) ----------
#let gruppe     = "XX"        // TODO: Gruppennummer eintragen
#let mn_cedric  = "0000000"   // TODO: Matrikelnummer Cedric Malsch
#let mn_artem   = "0000000"   // TODO: Matrikelnummer Artem Bas
#let mn_emil    = "0000000"   // TODO: Matrikelnummer Emil Rilk

// ---------- Farben ----------
#let accent  = rgb("#E2001A")   // DHBW-Rot
#let dark    = rgb("#3C3C3B")
#let blue    = rgb("#5B9BD5")
#let grey    = rgb("#BFBFBF")
#let cgreen  = rgb("#2E7D32")
#let camber  = rgb("#B8860B")
#let cred    = rgb("#C0392B")
#let mgreen  = rgb("#C6E0B4")
#let myellow = rgb("#FFE699")
#let mred    = rgb("#F4A7A7")

// ---------- Seiten- & Textlayout ----------
#set page(paper: "a4", margin: (top: 2.2cm, bottom: 2cm, left: 2.2cm, right: 2cm))
#set text(font: ("Inter", "Segoe UI", "Liberation Sans", "DejaVu Sans"), size: 11pt, lang: "de")
#set par(justify: true, leading: 0.65em)

#show heading.where(level: 1): set text(fill: accent, size: 16pt)
#show heading.where(level: 2): set text(fill: dark, size: 13pt)
#show heading.where(level: 3): set text(fill: dark, size: 11.5pt)
#show heading: it => { it; v(0.2em) }

// ---------- Hilfsfunktionen ----------
#let hc(c) = table.cell(fill: accent, align: left + horizon)[#text(fill: white, weight: "bold", size: 9pt)[#c]]
#let zebra = (x, y) => if y > 0 and calc.even(y) { luma(247) } else { none }
#let dot(c) = box(baseline: 1pt, circle(radius: 4pt, fill: c))

#let st_open = text(fill: cred)[offen]
#let st_prog = text(fill: camber)[in Arbeit]
#let st_done = text(fill: cgreen)[erledigt]

// =====================================================================
//  TITELBLATT (Frontblatt)
// =====================================================================
#align(center)[
  #v(0.8cm)
  #text(size: 11pt, fill: dark, weight: "bold")[DUALE HOCHSCHULE BADEN-WUERTTEMBERG]
  #v(0.1cm)
  #text(size: 11pt, fill: dark)[Vorlesung Webengineering — Projektmanagement]
  #v(2.2cm)

  #block(width: 100%, inset: 0pt)[
    #line(length: 100%, stroke: 1.2pt + accent)
    #v(0.4cm)
    #text(size: 30pt, weight: "bold", fill: dark)[Projekthandbuch]
    #v(0.25cm)
    #text(size: 17pt, fill: accent, weight: "bold")[PixelForge]
    #v(0.1cm)
    #text(size: 13pt, fill: dark)[Web-Portal fuer ein Gaming-Cafe]
    #v(0.4cm)
    #line(length: 100%, stroke: 1.2pt + accent)
  ]
  #v(1.6cm)

  #set text(size: 11pt)
  #table(
    columns: (auto, auto),
    align: (right, left),
    stroke: none,
    inset: (x: 8pt, y: 5pt),
    [#text(weight: "bold")[Gruppe:]], [Gruppe #gruppe],
    [#text(weight: "bold")[Projektauftraggeber:]], [Frank Merkel],
    [#text(weight: "bold")[Projektleitung:]], [Cedric Malsch],
    [#text(weight: "bold")[Dokumenttyp:]], [Projekthandbuch (gemaess Vorgabe)],
    [#text(weight: "bold")[Version / Stand:]], [1.0 — 17.07.2026],
  )
  #v(1.0cm)

  #text(size: 12pt, weight: "bold", fill: dark)[Projektteam]
  #v(0.3cm)
  #table(
    columns: (auto, auto, auto),
    align: (left, left, left),
    inset: (x: 10pt, y: 6pt),
    stroke: 0.5pt + luma(210),
    fill: zebra,
    table.header(hc[Name], hc[Matrikelnummer], hc[Projektrolle]),
    [Cedric Malsch], [#mn_cedric], [Projektleitung & Backend-Entwicklung],
    [Artem Bas], [#mn_artem], [Frontend-Entwicklung],
    [Emil Rilk], [#mn_emil], [Konzeption, Design & Qualitaetssicherung],
  )
  #v(1.2cm)
  #block(width: 90%, inset: 8pt, radius: 4pt, fill: luma(245), stroke: 0.5pt + grey)[
    #set text(size: 9.5pt, fill: dark)
    #align(left)[*Hinweis zur Gruppengroesse:* Gemaess der in der Aufgabenstellung
    genannten Ausnahmeregelung (Gruppen von 4, ausnahmsweise 3 Studierenden) besteht
    dieses Projektteam aus 3 Studierenden.]
  ]
]

#pagebreak()

// =====================================================================
//  INHALTSVERZEICHNIS
// =====================================================================
#outline(title: text(size: 16pt, weight: "bold", fill: accent)[Inhaltsverzeichnis], indent: auto, depth: 2)

#pagebreak()

// ---------- ab hier Kopf-/Fusszeile + Seitenzahlen ----------
#set page(
  header: context {
    set text(size: 8pt, fill: luma(120))
    grid(columns: (1fr, auto), [Projekthandbuch — PixelForge], [Gruppe #gruppe])
    line(length: 100%, stroke: 0.5pt + luma(190))
  },
  footer: context {
    line(length: 100%, stroke: 0.5pt + luma(190))
    set text(size: 8pt, fill: luma(120))
    grid(columns: (1fr, auto),
      [Version 1.0 — 17.07.2026],
      [Seite #counter(page).display() / #context counter(page).final().first()])
  },
  numbering: "1",
)
#counter(page).update(1)
#set heading(numbering: "1.1")

// =====================================================================
= Einleitung und Projektueberblick
// =====================================================================

== Zweck des Projekthandbuchs
Dieses Projekthandbuch dokumentiert das Projekt *PixelForge* — die Entwicklung eines
Web-Portals fuer ein Gaming-Cafe — vollstaendig und nachvollziehbar. Es buendelt alle
wesentlichen Planungs-, Organisations- und Steuerungsartefakte des Projekts und wurde
sukzessive zur Vorlesung Webengineering erarbeitet. Da der Leser das Projekt nicht
zwingend kennt, erklaeren die folgenden Abschnitte das Vorhaben (Projektauftrag), die
gewaehlten Loesungen sowie die eingesetzten Methoden jeweils im konkreten Fall.

== Projektkurzbeschreibung
PixelForge ist ein fiktives Gaming-/Internet-Cafe. Im Rahmen des Projekts wird ein
Web-Portal entwickelt, ueber das Gaeste sich registrieren, freie PC-Plaetze ueber einen
Sitzplan reservieren, Teams gruenden sowie an Turnieren (Valorant, League of Legends,
Counter-Strike, FIFA) teilnehmen koennen. Die in den Turnieren erzielten Platzierungen
werden vom Cafe-Personal erfasst und fliessen automatisch in oeffentliche Bestenlisten
(Leaderboards) ein. Technisch wird das Portal als klassische Web-Anwendung umgesetzt:
ein Frontend (HTML5, CSS3, JavaScript als ES-Module), ein Backend (Node.js mit Express,
geschichtete Architektur) sowie eine relationale Datenbank (MySQL/MariaDB).

#v(0.3em)
#block(width: 100%, inset: 8pt, radius: 4pt, fill: luma(246), stroke: 0.5pt + grey)[
  #set text(size: 9.5pt)
  *Projektsteckbrief*
  #table(
    columns: (auto, 1fr),
    stroke: none,
    inset: (x: 6pt, y: 3pt),
    [*Projektname:*], [PixelForge — Web-Portal fuer ein Gaming-Cafe],
    [*Auftraggeber:*], [Frank Merkel],
    [*Projektleitung:*], [Cedric Malsch],
    [*Team:*], [Cedric Malsch, Artem Bas, Emil Rilk (3 Studierende)],
    [*Laufzeit:*], [16.03.2026 (KW 12) bis 17.07.2026 (KW 29) — ca. 4 Monate],
    [*Geplantes Budget:*], [72.000 EUR (inkl. Risikopuffer)],
    [*Vorgehensmodell:*], [Hybrid: klassische Phasenplanung + Scrum in der Umsetzung],
  )
]

== Methodisches Vorgehen
Das Projekt folgt einem *hybriden Vorgehensmodell*. Die uebergeordnete Struktur
(Phasen, Meilensteine, Projektstrukturplan, Gantt-Diagramm, Ressourcen- und
Kostenplanung) wird klassisch geplant, da Termine, Budget und Abnahmen gegenueber dem
Auftraggeber verbindlich zu vereinbaren sind. Innerhalb der Umsetzungsphasen
(Frontend- und Backend-Entwicklung) wird *Scrum* mit Product Backlog, Sprint Backlogs
und zweiwoechigen Sprints eingesetzt, um flexibel auf Erkenntnisse reagieren zu koennen.
Bei allen Entscheidungen wird das *magische Projektdreieck* aus Leistung, Kosten und
Zeit ausbalanciert.

== Verantwortlichkeiten im Projekthandbuch
Die folgende Verantwortlichkeitsmatrix kennzeichnet, wer fuer welche Inhalte
hauptverantwortlich ist (V) und wer mitwirkt (M). Damit ist fuer jedes Kapitel eindeutig
erkennbar, wer es erstellt hat.

#table(
  columns: (auto, 1fr, auto, auto),
  inset: (x: 7pt, y: 5pt),
  align: (center, left, center, center),
  stroke: 0.5pt + luma(210),
  fill: zebra,
  table.header(hc[Kap.], hc[Inhalt], hc[Verantwortlich (V)], hc[Mitwirkende (M)]),
  [2], [Protokolle], [rotierend (s. Kap. 2)], [alle],
  [3], [Projektauftrag], [Cedric Malsch], [Emil Rilk],
  [4], [Projektziele], [Emil Rilk], [Cedric, Artem],
  [5], [Phasen- und Meilensteinplan], [Cedric Malsch], [alle],
  [6], [Projektorganisation & Organigramm], [Cedric Malsch], [alle],
  [7], [Offene-Punkte-Liste (OPL)], [Artem Bas], [alle],
  [8], [Projektstrukturplan (PSP)], [Emil Rilk], [alle],
  [9], [Arbeitspaketbeschreibungen], [je Autor (s. Kap. 9)], [—],
  [10], [Gantt-Diagramm & kritischer Pfad], [Artem Bas], [Cedric],
  [11], [Ressourcen- & Kostenplanung], [Cedric Malsch], [Emil],
  [12], [Risikomanagement], [Emil Rilk], [alle],
  [13], [Stakeholdermanagement], [Artem Bas], [Emil],
  [14], [Projektstatusbericht], [Cedric Malsch], [alle],
  [15], [Product & Sprint Backlog], [Artem Bas], [Cedric, Emil],
)

#pagebreak()

// =====================================================================
= Protokolle
// =====================================================================
Gemaess dem Grundsatz "Ein nicht dokumentiertes Treffen hat nicht stattgefunden" werden
alle Teamtreffen protokolliert. Pro Teammitglied ist mindestens ein Protokoll enthalten;
die Protokollfuehrung rotiert. Im Folgenden werden die verwendete Vorlage und drei
ausgewaehlte Protokolle dargestellt.

== Protokollvorlage
Die Vorlage enthaelt einen Kopf (Stammdaten), die Agenda, die wesentlichen Inhalte,
getroffene Entscheidungen sowie eine ToDo-Tabelle mit Zustaendigkeit, Faelligkeit und
Status.

#table(
  columns: (auto, 1fr, auto, 1fr),
  inset: (x: 7pt, y: 5pt),
  stroke: 0.5pt + luma(210),
  [#text(weight: "bold")[Protokoll-Nr.]], [...], [#text(weight: "bold")[Art]], [Kick-off / Jour fixe / Workshop],
  [#text(weight: "bold")[Datum / Uhrzeit]], [...], [#text(weight: "bold")[Dauer]], [...],
  [#text(weight: "bold")[Ort]], [...], [#text(weight: "bold")[Protokollant]], [...],
  table.cell(colspan: 4)[#text(weight: "bold")[Teilnehmer / Abwesend:] ...],
  table.cell(colspan: 4)[#text(weight: "bold")[Agenda:] (1) ... (2) ...],
  table.cell(colspan: 4)[#text(weight: "bold")[Wesentliche Inhalte (Kurzform):] ...],
  table.cell(colspan: 4)[#text(weight: "bold")[Entscheidungen:] ...],
  table.cell(colspan: 4)[#text(weight: "bold")[ToDos:] Aufgabe — Verantwortlich — erledigt bis — Status],
)

== Protokoll Nr. 1 — Kick-off
#table(
  columns: (auto, 1fr, auto, 1fr),
  inset: (x: 7pt, y: 4pt),
  stroke: 0.5pt + luma(210),
  [*Protokoll-Nr.*], [01], [*Art*], [Kick-off],
  [*Datum / Uhrzeit*], [16.03.2026, 10:00], [*Dauer*], [90 min],
  [*Ort*], [DHBW, Raum B2.13], [*Protokollant*], [Cedric Malsch],
  table.cell(colspan: 4)[*Teilnehmer:* Cedric Malsch, Artem Bas, Emil Rilk, Frank Merkel (Auftraggeber) — *Abwesend:* —],
)
*Agenda:* (1) Projektvorstellung & Zielbild, (2) Rollen und Vorgehensmodell,
(3) Technologie-Stack, (4) Termine & naechste Schritte.

*Wesentliche Inhalte:* Der Auftraggeber stellt das Zielbild eines Community-Portals fuer
das Gaming-Cafe vor. Das Team stimmt das hybride Vorgehen (klassische Planung + Scrum)
ab und vereinbart einen woechentlichen Jour fixe (montags, 9:00).

*Entscheidungen:* Rollenverteilung bestaetigt (PL: Cedric); Tech-Stack festgelegt
(Vanilla JS, Node/Express, MySQL); woechentlicher Jour fixe eingefuehrt.

#table(
  columns: (1fr, auto, auto, auto),
  inset: (x: 7pt, y: 4pt),
  align: (left, left, center, center),
  stroke: 0.5pt + luma(210),
  fill: zebra,
  table.header(hc[ToDo], hc[Verantwortlich], hc[erledigt bis], hc[Status]),
  [Projektauftrag erstellen und mit AG abstimmen], [Cedric], [20.03.2026], [#st_done],
  [Anforderungen / Lastenheft entwerfen], [Emil], [25.03.2026], [#st_done],
  [Git-Repository & Tooling (ESLint, Prettier) aufsetzen], [Artem], [19.03.2026], [#st_done],
)

== Protokoll Nr. 2 — Anforderungs- und Konzept-Workshop
#table(
  columns: (auto, 1fr, auto, 1fr),
  inset: (x: 7pt, y: 4pt),
  stroke: 0.5pt + luma(210),
  [*Protokoll-Nr.*], [02], [*Art*], [Workshop],
  [*Datum / Uhrzeit*], [26.03.2026, 13:00], [*Dauer*], [120 min],
  [*Ort*], [Online (Videokonferenz)], [*Protokollant*], [Emil Rilk],
  table.cell(colspan: 4)[*Teilnehmer:* Cedric Malsch, Artem Bas, Emil Rilk — *Abwesend:* —],
)
*Agenda:* (1) Funktionsumfang sammeln, (2) Priorisierung (MoSCoW), (3) Abgrenzung
(Nicht-Ziele), (4) erste Risiken.

*Wesentliche Inhalte:* Der Funktionsumfang (Benutzerkonten, Teams, Turniere,
Leaderboards, Sitzplan-Reservierung, Admin-Ergebniserfassung) wird gesammelt und nach
MoSCoW priorisiert. Eine Bezahlfunktion wird ausgeschlossen.

*Entscheidungen:* Vier Turnierspiele werden unterstuetzt; Authentifizierung nur per
Benutzername + Passwort (kein E-Mail-/Klarnamenzwang); keine Online-Bezahlung im Scope.

#table(
  columns: (1fr, auto, auto, auto),
  inset: (x: 7pt, y: 4pt),
  align: (left, left, center, center),
  stroke: 0.5pt + luma(210),
  fill: zebra,
  table.header(hc[ToDo], hc[Verantwortlich], hc[erledigt bis], hc[Status]),
  [Pflichtenheft auf Basis des Lastenhefts erstellen], [Emil], [02.04.2026], [#st_done],
  [Datenmodell (Tabellen) skizzieren], [Cedric], [02.04.2026], [#st_done],
  [Wireframes der Kernseiten erstellen], [Emil], [10.04.2026], [#st_done],
  [PSP-Entwurf vorbereiten], [alle], [08.04.2026], [#st_done],
)

== Protokoll Nr. 3 — Design-Abnahme & Sprint-Planning
#table(
  columns: (auto, 1fr, auto, 1fr),
  inset: (x: 7pt, y: 4pt),
  stroke: 0.5pt + luma(210),
  [*Protokoll-Nr.*], [03], [*Art*], [Jour fixe / Sprint-Planning],
  [*Datum / Uhrzeit*], [20.04.2026, 09:00], [*Dauer*], [75 min],
  [*Ort*], [DHBW, Raum B2.13], [*Protokollant*], [Artem Bas],
  table.cell(colspan: 4)[*Teilnehmer:* Cedric Malsch, Artem Bas, Emil Rilk — *Abwesend:* —],
)
*Agenda:* (1) Design-Abnahme (Meilenstein M2), (2) Sprint-1-Planung, (3) API-Vertrag,
(4) Definition of Done.

*Wesentliche Inhalte:* Die Mockups werden abgenommen (M2 erreicht). Der erste
Entwicklungs-Sprint wird geplant; die Schnittstellen zwischen Frontend und Backend
(REST-API-Vertrag) werden grob festgelegt.

*Entscheidungen:* Design abgenommen; Sprintlaenge 2 Wochen; Definition of Done
verabschiedet (Code-Review, bestandene Tests, dokumentiert).

#table(
  columns: (1fr, auto, auto, auto),
  inset: (x: 7pt, y: 4pt),
  align: (left, left, center, center),
  stroke: 0.5pt + luma(210),
  fill: zebra,
  table.header(hc[ToDo], hc[Verantwortlich], hc[erledigt bis], hc[Status]),
  [Frontend-Grundgeruest & Komponenten aufsetzen], [Artem], [01.05.2026], [#st_done],
  [REST-API-Skeleton + DB-Anbindung], [Cedric], [01.05.2026], [#st_prog],
  [Testkonzept & Definition of Done dokumentieren], [Emil], [24.04.2026], [#st_done],
)

#pagebreak()

// =====================================================================
= Projektauftrag
// =====================================================================
Der Projektauftrag ist die verbindliche Vereinbarung zwischen Auftraggeber und
Projektleitung und bildet den ersten Bestandteil des Projekthandbuchs. Die zugrunde
liegende Vorlage (eigenstaendig erarbeitet, nicht Teil dieses Dokuments) enthaelt alle
erforderlichen Inhalte; sie ist hier ausgefuellt wiedergegeben.

#table(
  columns: (auto, 1fr),
  inset: (x: 8pt, y: 6pt),
  align: (left + horizon, left + horizon),
  stroke: 0.5pt + luma(210),
  fill: zebra,
  table.header(hc[Feld], hc[Inhalt]),
  [Projektname], [PixelForge — Web-Portal fuer ein Gaming-Cafe],
  [Auftraggeber], [Frank Merkel],
  [Projektleitung / Stellvertretung], [Cedric Malsch / Emil Rilk],
  [Projekt-Kernteam], [Cedric Malsch (Backend), Artem Bas (Frontend), Emil Rilk (Design/QA)],
  [Ausgangssituation], [Das Gaming-Cafe besitzt bislang keinen digitalen Auftritt. Reservierungen, Turnieranmeldungen und Bestenlisten werden manuell verwaltet, was fehleranfaellig und wenig attraktiv ist.],
  [Kurzbeschreibung], [Entwicklung eines responsiven Web-Portals mit Benutzerkonten, Team- und Turnierverwaltung, automatisierten Bestenlisten sowie einer Sitzplatz-Reservierung.],
  [Projektziele (Kurz)], [Funktionsfaehiges Portal, das Registrierung, Reservierung, Turnier- und Teamverwaltung sowie Leaderboards abbildet (Details s. Kap. 4).],
  [In Scope], [Benutzerkonten (Benutzername + Passwort), Teams, Turnieranmeldung, Bestenlisten, Sitzplan-Reservierung, Admin-Ergebniserfassung, responsives Design.],
  [Out of Scope (Ausschluss)], [Online-Bezahlung, native Mobile-App, E-Mail-Verifizierung, Konsolen-/VR-Plaetze, Echtzeit-Chat.],
  [Wichtige Meilensteine], [M1 Anforderungen freigegeben (03.04.2026), M2 Design abgenommen (24.04.2026), M3 Frontend fertig (29.05.2026), M4 Backend fertig (19.06.2026), M5 Go-Live (10.07.2026), M6 Abnahme (17.07.2026).],
  [Termine], [Start 16.03.2026 — Ende 17.07.2026],
  [Budget / Ressourcen], [72.000 EUR (inkl. 10 % Risikopuffer); 3 Teammitglieder, ca. 102 Personentage.],
  [Annahmen], [Anforderungen sind nach M1 stabil; das Cafe-Personal pflegt Turnierergebnisse selbst; ein Managed-Hosting steht bereit.],
  [Offene Punkte], [Siehe Offene-Punkte-Liste (Kap. 7).],
  [Unterschriften], [Auftraggeber: \_\_\_\_\_\_\_\_\_\_ (Frank Merkel) #h(1.5em) Projektleitung: \_\_\_\_\_\_\_\_\_\_ (Cedric Malsch)],
)

#pagebreak()

// =====================================================================
= Projektziele
// =====================================================================
Die Projektziele sind als vollstaendige Saetze formuliert (keine Stichworte), nach dem
Prinzip der SMART-Kriterien strukturiert und den vom Auftraggeber gewuenschten
Loesungen loesungsneutral vorgelagert. Sie sind nach Zielarten gegliedert und
anschliessend nach dem *MoSCoW-Prinzip* (Muss / Soll / Kann / Nicht) priorisiert, da
sich diese Methodik gut eignet, um in einem zeitlich befristeten Studienprojekt den
verbindlichen Kern vom wuenschenswerten Rand zu trennen.

== Zielformulierung nach Zielarten

*Leistungs- und Qualitaetsziele*
- Das Web-Portal soll registrierten Nutzern ermoeglichen, sich an mindestens vier Turnierspielen (Valorant, League of Legends, Counter-Strike, FIFA) anzumelden und teilzunehmen.
- Das Portal soll fuer jedes Turnierformat automatisch aktualisierte Bestenlisten bereitstellen, sobald das Cafe-Personal die Platzierungen erfasst hat.
- Die Oberflaeche soll responsiv sein und auf Bildschirmbreiten ab 360 Pixeln ohne horizontales Scrollen bedienbar bleiben.
- Das Portal soll grundlegende Anforderungen an die Barrierefreiheit (Tastaturbedienbarkeit, ausreichende Kontraste) erfuellen.

*Termin- und Kostenziele*
- Das Projekt soll bis spaetestens 17.07.2026 abgenommen sein und die definierten Meilensteine einhalten.
- Das Projekt soll innerhalb des genehmigten Budgets von 72.000 EUR abgeschlossen werden.

*Ergebnis- und Vorgehensziele*
- Am Projektende soll ein lauffaehiges, dokumentiertes System (Frontend, Backend, Datenbank) sowie ein vollstaendiges Projekthandbuch vorliegen.
- Die Umsetzung soll mit dem vereinbarten Technologie-Stack (Vanilla JS, Node.js/Express, MySQL) und einem hybriden Vorgehen (klassische Planung + Scrum) erfolgen.

*Soziale Ziele*
- Die Zufriedenheit des Auftraggebers soll durch regelmaessige Status- und Abnahmetermine sichergestellt werden.

== Priorisierung nach MoSCoW

#table(
  columns: (auto, 1fr, auto),
  inset: (x: 7pt, y: 5pt),
  align: (center + horizon, left, center + horizon),
  stroke: 0.5pt + luma(210),
  fill: zebra,
  table.header(hc[Prio], hc[Ziel (Kurzbezeichnung)], hc[Klasse]),
  [1], [Benutzerkonten, Turnieranmeldung und automatische Bestenlisten funktionieren zuverlaessig.], [Muss],
  [1], [Einhaltung von Endtermin und Budget.], [Muss],
  [2], [Sitzplatz-Reservierung ueber einen interaktiven Sitzplan.], [Soll],
  [2], [Responsives, barrierearmes Design.], [Soll],
  [3], [Komfortfunktionen wie Filter/Suche in den Bestenlisten.], [Kann],
  [4], [Online-Bezahlung, native App, Echtzeit-Chat.], [Nicht (Nicht-Ziel)],
)

*Nicht-Ziele:* Ausdruecklich nicht Gegenstand des Projekts sind eine Online-Bezahlung,
eine native Mobile-App sowie ein Echtzeit-Chat. Diese Abgrenzung schuetzt den Zeitplan
vor "Scope Creep".

#pagebreak()

// =====================================================================
= Phasen- und Meilensteinplan
// =====================================================================
Das Projekt ist in fuenf inhaltliche Phasen plus eine durchgaengige Phase
"Projektmanagement" gegliedert. Die Phasen sind weitgehend sequenziell, Frontend- und
Backend-Entwicklung laufen nach der Design-Abnahme teilweise parallel. Die grafische
Gantt-Darstellung mit Anordnungsbeziehungen und kritischem Pfad folgt in Kapitel 10;
die Meilensteine sind mit Datum dargestellt.

== Phasenuebersicht
#table(
  columns: (auto, auto, 1fr, 1fr),
  inset: (x: 7pt, y: 5pt),
  align: (left + horizon, left + horizon, left, left),
  stroke: 0.5pt + luma(210),
  fill: zebra,
  table.header(hc[Phase], hc[Zeitraum], hc[Inhalt], hc[Ergebnis]),
  [0/durchgaengig — Projektmanagement], [KW 12–29], [Planung, Steuerung, Reporting, Doku], [Aktuelles Projekthandbuch],
  [1 — Initialisierung & Anforderungen], [KW 12–14], [Kick-off, Lasten-/Pflichtenheft, Priorisierung], [Anforderungen freigegeben (M1)],
  [2 — Konzeption & Design], [KW 15–17], [Informationsarchitektur, Wireframes, UI-Design], [Design abgenommen (M2)],
  [3 — Frontend-Entwicklung], [KW 18–22], [HTML/CSS-Komponenten, JS, API-Anbindung], [Frontend fertig (M3)],
  [4 — Backend-Entwicklung], [KW 18–25], [Datenmodell, REST-API, Authentifizierung], [Backend & API fertig (M4)],
  [5 — Integration, Test & Abnahme], [KW 26–29], [Integration, Tests, Deployment, Abnahme], [Go-Live (M5), Abnahme (M6)],
)

== Meilensteine
#table(
  columns: (auto, 1fr, auto, auto),
  inset: (x: 7pt, y: 5pt),
  align: (center + horizon, left, center + horizon, center + horizon),
  stroke: 0.5pt + luma(210),
  fill: zebra,
  table.header(hc[MS], hc[Bezeichnung], hc[KW], hc[Datum]),
  [M0], [Projektstart / Kick-off], [KW 12], [16.03.2026],
  [M1], [Anforderungen & Projektauftrag freigegeben], [KW 14], [03.04.2026],
  [M2], [Konzept & Design abgenommen], [KW 17], [24.04.2026],
  [M3], [Frontend fertiggestellt], [KW 22], [29.05.2026],
  [M4], [Backend & API fertiggestellt], [KW 25], [19.06.2026],
  [M5], [Integration & Test abgeschlossen (Go-Live)], [KW 28], [10.07.2026],
  [M6], [Projektabnahme & -abschluss], [KW 29], [17.07.2026],
)

#pagebreak()

// =====================================================================
= Projektorganisation
// =====================================================================

== Gewaehlte Organisationsform
Fuer PixelForge wird die *reine (autonome) Projektorganisation* gewaehlt. Das Team
arbeitet ausschliesslich an diesem Projekt, die Projektleitung besitzt umfassende
fachliche und koordinierende Befugnisse, und die Verantwortlichkeiten sind eindeutig
zugeordnet. Dies passt zum klar abgegrenzten, zeitlich befristeten Vorhaben und fuehrt
zu hoher Identifikation und geringem Konfliktpotenzial. Eine *Einfluss-(Stabs-)
Projektorganisation* waere zu schwach (die Projektleitung haette keine
Entscheidungsbefugnis), eine *Matrix-Projektorganisation* unnoetig komplex, da keine
konkurrierende Linienorganisation um die Ressourcen der drei Teammitglieder ringt.

== Rollen und Verantwortlichkeiten
#table(
  columns: (auto, 1fr),
  inset: (x: 7pt, y: 5pt),
  align: (left + horizon, left),
  stroke: 0.5pt + luma(210),
  fill: zebra,
  table.header(hc[Rolle / Person], hc[Verantwortung]),
  [Auftraggeber — Frank Merkel], [Beauftragt das Projekt, gibt Anforderungen und Budget frei, nimmt Ergebnisse ab, trifft eskalierte Entscheidungen (Lenkungsausschuss).],
  [Projektleitung — Cedric Malsch], [Gesamtverantwortung fuer Termine, Kosten und Leistung; Planung, Steuerung, Reporting und Kommunikation mit dem Auftraggeber.],
  [Backend-Entwicklung — Cedric Malsch], [Datenmodell, REST-API, Geschaeftslogik, Authentifizierung, Deployment.],
  [Frontend-Entwicklung — Artem Bas], [HTML/CSS-Komponenten, JavaScript, Anbindung an die API, Integration.],
  [Konzeption, Design & QA — Emil Rilk], [Anforderungen, Lasten-/Pflichtenheft, Wireframes, UI-Design, Testkonzept und Qualitaetssicherung.],
)
#v(0.3em)
Die Vertretungsregelung sieht vor, dass die Projektleitung im Verhinderungsfall durch
Emil Rilk vertreten wird; fachliche Vertretungen erfolgen paarweise (Pair-Programming).

== Projektorganigramm
#let orgbox(role, name, col, w: 5.2cm) = box(width: w, inset: 7pt, radius: 4pt, fill: col, stroke: 0.6pt + col.darken(25%))[
  #set text(fill: white)
  #align(center)[#text(size: 9.5pt, weight: "bold")[#role] \ #text(size: 9pt)[#name]]
]
#let vbar = line(length: 0.7cm, angle: 90deg, stroke: 0.9pt + dark)

#align(center)[
  #grid(columns: 1, row-gutter: 0pt, align: center,
    orgbox("Auftraggeber / Lenkungsausschuss", "Frank Merkel", accent, w: 7cm),
    vbar,
    orgbox("Projektleitung", "Cedric Malsch", dark, w: 6cm),
    vbar,
    grid(columns: 3, column-gutter: 8pt, align: center,
      orgbox("Backend-Entwicklung", "Cedric Malsch", blue, w: 4.4cm),
      orgbox("Frontend-Entwicklung", "Artem Bas", blue, w: 4.4cm),
      orgbox("Konzeption, Design & QA", "Emil Rilk", blue, w: 4.4cm),
    ),
  )
]

#pagebreak()

// =====================================================================
= Offene-Punkte-Liste (OPL)
// =====================================================================
Eine projektweite Offene-Punkte-Liste existierte zu Projektbeginn nicht und wurde daher
neu erstellt. Sie wird auch im Kontext der Protokollierung genutzt: offene ToDos,
Entscheidungen und Fragen aus den Treffen werden zentral hier verfolgt. Kategorien:
A = Aufgabe, E = Entscheidung, F = Frage, R = Risiko/Hinweis.

#table(
  columns: (auto, auto, 1fr, auto, auto, auto, auto),
  inset: (x: 5pt, y: 4pt),
  align: (center + horizon, center + horizon, left, center, left, center, center),
  stroke: 0.5pt + luma(210),
  fill: zebra,
  table.header(hc[Nr.], hc[Datum], hc[Thema / Beschreibung], hc[Kat.], hc[Verantw.], hc[faellig], hc[Status]),
  [1], [16.03.], [Projektauftrag erstellen und vom AG freigeben lassen], [A], [Cedric], [20.03.], [#st_done],
  [2], [26.03.], [Funktionsumfang final festlegen (MoSCoW)], [E], [alle], [26.03.], [#st_done],
  [3], [26.03.], [Datenmodell / Tabellenstruktur entwerfen], [A], [Cedric], [02.04.], [#st_done],
  [4], [26.03.], [Wireframes der Kernseiten erstellen], [A], [Emil], [10.04.], [#st_done],
  [5], [20.04.], [REST-API-Vertrag (Endpunkte) abstimmen], [E], [Cedric/Artem], [24.04.], [#st_done],
  [6], [04.05.], [Browser-Kompatibilitaet (Safari) pruefen], [F], [Artem], [29.05.], [#st_prog],
  [7], [11.05.], [Lasttest fuer Bestenlisten einplanen], [A], [Emil], [12.06.], [#st_open],
  [8], [11.05.], [Datenschutzhinweis fuer Benutzerkonten formulieren], [R], [Emil], [05.06.], [#st_prog],
  [9], [15.05.], [Hosting-Anbieter und Domain final buchen], [A], [Cedric], [01.06.], [#st_open],
)

#pagebreak()

// =====================================================================
= Projektstrukturplan (PSP)
// =====================================================================

== Gliederungstyp und Begruendung
Der PSP ist auf der obersten Ebene *phasenorientiert* gegliedert. Ein Web-Projekt
durchlaeuft einen klar erkennbaren Lebenszyklus von der Anforderungsdefinition ueber
Konzeption und Design hin zu Frontend-, Backend-Entwicklung sowie Integration und
Abnahme. Diese Gliederung bildet den tatsaechlichen Projektablauf ab, erleichtert die
spaetere Termin- und Kostenzuordnung je Phase und ermoeglicht eine eindeutige Zuordnung
der Arbeitspakete. Eine rein *objektorientierte* Gliederung (nach Komponenten) waere
moeglich, wuerde aber die zeitliche Abfolge verschleiern; das durchgaengige Teilprojekt
"Projektmanagement" stellt sicher, dass auch administrative Aufgaben enthalten sind.

== Grafische Struktur
#let psp1(code, title) = block(width: 100%, inset: 6pt, radius: 3pt, fill: accent)[#text(fill: white, weight: "bold")[#code #h(0.6em) #title]]
#let psp2(code, title, resp) = pad(left: 1.3cm, top: 3pt, bottom: 0pt, block(width: 100%, inset: 5pt, radius: 3pt, fill: rgb("#F5DADD"), stroke: 0.5pt + accent)[#text(weight: "bold")[#code] #h(0.4em) #title #h(1fr) #text(size: 8pt, fill: dark)[#resp]])

#align(center)[#box(width: 100%, inset: 7pt, radius: 4pt, fill: dark)[#text(fill: white, weight: "bold", size: 12pt)[PixelForge — Web-Portal (Gesamtprojekt)]]]
#v(4pt)
#psp1("1", "Projektmanagement")
#psp2("1.1", "Projektplanung & -steuerung", "Cedric")
#psp2("1.2", "Dokumentation & Reporting", "Cedric")
#v(4pt)
#psp1("2", "Initialisierung & Anforderungen")
#psp2("2.1", "Anforderungsanalyse / Lastenheft", "Emil")
#psp2("2.2", "Konzept & Pflichtenheft", "Emil")
#v(4pt)
#psp1("3", "Konzeption & Design")
#psp2("3.1", "Informationsarchitektur & Wireframes", "Emil")
#psp2("3.2", "UI-Design / Mockups", "Emil")
#v(4pt)
#psp1("4", "Frontend-Entwicklung")
#psp2("4.1", "Seitenstruktur & Komponenten (HTML/CSS)", "Artem")
#psp2("4.2", "Interaktivitaet & API-Anbindung (JS)", "Artem")
#v(4pt)
#psp1("5", "Backend-Entwicklung")
#psp2("5.1", "Datenbank & Datenmodell", "Cedric")
#psp2("5.2", "REST-API & Geschaeftslogik", "Cedric")
#psp2("5.3", "Authentifizierung & Benutzerkonten", "Cedric")
#v(4pt)
#psp1("6", "Integration, Test & Abnahme")
#psp2("6.1", "Integration & Tests", "Artem / Emil")
#psp2("6.2", "Deployment & Abnahme", "Cedric")

== Tabellarische Darstellung
Der PSP umfasst 6 Teilprojekte und 13 Arbeitspakete (insgesamt 19 Elemente).
Arbeitspakete (AP) sind die nicht weiter zerlegten Blattknoten mit eindeutiger
Zustaendigkeit.

#table(
  columns: (auto, 1fr, auto, auto),
  inset: (x: 7pt, y: 4pt),
  align: (left + horizon, left, center, center),
  stroke: 0.5pt + luma(210),
  fill: zebra,
  table.header(hc[PSP-Code], hc[Element], hc[Typ], hc[Verantwortlich]),
  [1], [Projektmanagement], [Teilprojekt], [Cedric],
  [1.1], [Projektplanung & -steuerung], [AP], [Cedric],
  [1.2], [Dokumentation & Reporting], [AP], [Cedric],
  [2], [Initialisierung & Anforderungen], [Teilprojekt], [Emil],
  [2.1], [Anforderungsanalyse / Lastenheft], [AP], [Emil],
  [2.2], [Konzept & Pflichtenheft], [AP], [Emil],
  [3], [Konzeption & Design], [Teilprojekt], [Emil],
  [3.1], [Informationsarchitektur & Wireframes], [AP], [Emil],
  [3.2], [UI-Design / Mockups], [AP], [Emil],
  [4], [Frontend-Entwicklung], [Teilprojekt], [Artem],
  [4.1], [Seitenstruktur & Komponenten (HTML/CSS)], [AP], [Artem],
  [4.2], [Interaktivitaet & API-Anbindung (JS)], [AP], [Artem],
  [5], [Backend-Entwicklung], [Teilprojekt], [Cedric],
  [5.1], [Datenbank & Datenmodell], [AP], [Cedric],
  [5.2], [REST-API & Geschaeftslogik], [AP], [Cedric],
  [5.3], [Authentifizierung & Benutzerkonten], [AP], [Cedric],
  [6], [Integration, Test & Abnahme], [Teilprojekt], [Artem/Emil],
  [6.1], [Integration & Tests], [AP], [Artem/Emil],
  [6.2], [Deployment & Abnahme], [AP], [Cedric],
)

#pagebreak()

// =====================================================================
= Arbeitspaketbeschreibungen
// =====================================================================
Auf Basis der gemeinsam erarbeiteten Vorlage (Felder gemaess Vorlesung; die Vorlage
selbst ist nicht Bestandteil dieses Handbuchs) erstellt jedes Teammitglied mindestens
eine Arbeitspaketbeschreibung. Der Autor ist jeweils eindeutig gekennzeichnet.

#let apbox(rows) = table(
  columns: (auto, 1fr),
  inset: (x: 7pt, y: 5pt),
  align: (left + horizon, left),
  stroke: 0.5pt + luma(210),
  ..rows,
)

== AP 5.2 — REST-API & Geschaeftslogik
#apbox((
  [*Nr. / Bezeichnung*], [5.2 — REST-API & Geschaeftslogik],
  [*Autor*], [Cedric Malsch],
  [*Verantwortlich / Vertretung*], [Cedric Malsch / Emil Rilk],
  [*Voraussetzungen*], [AP 5.1 (Datenmodell) abgeschlossen; API-Vertrag aus Protokoll 3 abgestimmt.],
  [*Zu erbringende Ergebnisse*], [Dokumentierte REST-Endpunkte fuer Teams, Turniere, Anmeldungen und Bestenlisten; geschichtete Architektur (Routes, Controller, Services).],
  [*Aktivitaeten*], [Routen definieren, Controller/Services implementieren, Eingaben validieren, Fehlerbehandlung, Unit-Tests schreiben.],
  [*Abhaengige Arbeitspakete*], [Vorgaenger: 5.1; Nachfolger: 4.2 (Frontend-Anbindung), 6.1 (Integration).],
  [*Schnittstellen*], [JSON-REST-Schnittstelle zum Frontend (AP 4.2); Datenbankzugriff (AP 5.1).],
  [*Aufwand (Dauer / PT / Kosten)*], [3 Wochen / 12 PT / 7.800 EUR],
  [*Besondere Ressourcen*], [Node.js/Express, mysql2; Testdatenbank.],
  [*Start / Ende*], [KW 20 / KW 24],
  [*Version / Status*], [1.0 / in Arbeit],
  [*Erstellt am*], [20.04.2026],
))

== AP 4.2 — Interaktivitaet & API-Anbindung (Frontend)
#apbox((
  [*Nr. / Bezeichnung*], [4.2 — Interaktivitaet & API-Anbindung (JavaScript)],
  [*Autor*], [Artem Bas],
  [*Verantwortlich / Vertretung*], [Artem Bas / Cedric Malsch],
  [*Voraussetzungen*], [AP 4.1 (Seitenstruktur) und API-Vertrag liegen vor; erste Endpunkte aus AP 5.2 verfuegbar.],
  [*Zu erbringende Ergebnisse*], [Interaktive Seiten (Registrierung/Login, Teams, Turniere, Sitzplan, Bestenlisten) mit Anbindung an die REST-API inkl. Fehler- und Ladezustaenden.],
  [*Aktivitaeten*], [ES-Module strukturieren, fetch-Aufrufe kapseln, Formularvalidierung, DOM-Aktualisierung, Mock-Fallback bei Netzwerkfehlern.],
  [*Abhaengige Arbeitspakete*], [Vorgaenger: 4.1, 5.2; Nachfolger: 6.1 (Integration).],
  [*Schnittstellen*], [REST-API (AP 5.2); UI-Komponenten (AP 4.1); Design-Vorgaben (AP 3.2).],
  [*Aufwand (Dauer / PT / Kosten)*], [2,5 Wochen / 10 PT / 6.000 EUR],
  [*Besondere Ressourcen*], [Moderne Browser fuer Tests; ESLint/Prettier.],
  [*Start / Ende*], [KW 20 / KW 22],
  [*Version / Status*], [1.0 / geplant],
  [*Erstellt am*], [20.04.2026],
))

== AP 3.2 — UI-Design / Mockups
#apbox((
  [*Nr. / Bezeichnung*], [3.2 — UI-Design / Mockups],
  [*Autor*], [Emil Rilk],
  [*Verantwortlich / Vertretung*], [Emil Rilk / Artem Bas],
  [*Voraussetzungen*], [AP 3.1 (Wireframes) abgeschlossen; Anforderungen aus AP 2.2 freigegeben.],
  [*Zu erbringende Ergebnisse*], [Abgenommenes UI-Design (Farbsystem, Typografie, Komponenten) und High-Fidelity-Mockups der Kernseiten als Vorgabe fuer das Frontend.],
  [*Aktivitaeten*], [Design-System definieren, Mockups erstellen, Kontraste/Barrierefreiheit pruefen, mit AG abstimmen, Abnahme (M2).],
  [*Abhaengige Arbeitspakete*], [Vorgaenger: 3.1; Nachfolger: 4.1 und 4.2 (Frontend).],
  [*Schnittstellen*], [Wireframes (AP 3.1); Frontend-Umsetzung (AP 4.1/4.2).],
  [*Aufwand (Dauer / PT / Kosten)*], [1,5 Wochen / 7 PT / 4.060 EUR],
  [*Besondere Ressourcen*], [Design-Tool (Figma); Lizenzkosten.],
  [*Start / Ende*], [KW 16 / KW 17],
  [*Version / Status*], [1.0 / abgenommen],
  [*Erstellt am*], [10.04.2026],
))

#pagebreak()

// =====================================================================
= Ablaufplan, Gantt-Diagramm und kritischer Pfad
// =====================================================================
Auf Basis des PSP wurde der zeitliche Ablauf geplant. Die Balken zeigen die Lage der
Phasen ueber die Kalenderwochen (KW) des Jahres 2026; die Meilensteine sind in der
untersten Zeile verortet.

== Gantt-Diagramm
#let weeks = range(12, 30)
#let crit  = accent
#let ncrit = blue
#let pmc   = grey
#let grow(label, s, e, col) = (
  table.cell(align: left + horizon)[#text(size: 7.5pt)[#label]],
  ..weeks.map(w => if w >= s and w <= e { table.cell(fill: col)[] } else { [] }),
)
#let mslabel(w) = if w == 12 {"M0"} else if w == 14 {"M1"} else if w == 17 {"M2"} else if w == 22 {"M3"} else if w == 25 {"M4"} else if w == 28 {"M5"} else if w == 29 {"M6"} else {""}
#let msrow = (
  table.cell(align: left + horizon)[#text(size: 7.5pt, weight: "bold")[Meilensteine]],
  ..weeks.map(w => { let m = mslabel(w); if m != "" { table.cell()[#text(size: 6.5pt, weight: "bold", fill: accent)[#m]] } else { [] } }),
)

#table(
  columns: (3.6cm,) + range(18).map(_ => 1fr),
  inset: 2.5pt,
  align: center + horizon,
  stroke: 0.4pt + luma(215),
  table.header(
    table.cell(fill: dark, align: left + horizon)[#text(size: 7pt, fill: white, weight: "bold")[Phase / KW]],
    ..weeks.map(w => table.cell(fill: dark)[#text(size: 6.5pt, fill: white)[#w]]),
  ),
  ..grow("1 Projektmanagement", 12, 29, pmc),
  ..grow("2 Anforderungen", 12, 14, crit),
  ..grow("3 Konzeption & Design", 15, 17, crit),
  ..grow("4 Frontend-Entwicklung", 18, 22, ncrit),
  ..grow("5 Backend-Entwicklung", 18, 25, crit),
  ..grow("6 Integration & Abnahme", 26, 29, crit),
  ..msrow,
)
#v(4pt)
#text(size: 8.5pt)[
  *Legende:* #dot(crit) kritischer Pfad #h(1em) #dot(ncrit) Phase mit Puffer (nicht kritisch)
  #h(1em) #dot(pmc) durchgaengiges Projektmanagement
]

== Anordnungsbeziehungen
Die Planung beruht ueberwiegend auf *Normalfolgen (Ende-Anfang, EA)*, da die Phasen
inhaltlich aufeinander aufbauen. Zusaetzlich kommen eine Anfangsfolge und eine Endfolge
vor; eine Sprungfolge (Anfang-Ende) wird nicht benoetigt.

#table(
  columns: (auto, auto, auto, 1fr),
  inset: (x: 7pt, y: 5pt),
  align: (center + horizon, center + horizon, center + horizon, left),
  stroke: 0.5pt + luma(210),
  fill: zebra,
  table.header(hc[Vorgaenger], hc[Nachfolger], hc[Typ], hc[Begruendung]),
  [2 Anforderungen], [3 Design], [Normalfolge (EA)], [Das Design darf erst beginnen, wenn die Anforderungen freigegeben sind (M1).],
  [3 Design], [4 Frontend], [Normalfolge (EA)], [Die Frontend-Umsetzung benoetigt das abgenommene Design (M2).],
  [3 Design], [5 Backend], [Normalfolge (EA)], [Das Datenmodell basiert auf dem abgenommenen Konzept.],
  [4 Frontend], [5 Backend], [Anfangsfolge (AA)], [Beide Stränge starten gemeinsam nach der Design-Abnahme und laufen parallel.],
  [5.2 REST-API], [4.2 API-Anbindung], [Endfolge (EE)], [Die Frontend-Anbindung kann erst enden, wenn die API fertiggestellt ist.],
  [4 / 5], [6 Integration], [Normalfolge (EA)], [Integration und Tests starten erst, wenn Frontend und Backend fertig sind.],
)

== Kritischer Pfad
Der kritische Pfad verlaeuft ueber
*Anforderungen (Phase 2) → Konzeption & Design (Phase 3) → Backend-Entwicklung
(Phase 5) → Integration & Abnahme (Phase 6)*. Diese Kette bestimmt mit 18 Wochen die
Gesamtdauer. Die *Frontend-Entwicklung (Phase 4)* liegt nicht auf dem kritischen Pfad:
Sie endet in KW 22, waehrend das Backend erst in KW 25 fertig wird — Phase 4 verfuegt
daher ueber rund drei Wochen Puffer (Slack). Verzoegerungen im Backend wirken sich
dagegen unmittelbar auf den Endtermin aus und sind besonders zu ueberwachen.

== Alternative Planung
Eine Alternative bestuende darin, das Backend bereits parallel zur Designphase mit einem
duennen vertikalen Schnitt (Datenmodell + ein erster Endpunkt) zu beginnen und so den
kritischen Pfad um ca. zwei Wochen zu verkuerzen. Dies erhoeht jedoch das Risiko von
Nacharbeiten, falls sich das Konzept noch aendert, und steigert den
Koordinationsaufwand. Da im studentischen Kontext Stabilitaet wichtiger ist als maximale
Geschwindigkeit, wurde die dargestellte, sequenziellere Planung mit klaren
Abnahmepunkten bevorzugt.

#pagebreak()

// =====================================================================
= Ressourcen- und Kostenplanung
// =====================================================================
Die Planung leitet sich direkt aus den Arbeitspaketen des PSP ab. Pro Arbeitspaket
werden der Aufwand in Personentagen (PT), die verantwortliche Rolle und ein interner
Tagessatz angesetzt. Ein PT entspricht 8 Stunden.

== Ressourcen- und Personalkostenplanung
#table(
  columns: (auto, 1fr, auto, auto, auto, auto),
  inset: (x: 6pt, y: 4pt),
  align: (center + horizon, left, center, center, center, right),
  stroke: 0.5pt + luma(210),
  fill: zebra,
  table.header(hc[Code], hc[Arbeitspaket], hc[Verantw.], hc[PT], hc[EUR/PT], hc[Personalkosten]),
  [1], [Projektmanagement], [Cedric], [18], [650], [11.700 EUR],
  [2.1], [Anforderungsanalyse / Lastenheft], [Emil], [6], [580], [3.480 EUR],
  [2.2], [Konzept & Pflichtenheft], [Emil], [6], [580], [3.480 EUR],
  [3.1], [Wireframes], [Emil], [5], [580], [2.900 EUR],
  [3.2], [UI-Design / Mockups], [Emil], [7], [580], [4.060 EUR],
  [4.1], [Seitenstruktur & Komponenten], [Artem], [12], [600], [7.200 EUR],
  [4.2], [Interaktivitaet & API-Anbindung], [Artem], [10], [600], [6.000 EUR],
  [5.1], [Datenbank & Datenmodell], [Cedric], [6], [650], [3.900 EUR],
  [5.2], [REST-API & Geschaeftslogik], [Cedric], [12], [650], [7.800 EUR],
  [5.3], [Authentifizierung & Benutzerkonten], [Cedric], [6], [650], [3.900 EUR],
  [6.1], [Integration & Tests], [Artem/Emil], [10], [590], [5.900 EUR],
  [6.2], [Deployment & Abnahme], [Cedric], [4], [650], [2.600 EUR],
  table.cell(colspan: 3, align: right)[#text(weight: "bold")[Summe]],
  table.cell(align: center)[#text(weight: "bold")[102]], [], table.cell(align: right)[#text(weight: "bold")[62.920 EUR]],
)

== Sachkostenplanung
#table(
  columns: (1fr, auto),
  inset: (x: 7pt, y: 4pt),
  align: (left + horizon, right),
  stroke: 0.5pt + luma(210),
  fill: zebra,
  table.header(hc[Sachkostenposition], hc[Kosten]),
  [Hosting & Cloud-Infrastruktur (4 Monate)], [400 EUR],
  [Domain & SSL-Zertifikat], [60 EUR],
  [Software-Lizenzen (Design- & Entwicklungstools)], [540 EUR],
  [Test-Hardware (anteilig)], [800 EUR],
  table.cell(align: right)[#text(weight: "bold")[Summe Sachkosten]], table.cell(align: right)[#text(weight: "bold")[1.800 EUR]],
)

== Gesamtbudget
#table(
  columns: (1fr, auto),
  inset: (x: 7pt, y: 4pt),
  align: (left + horizon, right),
  stroke: 0.5pt + luma(210),
  [Personalkosten], [62.920 EUR],
  [Sachkosten], [1.800 EUR],
  [#text(weight: "bold")[Zwischensumme]], [#text(weight: "bold")[64.720 EUR]],
  [Risikopuffer (10 %)], [6.472 EUR],
  table.cell(fill: luma(240))[#text(weight: "bold")[Gesamtbudget (genehmigt: 72.000 EUR)]], table.cell(fill: luma(240))[#text(weight: "bold")[71.192 EUR]],
)

== Kostengang und Kostensumme
Der *Kostengang* zeigt die periodisch (je Monat) anfallenden Kosten, die *Kostensumme*
die kumulierten Gesamtkosten. Der typische s-foermige Verlauf entsteht durch die hoehere
Auslastung in der parallelen Entwicklungsphase (Mai/Juni). Werte ohne Risikopuffer.

#let bar(p) = box(width: 100%)[#rect(width: p, height: 9pt, radius: 1pt, fill: accent)]
#table(
  columns: (auto, auto, auto, 5cm),
  inset: (x: 7pt, y: 5pt),
  align: (left + horizon, right + horizon, right + horizon, left + horizon),
  stroke: 0.5pt + luma(210),
  fill: zebra,
  table.header(hc[Monat], hc[Periodenkosten], hc[Kostensumme], hc[Verlauf (kumuliert)]),
  [Maerz 2026], [8.000 EUR], [8.000 EUR], bar(12%),
  [April 2026], [12.720 EUR], [20.720 EUR], bar(32%),
  [Mai 2026], [21.000 EUR], [41.720 EUR], bar(64%),
  [Juni 2026], [16.000 EUR], [57.720 EUR], bar(89%),
  [Juli 2026], [7.000 EUR], [64.720 EUR], bar(100%),
)

#pagebreak()

// =====================================================================
= Risikomanagement
// =====================================================================
Fuer das Projekt wurde eine *qualitative* Risikoanalyse gewaehlt. In einem studentischen
Projekt ohne belastbare monetaere Schadensdaten lassen sich Eintrittswahrscheinlichkeit
und Auswirkung verlaesslicher relativ (niedrig/mittel/hoch) als absolut in Euro
einschaetzen; die Risikomatrix erlaubt zudem eine schnelle, kommunizierbare Priorisierung.

== Identifizierte Risikoarten
- *Technische Risiken:* Komplexitaet von Backend/Authentifizierung, Browser-Kompatibilitaet.
- *Terminliche Risiken:* Verzug durch Doppelbelastung mit Vorlesungen und Pruefungen.
- *Personelle Risiken:* Ausfall eines Teammitglieds in einem sehr kleinen Team.
- *Organisatorische / Anforderungs-Risiken:* unklare Anforderungen, Scope Creep, spaete Aenderungen.
- *Externe / rechtliche Risiken:* Datenschutz der Benutzerkonten, Ausfall des Hosting-Anbieters.

== Risikomatrix (qualitativ)
Senkrechte Achse: Eintrittswahrscheinlichkeit; waagerechte Achse: Auswirkung.
Farbe = Risikoklasse (gruen = gering, gelb = mittel, rot = hoch).

#table(
  columns: (auto, 1fr, 1fr, 1fr),
  inset: (x: 7pt, y: 9pt),
  align: center + horizon,
  stroke: 0.5pt + luma(210),
  table.header(
    table.cell(fill: dark)[#text(size: 8pt, fill: white)[Wahrsch. \/ Auswirkung]],
    table.cell(fill: dark)[#text(fill: white, weight: "bold")[niedrig]],
    table.cell(fill: dark)[#text(fill: white, weight: "bold")[mittel]],
    table.cell(fill: dark)[#text(fill: white, weight: "bold")[hoch]],
  ),
  table.cell(fill: dark)[#text(fill: white, weight: "bold")[hoch]],
  table.cell(fill: myellow)[], table.cell(fill: mred)[R3], table.cell(fill: mred)[R1],
  table.cell(fill: dark)[#text(fill: white, weight: "bold")[mittel]],
  table.cell(fill: mgreen)[R7, R8], table.cell(fill: myellow)[], table.cell(fill: mred)[R2, R4],
  table.cell(fill: dark)[#text(fill: white, weight: "bold")[niedrig]],
  table.cell(fill: mgreen)[], table.cell(fill: mgreen)[R6], table.cell(fill: myellow)[R5],
)

== Risikoregister und Risikobehandlung
#[
#set text(size: 8.7pt)
#table(
  columns: (auto, 1.5fr, auto, auto, auto, 2fr, auto),
  inset: (x: 5pt, y: 4pt),
  align: (center + horizon, left, center, center, center, left, center),
  stroke: 0.5pt + luma(210),
  fill: zebra,
  table.header(hc[ID], hc[Risiko / Kategorie], hc[W], hc[A], hc[Klasse], hc[Strategie & Massnahme], hc[V.]),
  [R1], [Unklare Anforderungen / Scope Creep (organisatorisch)], [hoch], [hoch], [hoch], [Verminderung: Lastenheft, verbindliche Abnahme (M1), Change-Prozess], [Emil],
  [R2], [Hohe technische Komplexitaet Backend/Auth (technisch)], [mittel], [hoch], [hoch], [Verminderung: Prototyp, Code-Reviews, bewaehrte Bibliotheken], [Cedric],
  [R3], [Terminverzug durch Doppelbelastung (terminlich)], [hoch], [mittel], [hoch], [Verminderung + Akzeptanz: Zeitpuffer, MoSCoW-Priorisierung], [Cedric],
  [R4], [Ausfall eines Teammitglieds (personell)], [mittel], [hoch], [hoch], [Verminderung: Vertretungsregelung, Pair-Programming, Wissensteilung], [Cedric],
  [R5], [Datenschutz/Sicherheit der Konten (rechtlich)], [niedrig], [hoch], [mittel], [Verlagerung/Verminderung: bcrypt, kein Klarname/E-Mail, Hoster-SLA], [Emil],
  [R6], [Ausfall Hosting/Infrastruktur (extern)], [niedrig], [mittel], [gering], [Verlagerung: Managed-Hosting mit SLA, Backups], [Cedric],
  [R7], [Spaete Designaenderungen (organisatorisch)], [mittel], [niedrig], [gering], [Akzeptanz/Verminderung: fruehe Mockup-Abnahme (M2)], [Emil],
  [R8], [Browser-Kompatibilitaet (technisch/Qualitaet)], [mittel], [niedrig], [gering], [Verminderung: Progressive Enhancement, Cross-Browser-Tests], [Artem],
)
]

== Begruendung ausgewaehlter Behandlungsstrategien
- *Verminderung (R1):* Das Risiko unklarer Anforderungen laesst sich nicht ganz vermeiden, aber durch ein freigegebenes Lastenheft und einen Change-Prozess deutlich reduzieren — Vermeidung waere nur durch Verzicht auf das Projekt moeglich.
- *Verlagerung (R5, R6):* Datensicherheit und Verfuegbarkeit werden teilweise auf spezialisierte Dritte verlagert (bewaehrte Krypto-Bibliotheken, Managed-Hosting mit SLA), da diese das Risiko zuverlaessiger beherrschen als das kleine Projektteam.
- *Akzeptanz (R7):* Spaete, kleinere Designaenderungen haben geringe Auswirkung; der Aufwand zur vollstaendigen Vermeidung waere unverhaeltnismaessig, daher wird das Restrisiko bewusst akzeptiert.

#pagebreak()

// =====================================================================
= Stakeholdermanagement
// =====================================================================

== Vorlage und Parameter
Fuer die Stakeholderanalyse wurde eine eigene Vorlage definiert. Je Stakeholder werden
folgende Parameter erfasst: *Bezug/Rolle*, *Erwartung/Interesse am Projekt*,
*Einfluss (Macht)* sowie *Interesse* (jeweils niedrig/mittel/hoch), die *Einstellung*
(positiv/neutral/kritisch) und die daraus abgeleitete *Kommunikationsstrategie*. Die
Klassifizierung nach Einfluss und Interesse bildet die Grundlage der Einfluss-Interesse-Matrix.

== Stakeholderregister (beispielhaft durchgefuehrt)
#[
#set text(size: 8.7pt)
#table(
  columns: (auto, auto, 1.6fr, auto, auto, 1.4fr),
  inset: (x: 5pt, y: 4pt),
  align: (left + horizon, left + horizon, left, center, center, left),
  stroke: 0.5pt + luma(210),
  fill: zebra,
  table.header(hc[Stakeholder], hc[Bezug], hc[Erwartung], hc[Einfl.], hc[Inter.], hc[Strategie]),
  [Frank Merkel], [Auftraggeber], [Vereinbarte Leistung in Zeit/Budget, nachvollziehbare Doku], [hoch], [hoch], [Eng einbinden: regelmaessige Abstimmung, Abnahmen, Statusberichte],
  [Cafe-Betreiber], [Kunde/Betrieb], [Mehr Gaeste, einfache Verwaltung], [hoch], [hoch], [Eng einbinden: Anforderungen, Demos],
  [Projektteam], [Durchfuehrung], [Klare Rollen, machbarer Umfang], [hoch], [hoch], [Aktiv einbinden, klare Verantwortlichkeiten],
  [Endnutzer / Gaeste], [Nutzer], [Einfache, schnelle Bedienung], [niedrig], [hoch], [Informieren, Usability & Feedback sicherstellen],
  [Cafe-Personal / Admins], [Anwender (Backend)], [Einfache Ergebniserfassung], [mittel], [hoch], [Einbinden, kurze Schulung/Anleitung],
  [DHBW / Pruefungsausschuss], [Institution], [Erfuellung der Vorgaben], [hoch], [niedrig], [Zufriedenstellen: Vorgaben einhalten],
  [Hosting-Provider], [Lieferant], [Vertragsgemaesser Betrieb], [mittel], [niedrig], [Ueberwachen, SLA vereinbaren],
  [Wettbewerber], [Umfeld], [—], [niedrig], [niedrig], [Beobachten (minimaler Aufwand)],
)
]

== Einfluss-Interesse-Matrix
#table(
  columns: (auto, 1fr, 1fr),
  inset: (x: 7pt, y: 10pt),
  align: (center + horizon, left + horizon, left + horizon),
  stroke: 0.5pt + luma(210),
  table.header(
    table.cell(fill: dark)[#text(size: 8pt, fill: white)[Einfluss \/ Interesse]],
    table.cell(fill: dark)[#text(fill: white, weight: "bold")[Interesse niedrig]],
    table.cell(fill: dark)[#text(fill: white, weight: "bold")[Interesse hoch]],
  ),
  table.cell(fill: dark)[#text(fill: white, weight: "bold")[Einfluss hoch]],
  table.cell(fill: luma(238))[*Zufriedenstellen* \ DHBW / Pruefungsausschuss],
  table.cell(fill: rgb("#F5DADD"))[*Eng einbinden (Key Player)* \ Frank Merkel, Cafe-Betreiber, Projektteam],
  table.cell(fill: dark)[#text(fill: white, weight: "bold")[Einfluss niedrig]],
  table.cell(fill: luma(247))[*Beobachten* \ Wettbewerber, Hosting-Provider],
  table.cell(fill: luma(238))[*Informieren* \ Endnutzer, Cafe-Personal],
)

#pagebreak()

// =====================================================================
= Projektstatusbericht
// =====================================================================
Der Statusbericht ist als kompakter One-Pager fuer Auftraggeber und Team angelegt.
Stichtag ist der *15.05.2026 (KW 20)* — etwa zur Projektmitte. Der Status wird je
Dimension mit einer Ampel (#dot(cgreen) im Plan, #dot(camber) im Team in Bearbeitung,
#dot(cred) Entscheidungsbedarf) und einem Trend dargestellt.

#table(
  columns: (auto, 1fr),
  inset: (x: 7pt, y: 4pt),
  stroke: 0.5pt + luma(210),
  fill: zebra,
  [*Projekt*], [PixelForge — Web-Portal fuer ein Gaming-Cafe],
  [*Stichtag / Berichtszeitraum*], [15.05.2026 (KW 20)],
  [*Projektleitung*], [Cedric Malsch],
  [*Gesamtstatus*], [#dot(cgreen) gruen — Projekt im Plan],
)

== Ampelstatus
#table(
  columns: (auto, auto, auto, 1fr),
  inset: (x: 7pt, y: 5pt),
  align: (left + horizon, center + horizon, center + horizon, left),
  stroke: 0.5pt + luma(210),
  fill: zebra,
  table.header(hc[Dimension], hc[Status], hc[Trend], hc[Erlaeuterung]),
  [Termin], [#dot(cgreen)], [→], [Meilensteine M1 und M2 termingerecht erreicht; Restplanung stabil.],
  [Aufwand / Kosten], [#dot(camber)], [→], [Backend etwas aufwaendiger als geschaetzt; liegt noch im Risikopuffer, wird beobachtet.],
  [Inhalt / Qualitaet], [#dot(cgreen)], [↑], [Funktionsumfang stabil (MoSCoW); erste Komponenten getestet.],
)

== Status im Detail
*Erreicht:* Anforderungen freigegeben (M1) und Design abgenommen (M2). Das
Frontend-Grundgeruest mit Komponenten steht (ca. 80 % von AP 4.1); das Datenmodell und
das REST-API-Skeleton (AP 5.1, Teile von 5.2) sind umgesetzt.

*Laufende Aktivitaeten:* Frontend-Interaktivitaet und API-Anbindung (AP 4.2);
REST-Endpunkte und Authentifizierung im Backend (AP 5.2, 5.3).

*Naechste Schritte:* Fertigstellung des Frontends bis M3 (29.05.2026), Abschluss von
Backend & API bis M4 (19.06.2026), anschliessend Integration und Tests.

*Entscheidungsbedarf:* Finale Freigabe des Hosting-Anbieters und der Domain durch den
Auftraggeber (vgl. OPL Nr. 9), damit das Deployment rechtzeitig vorbereitet werden kann.

#pagebreak()

// =====================================================================
= Scrum: Product Backlog und Sprint Backlog
// =====================================================================
In den Umsetzungsphasen wird Scrum eingesetzt. Anforderungen werden als User Stories im
Format "Als <Rolle> moechte ich <Ziel>, um <Nutzen>" formuliert, nach MoSCoW priorisiert
und mit Story Points (SP) geschaetzt.

== Epic (Beispiel)
#block(width: 100%, inset: 8pt, radius: 4pt, fill: rgb("#F5DADD"), stroke: 0.5pt + accent)[
  *Epic E1 — Turnier- & Community-System* \
  Als Gast des Gaming-Cafes moechte ich an Turnieren teilnehmen, Teams bilden und meinen
  Fortschritt verfolgen koennen, damit das Cafe-Erlebnis kompetitiv und motivierend wird.
  Dieses Epic buendelt die User Stories US1–US6 und wird ueber mehrere Sprints umgesetzt.
]

== Product Backlog
#table(
  columns: (auto, 1fr, auto, auto, auto),
  inset: (x: 6pt, y: 5pt),
  align: (center + horizon, left, center + horizon, center + horizon, center + horizon),
  stroke: 0.5pt + luma(210),
  fill: zebra,
  table.header(hc[ID], hc[User Story], hc[Prio], hc[SP], hc[Status]),
  [US1], [Als Gast moechte ich ein Konto mit Benutzername und Passwort anlegen, um an Turnieren teilnehmen zu koennen.], [Muss], [5], [#st_done],
  [US2], [Als registrierter Spieler moechte ich ein Team gruenden oder ihm beitreten, um an Team-Turnieren teilzunehmen.], [Muss], [8], [#st_prog],
  [US3], [Als Café-Mitarbeiter moechte ich Turnierergebnisse erfassen, damit Punkte automatisch in die Bestenlisten einfliessen.], [Muss], [5], [#st_prog],
  [US4], [Als Spieler moechte ich die aktuellen Bestenlisten einsehen, um meine Platzierung zu verfolgen.], [Soll], [5], [#st_open],
  [US5], [Als Gast moechte ich einen freien PC-Platz ueber den Sitzplan reservieren, um meinen Besuch zu planen.], [Soll], [8], [#st_open],
  [US6], [Als Spieler moechte ich kommende Turniere mit Spiel und Datum sehen, um mich anzumelden.], [Soll], [3], [#st_open],
)
#v(0.3em)
*Akzeptanzkriterien (Beispiel US1):* Benutzername ist eindeutig; Passwort wird nur als
Hash gespeichert (bcrypt); nach erfolgreicher Registrierung ist der Nutzer angemeldet;
Fehleingaben werden verstaendlich gemeldet.

== Sprint Backlog (Sprint 3 — "Benutzerkonten & Authentifizierung")
*Sprint-Ziel:* Registrierung, Login und Logout sind durchgaengig (Frontend + Backend)
funktionsfaehig. *Zeitraum:* KW 20–21. *Kapazitaet:* ca. 30 Stunden.

#table(
  columns: (auto, 1fr, auto, auto, auto, auto),
  inset: (x: 6pt, y: 4pt),
  align: (center + horizon, left, center, center, center, center),
  stroke: 0.5pt + luma(210),
  fill: zebra,
  table.header(hc[ID], hc[Task], hc[Story], hc[Verantw.], hc[Schätzg.], hc[Status]),
  [T1], [Tabelle `users` modellieren und migrieren], [US1], [Cedric], [4 h], [#st_done],
  [T2], [Endpunkt POST /api/auth/register mit bcrypt-Hashing], [US1], [Cedric], [6 h], [#st_prog],
  [T3], [Login/Logout mit Session (express-session)], [US1], [Cedric], [5 h], [#st_open],
  [T4], [Registrierungs-/Login-Formular im Frontend], [US1], [Artem], [6 h], [#st_open],
  [T5], [Formularvalidierung und Fehlermeldungen], [US1], [Artem], [3 h], [#st_open],
  [T6], [Unit-Tests fuer den Auth-Service], [US1], [Emil], [4 h], [#st_open],
)
#v(0.3em)
*Definition of Done:* Code-Review durch ein zweites Teammitglied, alle Unit-Tests
bestehen, Funktion manuell geprueft und dokumentiert.

#pagebreak()

// =====================================================================
= Anhang: Abkuerzungsverzeichnis
// =====================================================================
#table(
  columns: (auto, 1fr),
  inset: (x: 7pt, y: 4pt),
  align: (left + horizon, left),
  stroke: 0.5pt + luma(210),
  fill: zebra,
  table.header(hc[Abkuerzung], hc[Bedeutung]),
  [AG], [Auftraggeber],
  [AP], [Arbeitspaket],
  [DoD], [Definition of Done],
  [EA / AA / EE / AE], [Ende-Anfang / Anfang-Anfang / Ende-Ende / Anfang-Ende (Anordnungsbeziehungen)],
  [KW], [Kalenderwoche],
  [MoSCoW], [Must / Should / Could / Won't have (Priorisierung)],
  [MS], [Meilenstein],
  [OPL], [Offene-Punkte-Liste],
  [PL], [Projektleitung],
  [PSP], [Projektstrukturplan],
  [PT], [Personentag (8 Stunden)],
  [SP], [Story Points],
  [US], [User Story],
)
