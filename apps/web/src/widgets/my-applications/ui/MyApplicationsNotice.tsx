import { Callout } from '@ogonggo/ui';
import type { MyApplicationTab } from '../lib/query';

/**
 * 표 위 안내 띠 한 줄. 탭마다 말이 다르다.
 *
 * 사이드·스터디는 목업(`docs/asset/v4 마이페이지/지원 신청내역/사이드 스터디.png`) 의 파란 띠
 * 문구 그대로다 — 지원 링크를 열면 `POST /api/v1/recruitment-posts/{postId}/applications` 가
 * 이력을 남긴다.
 *
 * 나머지 두 탭은 **한 번에 한 단계만 보인다**는 것을 말한다. 북마크 목록 응답에 단계 칸이
 * 없어 여러 단계를 섞어 그릴 수 없고(`lib/query.ts` 의 `DEFAULT_STAGE`), 그 사정은 화면만
 * 봐서는 알 수 없다.
 */
const NOTICES: Record<MyApplicationTab, string> = {
  jobs: '스크랩한 공고에서 지원 준비 중으로 옮긴 공고가 여기 모여요. 다른 단계는 지원 상태에서 골라 볼 수 있어요.',
  bootcamps:
    '스크랩한 공고에서 신청 전으로 옮긴 교육 · 부트캠프가 여기 모여요. 다른 단계는 지원 상태에서 골라 볼 수 있어요.',
  'side-studies':
    '지원 링크를 연 사이드 프로젝트 · 스터디 모집글이 자동으로 저장돼요. 지원 및 활동 상태는 직접 변경할 수 있어요.',
};

export function MyApplicationsNotice({ tab }: { tab: MyApplicationTab }) {
  return (
    <Callout className="flex items-start gap-2 border-transparent bg-blue-50 text-blue-800">
      <span aria-hidden="true" className="icon-[lucide--info] mt-0.5 block h-4 w-4 shrink-0" />
      <span>{NOTICES[tab]}</span>
    </Callout>
  );
}
