# PixelForge — Backend API Contract

> **Single source of truth** for the database schema and REST API. All
> layer-agents (routes → controllers → services → db) build against this file.
> GET response shapes mirror `frontend/js/api/mock.js` exactly so the static
> site and the live API are interchangeable.

- Base path: `/api`
- Content type: `application/json` (request + response)
- Sessions: `express-session`, httpOnly cookie `pixelforge.sid`, `credentials: 'include'`
- Passwords: `bcryptjs` hashes (never returned to clients)
- Money: stored as `DECIMAL`, returned as JSON numbers
- Dates: `YYYY-MM-DD`; times: `HH:MM` / `HH:MM:SS`

---

## 1. Error shape

Every error response uses one envelope and a correct HTTP status:

```json
{ "error": { "code": "validation_error", "message": "…", "fields": { "username": "…" } } }
```

- `code` — stable machine string (e.g. `validation_error`, `unauthenticated`,
  `forbidden`, `not_found`, `conflict`, `internal_error`).
- `message` — human-readable (German for user-facing flows).
- `fields` — optional, present on `400` validation errors: `{ <field>: <message> }`.

| Status | When |
|--------|------|
| `400` | Validation failed → include `fields`. |
| `401` | Not authenticated (no/invalid session). |
| `403` | Authenticated but lacking role (needs `staff`) or not the resource owner. |
| `404` | Resource / route not found. |
| `409` | Conflict: duplicate username, booked slot, full/duplicate registration. |
| `500` | Unhandled server error (message is generic). |

The central handler in `server.js` also maps MySQL `ER_DUP_ENTRY` → `409`.

---

## 2. Auth & role conventions

- `requireAuth` — rejects with `401 { code: 'unauthenticated' }` if no session user.
- `requireStaff` — requires `requireAuth` **and** `user.role === 'staff'`; else
  `403 { code: 'forbidden' }`.
- The session stores the user id; controllers load `req.user = { id, username, role }`.
- The **user object** returned by auth endpoints never includes `password_hash`:

```json
{ "id": 1, "username": "admin", "role": "staff", "created_at": "2026-06-23 10:00:00" }
```

---

## 3. Database tables (final columns)

### users  *(no email)*
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED PK AI | |
| username | VARCHAR(40) | UNIQUE |
| password_hash | VARCHAR(255) | bcrypt |
| role | ENUM('user','staff') | DEFAULT 'user' |
| created_at | TIMESTAMP | DEFAULT now |

### teams
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED PK AI | |
| name | VARCHAR(60) | UNIQUE |
| tag | VARCHAR(8) | nullable |
| game | ENUM('valorant','lol','cs') | team games only (no FIFA) |
| captain_id | INT UNSIGNED FK→users | ON DELETE CASCADE |
| created_at | TIMESTAMP | |

### team_members
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED PK AI | |
| team_id | INT UNSIGNED FK→teams | |
| user_id | INT UNSIGNED FK→users | |
| role | ENUM('captain','member') | DEFAULT 'member' |
| joined_at | TIMESTAMP | |
| | | UNIQUE(team_id, user_id) |

### tournaments
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED PK AI | |
| game | ENUM('valorant','fifa','lol','cs') | |
| mode | ENUM('solo','team') | FIFA=solo, rest=team |
| title | VARCHAR(120) | |
| date | DATE | nullable |
| format | VARCHAR(40) | e.g. '5v5 · Team' |
| prize | VARCHAR(40) | e.g. '500 €' |
| max_participants | INT UNSIGNED | nullable |
| status | ENUM('angekuendigt','anmeldung_offen','laufend','abgeschlossen') | DEFAULT 'angekuendigt' |
| created_at | TIMESTAMP | |

### registrations  *(exactly one of user_id / team_id)*
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED PK AI | |
| tournament_id | INT UNSIGNED FK→tournaments | |
| user_id | INT UNSIGNED FK→users | nullable |
| team_id | INT UNSIGNED FK→teams | nullable |
| registered_at | TIMESTAMP | |
| | | UNIQUE(tournament_id,user_id), UNIQUE(tournament_id,team_id), CHECK XOR |

### results  *(exactly one of user_id / team_id)*
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED PK AI | |
| tournament_id | INT UNSIGNED FK→tournaments | |
| user_id | INT UNSIGNED FK→users | nullable |
| team_id | INT UNSIGNED FK→teams | nullable |
| placement | INT | 1-based |
| points | INT | DEFAULT 0 (PLAN.md: 1=100,2=60,3=40,4–8=20,part=10) |

### seats  *(38 PCs, PC-only)*
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED PK AI | |
| code | VARCHAR(8) | UNIQUE (N1–N6, W1–W10, A1–A8, B1–B8, P1–P6) |
| zone | VARCHAR(40) | 'Reihe Nord' / 'Reihe West' / 'Insel A' / 'Insel B' / 'Privat-Box' |
| label | VARCHAR(40) | = code |
| type | ENUM('pc') | DEFAULT 'pc' |

