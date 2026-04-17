import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '주의사항 | 자리요',
  description: '자리요는 좌석을 사고팔지 않습니다. 호의의 교환을 돕습니다.',
};

export default function DisclaimerPage() {
  return (
    <>
      <h1 className="text-2xl font-bold mb-2">주의사항</h1>
      <p className="text-xs text-gray-500 mb-8">최종 개정: 2026-04-17</p>

      <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 rounded-xl p-5 my-6">
        <p className="text-base font-semibold text-emerald-900 dark:text-emerald-100">
          자리요는 좌석을 사고팔지 않습니다.
        </p>
        <p className="text-sm text-emerald-800 dark:text-emerald-200 mt-1">
          호의의 교환을 돕습니다.
        </p>
      </div>

      <h2 className="text-lg font-semibold mt-6 mb-2">이 서비스가 무엇인지</h2>
      <p>
        자리요는 지하철에서 하차 예정인 이용자가 자신의 좌석을 자발적으로
        공유하고, 자리가 필요한 이용자가 그 좌석을 이어받을 수 있도록 돕는
        정보 공유 도구입니다. 좌석은 거래되지 않으며, 금전이 오가지 않습니다.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">해서는 안 되는 것</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>좌석 양도의 대가로 금전·기프티콘·재화를 요구하거나 제공하는 행위</li>
        <li>허위 좌석 정보 등록 또는 실재하지 않는 양도 의사 표시</li>
        <li>교통약자 전용 좌석(임산부·노약자·장애인)의 양도·요청</li>
        <li>상대방에 대한 위협·혐오·성희롱·차별적 언동</li>
        <li>본 서비스를 광고·영업·홍보 목적으로 이용하는 행위</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">매칭 실패와 기대 관리</h2>
      <p>
        자리요는 &ldquo;확실한 자리&rdquo;가 아니라 &ldquo;시도해볼 가치가 있는
        가능성&rdquo;을 제공합니다. 다음과 같은 경우 매칭이 성사되지 않을 수
        있습니다.
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>제공자가 예정보다 일찍 하차한 경우</li>
        <li>제공자가 등록을 취소한 경우</li>
        <li>다른 승객이 먼저 자리에 앉은 경우</li>
        <li>지하철 혼잡으로 제공자와 수혜자가 만나지 못한 경우</li>
      </ul>
      <p className="mt-2">
        매칭이 실패하더라도 서로를 비난하거나 평판을 훼손하는 행위는 금지됩니다.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">안전 수칙</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>지하철 운행 중에는 안전을 최우선으로 하세요. 좌석 양도 과정에서 밀치거나 달리지 않습니다.</li>
        <li>개찰구·계단·플랫폼 경계에서는 앱 조작을 자제하세요.</li>
        <li>불쾌한 경험이 있었다면 신고 기능을 이용해주세요.</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">법적 안내</h2>
      <p>
        좌석 이용은 철도 운영사의 여객운송약관에 따릅니다. 자리요를 이용한 좌석
        양도 역시 해당 약관 및 관련 법령의 적용을 받으며, 이와 충돌하는 경우
        법령과 약관이 우선합니다.
      </p>
    </>
  );
}
