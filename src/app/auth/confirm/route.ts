import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * 確認メールのリンク先。
 * メールテンプレートを次の形式にしておくこと:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
 * verifyOtp が成功すると Cookie にセッションが書き込まれ、ログイン状態になる。
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/';

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      // 確認成功 → 目的のページ（既定はトップ）へ。
      return NextResponse.redirect(new URL(next, request.url));
    }
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent('確認リンクが無効か期限切れです。もう一度お試しください。')}`,
        request.url,
      ),
    );
  }

  return NextResponse.redirect(
    new URL(
      `/login?error=${encodeURIComponent('確認リンクが正しくありません。')}`,
      request.url,
    ),
  );
}
