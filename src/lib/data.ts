// Supabase データアクセス層。mock.ts の各 export に対応する非同期版。
// ページを mock から切り替えるには import を差し替えて await するだけ:
//   import { staff } from '@/lib/mock';        →  import { getStaff } from '@/lib/data';
//   const rows = staff;                         →  const rows = await getStaff();
// ※ 呼び出し側は Server Component / Route Handler / Server Action である必要がある。

import { createClient } from '@/lib/supabase/server';
import type {
  BookingBlock,
  CustomerDetail,
  CustomerListItem,
  FollowUp,
  LabelKey,
  OrderRow,
  SalesCategory,
  SalesMonthBar,
  SalesStaffRank,
  SalesSummary,
  SalesTxn,
  ScheduleEntry,
  ShiftCell,
  ShiftRow,
  Staff,
  StockAlert,
  StockItem,
  Tone,
} from './types';

/** ISO 日付文字列を 'M/D'（先頭ゼロなし）に整形。 */
function md(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${Number(m)}/${Number(d)}`;
}

/** YYYY-MM-DD（ローカル日付）。 */
function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** JS の getDay()(0=日) を shifts.weekday(0=月..6=日) に変換。 */
function weekdayMonFirst(d: Date): number {
  return (d.getDay() + 6) % 7;
}

/** DB の time 値（'09:30:00'）を 'HH:MM' に整形。 */
function hhmm(t: string): string {
  return t.slice(0, 5);
}

export type CurrentUser = { name: string; initial: string; email: string };

/** ログイン中ユーザーの表示名・イニシャルを返す（未ログイン/エラー時は null）。 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const meta = (user.user_metadata ?? {}) as { display_name?: string; initial?: string };
    const name = (meta.display_name || user.email?.split('@')[0] || 'User').trim();
    const initial = (meta.initial || name[0] || 'U').toUpperCase();
    return { name, initial, email: user.email ?? '' };
  } catch {
    return null;
  }
}

export async function getStaff(): Promise<Staff[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('staff')
    .select('id, name, initial, tone, weekly_hours')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    initial: r.initial,
    tone: r.tone as Tone,
    weeklyHours: r.weekly_hours,
  }));
}

/** 週テンプレート（shifts）を staff 単位の ShiftRow[]（Mon..Sun）に組み立てる。 */
export async function getShiftRows(): Promise<ShiftRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('staff')
    .select(
      'initial, name, tone, weekly_hours, shifts (weekday, start_time, end_time, tone)',
    )
    .order('created_at', { ascending: true });
  if (error) throw error;

  return (data ?? []).map((s) => {
    const days: ShiftCell[] = Array(7).fill(null);
    for (const sh of (s.shifts ?? []) as {
      weekday: number;
      start_time: string;
      end_time: string;
      tone: Tone;
    }[]) {
      days[sh.weekday] = {
        start: hhmm(sh.start_time),
        end: hhmm(sh.end_time),
        tone: sh.tone,
      };
    }
    return {
      staff: {
        initial: s.initial,
        name: s.name,
        tone: s.tone as Tone,
        weeklyHours: s.weekly_hours,
      },
      days,
    };
  });
}

/** 指定日（既定: 今日）の予約を ScheduleEntry[] で返す。 */
export async function getTodaySchedule(
  date = new Date().toISOString().slice(0, 10),
): Promise<ScheduleEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bookings')
    .select(
      'id, start_time, duration_min, customer_name, service_key, tone, staff (initial, name)',
    )
    .eq('booking_date', date)
    .order('start_time', { ascending: true });
  if (error) throw error;

  return (data ?? []).map((b) => {
    // supabase-js は to-one リレーションを配列として型付けすることがあるため正規化。
    const rel = b.staff as unknown;
    const st = (Array.isArray(rel) ? rel[0] : rel) as
      | { initial: string; name: string }
      | null;
    return {
      id: b.id,
      time: hhmm(b.start_time),
      customer: b.customer_name,
      serviceKey: (b.service_key ?? 'svcCut') as ScheduleEntry['serviceKey'],
      durationMin: b.duration_min,
      staffInitial: st?.initial ?? '',
      staffName: st?.name ?? '',
      tone: b.tone as Tone,
    };
  });
}

export async function getFollowUps(): Promise<FollowUp[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('follow_ups')
    .select('id, initial, customer_name, tone, first_visit_date, status')
    .order('first_visit_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((f) => ({
    id: f.id,
    initial: f.initial,
    name: f.customer_name,
    tone: f.tone as Tone,
    firstVisitDate: f.first_visit_date,
    status: f.status as FollowUp['status'],
  }));
}

export async function getStockItems(): Promise<StockItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('inventory_items')
    .select('id, name, category_key, stock, capacity, reorder_pt, status')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((i) => ({
    id: i.id,
    name: i.name,
    categoryKey: i.category_key as StockItem['categoryKey'],
    stock: i.stock,
    capacity: i.capacity,
    reorderPt: i.reorder_pt,
    status: i.status as StockItem['status'],
  }));
}

export async function getOrders(): Promise<OrderRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .select('id, item, qty, supplier, order_date, eta, status')
    .order('order_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((o) => ({
    id: o.id,
    item: o.item,
    qty: o.qty,
    supplier: o.supplier,
    orderDate: md(o.order_date),
    eta: o.eta ? md(o.eta) : '',
    status: o.status as OrderRow['status'],
  }));
}

export async function getCustomerList(): Promise<CustomerListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('customers')
    .select('id, initial, name, tone, visits, last_visit, email')
    .order('last_visit', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.id,
    initial: c.initial,
    name: c.name,
    tone: c.tone as Tone,
    visits: c.visits,
    date: c.last_visit ? md(c.last_visit) : '',
    hasEmail: !!c.email,
  }));
}

export type DashboardMetrics = {
  todayBookings: number;
  todayBookingsDelta: string;
  staffOnShift: number;
  staffTotal: number;
  needsFollow: number;
  lowStock: number;
};

/** ダッシュボード上部の集計値を一括取得。 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createClient();
  const now = new Date();
  const todayStr = ymd(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = ymd(yesterday);
  const weekday = weekdayMonFirst(now);

  const head = { count: 'exact' as const, head: true };
  const [staffTotal, onShift, todayB, yB, needsFollow, lowStock] = await Promise.all([
    supabase.from('staff').select('id', head),
    supabase.from('shifts').select('id', head).eq('weekday', weekday),
    supabase.from('bookings').select('id', head).eq('booking_date', todayStr),
    supabase.from('bookings').select('id', head).eq('booking_date', yesterdayStr),
    supabase.from('follow_ups').select('id', head).eq('status', 'send'),
    supabase.from('inventory_items').select('id', head).in('status', ['low', 'order']),
  ]);

  const tb = todayB.count ?? 0;
  const delta = tb - (yB.count ?? 0);
  return {
    todayBookings: tb,
    todayBookingsDelta: `${delta >= 0 ? '+' : ''}${delta}`,
    staffOnShift: onShift.count ?? 0,
    staffTotal: staffTotal.count ?? 0,
    needsFollow: needsFollow.count ?? 0,
    lowStock: lowStock.count ?? 0,
  };
}

/** 在庫アラート（low/order のみ）。pct = 在庫 / 容量。 */
export async function getStockAlerts(): Promise<StockAlert[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('inventory_items')
    .select('id, name, stock, capacity, status')
    .in('status', ['low', 'order'])
    .order('stock', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((i) => ({
    id: i.id,
    nameKey: null,
    name: i.name,
    pct: i.capacity ? Math.round((i.stock / i.capacity) * 100) : 0,
  }));
}

/** 顧客数サマリ（合計 / 連絡先登録済み）。 */
export async function getCustomerCount(): Promise<{ total: number; withContact: number }> {
  const supabase = await createClient();
  const head = { count: 'exact' as const, head: true };
  const [total, withContact] = await Promise.all([
    supabase.from('customers').select('id', head),
    supabase.from('customers').select('id', head).not('email', 'is', null),
  ]);
  return { total: total.count ?? 0, withContact: withContact.count ?? 0 };
}

/** 顧客詳細（指定 id、無指定なら最終来店が最新の1件）＋メモ＋担当。 */
export async function getCustomerDetail(id?: string): Promise<CustomerDetail | null> {
  const supabase = await createClient();
  let q = supabase
    .from('customers')
    .select(
      'id, initial, name, tone, email, phone, visits, last_visit, lifetime_spend, primary_staff:staff!primary_staff_id(initial,name,tone)',
    );
  q = id ? q.eq('id', id) : q.order('last_visit', { ascending: false });
  const { data, error } = await q.limit(1).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const rel = data.primary_staff as unknown;
  const ps = (Array.isArray(rel) ? rel[0] : rel) as
    | { initial: string; name: string; tone: Tone }
    | null;

  const { data: memos } = await supabase
    .from('customer_memos')
    .select('memo_date, staff_name, tone, text')
    .eq('customer_id', data.id)
    .order('memo_date', { ascending: false });

  return {
    id: data.id,
    initial: data.initial,
    name: data.name,
    tone: data.tone as Tone,
    email: data.email ?? '',
    phone: data.phone ?? '',
    visits: data.visits,
    lastVisit: data.last_visit ? md(data.last_visit) : '—',
    spend: data.lifetime_spend != null ? `$${Number(data.lifetime_spend).toLocaleString('en-US')}` : '—',
    primaryStaff: {
      initial: ps?.initial ?? '',
      name: ps?.name ?? '',
      tone: (ps?.tone ?? 'accent') as Tone,
    },
    memos: (memos ?? []).map((m) => ({
      date: md(m.memo_date),
      staff: m.staff_name ?? '',
      tone: m.tone as Tone,
      text: m.text,
    })),
  };
}

export type BookingColumnStaff = { initial: string; name: string; tone: Tone };

/** 30分=1スロット。9:00 を rowStart 2 とするグリッド行番号を返す。 */
function rowStartFromTime(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return 2 + (h - 9) * 2 + (m >= 30 ? 1 : 0);
}

/** 指定日（既定: 今日）の予約タイムライン。スタッフ列とブロックを返す。 */
export async function getBookings(
  date = ymd(new Date()),
): Promise<{ staff: BookingColumnStaff[]; blocks: BookingBlock[] }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('id, start_time, duration_min, customer_name, service_key, tone, staff(id, initial, name, tone)')
    .eq('booking_date', date)
    .order('start_time', { ascending: true });
  if (error) throw error;

  const columns: BookingColumnStaff[] = [];
  const colIndex = new Map<string, number>();
  const blocks: BookingBlock[] = [];

  for (const b of data ?? []) {
    const rel = b.staff as unknown;
    const st = (Array.isArray(rel) ? rel[0] : rel) as
      | { id: string; initial: string; name: string; tone: Tone }
      | null;
    if (!st) continue;

    if (!colIndex.has(st.id)) {
      colIndex.set(st.id, columns.length);
      columns.push({ initial: st.initial, name: st.name, tone: st.tone });
    }
    const col = colIndex.get(st.id)! + 1; // 1-based

    blocks.push({
      id: b.id,
      col,
      rowStart: rowStartFromTime(b.start_time),
      rowSpan: Math.max(1, Math.ceil(b.duration_min / 30)),
      time: hhmm(b.start_time),
      customer: b.customer_name,
      serviceKey: (b.service_key ?? undefined) as BookingBlock['serviceKey'],
      tone: b.tone as Tone,
    });
  }

  return { staff: columns, blocks };
}

export type SalesData = {
  summary: SalesSummary;
  trend: SalesMonthBar[];
  categories: SalesCategory[];
  staffRank: SalesStaffRank[];
  txns: SalesTxn[];
};

const CATEGORY_TONE: Record<string, Tone> = {
  svcColor: 'accent',
  svcCut: 'sage',
  svcSpa: 'rose',
  svcCutColor: 'accent',
  salesRetail: 'accent',
};

type TxnRow = {
  id: string;
  txn_date: string;
  customer_name: string;
  service_key: string | null;
  category: 'service' | 'retail';
  amount: number;
  staff: { initial: string; name: string; tone: Tone } | null;
};

/** 6ヶ月分のゼロ推移＋空集計（transactions テーブル未作成時のフォールバック）。 */
function emptySales(now: Date): SalesData {
  const trend: SalesMonthBar[] = [];
  for (let i = 5; i >= 0; i--) {
    trend.push({ month: new Date(now.getFullYear(), now.getMonth() - i, 1).getMonth() + 1, value: 0 });
  }
  return {
    summary: { monthRevenue: 0, monthRevenueDelta: 0, avgSpend: 0, transactions: 0, serviceRevenue: 0, retailRevenue: 0 },
    trend,
    categories: [],
    staffRank: [],
    txns: [],
  };
}

/** 売上ページ用の集計一式（当月サマリ / 6ヶ月推移 / カテゴリ別 / スタッフ別 / 直近取引）。 */
export async function getSales(): Promise<SalesData> {
  const supabase = await createClient();
  const now = new Date();
  const since = new Date(now.getFullYear(), now.getMonth() - 5, 1); // 6ヶ月前の月初
  const { data, error } = await supabase
    .from('transactions')
    .select('id, txn_date, customer_name, service_key, category, amount, staff(initial, name, tone)')
    .gte('txn_date', ymd(since))
    .order('txn_date', { ascending: false });
  // transactions マイグレーション未適用時はテーブルが無いので空集計でフォールバック。
  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205' || /does not exist|find the table/i.test(error.message)) {
      return emptySales(now);
    }
    throw error;
  }

  const rows: TxnRow[] = (data ?? []).map((r) => {
    const rel = r.staff as unknown;
    const st = (Array.isArray(rel) ? rel[0] : rel) as TxnRow['staff'];
    return {
      id: r.id,
      txn_date: r.txn_date,
      customer_name: r.customer_name,
      service_key: r.service_key,
      category: r.category,
      amount: Number(r.amount),
      staff: st,
    };
  });

  const ym = (d: string) => d.slice(0, 7); // 'YYYY-MM'
  const thisMonth = ym(ymd(now));
  const lastMonth = ym(ymd(new Date(now.getFullYear(), now.getMonth() - 1, 1)));
  const monthRows = rows.filter((r) => ym(r.txn_date) === thisMonth);

  // --- summary（当月） ---
  const monthRevenue = monthRows.reduce((s, r) => s + r.amount, 0);
  const serviceRevenue = monthRows.filter((r) => r.category === 'service').reduce((s, r) => s + r.amount, 0);
  const retailRevenue = monthRows.filter((r) => r.category === 'retail').reduce((s, r) => s + r.amount, 0);
  const transactions = monthRows.length;
  const lastMonthRevenue = rows.filter((r) => ym(r.txn_date) === lastMonth).reduce((s, r) => s + r.amount, 0);
  const summary: SalesSummary = {
    monthRevenue: Math.round(monthRevenue),
    monthRevenueDelta: lastMonthRevenue ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0,
    avgSpend: transactions ? Math.round(monthRevenue / transactions) : 0,
    transactions,
    serviceRevenue: Math.round(serviceRevenue),
    retailRevenue: Math.round(retailRevenue),
  };

  // --- trend（6ヶ月） ---
  const byMonth = new Map<number, number>();
  for (const r of rows) {
    const mo = Number(r.txn_date.slice(5, 7));
    byMonth.set(mo, (byMonth.get(mo) ?? 0) + r.amount);
  }
  const trend: SalesMonthBar[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mo = d.getMonth() + 1;
    trend.push({ month: mo, value: Math.round(byMonth.get(mo) ?? 0) });
  }

  // --- categories（当月） ---
  const catMap = new Map<string, number>();
  for (const r of monthRows) {
    const key = r.category === 'retail' ? 'salesRetail' : r.service_key ?? 'svcCut';
    catMap.set(key, (catMap.get(key) ?? 0) + r.amount);
  }
  const categories: SalesCategory[] = [...catMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, amount], i) => ({
      id: `sc${i + 1}`,
      nameKey: key as LabelKey,
      amount: Math.round(amount),
      pct: monthRevenue ? Math.round((amount / monthRevenue) * 100) : 0,
      tone: CATEGORY_TONE[key] ?? 'accent',
    }));

  // --- staffRank（当月） ---
  const staffMap = new Map<string, { initial: string; name: string; tone: Tone; amount: number }>();
  for (const r of monthRows) {
    if (!r.staff) continue;
    const cur = staffMap.get(r.staff.name) ?? { ...r.staff, amount: 0 };
    cur.amount += r.amount;
    staffMap.set(r.staff.name, cur);
  }
  const staffRank: SalesStaffRank[] = [...staffMap.values()]
    .sort((a, b) => b.amount - a.amount)
    .map((s, i) => ({
      id: `sr${i + 1}`,
      initial: s.initial,
      name: s.name,
      tone: s.tone,
      amount: Math.round(s.amount),
      share: monthRevenue ? Math.round((s.amount / monthRevenue) * 100) : 0,
    }));

  // --- txns（直近8件） ---
  const txns: SalesTxn[] = rows.slice(0, 8).map((r) => ({
    id: r.id,
    date: md(r.txn_date),
    customer: r.customer_name,
    serviceKey: (r.service_key ?? 'svcCut') as LabelKey,
    staffInitial: r.staff?.initial ?? '',
    staffName: r.staff?.name ?? '',
    tone: r.staff?.tone ?? 'accent',
    amount: Math.round(r.amount),
  }));

  return { summary, trend, categories, staffRank, txns };
}
