-- 개발/테스트용 계정 백업 (2026-07-15 기준 실제 DB 값)
-- 비밀번호는 모두 'password123' (bcrypt 해시는 아래 password_hash 컬럼 값 그대로 사용)
-- 재적용 시 이미 동일 id/email 레코드가 있으면 충돌하므로 ON CONFLICT DO NOTHING 처리됨.

-- users
INSERT INTO users (id, email, password_hash, name, phone, profile_image_path, is_active, created_at, updated_at) VALUES
  ('99552690-fce9-416e-b8cb-bceba966e31d', 'buyer1@test.com',        '$2b$12$.F2PCApvXDYDr4Xj6vZrvuHlVdPerJAsKFfEyc/YzQXSotYGzBI1e', 'Buyer One',       NULL,             NULL, true, '2026-07-15 04:05:27.858214+00', '2026-07-15 04:05:27.858214+00'),
  ('16892f75-85eb-417a-98ae-83950a58c9d6', 'seller1@test.com',       '$2b$12$gl0DjduYCOFbHgXNSfmjgeGR2vZc3lZd.47Q4/SS4bsF1unCeKSfS', 'Seller One',      NULL,             NULL, true, '2026-07-15 04:05:28.346025+00', '2026-07-15 04:05:28.346025+00'),
  ('e0e222cb-7f52-4ce8-9df4-7db8edce90c2', 'newseller@test.com',     '$2b$12$F.Z3A1Wcke08iiEVmyRqOev5.GOS2Av7pfmL1ijN1uAxV9I3OzjP2', 'New Seller',      NULL,             NULL, true, '2026-07-15 04:44:23.252629+00', '2026-07-15 04:44:23.252629+00'),
  ('8d97a9f0-db57-40fe-b1be-5ec5df1f6557', 'frontend_test@test.com', '$2b$12$Xo8ItcgSBPUNG01.zYpE7.eT18V8UVjzvbbhppCTqy2SX6YonOBEu', 'Frontend Tester', '010-1234-5678',  NULL, true, '2026-07-15 04:34:02.274072+00', '2026-07-15 04:34:02.274072+00'),
  ('0f38884d-6335-48b2-873f-b4e68bfed2fb', 'outsider@test.com',      '$2b$12$b.jNnTADh8CGJcgrpOYk9.TrUVqKYLi4XYNOg2CcHf04w7ABJx2ne', 'Outsider',        NULL,             NULL, true, '2026-07-15 04:13:02.447589+00', '2026-07-15 04:13:02.447589+00')
ON CONFLICT (id) DO NOTHING;

-- admin_users (buyer1@test.com = super_admin — 공지/FAQ/자료실 CRUD, QnA 답변, /admin/* 접근)
INSERT INTO admin_users (id, user_id, role) VALUES
  ('572886e4-b3db-48b7-88a3-6c3bf47322f7', '99552690-fce9-416e-b8cb-bceba966e31d', 'super_admin')
ON CONFLICT (id) DO NOTHING;

-- seller_profiles (seller1@test.com, newseller@test.com)
INSERT INTO seller_profiles (id, user_id, headline, bio, category_id, career_years, created_at, updated_at) VALUES
  ('72741820-b317-4d22-aea0-e0998a1169ba', '16892f75-85eb-417a-98ae-83950a58c9d6', '디자인 전문가',   '10년 경력', NULL, NULL, '2026-07-15 04:05:40.739663+00', '2026-07-15 04:05:40.739663+00'),
  ('281f5d80-74f2-44fb-a8d8-f96a03cea305', 'e0e222cb-7f52-4ce8-9df4-7db8edce90c2', '새 판매자입니다', NULL,        NULL, 3,    '2026-07-15 04:44:25.064685+00', '2026-07-15 04:44:25.064685+00')
ON CONFLICT (id) DO NOTHING;
