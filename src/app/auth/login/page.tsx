'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [nickname, setNickname] = useState('');
  const router = useRouter();

  // 익명 로그인 (MVP용)
  async function handleAnonymousLogin() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) throw error;

      if (data.user) {
        // 프로필 생성
        const displayName = nickname.trim() || `승객${Math.floor(Math.random() * 10000)}`;
        await supabase.from('profiles').upsert({
          id: data.user.id,
          nickname: displayName,
        });
      }

      router.push('/');
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 pt-12">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="6" y="4" width="20" height="22" rx="4" fill="#0052A4" />
            <rect x="9" y="8" width="14" height="8" rx="2" fill="#E0F2FE" />
            <circle cx="11" cy="21" r="2" fill="#FCD34D" />
            <circle cx="21" cy="21" r="2" fill="#FCD34D" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">메트로시트</h1>
        <p className="text-sm text-gray-500">간편하게 시작하세요</p>
      </div>

      <div className="max-w-sm mx-auto space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">닉네임 (선택)</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임을 입력하세요"
            maxLength={20}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleAnonymousLogin}
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:bg-gray-300 active:bg-blue-700 transition-colors"
        >
          {loading ? '로딩 중...' : '바로 시작하기'}
        </button>

        <p className="text-xs text-center text-gray-400">
          로그인 없이 익명으로 이용할 수 있습니다
        </p>
      </div>
    </div>
  );
}
