import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보처리방침 | 자리요',
  description: '자리요 개인정보처리방침',
};

export default function PrivacyPage() {
  return (
    <>
      <h1 className="text-2xl font-bold mb-2">개인정보처리방침</h1>
      <p className="text-xs text-gray-500 mb-8">최종 개정: 2026-04-17</p>

      <h2 className="text-lg font-semibold mt-6 mb-2">1. 수집하는 개인정보</h2>
      <p>자리요는 다음 정보를 수집합니다.</p>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>익명 인증 ID</strong>: Supabase가 발급한 UUID (이메일·실명 없음)</li>
        <li><strong>닉네임</strong>(선택): 이용자가 직접 입력한 표시명</li>
        <li><strong>서비스 이용 기록</strong>: 좌석 제공·요청·매칭 이벤트, 이용 시각, 이용 호선</li>
        <li><strong>기기 정보</strong>: 브라우저·OS·접속 IP (IP는 부정행위 탐지 목적으로 최대 24시간 보관)</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">2. 수집 목적</h2>
      <ol className="list-decimal pl-5 space-y-1">
        <li>좌석 양보 서비스 제공 및 이용자 간 매칭</li>
        <li>부정행위·악용 방지 (허위 등록·거래 시도 탐지)</li>
        <li>서비스 품질 개선을 위한 통계 분석</li>
      </ol>

      <h2 className="text-lg font-semibold mt-6 mb-2">3. 보유 및 이용 기간</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>익명 계정: 마지막 접속 후 1년 경과 시 자동 폐기</li>
        <li>좌석 제공·요청 기록: 생성 후 30일 (법적 분쟁 대비 최소 보관)</li>
        <li>IP 접속 로그: 최대 24시간 (법적 요청 시에만 연장)</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">4. 제3자 제공</h2>
      <p>
        자리요는 법령상 의무 외에 이용자의 개인정보를 제3자에게 제공하지 않습니다.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">5. 개인정보 처리 위탁</h2>
      <table className="w-full text-sm mt-2 border-collapse">
        <thead>
          <tr className="border-b border-gray-300 dark:border-gray-700">
            <th className="text-left py-2">위탁 받는 자</th>
            <th className="text-left py-2">위탁 업무</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-200 dark:border-gray-800">
            <td className="py-2">Supabase Inc.</td>
            <td className="py-2">데이터베이스·인증·실시간 통신</td>
          </tr>
          <tr className="border-b border-gray-200 dark:border-gray-800">
            <td className="py-2">Vercel Inc.</td>
            <td className="py-2">웹 호스팅·CDN</td>
          </tr>
          <tr className="border-b border-gray-200 dark:border-gray-800">
            <td className="py-2">Google LLC</td>
            <td className="py-2">이용 통계 분석 (Google Analytics 4)</td>
          </tr>
          <tr>
            <td className="py-2">Functional Software, Inc. (Sentry)</td>
            <td className="py-2">오류 추적</td>
          </tr>
        </tbody>
      </table>

      <h2 className="text-lg font-semibold mt-6 mb-2">6. 이용자의 권리</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>언제든지 본인 계정을 직접 삭제할 수 있습니다 (내 현황 &gt; 계정 삭제).</li>
        <li>이용 기록 열람·정정 요청은 문의 채널을 통해 접수할 수 있습니다.</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">7. 14세 미만 이용 금지</h2>
      <p>
        자리요는 14세 미만의 가입을 받지 않으며, 이용을 권장하지 않습니다.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">8. 문의</h2>
      <p>
        개인정보 관련 문의는 GitHub Issues 또는 서비스 내 피드백 채널을 통해
        접수할 수 있습니다.
      </p>
    </>
  );
}
