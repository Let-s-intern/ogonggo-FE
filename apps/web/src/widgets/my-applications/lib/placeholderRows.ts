import {
  PLACEHOLDER_APPLICATIONS,
  type PlaceholderApplicationTab,
} from '@/features/my-applications/model/placeholder';
import type { MyApplicationRow } from './fetch';

/**
 * 하드코딩한 두 탭의 행. 값은 전부
 * `features/my-applications/model/placeholder.ts` 에 있고 여기서는 표가 아는 모양으로만
 * 옮긴다 — 그 파일 하나만 지우면 되게 두려고 값과 옮기는 일을 갈라 놓았다.
 *
 * `postId` 와 `href` 가 없다. 되읽는 API 가 없으니 상태를 바꿀 곳도, 제목을 눌러 갈 상세도
 * 없다. 그 둘이 없다는 것이 이 행의 컨트롤을 비활성으로 그리는 근거다.
 */
export function placeholderRows(tab: PlaceholderApplicationTab): MyApplicationRow[] {
  return PLACEHOLDER_APPLICATIONS[tab].map((row) => ({
    key: row.key,
    caption: row.caption,
    title: row.title,
    meta: row.meta,
    recruitmentType: 'PERIOD' as const,
    recruitmentEndAt: row.recruitmentEndAt,
    applicationStatus: row.applicationStatus,
  }));
}
