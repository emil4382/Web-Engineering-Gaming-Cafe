# PixelForge — Gaming & Internet Café

Eine Web-App für ein fiktives PC-Gaming- & Internet-Café in Berlin-Wedding:
PC-Platz-Reservierung über einen interaktiven **Raumplan**, eine **Spiele-Bibliothek**,
**Turniere** mit Accounts/Teams und daraus **abgeleiteten Leaderboards**, ein **Gastro-Menü**
und ein **Admin-Bereich** — im dunklen, modernen Design.

> Studienprojekt (Web Engineering). Frontend: Vanilla **HTML5 + CSS3 + ES-Module-JavaScript**.
> Backend: **Node.js + Express**. Datenbank: **MySQL/MariaDB**. Kein Framework, kein Build-Step.

---

## Inhalt / Features

| Seite | Beschreibung |
|-------|--------------|
| **Home** (`index.html`) | Hero mit echten Café-Fotos, Tarif-Teaser, animierte Stats (IntersectionObserver) |
| **Buchung** (`buchung.html`) | Interaktiver **PC-Raumplan** (nach echtem Grundriss) → Reservierung mit Inline-Validierung |
| **Spiele** (`spiele.html`) | Galerie mit Cover-Bildern, Live-Suche + Genre-Filter |
| **Ausstattung** (`ausstattung.html`) | Hardware-Specs als WAI-ARIA-Tabs (tastaturbedienbar) |
| **Preise** (`preise.html`) | Tarif-Karten (datengetrieben aus der Config) |
| **Turniere** (`turniere.html`) | 4 Spiele (Valorant, FIFA, LoL, CS), Anmeldung (Login nötig) |
| **Leaderboards** (`leaderboards.html`) | Pro Spiel **Solo + Team**, aus Turnier-Ergebnissen abgeleitet |
| **Gastro** (`gastro.html`) | Filterbares Menü |
| **Konto** (`konto.html`) | Registrierung & Login (**nur Benutzername + Passwort**) |
| **Admin** (`admin.html`) | Buchungen einsehen/stornieren (Staff-Token) |
| **404 / Impressum / Datenschutz / AGB** | Fehlerseite + Rechtliches |

**Barrierefreiheit:** Skip-Link, durchgehende Heading-Hierarchie, `aria-*`, sichtbarer Fokus-Ring,
volle Tastaturbedienung (Sitzplan & Tabs als echte `<button>`s), `prefers-reduced-motion`-Guard.
**Browser-APIs:** Canvas-frei, aber `localStorage`, `IntersectionObserver`, History/Fetch.

---

## Projektstruktur

```
.
├── frontend/                 # statische Multi-Page-App (wird vom Backend ausgeliefert)
│   ├── *.html                # 14 Seiten
│   ├── css/                  # Design-System, @layer + Tokens (14 Dateien, main.css = Einstieg)
│   ├── js/
│   │   ├── main.js           # lädt pro Seite das passende features/<page>.js
│   │   ├── api/              # api.js (fetch + Mock-Fallback) · mock.js
│   │   ├── features/         # ein Modul pro Seite
│   │   ├── utils/ · config/  # dom/format/storage · SEAT_ZONES, TARIFE …
│   │   └── …
│   └── assets/               # Fotos & Spiel-Cover
├── backend/                  # Express + MySQL (geschichtet)
│   ├── server.js             # App: helmet, session, /api-Router, statisch, 404, Fehler-Handler
│   ├── routes/ controllers/ services/   # dünne Routen → Controller → Services
│   ├── db/                   # schema.sql · seed.sql · pool.js · setup.js
│   ├── lib/ validators/ middleware/      # rein/wiederverwendbar · Validierung · Auth/Errors
│   └── test/                 # node:test Unit-Tests (ohne DB)
├── docker-compose.yml        # App + MariaDB
├── PLAN.md · SPIELE.md       # Projektplan · Spieleliste
```

---

## Lokal starten

Voraussetzung: **Node.js ≥ 20**. (Für echte Daten zusätzlich **MySQL/MariaDB**.)

### Option A — Komplette App mit Datenbank (empfohlen)

```bash
cd backend
npm install
cp .env.example .env          # DB-Zugangsdaten in .env eintragen
npm run db:setup              # legt Schema an + befüllt Beispieldaten (+ Admin-User)
npm run dev                   # Server auf http://localhost:3000
```

Dann **http://localhost:3000** öffnen. Buchungen, Login & Turnier-Anmeldungen werden in der DB
gespeichert. Der Seed legt einen Staff-Account an: **`admin` / `admin123`** (in `.env` änderbar
via `ADMIN_BOOTSTRAP`).

### Option B — Schnellansicht ohne Datenbank

```bash
cd backend
npm install
cp .env.example .env
npm run dev                   # http://localhost:3000
```

Ohne erreichbare DB liefert das Frontend automatisch **eingebaute Mock-Daten** (Spiele, Menü,
Sitzplan, Leaderboards …), sodass alle Seiten funktionieren. Buchung/Login werden dann nur
simuliert. Ideal für einen schnellen Blick.

### Option C — Docker

```bash
docker compose up            # App + MariaDB
# danach einmalig im app-Container: npm run db:setup
```

---

## Skripte (im `backend/`)

| Befehl | Wirkung |
|--------|---------|
| `npm run dev` | Server mit Auto-Reload (nodemon) |
| `npm start` | Server starten |
| `npm run db:setup` | `schema.sql` + `seed.sql` ausführen, Admin-Passwort hashen (idempotent) |
| `npm test` | Unit-Tests (`node:test`, ohne DB) |
| `npm run lint` / `npm run format` | ESLint / Prettier |

---

## REST-API (Auszug)

| Methode | Route | Zweck |
|---------|-------|-------|
| `POST` | `/api/auth/register` · `/login` · `/logout` · `GET /me` | Accounts (Benutzername+Passwort, bcrypt + Session) |
| `GET` | `/api/seats` · `/api/seats/availability?date=&time=` | Sitzplan + Verfügbarkeit |
| `POST` | `/api/bookings` | Reservierung (Server-Validierung → 400; Doppelbuchung → 409) |
| `GET`/`PATCH` | `/api/bookings` · `/api/bookings/:id` | Admin: auflisten / stornieren (Staff) |
| `GET` | `/api/games?q=` · `/api/menu` | Spiele-Bibliothek · Gastro |
| `GET` | `/api/tournaments` · `POST /:id/register` · `/results` | Turniere (Anmeldung/Ergebnisse) |
| `GET` | `/api/leaderboard?game=&type=solo\|team` | abgeleitete Ranglisten |

Fehler kommen einheitlich als `{ "error": { "code", "message", "fields"? } }` mit passendem
HTTP-Status (400/401/403/404/409/500) zurück. Alle SQL-Abfragen sind parametrisiert.

---

## Datenbank

10 Tabellen (`users, teams, team_members, tournaments, registrations, results, seats, bookings,
games, menu_items`). Sitzplatz-Doppelbuchungen verhindert ein `UNIQUE(seat_id, date, start_time)`
+ Transaktion. **Leaderboards sind keine Tabelle**, sondern werden per `SUM(points)`-Join über
`results` abgeleitet (Solo / Team-Spiel-Solo / Team). Schema & Beispieldaten: `backend/db/`.

---

## Tests

```bash
cd backend && npm test    # 48 Unit-Tests (Punktevergabe, Preise, Verfügbarkeit, Validierung)
```

Die Tests sind rein (kein DB-Zugriff) und damit stabil.

---

© 2026 PixelForge Gaming Café — Studienprojekt Web Engineering.
