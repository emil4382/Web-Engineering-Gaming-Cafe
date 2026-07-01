-- seed data

SET NAMES utf8mb4;

-- seats
INSERT INTO seats (code, zone, label, type) VALUES
  ('A1','Reihe A','A1','pc' ), ('A2', 'Reihe A','A2', 'pc'),
  ('A3','Reihe A','A3','pc'), ('A4','Reihe A','A4','pc' ),
  ( 'A5','Reihe A', 'A5','pc'), ('A6', 'Reihe A','A6','pc'),
  ('A7','Reihe A', 'A7','pc' ), ('A8','Reihe A', 'A8','pc'),
  ( 'B1','Reihe B','B1','pc'), ('B2', 'Reihe B', 'B2','pc'),
  ('B3', 'Reihe B','B3','pc'), ('B4','Reihe B', 'B4','pc'),
  ('B5','Reihe B', 'B5','pc'), ( 'B6','Reihe B','B6','pc'),
  ('B7','Reihe B','B7', 'pc'), ('B8','Reihe B', 'B8','pc'),
  ('C1','Reihe C', 'C1','pc'), ('C2','Reihe C','C2', 'pc'),
  ( 'C3','Reihe C','C3','pc'), ('C4','Reihe C','C4','pc' ),
  ('C5','Reihe C','C5','pc'), ( 'C6', 'Reihe C','C6','pc'),
  ('C7','Reihe C','C7','pc'), ('C8','Reihe C','C8','pc'),
  ('D1','Reihe D','D1','pc' ), ('D2', 'Reihe D', 'D2', 'pc'),
  ( 'D3', 'Reihe D','D3', 'pc'),  ('D4','Reihe D','D4','pc'),
  ('D5','Reihe D','D5','pc'), ('D6', 'Reihe D','D6','pc'),
  ('D7','Reihe D','D7','pc'),  ('D8','Reihe D','D8','pc'),
  ('E1','Reihe E','E1', 'pc' ), ('E2','Reihe E','E2','pc' ),
  ('E3','Reihe E','E3', 'pc'), ('E4','Reihe E','E4','pc'),
  ('E5','Reihe E','E5', 'pc' ), ('E6','Reihe E', 'E6','pc'),
  ('E7','Reihe E','E7','pc'), ( 'E8','Reihe E','E8','pc'),
  ('F1', 'Reihe F','F1','pc' ), ('F2','Reihe F','F2','pc' ),
  ('F3','Reihe F','F3', 'pc'),  ('F4','Reihe F', 'F4','pc' ),
  ('F5','Reihe F','F5','pc'), ('F6','Reihe F', 'F6','pc' ),
  ('F7','Reihe F','F7','pc'), ( 'F8','Reihe F','F8','pc'),
  ('G1','Reihe G · Premium','G1','pc'), ('G2','Reihe G · Premium', 'G2', 'pc'),
  ( 'G3','Reihe G · Premium','G3', 'pc'), ('G4', 'Reihe G · Premium','G4','pc' ),
  ('G5','Reihe G · Premium','G5','pc'), ('G6', 'Reihe G · Premium','G6','pc'),
  ( 'G7', 'Reihe G · Premium','G7','pc'), ( 'G8','Reihe G · Premium','G8', 'pc'),
  ('P1','Privat-Boxen','P1','pc'),  ('P2','Privat-Boxen','P2','pc'),
  ('P3','Privat-Boxen','P3','pc' ),  ('P4','Privat-Boxen','P4','pc'),
  ('P5','Privat-Boxen', 'P5','pc' ), ('P6','Privat-Boxen','P6','pc' );

