// Supabase データアクセス層。mock.ts の各 export に対応する非同期版。
// ページを mock から切り替えるには import を差し替えて await するだけ:
//   import { staff } from '@/lib/mock';        →  import { getStaff } from '@/lib/data';
//   const rows = staff;                         →  const rows = await getStaff();
// ※ 呼び出し側は Server Component / Route Handler / Server Action である必要がある。

import { createClient } from '@/lib/supabase/server';
import type {
  CustomerListItem,
  FollowUp,
  OrderRow,
  ScheduleEntry,
  ShiftCell,
  ShiftRow,
  Staff,
  StockItem,
  Tone,
} from './types';

/** DB の time 値（'09:30:00'）を 'HH:MM' に整形。 */
function hhmm(t: string): string {
  return t.slice(0, 5);
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
    orderDate: o.order_date,
    eta: o.eta ?? '',
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
    date: c.last_visit ?? '',
    hasEmail: !!c.email,
  }));
}
