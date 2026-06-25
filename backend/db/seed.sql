-- ===========================================================================
-- PixelForge — seed data
-- ---------------------------------------------------------------------------
-- Mirrors the frontend mock dataset (js/api/mock.js + config/seatLayout.js +
-- SPIELE.md + index.html) so the live API returns the same shapes the static
-- site already renders. Run AFTER schema.sql by db/setup.js.
--
-- NOTE: the `admin` user is inserted with a PLACEHOLDER password hash here.
-- db/setup.js bcrypt-hashes ADMIN_BOOTSTRAP and UPDATEs it afterwards, so the
-- account is never usable with the placeholder.
-- ===========================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- seats — 62 PCs from SEAT_ZONES (dense LAN-café floor):
--   Gaming-Floor : Reihe A..F, 8 PCs each (A1-A8 … F1-F8) = 48
--   Premium      : Reihe G · Premium (G1-G8)              =  8
--   Privat-Boxen : three boxes of 2 (P1-P6)               =  6
-- ---------------------------------------------------------------------------
INSERT INTO seats (code, zone, label, type) VALUES
  ('A1','Reihe A','A1','pc'), ('A2','Reihe A','A2','pc'),
  ('A3','Reihe A','A3','pc'), ('A4','Reihe A','A4','pc'),
  ('A5','Reihe A','A5','pc'), ('A6','Reihe A','A6','pc'),
  ('A7','Reihe A','A7','pc'), ('A8','Reihe A','A8','pc'),
  ('B1','Reihe B','B1','pc'), ('B2','Reihe B','B2','pc'),
  ('B3','Reihe B','B3','pc'), ('B4','Reihe B','B4','pc'),
  ('B5','Reihe B','B5','pc'), ('B6','Reihe B','B6','pc'),
  ('B7','Reihe B','B7','pc'), ('B8','Reihe B','B8','pc'),
  ('C1','Reihe C','C1','pc'), ('C2','Reihe C','C2','pc'),
  ('C3','Reihe C','C3','pc'), ('C4','Reihe C','C4','pc'),
  ('C5','Reihe C','C5','pc'), ('C6','Reihe C','C6','pc'),
  ('C7','Reihe C','C7','pc'), ('C8','Reihe C','C8','pc'),
  ('D1','Reihe D','D1','pc'), ('D2','Reihe D','D2','pc'),
  ('D3','Reihe D','D3','pc'), ('D4','Reihe D','D4','pc'),
  ('D5','Reihe D','D5','pc'), ('D6','Reihe D','D6','pc'),
  ('D7','Reihe D','D7','pc'), ('D8','Reihe D','D8','pc'),
  ('E1','Reihe E','E1','pc'), ('E2','Reihe E','E2','pc'),
  ('E3','Reihe E','E3','pc'), ('E4','Reihe E','E4','pc'),
  ('E5','Reihe E','E5','pc'), ('E6','Reihe E','E6','pc'),
  ('E7','Reihe E','E7','pc'), ('E8','Reihe E','E8','pc'),
  ('F1','Reihe F','F1','pc'), ('F2','Reihe F','F2','pc'),
  ('F3','Reihe F','F3','pc'), ('F4','Reihe F','F4','pc'),
  ('F5','Reihe F','F5','pc'), ('F6','Reihe F','F6','pc'),
  ('F7','Reihe F','F7','pc'), ('F8','Reihe F','F8','pc'),
  ('G1','Reihe G · Premium','G1','pc'), ('G2','Reihe G · Premium','G2','pc'),
  ('G3','Reihe G · Premium','G3','pc'), ('G4','Reihe G · Premium','G4','pc'),
  ('G5','Reihe G · Premium','G5','pc'), ('G6','Reihe G · Premium','G6','pc'),
  ('G7','Reihe G · Premium','G7','pc'), ('G8','Reihe G · Premium','G8','pc'),
  ('P1','Privat-Boxen','P1','pc'), ('P2','Privat-Boxen','P2','pc'),
  ('P3','Privat-Boxen','P3','pc'), ('P4','Privat-Boxen','P4','pc'),
  ('P5','Privat-Boxen','P5','pc'), ('P6','Privat-Boxen','P6','pc');

