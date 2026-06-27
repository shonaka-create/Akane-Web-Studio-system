import { getShiftRows } from '@/lib/data';
import { ShiftsView } from './ShiftsView';

export default async function ShiftsPage() {
  const shiftRows = await getShiftRows();
  return <ShiftsView shiftRows={shiftRows} />;
}
