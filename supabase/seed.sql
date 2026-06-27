-- HUMAN-HUB Salon System — seed data (src/lib/mock.ts より移植)
-- 日付は mock の "6/24" 等を 2026 年として補完。
-- 何度流しても安全なように冒頭で truncate する。

truncate table
  customer_memos, follow_ups, bookings, shifts,
  orders, inventory_items, customers, services, staff
restart identity cascade;

-- ===== staff =====
insert into staff (id, name, initial, tone, weekly_hours) values
  ('emma',   'Emma',   'E', 'sage',   32),
  ('aoi',    'Aoi',    'A', 'accent', 30),
  ('mei',    'Mei',    'M', 'rose',   24),
  ('yuki',   'Yuki',   'Y', 'accent', 38),
  ('liam',   'Liam',   'L', 'sage',   26),
  ('sophie', 'Sophie', 'S', 'sage',   20);

-- ===== services =====
insert into services (key) values
  ('svcCut'), ('svcColor'), ('svcCutColor'), ('svcSpa');

-- ===== customers =====
insert into customers (id, name, initial, tone, email, phone, visits, last_visit, lifetime_spend, primary_staff_id) values
  ('11111111-1111-1111-1111-111111111111', '山本 結衣',    '山', 'accent', 'yui.yamamoto@email.com', '0412 345 678', 1,  '2026-06-24', 165.00, 'emma'),
  ('22222222-2222-2222-2222-222222222222', 'James Lee',    'J',  'sage',   null,                     null,           1,  '2026-06-24', null,   null),
  ('33333333-3333-3333-3333-333333333333', '佐藤 美咲',    '佐', 'rose',   null,                     null,           12, '2026-06-20', null,   'aoi'),
  ('44444444-4444-4444-4444-444444444444', 'Olivia Chen',  'O',  'accent', null,                     null,           5,  '2026-06-18', null,   'emma'),
  ('55555555-5555-5555-5555-555555555555', '田中 葵',      '田', 'sage',   null,                     null,           8,  '2026-06-15', null,   'mei');

-- ===== customer_memos (山本 結衣) =====
insert into customer_memos (customer_id, memo_date, staff_id, staff_name, tone, text) values
  ('11111111-1111-1111-1111-111111111111', '2026-06-24', 'emma', 'Emma', 'sage',   '初回来店。アッシュ系のカラーをご希望。ブリーチ未経験のため、次回はトーンダウンを提案。仕上がりにご満足いただけた様子。'),
  ('11111111-1111-1111-1111-111111111111', '2026-06-24', 'aoi',  'Aoi',  'accent', '受付・カウンセリングを担当。アレルギー・既往歴なしを確認。次回はヘッドスパもご検討中とのこと。'),
  ('11111111-1111-1111-1111-111111111111', '2026-06-22', 'mei',  'Mei',  'rose',   'Instagram DMから予約のお問い合わせ。土曜午前を希望され、6/24 11:30で確定。');

-- ===== follow_ups =====
insert into follow_ups (customer_id, customer_name, initial, tone, first_visit_date, status) values
  ('11111111-1111-1111-1111-111111111111', '山本 結衣', '山', 'accent', '2026-06-24', 'send'),
  ('22222222-2222-2222-2222-222222222222', 'James Lee', 'J',  'accent', '2026-06-24', 'send'),
  (null,                                    '中村 桃子', '中', 'sage',   '2026-06-23', 'sent');

-- ===== bookings (todaySchedule → 2026-06-28) =====
insert into bookings (booking_date, start_time, duration_min, staff_id, customer_name, service_key, tone) values
  ('2026-06-28', '09:30', 90, 'emma', '山田 花子',      'svcCutColor', 'sage'),
  ('2026-06-28', '10:00', 60, 'aoi',  '佐藤 美咲',      'svcSpa',      'accent'),
  ('2026-06-28', '11:30', 45, 'emma', 'Olivia Chen',    'svcCut',      'sage'),
  ('2026-06-28', '13:00', 75, 'mei',  '田中 葵',        'svcColor',    'rose'),
  ('2026-06-28', '15:30', 60, 'aoi',  'Sophie Müller',  'svcSpa',      'accent');

-- ===== shifts (週テンプレート, weekday 0=月..6=日) =====
insert into shifts (staff_id, weekday, start_time, end_time, tone) values
  -- Emma
  ('emma', 0, '09:00', '17:00', 'accent'),
  ('emma', 1, '09:00', '17:00', 'accent'),
  ('emma', 3, '09:00', '17:00', 'accent'),
  ('emma', 4, '09:00', '17:00', 'accent'),
  ('emma', 5, '09:00', '14:00', 'sage'),
  -- Aoi
  ('aoi', 1, '12:00', '20:00', 'rose'),
  ('aoi', 2, '12:00', '20:00', 'rose'),
  ('aoi', 3, '10:00', '18:00', 'accent'),
  ('aoi', 4, '10:00', '18:00', 'accent'),
  ('aoi', 6, '10:00', '18:00', 'accent'),
  -- Mei
  ('mei', 0, '09:00', '14:00', 'sage'),
  ('mei', 2, '09:00', '14:00', 'sage'),
  ('mei', 4, '09:00', '14:00', 'sage'),
  ('mei', 5, '10:00', '18:00', 'accent'),
  ('mei', 6, '10:00', '18:00', 'accent'),
  -- Yuki
  ('yuki', 0, '09:00', '18:00', 'accent'),
  ('yuki', 1, '09:00', '18:00', 'accent'),
  ('yuki', 2, '09:00', '18:00', 'accent'),
  ('yuki', 4, '09:00', '18:00', 'accent'),
  ('yuki', 5, '09:00', '18:00', 'accent'),
  -- Liam
  ('liam', 1, '12:00', '20:00', 'rose'),
  ('liam', 2, '12:00', '20:00', 'rose'),
  ('liam', 3, '11:00', '19:00', 'accent'),
  ('liam', 5, '11:00', '19:00', 'accent'),
  ('liam', 6, '12:00', '20:00', 'rose'),
  -- Sophie
  ('sophie', 0, '10:00', '15:00', 'sage'),
  ('sophie', 2, '10:00', '15:00', 'sage'),
  ('sophie', 5, '10:00', '18:00', 'accent');

-- ===== inventory_items =====
insert into inventory_items (name, category_key, stock, capacity, reorder_pt, status) values
  ('カラー剤 6N',          'catColor',  3,  25,  10, 'order'),
  ('アルミホイル',          'catSupply', 1,  5,   2,  'order'),
  ('シャンプー（業務用）',  'catCare',   8,  20,  10, 'low'),
  ('ヘアオイル（店販）',    'catRetail', 14, 20,  6,  'ok'),
  ('トリートメント剤',      'catCare',   22, 30,  12, 'ordered'),
  ('フェイスタオル',        'catSupply', 60, 80,  40, 'ok'),
  ('使い捨てケープ',        'catSupply', 30, 100, 50, 'low');

-- ===== orders =====
insert into orders (item, qty, supplier, order_date, eta, status) values
  ('カラー剤 6N',         '20',   'B-Cosme',  '2026-06-26', '2026-06-29', 'shipping'),
  ('アルミホイル',         '10箱', 'SalonPro', '2026-06-26', '2026-06-28', 'shipping'),
  ('ヘアオイル（店販）',   '12',   'Aroma Co.','2026-06-27', '2026-07-01', 'ordered'),
  ('トリートメント剤',     '12',   'B-Cosme',  '2026-06-24', '2026-06-27', 'arrived'),
  ('シャンプー（業務用）', '24',   'SalonPro', '2026-06-20', '2026-06-23', 'arrived');
