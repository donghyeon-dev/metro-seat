import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '이용약관 | 자리요',
  description: '자리요 이용약관',
};

export default function TermsPage() {
  return (
    <>
      <h1 className="text-2xl font-bold mb-2">이용약관</h1>
      <p className="text-xs text-gray-500 mb-8">최종 개정: 2026-04-17</p>

      <h2 className="text-lg font-semibold mt-6 mb-2">제1조 (목적)</h2>
      <p>
        본 약관은 자리요(이하 &ldquo;서비스&rdquo;)가 제공하는 지하철 좌석 양보 중개
        서비스의 이용 조건과 절차, 이용자와 운영자의 권리·의무·책임을 규정함을
        목적으로 합니다.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">제2조 (서비스의 성격)</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          자리요는 하차 예정자(제공자)가 자신의 좌석을 자발적으로 공유하고, 자리가
          필요한 이용자(수혜자)가 이를 이어받을 수 있도록 돕는 정보 공유·연결
          서비스입니다.
        </li>
        <li>
          <strong>자리요는 좌석을 매매·임대·거래하는 서비스가 아닙니다.</strong>{' '}
          좌석 양도는 전적으로 이용자 간의 호의와 합의에 따라 이루어집니다.
        </li>
        <li>
          철도 운영사의 여객운송약관 및 관계 법령에 따라, 서비스를 이용한 좌석
          양도에도 해당 규정이 우선 적용됩니다.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">제3조 (이용자의 의무)</h2>
      <ol className="list-decimal pl-5 space-y-1">
        <li>이용자는 허위 좌석 정보를 등록하거나 실재하지 않는 양도 의사를 표시해서는 안 됩니다.</li>
        <li>이용자는 좌석 양도를 대가로 금전·재화를 요구하거나 제공해서는 안 됩니다.</li>
        <li>이용자는 교통약자(임산부·노약자·장애인 등) 전용 좌석을 본 서비스로 양도·요청해서는 안 됩니다.</li>
        <li>이용자는 타인에게 위협·혐오·차별적 언동을 해서는 안 됩니다.</li>
      </ol>

      <h2 className="text-lg font-semibold mt-6 mb-2">제4조 (서비스 이용 제한)</h2>
      <p>
        운영자는 전항의 의무를 위반한 이용자에 대해 사전 통지 없이 서비스 이용을
        제한하거나 등록 정보를 삭제할 수 있습니다.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">제5조 (책임의 제한)</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          운영자는 이용자 간 좌석 양도 과정에서 발생한 분쟁·손해에 대해 책임을
          지지 않습니다.
        </li>
        <li>
          서울 열린데이터 광장 등 외부 API의 장애·지연으로 인한 정보 부정확에
          대하여 운영자는 합리적인 범위 내에서만 책임을 부담합니다.
        </li>
        <li>
          천재지변·운영사 시스템 장애·네트워크 장애 등 불가항력에 의한 서비스
          중단에 대해 책임을 지지 않습니다.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">제6조 (약관의 변경)</h2>
      <p>
        운영자는 필요한 경우 본 약관을 변경할 수 있으며, 변경 시 서비스 내 공지를
        통해 고지합니다. 변경된 약관에 동의하지 않는 이용자는 서비스 이용을 중단할
        수 있습니다.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">제7조 (준거법)</h2>
      <p>본 약관은 대한민국 법률에 따라 해석되며, 서비스 이용과 관련한 분쟁의 관할은 민사소송법에 따릅니다.</p>
    </>
  );
}
