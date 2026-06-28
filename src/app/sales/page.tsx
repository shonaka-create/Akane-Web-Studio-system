import { SalesView } from './SalesView';
import { getSales, getStaff, type SalesPeriod } from '@/lib/data';

const PERIODS: SalesPeriod[] = ['month', 'lastMonth', 'year'];

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period } = await searchParams;
  const p: SalesPeriod = PERIODS.includes(period as SalesPeriod) ? (period as SalesPeriod) : 'month';
  const [sales, staff] = await Promise.all([getSales(p), getStaff()]);
  return <SalesView {...sales} staff={staff} />;
}
