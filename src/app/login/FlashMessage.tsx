'use client';

import { useEffect } from 'react';

/**
 * ログイン画面のフラッシュメッセージ。
 * error / message クエリを一度だけ表示し、表示後は URL からパラメータを除去する。
 * （これがないと ?message=signup 付き URL のハードリロードで毎回再表示されてしまう）
 */
export default function FlashMessage({ error, message }: { error?: string; message?: string }) {
  useEffect(() => {
    if (error || message) {
      window.history.replaceState({}, '', '/login');
    }
  }, [error, message]);

  if (error) {
    return (
      <p
        style={{
          fontSize: 13,
          color: 'var(--rose)',
          background: 'var(--rose-soft, #f7e9e7)',
          border: '1px solid var(--rose)',
          borderRadius: 8,
          padding: '10px 12px',
          margin: '0 0 16px',
        }}
      >
        {error}
      </p>
    );
  }

  if (message === 'signup') {
    return (
      <p
        style={{
          fontSize: 13,
          color: 'var(--sage)',
          background: 'var(--sage-soft, #e9efe9)',
          border: '1px solid var(--sage)',
          borderRadius: 8,
          padding: '10px 12px',
          margin: '0 0 16px',
        }}
      >
        アカウントを作成しました。メール確認が必要な場合は受信箱をご確認ください。
      </p>
    );
  }

  return null;
}
