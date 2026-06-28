import { SalesView } from './SalesView';
import { getSales, getStaff } from '@/lib/data';

export default async function SalesPage() {
  const [sales, staff] = await Promise.all([getSales(), getStaff()]);
  return <SalesView {...sales} staff={staff} />;
}
