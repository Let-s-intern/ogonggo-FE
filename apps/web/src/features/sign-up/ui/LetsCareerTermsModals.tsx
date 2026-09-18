'use client';

import { Button, Modal } from '@ogonggo/ui';

/**
 * 렛츠커리어 가입 화면이 "보기" 로 여는 문서. 가입하는 계정이 렛츠커리어 계정이라 렛츠커리어의 문서를 그대로
 * 보인다(PRD "화면 > 일반 회원 가입").
 *
 * 서비스 이용약관은 노션 주소를 새 탭으로 열고, 개인정보 수집·이용과 마케팅 수신 동의는 렛츠커리어도 주소 없이
 * 모달로 띄운다. 주소와 문구는 `lets-intern-client` origin/main 의
 * `apps/web/src/domain/auth/section/AgreementSection.tsx`, `modal/PrivacyPolicyModal.tsx`,
 * `modal/MarketingModal.tsx` 에서 글자 그대로 옮겼다. 렛츠커리어가 문서를 바꾸면 여기도 바꾼다.
 */

export const LETSCAREER_TERMS_URL =
  'https://letsintern.notion.site/251208-2c35e77cbee1800bb2b5cfbd4c2f1525?pvs=21';

const LETSCAREER_PRIVACY_POLICY_URL =
  'https://letsintern.notion.site/c3af485bfced49ab9601f2d7bf07657d?pvs=4';

const CELL = 'border border-gray-200 p-2 align-top break-keep';
const HEAD = 'border border-gray-200 px-2 py-1 text-start font-semibold';

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex justify-center pt-6">
      <Button type="button" size="sm" onClick={onClose}>
        닫기
      </Button>
    </div>
  );
}

export function LetsCareerPrivacyModal({ open, onClose }: TermsModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="개인정보 수집 및 이용 동의서"
      className="w-[min(48rem,calc(100vw-2rem))]"
    >
      <div className="flex flex-col gap-4 text-sm text-gray-700">
        <p>
          아이엔지는 렛츠커리어 서비스 회원가입, 고객상담, 고지사항 전달 등을 위해 아래와 같이
          개인정보를 수집*이용합니다.
        </p>
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr>
              <th className={HEAD}>수집목적</th>
              <th className={HEAD}>수집항목</th>
              <th className={HEAD}>수집기간</th>
              <th className={HEAD}>수집근거</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={CELL}>
                - 회원가입 및 서비스 이용
                <br />- 고지사항 전달(프로그램 참여 방법 및 일정, 장소 안내 / 후기작성)
              </td>
              <td className={CELL}>이메일주소, 이름, 휴대폰 번호, 비밀번호</td>
              <td className={CELL}>회원 탈퇴 후 30일까지</td>
              <td className={CELL}>개인정보 보호법 제 15조 제1항</td>
            </tr>
          </tbody>
        </table>
        <p>
          귀하는 렛츠커리어 서비스 이용에 필요한 개인정보 수집*이용에 동의하지 않을 수 있으나,
          동의를 거부할 경우 회원제 서비스 이용이 불가합니다.
        </p>
        <p>
          개인정보처리내용에 대해서는{' '}
          <a
            href={LETSCAREER_PRIVACY_POLICY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            개인정보처리방침
          </a>
          을 확인해주세요.
        </p>
      </div>
      <CloseButton onClose={onClose} />
    </Modal>
  );
}

export function LetsCareerMarketingModal({ open, onClose }: TermsModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="마케팅 수신 동의"
      className="w-[min(48rem,calc(100vw-2rem))]"
    >
      <div className="flex flex-col gap-4 text-sm text-gray-700">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr>
              <th className={HEAD}>목적</th>
              <th className={HEAD}>항목</th>
              <th className={HEAD}>보유기간</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={CELL}>
                아이엔지가 제공하는 이용자 맞춤형 서비스 및 프로그램 추천, 각종 경품 행사, 이벤트의
                광고성 정보 제공 (이메일, SMS, 카카오톡 등)
              </td>
              <td className={CELL}>이름, 이메일주소, 휴대폰번호, 마케팅 수신 동의 여부</td>
              <td className={CELL}>회원 탈퇴 후 30일 도는 동의 철회시까지</td>
            </tr>
          </tbody>
        </table>
        <p>
          본 마케팅 정보 수신에 대한 동의를 거부하실 수 있으며, 이 경우 회원가입은 가능하나 일부
          서비스 이용 및 각종 광고, 할인, 이벤트 및 이용자 맞춤형 상품 추천 등의 서비스 제공이
          제한될 수 있습니다.
        </p>
      </div>
      <CloseButton onClose={onClose} />
    </Modal>
  );
}
