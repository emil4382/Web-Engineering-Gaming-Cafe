-- ===========================================================================
-- PixelForge — relational schema (MySQL / MariaDB)
-- ---------------------------------------------------------------------------
-- Re-runnable: every table is dropped first (in FK-dependency order) so the
-- whole file can be replayed by db/setup.js. Charset utf8mb4 throughout so
-- emojis (games / menu) and German umlauts are stored faithfully.
-- ===========================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Drop in dependency order (children before parents) ------------------------
DROP TABLE IF EXISTS results;
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS team_members;
DROP TABLE IF EXISTS tournaments;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS seats;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------------
-- users — accounts (username + password only, NO email)
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(40)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('user','staff') NOT NULL DEFAULT 'user',
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- teams — fixed rosters, each bound to a 5v5 game (FIFA is solo-only)
-- ---------------------------------------------------------------------------
CREATE TABLE teams (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(60)  NOT NULL,
  tag        VARCHAR(8)   NULL,
  game       ENUM('valorant','lol','cs') NOT NULL,
  captain_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_teams_name (name),
  KEY idx_teams_game (game),
  KEY idx_teams_captain (captain_id),
  CONSTRAINT fk_teams_captain FOREIGN KEY (captain_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- team_members — membership join table (one row per user per team)
-- ---------------------------------------------------------------------------
CREATE TABLE team_members (
  id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  team_id   INT UNSIGNED NOT NULL,
  user_id   INT UNSIGNED NOT NULL,
  role      ENUM('captain','member') NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_team_member (team_id, user_id),
  KEY idx_tm_user (user_id),
  CONSTRAINT fk_tm_team FOREIGN KEY (team_id)
    REFERENCES teams (id) ON DELETE CASCADE,
  CONSTRAINT fk_tm_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- tournaments — cafe tournaments (the 4 games), lifecycle via status enum
-- ---------------------------------------------------------------------------
CREATE TABLE tournaments (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  game             ENUM('valorant','fifa','lol','cs') NOT NULL,
  mode             ENUM('solo','team') NOT NULL,
  title            VARCHAR(120) NOT NULL,
  date             DATE         NULL,
  format           VARCHAR(40)  NULL,
  prize            VARCHAR(40)  NULL,
  max_participants INT UNSIGNED NULL,
  status           ENUM('angekuendigt','anmeldung_offen','laufend','abgeschlossen')
                     NOT NULL DEFAULT 'angekuendigt',
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tournaments_game (game),
  KEY idx_tournaments_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- registrations — exactly ONE of user_id / team_id is set (solo vs. team)
-- The XOR rule is enforced at the service layer; the partial UNIQUE indexes
-- below prevent duplicate sign-ups per tournament for each side.
-- ---------------------------------------------------------------------------
CREATE TABLE registrations (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tournament_id INT UNSIGNED NOT NULL,
  user_id       INT UNSIGNED NULL,
  team_id       INT UNSIGNED NULL,
  registered_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reg_user (tournament_id, user_id),
  UNIQUE KEY uq_reg_team (tournament_id, team_id),
  KEY idx_reg_tournament (tournament_id),
  CONSTRAINT fk_reg_tournament FOREIGN KEY (tournament_id)
    REFERENCES tournaments (id) ON DELETE CASCADE,
  CONSTRAINT fk_reg_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_reg_team FOREIGN KEY (team_id)
    REFERENCES teams (id) ON DELETE CASCADE,
  CONSTRAINT chk_reg_xor CHECK (
    (user_id IS NOT NULL AND team_id IS NULL)
    OR (user_id IS NULL AND team_id IS NOT NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- results — final placements + points; leaderboards are DERIVED from this.
-- Exactly ONE of user_id / team_id is set, mirroring registrations.
-- ---------------------------------------------------------------------------
CREATE TABLE results (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tournament_id INT UNSIGNED NOT NULL,
  user_id       INT UNSIGNED NULL,
  team_id       INT UNSIGNED NULL,
  placement     INT          NOT NULL,
  points        INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_results_tournament (tournament_id),
  KEY idx_results_user (user_id),
  KEY idx_results_team (team_id),
  CONSTRAINT fk_results_tournament FOREIGN KEY (tournament_id)
    REFERENCES tournaments (id) ON DELETE CASCADE,
  CONSTRAINT fk_results_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_results_team FOREIGN KEY (team_id)
    REFERENCES teams (id) ON DELETE CASCADE,
  CONSTRAINT chk_results_xor CHECK (
    (user_id IS NOT NULL AND team_id IS NULL)
    OR (user_id IS NULL AND team_id IS NOT NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- seats — the 38 PCs of the cafe (PC-only). zone mirrors SEAT_ZONES names.
-- ---------------------------------------------------------------------------
CREATE TABLE seats (
  id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code  VARCHAR(8)   NOT NULL,
  zone  VARCHAR(40)  NOT NULL,
  label VARCHAR(40)  NOT NULL,
  type  ENUM('pc')   NOT NULL DEFAULT 'pc',
  PRIMARY KEY (id),
  UNIQUE KEY uq_seats_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- bookings — reservations. UNIQUE(seat_id,date,start_time) guarantees a slot
-- can only be taken once; the booking transaction relies on it to return 409.
-- ---------------------------------------------------------------------------
CREATE TABLE bookings (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  seat_id    INT UNSIGNED NOT NULL,
  date       DATE         NOT NULL,
  start_time TIME         NOT NULL,
  tarif      VARCHAR(20)  NOT NULL,
  total      DECIMAL(7,2) NOT NULL,
  name       VARCHAR(80)  NOT NULL,
  email      VARCHAR(120) NULL,
  status     ENUM('offen','bestaetigt','storniert') NOT NULL DEFAULT 'bestaetigt',
  reference  VARCHAR(20)  NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_active_slot (seat_id, date, start_time),
  UNIQUE KEY uq_booking_reference (reference),
  KEY idx_bookings_date (date),
  KEY idx_bookings_status (status),
  CONSTRAINT fk_bookings_seat FOREIGN KEY (seat_id)
    REFERENCES seats (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- games — featured library (name, emoji, genre, optional cover image)
-- ---------------------------------------------------------------------------
CREATE TABLE games (
  id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name      VARCHAR(80)  NOT NULL,
  emoji     VARCHAR(8)   NULL,
  genre     VARCHAR(20)  NULL,
  image_url VARCHAR(160) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_games_name (name),
  KEY idx_games_genre (genre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- menu_items — gastro menu grouped by category
-- ---------------------------------------------------------------------------
CREATE TABLE menu_items (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  category    ENUM('snacks','energy','kaffee','soft') NOT NULL,
  emoji       VARCHAR(8)   NULL,
  name        VARCHAR(80)  NOT NULL,
  description VARCHAR(160) NULL,
  price       DECIMAL(6,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_menu_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
