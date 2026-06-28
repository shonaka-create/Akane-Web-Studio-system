'use server';

// 各画面の「追加 / 登録」操作に対応する Server Actions。
// フォーム送信 → Supabase へ INSERT/UPSERT/UPDATE → 該当パスを revalidate。
// RLS によりログイン済みユーザーのみ実行可能（匿名は不可）。

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Tone } from '@/lib/types';

/** 文字列の先頭1文字を大文字イニシャルに。空なら '?'。 */
function initialOf(name: string): string {
  return (name.trim()[0] ?? '?').toUpperCase();
}

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? '').trim();
}

function num(fd: FormData, key: string): number {
  return Number(fd.get(key) ?? 0) || 0;
}

/** 指定スタッフの配色を取得（見つからなければ 'accent'）。 */
async function staffTone(
  supabase: Awaited<ReturnType<typeof createClient>>,
  staffId: string,
): Promise<Tone> {
  if (!staffId) return 'accent';
  const { data } = await supabase.from('staff').select('tone').eq('id', staffId).maybeSingle();
  return (data?.tone as Tone) ?? 'accent';
}

/* ------------------------- 顧客 ------------------------- */
export async function createCustomer(formData: FormData) {
  const name = str(formData, 'name');
  if (!name) return;
  const supabase = await createClient();
  const tone = (str(formData, 'tone') || 'accent') as Tone;
  const staffId = str(formData, 'primary_staff_id');
  const { error } = await supabase.from('customers').insert({
    name,
    initial: initialOf(name),
    tone,
    email: str(formData, 'email') || null,
    phone: str(formData, 'phone') || null,
    primary_staff_id: staffId || null,
    first_visit: new Date().toISOString().slice(0, 10),
    last_visit: new Date().toISOString().slice(0, 10),
    visits: 0,
  });
  if (error) throw error;
  revalidatePath('/customers');
  revalidatePath('/');
}

/** 顧客詳細のメモ追加。 */
export async function addCustomerMemo(formData: FormData) {
  const customerId = str(formData, 'customer_id');
  const text = str(formData, 'text');
  if (!customerId || !text) return;
  const supabase = await createClient();
  const staffName = str(formData, 'staff_name');
  const { error } = await supabase.from('customer_memos').insert({
    customer_id: customerId,
    memo_date: new Date().toISOString().slice(0, 10),
    staff_name: staffName || null,
    tone: (str(formData, 'tone') || 'accent') as Tone,
    text,
  });
  if (error) throw error;
  revalidatePath('/customers');
}

/* ------------------------- 予約 ------------------------- */
export async function createBooking(formData: FormData) {
  const date = str(formData, 'booking_date');
  const time = str(formData, 'start_time');
  const customer = str(formData, 'customer_name');
  if (!date || !time || !customer) return;
  const supabase = await createClient();
  const staffId = str(formData, 'staff_id');
  const { error } = await supabase.from('bookings').insert({
    booking_date: date,
    start_time: time,
    duration_min: num(formData, 'duration_min') || 60,
    staff_id: staffId || null,
    customer_name: customer,
    service_key: str(formData, 'service_key') || null,
    tone: await staffTone(supabase, staffId),
  });
  if (error) throw error;
  revalidatePath('/bookings');
  revalidatePath('/');
}

/* ------------------------- シフト ------------------------- */
export async function upsertShift(formData: FormData) {
  const staffId = str(formData, 'staff_id');
  const weekday = num(formData, 'weekday');
  const start = str(formData, 'start_time');
  const end = str(formData, 'end_time');
  if (!staffId || !start || !end) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from('shifts')
    .upsert(
      {
        staff_id: staffId,
        weekday,
        start_time: start,
        end_time: end,
        tone: await staffTone(supabase, staffId),
      },
      { onConflict: 'staff_id,weekday' },
    );
  if (error) throw error;
  revalidatePath('/shifts');
  revalidatePath('/');
}

/* ------------------------- 売上 ------------------------- */
export async function createTransaction(formData: FormData) {
  const date = str(formData, 'txn_date');
  const customer = str(formData, 'customer_name');
  const amount = num(formData, 'amount');
  if (!date || !customer || !amount) return;
  const supabase = await createClient();
  const { error } = await supabase.from('transactions').insert({
    txn_date: date,
    customer_name: customer,
    staff_id: str(formData, 'staff_id') || null,
    service_key: str(formData, 'service_key') || null,
    category: (str(formData, 'category') || 'service') as 'service' | 'retail',
    amount,
  });
  if (error) throw error;
  revalidatePath('/sales');
  revalidatePath('/');
}

/* ------------------------- 資材（在庫） ------------------------- */
export async function createInventoryItem(formData: FormData) {
  const name = str(formData, 'name');
  if (!name) return;
  const supabase = await createClient();
  const stock = num(formData, 'stock');
  const reorderPt = num(formData, 'reorder_pt');
  const status = stock <= 0 ? 'order' : stock <= reorderPt ? 'low' : 'ok';
  const { error } = await supabase.from('inventory_items').insert({
    name,
    category_key: str(formData, 'category_key') || 'catSupply',
    stock,
    capacity: num(formData, 'capacity') || stock,
    reorder_pt: reorderPt,
    status,
    supplier: str(formData, 'supplier') || null,
  });
  if (error) throw error;
  revalidatePath('/inventory');
  revalidatePath('/');
}

/** 在庫アイテムを「発注済み」にし、orders に1行追加する。 */
export async function orderStockItem(formData: FormData) {
  const id = str(formData, 'id');
  const name = str(formData, 'name');
  if (!id) return;
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const eta = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const { error: e1 } = await supabase.from('inventory_items').update({ status: 'ordered' }).eq('id', id);
  if (e1) throw e1;
  const { error: e2 } = await supabase.from('orders').insert({
    item: name || '—',
    qty: str(formData, 'qty') || '1',
    supplier: str(formData, 'supplier') || '未設定',
    order_date: today,
    eta,
    status: 'ordered',
  });
  if (e2) throw e2;
  revalidatePath('/inventory');
  revalidatePath('/');
}

/* ------------------------- 発注 ------------------------- */
export async function createOrder(formData: FormData) {
  const item = str(formData, 'item');
  if (!item) return;
  const supabase = await createClient();
  const { error } = await supabase.from('orders').insert({
    item,
    qty: str(formData, 'qty') || '1',
    supplier: str(formData, 'supplier') || '—',
    order_date: str(formData, 'order_date') || new Date().toISOString().slice(0, 10),
    eta: str(formData, 'eta') || null,
    status: 'ordered',
  });
  if (error) throw error;
  revalidatePath('/inventory');
}

/** 発注を「入荷済み」にする。 */
export async function receiveOrder(formData: FormData) {
  const id = str(formData, 'id');
  if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase.from('orders').update({ status: 'arrived' }).eq('id', id);
  if (error) throw error;
  revalidatePath('/inventory');
}

/* ------------------------- 設定（スタッフ） ------------------------- */
export async function createStaff(formData: FormData) {
  const name = str(formData, 'name');
  if (!name) return;
  const supabase = await createClient();
  const id = str(formData, 'id') || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `staff-${Date.now()}`;
  const { error } = await supabase.from('staff').insert({
    id,
    name,
    initial: str(formData, 'initial') || initialOf(name),
    tone: (str(formData, 'tone') || 'accent') as Tone,
    weekly_hours: num(formData, 'weekly_hours'),
  });
  if (error) throw error;
  revalidatePath('/settings');
  revalidatePath('/shifts');
  revalidatePath('/');
}
