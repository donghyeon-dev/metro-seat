import Link from 'next/link';
import { LINE_COLORS } from '@/lib/constants';

export default function Home() {
  return (
    <div className="px-4 pt-8">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-2">
          <TrainIcon />
          <h1 className="text-2xl font-bold text-gray-900">메트로시트</h1>
        </div>
        <p className="text-sm text-gray-500">지하철 빈자리를 미리 확인하고 예약하세요</p>
      </div>

      {/* 메인 액션 카드 */}
      <div className="space-y-4">
        <Link
          href="/provide"
          className="block bg-white rounded-2xl p-6 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">자리 제공하기</h2>
              <p className="text-sm text-gray-500 mt-1">
                내가 앉아있는 자리를 다른 사람에게 알려주세요
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/seek"
          className="block bg-white rounded-2xl p-6 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">자리 찾기</h2>
              <p className="text-sm text-gray-500 mt-1">
                내가 탈 열차의 빈자리를 미리 확인하세요
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* 호선 빠른 선택 */}
      <div className="mt-8">
        <h3 className="text-sm font-medium text-gray-700 mb-3">호선 빠른 선택</h3>
        <div className="grid grid-cols-4 gap-2">
          {([1, 2, 3, 4, 5, 6, 7, 8] as const).map((line) => (
            <Link
              key={line}
              href={`/seek?line=${line}`}
              className="flex items-center justify-center h-12 rounded-xl text-white font-bold text-sm active:scale-95 transition-transform"
              style={{ backgroundColor: LINE_COLORS[line] }}
            >
              {line}호선
            </Link>
          ))}
        </div>
      </div>

      {/* 안내 */}
      <div className="mt-8 bg-blue-50 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">이용 방법</h3>
        <ol className="text-xs text-blue-800 space-y-1.5">
          <li>1. <b>자리 제공자</b>: 호선, 칸, 좌석 위치, 하차역을 등록</li>
          <li>2. <b>자리 이용자</b>: 탈 열차를 선택하고 빈자리 확인</li>
          <li>3. 원하는 좌석 앞으로 이동 후 예약 요청</li>
          <li>4. 제공자가 확인하면 하차 시 자리를 이어받기</li>
        </ol>
      </div>
    </div>
  );
}

function TrainIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect x="6" y="4" width="20" height="22" rx="4" fill="#0052A4" />
      <rect x="9" y="8" width="14" height="8" rx="2" fill="#E0F2FE" />
      <circle cx="11" cy="21" r="2" fill="#FCD34D" />
      <circle cx="21" cy="21" r="2" fill="#FCD34D" />
      <rect x="8" y="26" width="4" height="2" rx="1" fill="#6B7280" />
      <rect x="20" y="26" width="4" height="2" rx="1" fill="#6B7280" />
    </svg>
  );
}
