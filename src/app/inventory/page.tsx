import { InventoryView } from './InventoryView';
import { getOrders, getStockItems } from '@/lib/data';

export default async function InventoryPage() {
  const [stockItems, orderRows] = await Promise.all([getStockItems(), getOrders()]);
  return <InventoryView stockItems={stockItems} orderRows={orderRows} />;
}
