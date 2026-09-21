import { Callout } from '@ogonggo/ui';
import {
  PLACEHOLDER_NOTICE,
  PLACEHOLDER_NOTICE_DESCRIPTION,
} from '@/features/my-applications/model/placeholder';
import type { MyApplicationTab } from '../lib/query';

/**
 * 사이드·스터디 탭의 안내. 목업(`지원 신청내역/사이드 스터디.png`) 의 파란 띠 문구 그대로다.
 * 이 탭은 실제로 그렇게 동작한다 — 지원 링크를 열면
 * `POST /api/v1/recruitment-posts/{postId}/applications` 가 이력을 남긴다.
 */
const SIDE_STUDY_NOTICE =
  '지원 링크를 연 사이드 프로젝트 · 스터디 모집글이 자동으로 저장돼요. 지원 및 활동 상태는 직접 변경할 수 있어요.';

/**
 * 표 위 안내 띠 한 줄. 탭마다 말이 다르다.
 *
 * 하드코딩한 두 탭은 **왜 컨트롤이 비활성인지**를 말한다. 목업의 같은 자리 문구("지원 링크를
 * 연 채용 공고가 자동으로 저장돼요") 를 그대로 옮기지 않는다 — 저장되지 않는데 저장된다고
 * 적으면 화면이 거짓말을 한다.
 */
export function MyApplicationsNotice({ tab }: { tab: MyApplicationTab }) {
  if (tab === 'side-studies') {
    return (
      <Callout className="flex items-start gap-2 border-transparent bg-blue-50 text-blue-800">
        <span aria-hidden="true" className="icon-[lucide--info] mt-0.5 block h-4 w-4 shrink-0" />
        <span>{SIDE_STUDY_NOTICE}</span>
      </Callout>
    );
  }

  return (
    <Callout
      tone="warning"
      className="flex items-start gap-2 border-transparent bg-orange-50 text-orange-800"
    >
      <span aria-hidden="true" className="icon-[lucide--info] mt-0.5 block h-4 w-4 shrink-0" />
      <span>
        <b className="font-semibold">{PLACEHOLDER_NOTICE}</b> {PLACEHOLDER_NOTICE_DESCRIPTION}
      </span>
    </Callout>
  );
}
