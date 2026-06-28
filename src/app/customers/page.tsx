import { CustomersView } from './CustomersView';
import { getCustomerCount, getCustomerDetail, getCustomerList, getStaff } from '@/lib/data';

export default async function CustomersPage() {
  const [customerCount, customerList, customerDetail, staff] = await Promise.all([
    getCustomerCount(),
    getCustomerList(),
    getCustomerDetail(),
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