-- ---------------------------------------------------------------------------
-- games — 32 featured titles from SPIELE.md. Every game has a cover under
-- frontend/assets/games/ (extensions vary: jpg/png/webp/avif/jpeg).
-- ---------------------------------------------------------------------------
INSERT INTO games (name, emoji, genre, image_url) VALUES
  -- Shooter / FPS
  ('Valorant','🎯','Shooter / FPS','assets/games/valorant.jpg'),
  ('Counter-Strike 2','🔫','Shooter / FPS','assets/games/counter-strike.jpg'),
  ('Fortnite','🏗️','Shooter / FPS','assets/games/fortnite.jpg'),
  ('Apex Legends','🦾','Shooter / FPS','assets/games/apex-legends.jpg'),
  ('Overwatch 2','🛡️','Shooter / FPS','assets/games/overwatch.jpg'),
  ('Call of Duty: Modern Warfare III','💥','Shooter / FPS','assets/games/cod-mwiii.jpg'),
  ('Call of Duty: Warzone','🪂','Shooter / FPS','assets/games/cod-warzone.jpg'),
  ('Rainbow Six Siege','🏚️','Shooter / FPS','assets/games/rainbow-six-siege.webp'),
  ('PUBG: Battlegrounds','🍗','Shooter / FPS','assets/games/pubg.avif'),
  -- MOBA
  ('League of Legends','⚔️','MOBA','assets/games/league-of-legends.jpg'),
  ('Dota 2','🗡️','MOBA','assets/games/dota-2.jpg'),
  ('Deadlock','🔮','MOBA','assets/games/deadlock.jpg'),
  -- Sport / Racing
  ('EA Sports FC 25 (FIFA 25)','⚽','Sport / Racing','assets/games/fifa.jpg'),
  ('Rocket League','🚀','Sport / Racing','assets/games/rocket-league.avif'),
  ('F1 24','🏁','Sport / Racing','assets/games/f1-24.jpg'),
  ('Assetto Corsa','🏎️','Sport / Racing','assets/games/assetto-corsa.png'),
  -- RPG / Adventure
  ('Elden Ring','🐉','RPG / Adventure','assets/games/elden-ring.webp'),
  ('Baldur''s Gate 3','🎲','RPG / Adventure','assets/games/baldurs-gate-3.jpg'),
  ('Cyberpunk 2077','🤖','RPG / Adventure','assets/games/cyberpunk-2077.jpg'),
  ('Diablo IV','😈','RPG / Adventure','assets/games/diablo-iv.png'),
  ('Starfield','🌌','RPG / Adventure','assets/games/starfield.avif'),
  ('The Witcher 3: Wild Hunt','🐺','RPG / Adventure','assets/games/witcher-3.jpg'),
  -- Fighting
  ('Tekken 8','🥊','Fighting','assets/games/tekken-8.jpg'),
  ('Street Fighter 6','👊','Fighting','assets/games/street-fighter-6.jpg'),
  -- Sandbox / Survival
  ('Minecraft','⛏️','Sandbox / Survival','assets/games/minecraft.webp'),
  ('Terraria','🌳','Sandbox / Survival','assets/games/terraria.png'),
  ('Rust','🔩','Sandbox / Survival','assets/games/rust.avif'),
  ('GTA V','🚗','Sandbox / Survival','assets/games/gta-v.png'),
  -- Party / Co-op
  ('Among Us','👽','Party / Co-op','assets/games/among-us.jpg'),
  ('Clicky Keys','⌨️','Party / Co-op','assets/games/clicky-keys.png'),
  ('Fall Guys','🏃','Party / Co-op','assets/games/fall-guys.webp'),
  ('Hades II','🔥','Party / Co-op','assets/games/hades-ii.jpeg');