-- games
INSERT INTO games (name, emoji,  genre,  image_url) VALUES
  ('Valorant', '🎯', 'Shooter / FPS','assets/games/valorant.jpg'),
  ('Counter-Strike 2','🔫','Shooter / FPS','assets/games/counter-strike.jpg'),
  ('Fortnite','🏗️','Shooter / FPS','assets/games/fortnite.jpg' ),
  ( 'Apex Legends','🦾','Shooter / FPS','assets/games/apex-legends.jpg'),
  ('Overwatch 2','🛡️','Shooter / FPS','assets/games/overwatch.jpg' ),
  ('Call of Duty: Modern Warfare III','💥','Shooter / FPS','assets/games/cod-mwiii.jpg'),
  ('Call of Duty: Warzone','🪂','Shooter / FPS','assets/games/cod-warzone.jpg'),
  ('Rainbow Six Siege','🏚️', 'Shooter / FPS','assets/games/rainbow-six-siege.webp'),
  ('PUBG: Battlegrounds', '🍗', 'Shooter / FPS','assets/games/pubg.avif'),
  ('League of Legends', '⚔️','MOBA','assets/games/league-of-legends.jpg' ),
  ('Dota 2','🗡️','MOBA','assets/games/dota-2.jpg' ),
  ('Deadlock', '🔮','MOBA','assets/games/deadlock.jpg'),
  ('EA Sports FC 25 (FIFA 25)','⚽','Sport / Racing','assets/games/fifa.jpg'),
  ('Rocket League','🚀','Sport / Racing','assets/games/rocket-league.avif'),
  ('F1 24', '🏁','Sport / Racing','assets/games/f1-24.jpg'),
  ('Assetto Corsa','🏎️', 'Sport / Racing', 'assets/games/assetto-corsa.png'),
  ('Elden Ring','🐉','RPG / Adventure','assets/games/elden-ring.webp'),
  ('Baldur''s Gate 3','🎲','RPG / Adventure','assets/games/baldurs-gate-3.jpg'),
  ('Cyberpunk 2077','🤖','RPG / Adventure','assets/games/cyberpunk-2077.jpg'),
  ('Diablo IV','😈','RPG / Adventure','assets/games/diablo-iv.png'),
  ('Starfield','🌌','RPG / Adventure','assets/games/starfield.avif' ),
  ('The Witcher 3: Wild Hunt','🐺','RPG / Adventure','assets/games/witcher-3.jpg'),
  ('Tekken 8', '🥊', 'Fighting','assets/games/tekken-8.jpg'),
  ('Street Fighter 6','👊','Fighting','assets/games/street-fighter-6.jpg' ),
  ('Minecraft','⛏️','Sandbox / Survival','assets/games/minecraft.webp'),
  ('Terraria','🌳','Sandbox / Survival','assets/games/terraria.png'),
  ('Rust','🔩','Sandbox / Survival', 'assets/games/rust.avif'),
  ('GTA V','🚗', 'Sandbox / Survival','assets/games/gta-v.png'),
  ('Among Us', '👽', 'Party / Co-op','assets/games/among-us.jpg'),
  ('Clicky Keys','⌨️', 'Party / Co-op','assets/games/clicky-keys.png'),
  ('Fall Guys', '🏃','Party / Co-op', 'assets/games/fall-guys.webp'),
  ('Hades II', '🔥', 'Party / Co-op','assets/games/hades-ii.jpeg');

-- featured game
UPDATE games SET featured = 1 WHERE name = 'Clicky Keys';

-- users
INSERT INTO users (id,  username, password_hash, role) VALUES
  (1, 'admin','PLACEHOLDER_REPLACED_BY_SETUP','staff'),
  -- valorant solo
  ( 2,'xX_ShadowBlade_Xx','PLACEHOLDER','user' ),
  (3,'NeonFury99','PLACEHOLDER','user'),
  (4,'PixelQueen','PLACEHOLDER','user'),
  (5,'AimBot3000','PLACEHOLDER','user'),
  (6,'NightOwl_GG','PLACEHOLDER','user'),
  -- fifa solo
  (7,'GoalMachine','PLACEHOLDER','user'),
  (8,'TikiTaka_Tom','PLACEHOLDER','user'),
  (9,'NutmegNico','PLACEHOLDER','user'),
  -- lol solo
  (10,'MidLaneMage','PLACEHOLDER', 'user' ),
  ( 11,'JungleDiff','PLACEHOLDER','user'),
  (12,'BaronSteal','PLACEHOLDER','user' ),
  -- cs solo
  (13,'OneTapOscar','PLACEHOLDER','user'),
  (14,'ClutchKing', 'PLACEHOLDER','user' ),
  (15,'SmokeCriminal','PLACEHOLDER','user');

-- teams
INSERT INTO teams (id, name, tag, game, captain_id ) VALUES
  (1,'Neon Vipers','NV','valorant',2),
  (2, 'Shadow Syndicate','SS','valorant',3 ),
  (3,'Rift Wardens','RW', 'lol',10 ),
  (4, 'Baron Barons','BB', 'lol',11),
  (5,'Headshot Hooligans','HH', 'cs', 13),
  ( 6,'Smoke & Mirrors','SM','cs',14);

-- team members
INSERT INTO team_members (team_id, user_id,  role) VALUES
  ( 1,2,'captain' ), (1, 4, 'member' ),
  (2,3,'captain'), (2,5,'member'),
  (3, 10,'captain'), (3, 12,'member'),
  (4,11,'captain' ),
  (5,13,'captain'), (5,15,'member'),
  (6, 14,'captain');

-- tournaments
INSERT INTO tournaments (id, game, mode, title, date,  format, prize, max_participants, status) VALUES
  (1,'valorant','team','Valorant 5v5 Cup','2026-06-22','5v5 · Team', '500 €', 16,'anmeldung_offen' ),
  (2,'fifa','solo','FIFA 25 Championship','2026-07-05','1v1 · Solo', '300 €',32,'anmeldung_offen'),
  (3,'lol','team','League of Legends Clash','2026-07-12','5v5 · Team','400 €',8,'anmeldung_offen'),
  (4, 'cs','team','Counter-Strike Major Night','2026-07-19','5v5 · Team', '350 €',16,'anmeldung_offen' );

-- registrations
INSERT INTO registrations ( tournament_id, team_id,  user_id) VALUES
  ( 1,1,NULL),  (1, 2,NULL);
INSERT INTO registrations (tournament_id, user_id, team_id) VALUES
  (2,7, NULL), ( 2,8,NULL), (2,9,NULL);
INSERT INTO registrations ( tournament_id, team_id, user_id ) VALUES
  (3,3,NULL), (3,4,NULL),
  (4,5,NULL), (4,6,NULL);
