import { BookingsView } from './BookingsView';
import { getBookings, getStaff } from '@/lib/data';

export default async function BookingsPage() {
  const [{ staff, blocks }, staffOptions] = await Promise.all([getBookings(), getStaff()]);
  return <BookingsView staff={staff} blocks={blocks} staffOptions={staffOptions} />;
}
