# PixelForge - Gaming & Internet Café

Web-App für ein erfundenes PC-Gaming-Café in Karlsruhe.
Man kann PC-Plätze über einen interaktiven Raumplan reservieren, es gibt eine
Spiele-Bibliothek, Turniere mit Accounts/Teams und einen Admin-Bereich. Alles im
dunklen, modernen Design.

Studienprojekt (Web Engineering). Frontend ist Vanilla HTML5 + CSS3 + ES-Module-JavaScript.
Backend läuft mit Node.js + Express, Datenbank ist MySQL/MariaDB. Kein Framework, kein Build-Step.

## Inhalt / Features

| Seite | Beschreibung |
|-------|--------------|
| Home (`index.html`) | Hero mit echten Café-Fotos, Tarif-Teaser, animierte Stats (IntersectionObserver) |
| Buchung (`buchung.html`) | Interaktiver PC-Raumplan (nach echtem Grundriss), Reservierung mit Inline-Validierung |
| Spiele (`spiele.html`) | Galerie mit Cover-Bildern, Live-Suche + Genre-Filter |
| Ausstattung (`ausstattung.html`) | Hardware-Specs als WAI-ARIA-Tabs (tastaturbedienbar) |
| Preise (`preise.html`) | Tarif-Karten (kommen aus der Config) |
| Turniere (`turniere.html`) | 4 Spiele (Valorant, FIFA, LoL, CS), Anmeldung geht nur mit Login |
| Konto (`konto.html`) | Registrierung & Login (nur Benutzername + Passwort) |
| Admin (`admin.html`) | Buchungen ansehen/stornieren (nur Staff) |
| 404 / Impressum / Datenschutz / AGB | Fehlerseite + Rechtliches |

Barrierefreiheit: Skip-Link, durchgehende Heading-Hierarchie, `aria-*`, sichtbarer Fokus-Ring,
volle Tastaturbedienung (Sitzplan & Tabs sind echte `<button>`s), `prefers-reduced-motion`-Guard.

Browser-APIs: `localStorage`, `IntersectionObserver`, History/Fetch.

## Projektstruktur

```
.
├── frontend/                 # statische Multi-Page-App (wird vom Backend ausgeliefert)
│   ├── *.html                # 12 Seiten
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
│   ├── lib/ validators/ middleware/      # Helper · Validierung · Auth/Errors
│   └── test/                 # node:test Unit-Tests (ohne DB)
├── docker-compose.yml        # App + MariaDB
```

## Lokal starten

Man braucht Node.js ≥ 20 (getestet mit 22). Für echte Daten zusätzlich MySQL/MariaDB, oder
einfach Docker (Option A), da ist die Datenbank schon dabei.

### Option A - Docker (am einfachsten, läuft unter Linux, macOS & Windows gleich)

Man braucht nur Docker (Docker Desktop unter Windows/macOS, Docker Engine unter Linux). Keine
lokale DB-Installation nötig.

```bash
cp backend/.env.example .env               # Root-.env für Compose; SESSION_SECRET setzen
docker compose up -d --build               # startet MariaDB + App
docker compose exec app npm run db:setup   # Schema + Beispieldaten anlegen (einmalig)
```

Danach http://localhost:3000 aufmachen. Den DB-Benutzer (`pixelforge`/`pixelforge`) legt der
Container automatisch aus der `.env` an. `docker compose down` stoppt alles, `down -v` löscht
zusätzlich die Datenbank.

### Option B - Node lokal + eigene MySQL/MariaDB

1. Datenbank installieren & starten:

- Linux (Fedora/RHEL): `sudo dnf install mariadb-server` · `sudo systemctl enable --now mariadb`
- Linux (Debian/Ubuntu): `sudo apt install mariadb-server` · `sudo systemctl enable --now mariadb`
- macOS (Homebrew): `brew install mariadb` · `brew services start mariadb`
- Windows: MariaDB- oder MySQL-Installer ausführen, läuft danach als Dienst

2. Datenbank + App-Benutzer anlegen. Dafür als DB-Admin einloggen, der Login ist je nach OS anders:

- Linux: `sudo mariadb`
- macOS (Homebrew): `mariadb -u root`
- Windows: `mysql -u root -p`

Und dann im DB-Prompt einmal das hier ausführen:

