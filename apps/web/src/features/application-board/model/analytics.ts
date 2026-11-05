import { track } from '@/shared/analytics/dataLayer';
import type { ApplicationBoardTab } from './stages';

/**
 * `지원 · 신청 관리` 분석 이벤트(이슈 #541). GTM(`dataLayer`)과 PostHog 에 같은 이름으로 보낸다.
 *
 * 단계 변경 이력 테이블이 없어 DB 로는 지금 단계만 보인다. 몇 번 옮겼는지, 어디서 어디로
 * 옮겼는지는 이 이벤트로 센다. **요청이 성공한 뒤에만 보낸다.**
 *
 * 두 이벤트가 같은 키를 빠짐없이 싣는다. dataLayer 는 앞선 push 의 값을 기억해, 키를 빼면 앞
 * 이벤트의 값이 그대로 붙는다(`dataLayer.ts` 머리 주석). 삭제의 `to_stage` 가 `''` 인 이유다.
 */
export type ApplicationChangeLocation = 'board' | 'list';

const CONTENT_TYPE: Record<ApplicationBoardTab, string> = {
  jobs: 'job',
  bootcamps: 'bootcamp',
  'side-studies': 'side_study',
};

export function trackApplicationStageChange(
  tab: ApplicationBoardTab,
  contentId: number,
  from: string,
  to: string,
  location: ApplicationChangeLocation,
): void {
  track('application_stage_change', {
    content_type: CONTENT_TYPE[tab],
    content_id: contentId,
    from_stage: from,
    to_stage: to,
    change_location: location,
  });
}

/** 목록의 삭제. 채용공고·부트캠프는 북마크 해제, 사이드·스터디는 지원 이력 삭제다. */
export function trackApplicationDelete(
  tab: ApplicationBoardTab,
  contentId: number,
  from: string,
  location: ApplicationChangeLocation,
): void {
  track('application_delete', {
    content_type: CONTENT_TYPE[tab],
    content_id: contentId,
    from_stage: from,
    to_stage: '',
    change_location: location,
  });
}
