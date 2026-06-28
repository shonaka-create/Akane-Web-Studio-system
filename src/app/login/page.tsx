import LoginForm from './LoginForm';

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

        <LoginForm />
      </div>
    </div>
  );
}
