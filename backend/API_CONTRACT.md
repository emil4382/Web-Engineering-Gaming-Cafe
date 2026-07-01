# PixelForge - Backend API Contract

This file describes the database schema and the REST API. All the layer-agents
(routes, controllers, services, db) build against it. The GET responses match
`frontend/js/api/mock.js` exactly, so the static site and the real API return
the same shapes.

Some basics:

- Base path: `/api`
- Content type: `application/json` (for both request and response)
- Sessions: `express-session`, httpOnly cookie `pixelforge.sid`, `credentials: 'include'`
- Passwords: `bcryptjs` hashes, we never send these back to clients
- Money: stored as `DECIMAL`, returned as normal JSON numbers
- Dates: `YYYY-MM-DD`, times: `HH:MM` / `HH:MM:SS`

## 1. Error shape

Every error uses the same wrapper and a matching HTTP status:

```json
{ "error": { "code": "validation_error", "message": "…", "fields": { "username": "…" } } }
```

- `code` is a fixed machine string (e.g. `validation_error`, `unauthenticated`,
  `forbidden`, `not_found`, `conflict`, `internal_error`).
- `message` is readable text (German for stuff the user sees).
- `fields` is optional. It shows up on `400` validation errors: `{ <field>: <message> }`.

The statuses we use:

- `400` validation failed, so include `fields`.
- `401` not logged in (no session or a bad one).
- `403` logged in but missing the role (needs `staff`) or not the owner of the resource.
- `404` resource or route not found.
- `409` conflict: duplicate username, a booked slot, a full or duplicate registration.
- `500` some server error we didn't handle (message stays generic).

The central handler in `server.js` also turns a MySQL `ER_DUP_ENTRY` into a `409`.

## 2. Auth and roles

- `requireAuth` sends back `401 { code: 'unauthenticated' }` when there's no session user.
- `requireStaff` needs `requireAuth` and `user.role === 'staff'`, otherwise
  `403 { code: 'forbidden' }`.
- The session keeps the user id, and controllers load `req.user = { id, username, role }`.
- The user object from the auth endpoints never has `password_hash` in it:

```json
{ "id": 1, "username": "admin", "role": "staff", "created_at": "2026-06-23 10:00:00" }
```

## 3. Database tables (final columns)

### users  (no email)
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

### registrations  (exactly one of user_id / team_id)
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED PK AI | |
| tournament_id | INT UNSIGNED FK→tournaments | |
| user_id | INT UNSIGNED FK→users | nullable |
| team_id | INT UNSIGNED FK→teams | nullable |
| registered_at | TIMESTAMP | |
| | | UNIQUE(tournament_id,user_id), UNIQUE(tournament_id,team_id), CHECK XOR |

### seats  (38 PCs, PC-only)
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
| | | UNIQUE uq_active_slot(seat_id, date, start_time) → 409 |

### games
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED PK AI | |
| name | VARCHAR(80) | UNIQUE |
| emoji | VARCHAR(8) | |
| genre | VARCHAR(20) | |
| image_url | VARCHAR(160) | nullable; `assets/games/<slug>.jpg` for 6 titles |

Note: the tarife are not a table. The 4 tariffs live as static data in
`frontend/js/config/seatLayout.js` (`TARIFE`). The optional
`GET /api/content/tarife` just echoes them.

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
- `401` → wrong credentials.

#### `POST /api/auth/logout`
- `204` → no body, kills the session.

#### `GET /api/auth/me`
- `200` → `{ "user": { … } }` when logged in, else `{ "user": null }`.
  (The mock throws 401 when logged out. Returning `{user:null}` is fine too,
  `getMe()` treats both as "logged out".)

### Teams  (requireAuth)

#### `POST /api/teams`
Request: `{ "name": "Neon Vipers", "tag": "NV", "game": "valorant" }`
- `201` → `{ "team": { id, name, tag, game, captain_id, created_at } }`
  (the creator gets added to `team_members` as `captain`).
- `400` invalid, `409` name taken.

#### `GET /api/teams/:id`
- `200` → `{ "team": { id, name, tag, game, captain_id, created_at,
  "members": [ { user_id, username, role, joined_at } ] } }`
- `404` unknown id.

#### `POST /api/teams/:id/members`  (captain only)
Request: `{ "username": "PixelQueen" }`
- `201` → `{ "member": { user_id, username, role:'member', joined_at } }`
- `403` not captain, `404` user/team unknown, `409` already a member.

#### `GET /api/me/teams`  (requireAuth)
- `200` → `[ { id, name, tag, game, role } ]`, the teams the user is in.

