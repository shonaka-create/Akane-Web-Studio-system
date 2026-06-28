import { SettingsView } from './SettingsView';
import { getStaff } from '@/lib/data';

export default async function SettingsPage() {
  const staff = await getStaff();
  return <SettingsView staff={staff} />;
}
