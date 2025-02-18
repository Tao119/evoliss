-- 講座の追加
INSERT INTO Course (title, description, price, image, coachId, createdAt, updatedAt) VALUES
('ポケモンカード初心者講座', 'ポケモンカードの基本ルールを学べます', 3000, NULL, 1, NOW(), NOW()),
('ポケモン対戦中級者講座', 'バトル戦略をマスターしましょう', 5000, NULL, 2, NOW(), NOW()),
('ポケモンGOでレイド攻略', 'レイドバトルで勝つためのコツ', 4000, NULL, 3, NOW(), NOW());

-- 対応ゲーム
INSERT INTO Game (name, createdAt) VALUES
('ポケモンカード', NOW()),
('ポケモン対戦', NOW()),
('ポケモンGO', NOW()),
('MineCraft', NOW()),
('cookie clicker', NOW()),
('OSU!', NOW()),
('パズドラ', NOW()),
('にゃんこ大戦争', NOW());

-- コースと対応ゲームの紐付け
INSERT INTO CourseGame (courseId, gameId) VALUES
(1, 1), -- ポケモンカード初心者講座 -> ポケモンカード
(2, 2), -- ポケモン対戦中級者講座 -> ポケモン対戦
(3, 3); -- ポケモンGOでレイド攻略 -> ポケモンGO

-- コースと対応ゲームの紐付け
INSERT INTO UserGame (userId, gameId) VALUES
(1, 1), -- ポケモンカード初心者講座 -> ポケモンカード
(1, 2), -- ポケモンカード初心者講座 -> ポケモンカード
(2, 2), -- ポケモン対戦中級者講座 -> ポケモン対戦
(3, 3); -- ポケモンGOでレイド攻略 -> ポケモンGO


-- スケジュール
INSERT INTO Schedule (courseId, startTime, endTime, createdAt, updatedAt) VALUES
(1, '2025-02-01 10:00:00', '2025-02-01 12:00:00', NOW(), NOW()),
(2, '2025-02-02 14:00:00', '2025-02-02 16:00:00', NOW(), NOW()),
(3, '2025-02-03 18:00:00', '2025-02-03 20:00:00', NOW(), NOW());

-- 予約
INSERT INTO Reservation (customerId, scheduleId, courseId, status, createdAt, updatedAt) VALUES
(4, 1, 1, 1, NOW(), NOW()), -- Tao Matsumuraがポケモンカード初心者講座を予約
(4, 2, 2, 1, NOW(), NOW()); -- Tao Matsumuraがポケモン対戦中級者講座を予約

-- メッセージ
INSERT INTO Message (senderId, receiverId, content, sentAt) VALUES
(4, 1, '講座についてもっと詳しく教えてください', NOW()),
(1, 4, 'もちろん！詳しくお伝えします。', NOW());

-- 支払い
INSERT INTO Payment (customerId, courseId, amount, method, status, createdAt, updatedAt) VALUES
(4, 1, 3000, 'credit_card', 1, NOW(), NOW()), -- Tao Matsumuraがポケモンカード講座を支払い
(4, 2, 5000, 'credit_card', 1, NOW(), NOW()); -- Tao Matsumuraがポケモン対戦講座を支払い



-- 検索履歴
INSERT INTO SearchHistory (userId, query, searchedAt) VALUES
(4, 'ポケモンカード 初心者', NOW()),
(4, 'ポケモン対戦 中級者', NOW());
 

-- レビュー
INSERT INTO Review (customerId, courseId, rating, comment, createdAt) VALUES
(4, 1, 5, 'とても分かりやすかった！', NOW()),
(3, 1, 5, 'とても分かりやすかった！', NOW()),
(2, 1, 4, 'とても分かりやすかった！', NOW()),
(4, 2, 4, '戦略について多く学べました', NOW()),
(1, 2, 2, '戦略について多く学べました', NOW());


Insert INTO User (name, email, createdAt, updatedAt, bio ,icon, header) VALUES
("Tao", "tao.dama.art@gmail.com", NOW(), NOW(), "開発者です\n以後お見知り置きを。", null,null);