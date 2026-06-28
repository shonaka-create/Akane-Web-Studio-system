import { DashboardView } from './DashboardView';
import {
  getCurrentUser,
  getDashboardMetrics,
  getFollowUps,
  getSales,
  getStockAlerts,
  getTodaySchedule,
} from '@/lib/data';

export default async function DashboardPage() {
  const [metrics, todaySchedule, followUps, stockAlerts, sales, user] = await Promise.all([
    getDashboardMetrics(),
    getTodaySchedule(),
    getFollowUps(),
    getStockAlerts(),
    getSales(),
    getCurrentUser(),
  ]);

  return (
    <DashboardView
      metrics={metrics}
      todaySchedule={todaySchedule}
      followUps={followUps}
      stockAlerts={stockAlerts}
      salesSummary={sales.summary}
      salesTrend={sales.trend}
      userName={user?.name ?? 'Guest'}
    />
  );
}
