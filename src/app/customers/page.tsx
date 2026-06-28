import { CustomersView } from './CustomersView';
import { getCustomerCount, getCustomerDetail, getCustomerList, getStaff } from '@/lib/data';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const [customerCount, customerList, customerDetail, staff] = await Promise.all([
    getCustomerCount(),
    getCustomerList(),
    getCustomerDetail(id),
    getStaff(),
  ]);

  return (
    <CustomersView
      customerCount={customerCount}
      customerList={customerList}
      customerDetail={customerDetail}
      staff={staff}
    />
  );
}