### Tournaments

#### `GET /api/tournaments?game=&status=`
Optional filters: `game` (`valorant|fifa|lol|cs`), `status`.
- `200` → array, each item matches the mock card shape:

```json
{
  "id": 1, "game": "valorant", "title": "Valorant 5v5 Cup", "mode": "team",
  "date": "2026-06-22", "format": "5v5 · Team", "prize": "500 €",
  "status": "anmeldung_offen", "slots": 16, "registered": 11
}
```

`slots` is `max_participants`, `registered` is the count of registrations. The
frontend mock also uses `status:'open'|'full'`. The backend gives back the German
enum plus `registered`/`slots` so the client can work out "full" itself.

#### `GET /api/tournaments/:id`
- `200` → the same tournament object plus a `participants` array (teams or users
  depending on `mode`). `404` unknown id.

#### `POST /api/tournaments/:id/register`  (requireAuth)
Request: team mode `{ "team_id": 1 }`, solo mode `{}` (uses the session user).
- `201` → `{ "registration": { id, tournament_id, user_id|team_id, registered_at } }`
- `400` wrong mode (e.g. a team_id on a solo tournament).
- `403` not captain of `team_id`.
- `409` tournament full or duplicate registration.

#### `POST /api/tournaments`  (requireStaff)
Request: `{ game, mode, title, date?, format?, prize?, max_participants?, status? }`
- `201` → `{ "tournament": { … } }`, `400` invalid.

### Café

#### `GET /api/seats`
- `200` → all 38 seats. Same shape as the mock seat object:

```json
{ "id": "B5", "code": "B5", "label": "B5", "zoneId": "insel-b",
  "zone": "Insel B", "tier": "Premium", "status": "available" }
```

Without a date/time the status is `available` (or a fixed demo pattern that
matches the mock). `zoneId` and `tier` come from the static layout, not the DB
row, so the renderer lines up with the floor plan.

#### `GET /api/seats/availability?date=&time=`
- `200` → same 38-seat array. `status` is `occupied` where an active
  (`status != 'storniert'`) booking exists for that `seat_id + date + time`,
  otherwise `available`.

#### `POST /api/bookings`
Request:
```json
{ "code": "B5", "date": "2026-06-26", "time": "18:00",
  "tarif": "starter", "name": "Max", "email": "max@example.com" }
```
- The server validates (seat exists, valid date/time slot, known tarif, name is
  there). It works out `total` from the tarif and inserts inside a transaction.
  The `uq_active_slot` UNIQUE turns a race into a clean conflict.
- `201` → `{ "booking": { id, seat_id, code, date, start_time, tarif, total,
  name, email, status, reference, created_at } }`
- `400` → `{ error:{ code:'validation_error', fields:{ … } } }`
- `409` → slot already booked.

#### `GET /api/bookings`  (requireStaff)
- `200` → array of bookings (the admin list), with optional `?date=` / `?status=` filters.

#### `PATCH /api/bookings/:id`  (requireStaff, cancel)
Request: `{ "status": "storniert" }`
- `200` → `{ "booking": { … } }`, `404` unknown id, `400` invalid status.

#### `GET /api/games?q=`
- `200` → array matching the mock game object (`q` filters by name):

```json
{ "name": "Valorant", "emoji": "🎯", "genre": "Shooter / FPS",
  "image": "assets/games/valorant.jpg" }
```

`image` is `null` when there's no asset. The DB column is `image_url`, the API
sends it as `image` to match the frontend. `slug` and `tournament` are mock-only
and we might add them for parity, but they aren't stored.

#### `GET /api/content/tarife`  (optional, static)
- `200` → the `TARIFE` array from `seatLayout.js` (4 tariffs). Not from the DB.

## 5. Mapping notes for whoever implements this

| Frontend field | DB column | Transform |
|----------------|-----------|-----------|
| game `image` | `games.image_url` | rename |
| booking `time` (req) | `bookings.start_time` | `HH:MM` → `TIME` |
| booking `code` (req) | resolve `seats.id` via `seats.code` | lookup |
| seat `zoneId` / `tier` | - (static layout) | join from `SEAT_ZONES` by `zone` |
| tournament `slots` | `tournaments.max_participants` | rename |
| tournament `registered` | `COUNT(registrations)` | derived |

Booking `total` = tarif price × units. For the POC the hourly `starter` tarif is
`price × 1` and the flat tariffs (`tagespass`, `night`, `vip`) just use their
fixed price. Keep the pricing in a plain `lib/pricing.js` so it's easy to unit-test.
