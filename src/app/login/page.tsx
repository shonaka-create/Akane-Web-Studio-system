import { login, signup } from './actions';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--paper)',
        color: 'var(--ink)',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: 16,
          padding: '40px 32px',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 26,
            fontWeight: 600,
            margin: '0 0 4px',
            textAlign: 'center',
          }}
        >
          HUMAN-HUB
        </h1>
        <p
          style={{
            fontSize: 13,
            color: 'var(--ink2)',
            textAlign: 'center',
            margin: '0 0 28px',
          }}
        >
          サロン管理システム ログイン
        </p>

        {error && (
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
        )}
        {message === 'signup' && (
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
        )}

        <form style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12.5, color: 'var(--ink2)' }}>メールアドレス</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12.5, color: 'var(--ink2)' }}>パスワード</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12.5, color: 'var(--ink2)' }}>
              表示名（ユーザー名）<span style={{ color: 'var(--ink3)', fontSize: 11 }}>　※新規登録時のみ</span>
            </span>
            <input
              name="display_name"
              type="text"
              autoComplete="name"
              placeholder="例）田中 由樹"
              style={inputStyle}
            />
          </label>

          <button formAction={login} style={primaryBtn}>
            ログイン
          </button>
          <button formAction={signup} style={secondaryBtn}>
            新規アカウント作成
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  border: '1px solid var(--line)',
  borderRadius: 8,
  padding: '10px 12px',
  font: '14px var(--ui)',
  color: 'var(--ink)',
  background: '#fff',
  outline: 'none',
};

const primaryBtn: React.CSSProperties = {
  marginTop: 8,
  border: 'none',
  borderRadius: 999,
  padding: '11px 16px',
  background: 'var(--accent)',
  color: '#fff',
  font: '14px var(--ui)',
  fontWeight: 600,
  cursor: 'pointer',
};

const secondaryBtn: React.CSSProperties = {
  border: '1px solid var(--line)',
  borderRadius: 999,
  padding: '10px 16px',
  background: '#fff',
  color: 'var(--ink2)',
  font: '13px var(--ui)',
  cursor: 'pointer',
};