### bookings
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED PK AI | |
| seat_id | INT UNSIGNED FK→seats | |
| date | DATE | |
| start_time | TIME | |
| tarif | VARCHAR(20) | one of TARIFE keys |
| total | DECIMAL(7,2) | |
| name | VARCHAR(80) | |
| email | VARCHAR(120) | nullable |
| status | ENUM('offen','bestaetigt','storniert') | DEFAULT 'bestaetigt' |
| reference | VARCHAR(20) | UNIQUE booking ref |
| created_at | TIMESTAMP | |
| | | **UNIQUE uq_active_slot(seat_id, date, start_time)** → 409 |

### games
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED PK AI | |
| name | VARCHAR(80) | UNIQUE |
| emoji | VARCHAR(8) | |
| genre | VARCHAR(20) | |
| image_url | VARCHAR(160) | nullable; `assets/games/<slug>.jpg` for 6 titles |

### menu_items
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED PK AI | |
| category | ENUM('snacks','energy','kaffee','soft') | |
| emoji | VARCHAR(8) | |
| name | VARCHAR(80) | |
| description | VARCHAR(160) | |
| price | DECIMAL(6,2) | |

> **Tarife are NOT a table** — the 4 tariffs are static in
> `frontend/js/config/seatLayout.js` (`TARIFE`). The optional
> `GET /api/content/tarife` simply echoes them.

