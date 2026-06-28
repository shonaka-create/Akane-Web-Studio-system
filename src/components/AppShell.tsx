'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { CurrentUser } from '@/lib/data';

export function AppShell({ children, user }: { children: React.ReactNode; user: CurrentUser | null }) {
  const pathname = usePathname();

  // ログイン画面ではサイドバー/ヘッダーを表示しない。
  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--paper)', color: 'var(--ink)' }}>
      <Sidebar user={user} />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Header />
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px 64px' }}>{children}</div>
      </main>
    </div>
  );
}
