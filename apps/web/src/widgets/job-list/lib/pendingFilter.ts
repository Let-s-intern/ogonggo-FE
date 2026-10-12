import type { FilterSelection } from './filter';
import type { JobListQuery } from './query';

/** 사이드바가 들고 있는, 아직 주소에 반영되지 않은(디바운스 중이거나 이동 중인) 선택. */
export type SidebarDraft = FilterSelection & Pick<JobListQuery, 'q'>;

/** 직무 칩이 고른, 아직 주소에 반영되지 않은 직무. */
export type RoleSelection = Pick<JobListQuery, 'jobFields' | 'jobRoles'>;

/**
 * 직무 칩(`JobRoleChips`)과 왼쪽 필터(`JobFilterSidebar`)가 서로의 아직 주소에 반영되지 않은 선택을
 * 보는 자리. 둘은 각자 렌더된 `query` 로 주소를 만들어 이동하므로 서로를 모르면 나중 이동이 앞 선택을
 * 지운다 — 체크박스를 누르고 300ms 안에 칩을 누르면 체크가, 칩을 누르고 이동이 끝나기 전에
 * 체크박스를 누르면 칩이 사라진다.
 *
 * 홈 목록은 화면에 하나뿐이고 이벤트 핸들러와 타이머 안에서만 읽어 서버 렌더에 닿지 않으므로 모듈
 * 변수로 둔다. 각 쪽이 마운트 때 자기 함수를 꽂고 언마운트 때 비운다.
 */
export const pendingFilter: {
  /** 사이드바의 미적용 선택을 돌려주고 대기 중인 타이머를 취소한다. 없으면 `null`. */
  takeSidebarDraft: () => SidebarDraft | null;
  /** 칩 이동이 끝나기 전이면 칩이 고른 직무. 아니면 `undefined`. */
  roleInFlight: () => RoleSelection | undefined;
} = {
  takeSidebarDraft: () => null,
  roleInFlight: () => undefined,
};
