-- HUMAN-HUB Salon System — transactions（売上）テーブル
-- 売上サマリ / 推移 / カテゴリ別 / スタッフ別 / 取引一覧は全てここから集計する。

create type txn_category as enum ('service', 'retail');

create table transactions (
  id            uuid primary key default gen_random_uuid(),
  txn_date      date not null,
  customer_id   uuid references customers(id) on delete set null,
  customer_name text not null,                 -- 表示用スナップショット
  staff_id      text references staff(id) on delete set null,
  service_key   text references services(key) on delete set null,
  category      txn_category not null default 'service',
  amount        numeric(12,2) not null,
  created_at    timestamptz not null default now()
);
create index on transactions (txn_date);
create index on transactions (staff_id);

-- RLS: 既存テーブルと同様、ログイン済みは全権限。
alter table transactions enable row level security;
create policy "authenticated full access" on transactions
  for all to authenticated using (true) with check (true);
