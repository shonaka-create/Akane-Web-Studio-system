import { BookingsView } from './BookingsView';
import { getBookings, getStaff } from '@/lib/data';

/** YYYY-MM-DD のみ許可（不正値は今日にフォールバック）。 */
function safeDate(v: string | string[] | undefined): string {
  const s = Array.isArray(v) ? v[0] : v;
  if (s && /^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const day = safeDate(date);
  const [{ staff, blocks }, staffOptions] = await Promise.all([getBookings(day), getStaff()]);
  return <BookingsView date={day} staff={staff} blocks={blocks} staffOptions={staffOptions} />;
}
