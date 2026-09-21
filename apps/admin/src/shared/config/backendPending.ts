import { isMockEnabled } from '@/app/enableMocking';

/**
 * 백엔드가 아직 없는 다섯 화면(대시보드·사이드·스터디·일반 회원·비즈니스 회원·공지사항)이
 * 실서버 모드에서 무엇을 보여줄지 정한다.
 *
 * 목 모드에서는 아홉 메뉴가 지금처럼 목데이터로 그려진다. 실서버 모드에서만 이 다섯이 빈
 * 상태가 된다 — 목과 실데이터가 한 화면에 섞이면 운영자는 어느 숫자를 믿어야 할지 구분할 수
 * 없다(PRD `.claude/tasks/todo/prd-admin-fe-only.md` "API 가 없는 화면은 목으로 채우지 않는다").
 *
 * 빈 상태는 화면을 지우지 않는다. 표의 머리글과 필터 줄은 그대로 두고 본문 자리에만 안내를
 * 넣는다. 백엔드가 생기면 이 파일을 쓰는 곳에서 안내만 걷어내면 된다.
 *
 * 좌측 메뉴는 건드리지 않는다. `./navigation.ts` 의 `disabled` 는 화면 자체가 없는 것
 * (지면·통계) 에 쓰는 표시고, 이 다섯은 화면이 있고 목 모드에서 돈다.
 */

/**
 * 실서버 모드인가. `app/enableMocking.ts` 가 보는 값을 그대로 쓴다.
 *
 * `shared` 가 `app` 을 가져오는 것은 이 한 줄뿐이다. 같은 환경변수를 여기서 다시 읽으면
 * 판정이 두 곳이 되고, 한쪽의 기본값이 바뀌면 화면과 목이 서로 다른 모드로 돈다.
 */
export const isBackendPending = !isMockEnabled;

/**
 * 메뉴마다 다른 안내 문구.
 *
 * 아홉 중 다섯이 같은 문장으로 비면 운영자는 콘솔 전체가 고장 난 것으로 읽는다. 무엇이 준비
 * 중인지 말해 준다. 회원 둘은 같은 기능이라 같은 문장을 쓴다.
 */
export const BACKEND_PENDING_MESSAGE = {
  dashboard: '집계 기능을 준비하고 있습니다. 검수와 콘텐츠 관리는 지금 쓸 수 있습니다.',
  sideStudy: '사이드·스터디 관리 기능을 준비하고 있습니다.',
  member: '회원 조회 기능을 준비하고 있습니다.',
  notice: '공지사항 기능을 준비하고 있습니다.',
} as const;

export interface TableBodyState {
  isLoading: boolean;
  emptyMessage: string;
}

/**
 * 목록 표의 본문 상태.
 *
 * 실서버 모드에서는 요청을 보내지 않으므로(훅이 `enabled` 로 막는다) 로딩을 끄고 안내를 본문에
 * 넣는다. 끄지 않으면 표가 "불러오는 중입니다" 에서 멈춘 것처럼 보인다.
 */
export function tableBodyState(
  pendingMessage: string,
  isPending: boolean,
  emptyMessage: string,
): TableBodyState {
  return isBackendPending
    ? { isLoading: false, emptyMessage: pendingMessage }
    : { isLoading: isPending, emptyMessage };
}
