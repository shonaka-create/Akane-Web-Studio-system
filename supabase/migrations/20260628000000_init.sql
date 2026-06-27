-- HUMAN-HUB Salon System — initial schema
-- src/lib/types.ts のドメインモデルに対応。
-- 表示専用の形（BookingBlock.col/rowStart/rowSpan, ShiftRow.days[]）は持たず、
-- 時刻ベースで正規化し、UI 側で組み立てる。

-- ========== ENUMs ==========
create type tone as enum ('accent', 'sage', 'rose');
create type follow_up_status as enum ('send', 'sent');
create type inventory_status as enum ('ok', 'low', 'order', 'ordered');
create type order_status as enum ('ordered', 'shipping', 'arrived');

-- ========== 共通: updated_at 自動更新 ==========
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ========== staff ==========
create table staff (
  id           text primary key,            -- 'emma' 等のスラッグ
  name         text not null,
  initial      text not null,
  tone         tone not null default 'accent',
  weekly_hours integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ========== services（施術カタログ。i18n キーをそのまま PK に）==========
create table services (
  key        text primary key,              -- 'svcCut', 'svcColor', 'svcCutColor', 'svcSpa'
  created_at timestamptz not null default now()
);

-- ========== customers ==========
create table customers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  initial       text not null,
  tone          tone not null default 'accent',
  email         text,
  phone         text,
  first_visit   date,
  last_visit    date,
  visits        integer not null default 0,
  lifetime_spend numeric(12,2),
  primary_staff_id text references staff(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ========== customer_memos ==========
create table customer_memos (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  memo_date   date not null,
  staff_id    text references staff(id) on delete set null,
  staff_name  text,                          -- 表示用スナップショット
  tone        tone not null default 'accent',
  text        text not null,
  created_at  timestamptz not null default now()
);
create index on customer_memos (customer_id);

-- ========== follow_ups ==========
create table follow_ups (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid references customers(id) on delete cascade,
  customer_name   text not null,             -- 表示用スナップショット
  initial         text not null,
  tone            tone not null default 'accent',
  first_visit_date date not null,
  status          follow_up_status not null default 'send',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ========== bookings（ScheduleEntry + BookingBlock を統合）==========
create table bookings (
  id           uuid primary key default gen_random_uuid(),
  booking_date date not null,
  start_time   time not null,
  duration_min integer not null default 60,
  staff_id     text references staff(id) on delete set null,
  customer_id  uuid references customers(id) on delete set null,
  customer_name text not null,               -- 表示用スナップショット（飛び込み客対応）
  service_key  text references services(key) on delete set null,
  tone         tone not null default 'accent',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index on bookings (booking_date);
create index on bookings (staff_id, booking_date);

-- ========== shifts（週テンプレート。weekday 0=月..6=日）==========
create table shifts (
  id         uuid primary key default gen_random_uuid(),
  staff_id   text not null references staff(id) on delete cascade,
  weekday    smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time   time not null,
  tone       tone not null default 'accent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (staff_id, weekday)
);

-- ========== inventory_items ==========
create table inventory_items (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category_key text not null,                -- 'catColor' 等の i18n キー
  stock        integer not null default 0,
  capacity     integer not null default 0,
  reorder_pt   integer not null default 0,
  status       inventory_status not null default 'ok',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ========== orders ==========
create table orders (
  id         uuid primary key default gen_random_uuid(),
  item       text not null,
  qty        text not null,                  -- '20', '10箱' 等の自由表記
  supplier   text not null,
  order_date date not null,
  eta        date,
  status     order_status not null default 'ordered',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ========== updated_at トリガー ==========
create trigger trg_staff_updated      before update on staff           for each row execute function set_updated_at();
create trigger trg_customers_updated  before update on customers       for each row execute function set_updated_at();
create trigger trg_followups_updated  before update on follow_ups      for each row execute function set_updated_at();
create trigger trg_bookings_updated   before update on bookings        for each row execute function set_updated_at();
create trigger trg_shifts_updated     before update on shifts          for each row execute function set_updated_at();
create trigger trg_inventory_updated  before update on inventory_items for each row execute function set_updated_at();
create trigger trg_orders_updated     before update on orders          for each row execute function set_updated_at();

-- ========== RLS ==========
-- 内部スタッフ向けツールのため、ログイン済みユーザーには全権限、匿名は不可。
-- 役割ベースで絞り込みたくなったら、各ポリシーの USING 句を後で調整する。
do $$
declare t text;
begin
  foreach t in array array[
    'staff','services','customers','customer_memos','follow_ups',
    'bookings','shifts','inventory_items','orders'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    execute format($f$
      create policy "authenticated full access" on %I
        for all to authenticated using (true) with check (true);
    $f$, t);
  end loop;
end $$;