> **Leaderboards are DERIVED** — no table. `GROUP BY + SUM(points)` over
> `results`, filtered by `game` and `type`:
> - `type=solo`, FIFA → `results JOIN users` (direct).
> - `type=solo`, team-game → `results JOIN team_members JOIN users` (each member
>   inherits the team's points; uses current membership).
> - `type=team` → `results JOIN teams`.
> `ORDER BY score DESC LIMIT 10`.

---

## 4. Endpoints

### Auth

#### `POST /api/auth/register`
Request: `{ "username": "neo", "password": "secret123" }`
- `201` → `{ "user": { id, username, role, created_at } }` and sets the session.
- `400` → `{ error: { code:'validation_error', fields:{ username?, password? } } }`
- `409` → username taken (`code:'conflict'`).

#### `POST /api/auth/login`
Request: `{ "username": "neo", "password": "secret123" }`
- `200` → `{ "user": { … } }`, sets session.
- `401` → invalid credentials.

#### `POST /api/auth/logout`
- `204` → no body; destroys the session.

#### `GET /api/auth/me`
- `200` → `{ "user": { … } }` when logged in, else `{ "user": null }`.
  *(The mock throws 401 when logged out; returning `{user:null}` is also
  acceptable — `getMe()` treats both as "logged out".)*

### Teams *(requireAuth)*

#### `POST /api/teams`
Request: `{ "name": "Neon Vipers", "tag": "NV", "game": "valorant" }`
- `201` → `{ "team": { id, name, tag, game, captain_id, created_at } }`
  (creator is inserted into `team_members` as `captain`).
- `400` invalid; `409` name taken.

#### `GET /api/teams/:id`
- `200` → `{ "team": { id, name, tag, game, captain_id, created_at,
  "members": [ { user_id, username, role, joined_at } ] } }`
- `404` unknown id.

#### `POST /api/teams/:id/members` *(captain only)*
Request: `{ "username": "PixelQueen" }`
- `201` → `{ "member": { user_id, username, role:'member', joined_at } }`
- `403` not captain; `404` user/team unknown; `409` already a member.

#### `GET /api/me/teams` *(requireAuth)*
- `200` → `[ { id, name, tag, game, role } ]` — teams the user belongs to.

### Tournaments

#### `GET /api/tournaments?game=&status=`
Optional filters: `game` (`valorant|fifa|lol|cs`), `status`.
- `200` → array; each item mirrors the mock card shape:

```json
{
  "id": 1, "game": "valorant", "title": "Valorant 5v5 Cup", "mode": "team",
  "date": "2026-06-22", "format": "5v5 · Team", "prize": "500 €",
  "status": "anmeldung_offen", "slots": 16, "registered": 11
}
```
> `slots` = `max_participants`; `registered` = count of registrations.
> Frontend mock also uses `status:'open'|'full'`; backend exposes the German
> enum and `registered`/`slots` so the client can derive "full".

#### `GET /api/tournaments/:id`
- `200` → the tournament object above plus a `participants` array
  (teams or users depending on `mode`). `404` unknown id.

#### `POST /api/tournaments/:id/register` *(requireAuth)*
Request: team mode `{ "team_id": 1 }`; solo mode `{}` (uses session user).
- `201` → `{ "registration": { id, tournament_id, user_id|team_id, registered_at } }`
- `400` wrong mode (e.g. team_id on a solo tournament).
- `403` not captain of `team_id`.
- `409` tournament full **or** duplicate registration.

#### `POST /api/tournaments` *(requireStaff)*
Request: `{ game, mode, title, date?, format?, prize?, max_participants?, status? }`
- `201` → `{ "tournament": { … } }`; `400` invalid.

#### `POST /api/tournaments/:id/results` *(requireStaff)*
Request: `{ "results": [ { "team_id"|"user_id": N, "placement": 1 } ] }`
- Server computes `points` from placement (PLAN.md scheme).
- `201` → `{ "results": [ { id, placement, points, … } ] }`; `400` invalid.

### Leaderboards

#### `GET /api/leaderboard?game=&type=solo|team`
- `game` ∈ `valorant|fifa|lol|cs` (default `valorant`); `type` ∈ `solo|team` (default `solo`).
- FIFA has only `solo`. `200` → derived ranked array, mirroring the mock:

Solo:
```json
[ { "rank": 1, "name": "xX_ShadowBlade_Xx", "points": 920, "delta": 2 } ]
```
Team:
```json
[ { "rank": 1, "name": "Neon Vipers", "players": 5, "points": 920, "delta": 2 } ]
```
> `rank` is derived from `ORDER BY points DESC`. `delta` (rank movement) has no
> historical source yet — return `0` unless a previous snapshot exists.

### Café

#### `GET /api/seats`
- `200` → all 38 seats. Shape mirrors the mock seat object:

```json
{ "id": "B5", "code": "B5", "label": "B5", "zoneId": "insel-b",
  "zone": "Insel B", "tier": "Premium", "status": "available" }
```
> Without a date/time the status is `available` (or a deterministic demo
> pattern matching the mock). `zoneId`/`tier` come from the static layout, not
> the DB row, so the renderer matches the floor plan.

#### `GET /api/seats/availability?date=&time=`
- `200` → same 38-seat array; `status` is `occupied` where an active
  (`status != 'storniert'`) booking exists for that `seat_id + date + time`,
  else `available`.

#### `POST /api/bookings`
Request:
```json
{ "code": "B5", "date": "2026-06-26", "time": "18:00",
  "tarif": "starter", "name": "Max", "email": "max@example.com" }
```
- Server validates (seat exists, valid date/time slot, known tarif, name
  present). Computes `total` from the tarif. Inserts inside a **transaction**;
  the `uq_active_slot` UNIQUE turns a race into a clean conflict.
- `201` → `{ "booking": { id, seat_id, code, date, start_time, tarif, total,
  name, email, status, reference, created_at } }`
- `400` → `{ error:{ code:'validation_error', fields:{ … } } }`
- `409` → slot already booked.

#### `GET /api/bookings` *(requireStaff)*
- `200` → array of bookings (admin list), optional `?date=` / `?status=` filters.

#### `PATCH /api/bookings/:id` *(requireStaff, cancel)*
Request: `{ "status": "storniert" }`
- `200` → `{ "booking": { … } }`; `404` unknown id; `400` invalid status.

#### `GET /api/games?q=`
- `200` → array mirroring the mock game object (search `q` filters by name):

```json
{ "name": "Valorant", "emoji": "🎯", "genre": "Shooter / FPS",
  "image": "assets/games/valorant.jpg" }
```
> `image` is `null` when no asset exists. The DB column is `image_url`; the API
> exposes it as `image` to match the frontend. `slug`/`tournament` are mock-only
> conveniences and may be added for parity but are not stored.

#### `GET /api/menu`
- `200` → array mirroring the mock menu object:

```json
{ "name": "Pizza Salami", "emoji": "🍕", "desc": "Frisch gebacken, 28cm",
  "price": 8.5, "category": "snacks" }
```
> DB column `description` is exposed as `desc` to match the frontend.

#### `GET /api/content/tarife` *(optional, static)*
- `200` → the `TARIFE` array from `seatLayout.js` (4 tariffs). Not DB-backed.

---

## 5. Mapping notes for implementers

| Frontend field | DB column | Transform |
|----------------|-----------|-----------|
| game `image` | `games.image_url` | rename |
| menu `desc` | `menu_items.description` | rename |
| booking `time` (req) | `bookings.start_time` | `HH:MM` → `TIME` |
| booking `code` (req) | resolve `seats.id` via `seats.code` | lookup |
| seat `zoneId` / `tier` | — (static layout) | join from `SEAT_ZONES` by `zone` |
| tournament `slots` | `tournaments.max_participants` | rename |
| tournament `registered` | `COUNT(registrations)` | derived |

Booking `total` = tarif price × units; for the POC the hourly `starter` tarif is
`price × 1` and flat tariffs (`tagespass`, `night`, `vip`) use their fixed price.
Keep pricing in a pure `lib/pricing.js` so it is unit-testable.