```sql
CREATE DATABASE IF NOT EXISTS pixelforge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'pixelforge'@'localhost' IDENTIFIED BY 'pixelforge';
CREATE USER IF NOT EXISTS 'pixelforge'@'127.0.0.1' IDENTIFIED BY 'pixelforge';
GRANT ALL PRIVILEGES ON pixelforge.* TO 'pixelforge'@'localhost', 'pixelforge'@'127.0.0.1';
FLUSH PRIVILEGES;
```

Warum ein eigener Benutzer und nicht `root`? Unter Linux/macOS meldet sich `root` per
Unix-Socket an und kann sich nicht per Passwort über TCP verbinden. Ein normaler DB-Benutzer
funktioniert überall gleich, und die Zugangsdaten stehen schon passend in `backend/.env.example`.

3. Backend starten:

```bash
cd backend
npm install
cp .env.example .env           # Standardwerte passen schon zum Benutzer oben
npm run db:setup               # Schema + Beispieldaten + Admin-User (idempotent)
npm run dev                    # Server auf http://localhost:3000
```

Der Seed legt einen Staff-Account an: `admin` / `admin123` (in `.env` über `ADMIN_BOOTSTRAP`
änderbar).

### Option C - schnell mal reingucken, ganz ohne Datenbank

```bash
cd backend && npm install && cp .env.example .env && npm run dev
```

Wenn keine DB erreichbar ist, nimmt das Frontend automatisch eingebaute Mock-Daten (Spiele,
Sitzplan, Turniere …), damit alle Seiten laufen. Buchung/Login sind dann nur simuliert. Gut,
wenn man nur kurz schauen will.

## Admin-Bereich

Der Admin-Bereich (`admin.html`) ist absichtlich nicht in der Navigation verlinkt, weil er
intern ist. Man ruft ihn direkt über die URL auf, z.B. `http://localhost:3000/admin.html`. Dort
sieht man alle Platzbuchungen und kann sie stornieren.

- Ohne Datenbank (Option C): einfach `admin.html` öffnen und auf „Laden" klicken, dann kommen
  Beispiel-Buchungen aus den Mock-Daten. Man braucht nichts weiter.
- Mit echtem Backend: die Route `GET /api/bookings` ist nur für Staff (`requireStaff`). Den
  Staff-Account legt der Seed an: `admin` / `admin123`.

Das „Admin-Token"-Feld auf der Seite ist aktuell nur ein Platzhalter, geprüft wird die
Staff-Session und nicht das Token.

## Skripte (im `backend/`)

| Befehl | Wirkung |
|--------|---------|
| `npm run dev` | Server mit Auto-Reload (nodemon) |
| `npm start` | Server starten |
| `npm run db:setup` | `schema.sql` + `seed.sql` ausführen, Admin-Passwort hashen (idempotent) |
| `npm test` | Unit-Tests (`node:test`, ohne DB) |
| `npm run lint` / `npm run format` | ESLint / Prettier |

## REST-API (Auszug)

| Methode | Route | Zweck |
|---------|-------|-------|
| `POST` | `/api/auth/register` · `/login` · `/logout` · `GET /me` | Accounts (Benutzername+Passwort, bcrypt + Session) |
| `GET` | `/api/seats` · `/api/seats/availability?date=&time=` | Sitzplan + Verfügbarkeit |
| `POST` | `/api/bookings` | Reservierung (Server-Validierung → 400; Doppelbuchung → 409) |
| `GET`/`PATCH` | `/api/bookings` · `/api/bookings/:id` | Admin: auflisten / stornieren (Staff) |
| `GET` | `/api/games?q=` | Spiele-Bibliothek |
| `GET` | `/api/tournaments` · `POST /:id/register` | Turniere (Anmeldung) |

Fehler kommen immer im gleichen Format zurück: `{ "error": { "code", "message", "fields"? } }`
mit passendem HTTP-Status (400/401/403/404/409/500). Alle SQL-Abfragen sind parametrisiert.

## Datenbank

8 Tabellen (`users, teams, team_members, tournaments, registrations, seats, bookings,
games`). Doppelbuchungen bei Sitzplätzen verhindert ein `UNIQUE(seat_id, date, start_time)`
plus Transaktion. Teams hängen an einem Spiel, und bei Turnier-Anmeldungen geht wahlweise
per User (Solo) oder per Team. Schema & Beispieldaten liegen in `backend/db/`.

## Tests

```bash
cd backend && npm test    # 33 Unit-Tests (Verfügbarkeit, Buchungs- & Auth-Validierung)
```


© 2026 PixelForge Gaming Café - Studienprojekt Web Engineering.
