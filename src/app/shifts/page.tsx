import { getShiftRows, getStaff } from '@/lib/data';
import { ShiftsView } from './ShiftsView';

export default async function ShiftsPage() {
  const [shiftRows, staff] = await Promise.all([getShiftRows(), getStaff()]);
  return <ShiftsView shiftRows={shiftRows} staff={staff} />;
}