-- ---------------------------------------------------------------------------
-- menu_items — from index.html (#gastro)
-- ---------------------------------------------------------------------------
INSERT INTO menu_items (category, emoji, name, description, price) VALUES
  ('snacks','🍕','Pizza Salami','Frisch gebacken, 28cm',8.50),
  ('snacks','🍔','Gaming-Burger','180g Beef, Bacon, Cheddar',9.90),
  ('snacks','🌮','Loaded Nachos','Mit Käse, Jalapeños & Salsa',7.50),
  ('snacks','🥨','Brezel-Sticks','Mit Kräuterbutter-Dip',5.00),
  ('snacks','🍟','Pommes Frites','XL-Portion mit Dips',6.00),
  ('snacks','🥗','Protein-Bowl','Quinoa, Avocado, Hühnchen',11.00),
  ('energy','⚡','Red Bull','250ml Dose',3.50),
  ('energy','⚡','Monster Energy','500ml Dose, versch. Sorten',4.00),
  ('energy','🧊','Gamer Fuel','Hausgemachter Energy-Mix',5.50),
  ('kaffee','☕','Espresso','Doppelter Shot',2.80),
  ('kaffee','🫗','Cappuccino','Mit Milchschaum',4.00),
  ('kaffee','🍵','Matcha Latte','Heiß oder kalt',4.80),
  ('kaffee','☕','Flat White','Perfekt für die Night-Session',4.20),
  ('soft','🥤','Coca-Cola','0,5l Glasflasche',3.00),
  ('soft','💧','Mineralwasser','0,75l, mit/ohne Sprudel',2.50),
  ('soft','🧋','Bubble Tea','Verschiedene Sorten',5.00);

-- ---------------------------------------------------------------------------
-- users — one staff account (admin, id 1) + sample players whose usernames
-- mirror the solo leaderboard names in the mock so derived boards match.
-- password_hash is a placeholder; setup.js rehashes admin's password.
-- ---------------------------------------------------------------------------
INSERT INTO users (id, username, password_hash, role) VALUES
  (1,'admin','PLACEHOLDER_REPLACED_BY_SETUP','staff'),
  -- Valorant solo names
  (2,'xX_ShadowBlade_Xx','PLACEHOLDER','user'),
  (3,'NeonFury99','PLACEHOLDER','user'),
  (4,'PixelQueen','PLACEHOLDER','user'),
  (5,'AimBot3000','PLACEHOLDER','user'),
  (6,'NightOwl_GG','PLACEHOLDER','user'),
  -- FIFA solo names
  (7,'GoalMachine','PLACEHOLDER','user'),
  (8,'TikiTaka_Tom','PLACEHOLDER','user'),
  (9,'NutmegNico','PLACEHOLDER','user'),
  -- LoL solo names
  (10,'MidLaneMage','PLACEHOLDER','user'),
  (11,'JungleDiff','PLACEHOLDER','user'),
  (12,'BaronSteal','PLACEHOLDER','user'),
  -- CS solo names
  (13,'OneTapOscar','PLACEHOLDER','user'),
  (14,'ClutchKing','PLACEHOLDER','user'),
  (15,'SmokeCriminal','PLACEHOLDER','user');

-- ---------------------------------------------------------------------------
-- teams — sample rosters per 5v5 game. captain_id reuses the player users.
-- ---------------------------------------------------------------------------
INSERT INTO teams (id, name, tag, game, captain_id) VALUES
  (1,'Neon Vipers','NV','valorant',2),
  (2,'Shadow Syndicate','SS','valorant',3),
  (3,'Rift Wardens','RW','lol',10),
  (4,'Baron Barons','BB','lol',11),
  (5,'Headshot Hooligans','HH','cs',13),
  (6,'Smoke & Mirrors','SM','cs',14);

-- ---------------------------------------------------------------------------
-- team_members — captains + a couple of members (drives the solo-by-team
-- leaderboard variant: each member inherits the team's placement points).
-- ---------------------------------------------------------------------------
INSERT INTO team_members (team_id, user_id, role) VALUES
  (1,2,'captain'), (1,4,'member'),
  (2,3,'captain'), (2,5,'member'),
  (3,10,'captain'), (3,12,'member'),
  (4,11,'captain'),
  (5,13,'captain'), (5,15,'member'),
  (6,14,'captain');

-- ---------------------------------------------------------------------------
-- tournaments — the 4 games (ids 1..4), mirroring the mock tournament titles.
-- status uses the German lifecycle enum (anmeldung_offen ≈ "open",
-- abgeschlossen for finished events that already have results).
-- ---------------------------------------------------------------------------
INSERT INTO tournaments (id, game, mode, title, date, format, prize, max_participants, status) VALUES
  (1,'valorant','team','Valorant 5v5 Cup','2026-06-22','5v5 · Team','500 €',16,'anmeldung_offen'),
  (2,'fifa','solo','FIFA 25 Championship','2026-07-05','1v1 · Solo','300 €',32,'anmeldung_offen'),
  (3,'lol','team','League of Legends Clash','2026-07-12','5v5 · Team','400 €',8,'anmeldung_offen'),
  (4,'cs','team','Counter-Strike Major Night','2026-07-19','5v5 · Team','350 €',16,'anmeldung_offen'),
  -- Past, finished editions that supply the leaderboard points.
  (5,'valorant','team','Valorant Spring Open','2026-03-10','5v5 · Team','500 €',16,'abgeschlossen'),
  (6,'fifa','solo','FIFA Winter Cup','2026-02-14','1v1 · Solo','300 €',32,'abgeschlossen'),
  (7,'lol','team','LoL Winter Clash','2026-01-20','5v5 · Team','400 €',8,'abgeschlossen'),
  (8,'cs','team','CS Winter Major','2026-01-28','5v5 · Team','350 €',16,'abgeschlossen');

-- ---------------------------------------------------------------------------
-- registrations — sample sign-ups for the OPEN tournaments (drives the
-- "registered / slots" counts on tournament cards).
-- ---------------------------------------------------------------------------
INSERT INTO registrations (tournament_id, team_id, user_id) VALUES
  (1,1,NULL), (1,2,NULL);          -- Valorant 5v5 Cup (teams)
INSERT INTO registrations (tournament_id, user_id, team_id) VALUES
  (2,7,NULL), (2,8,NULL), (2,9,NULL); -- FIFA 25 Championship (solo)
INSERT INTO registrations (tournament_id, team_id, user_id) VALUES
  (3,3,NULL), (3,4,NULL),          -- LoL Clash (teams)
  (4,5,NULL), (4,6,NULL);          -- CS Major Night (teams)

-- ---------------------------------------------------------------------------
-- results — placements + points from the FINISHED tournaments (5..8).
-- Points follow PLAN.md: 1.=100, 2.=60, 3.=40. These feed:
--   • solo boards (FIFA via users; team-games solo via team_members→users)
--   • team boards (valorant / lol / cs via teams)
-- ---------------------------------------------------------------------------
-- Valorant (team tournament 5) — team + per-captain solo demonstration
INSERT INTO results (tournament_id, team_id, points, placement) VALUES
  (5,1,100,1), (5,2,60,2);
-- FIFA (solo tournament 6) — users directly
INSERT INTO results (tournament_id, user_id, points, placement) VALUES
  (6,7,100,1), (6,8,60,2), (6,9,40,3);
-- LoL (team tournament 7)
INSERT INTO results (tournament_id, team_id, points, placement) VALUES
  (7,3,100,1), (7,4,60,2);
-- CS (team tournament 8)
INSERT INTO results (tournament_id, team_id, points, placement) VALUES
  (8,5,100,1), (8,6,60,2);
