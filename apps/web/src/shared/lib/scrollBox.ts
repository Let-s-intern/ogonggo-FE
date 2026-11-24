import { createContext, type RefObject } from 'react';

/**
 * 문서가 아니라 안쪽 상자가 스크롤되는 곳(`shared/ui/RouteModal.tsx`)이 자기 스크롤 상자를 아래로 내려 주는 자리.
 * 안의 컴포넌트가 스크롤 위치를 재려면 이 상자를 봐야 한다 — 모달이 떠 있는 동안 문서는 잠겨(`useScrollLock`)
 * 스크롤되지 않는다. 값이 없으면 문서가 스크롤하는 화면이다.
 *
 * 상자 자체가 아니라 ref 를 내린다. ref 는 마운트 때 채워지고 자식의 effect 는 그 뒤에 돌아서, 상자를 state 로
 * 받아 한 번 더 그리지 않고도 첫 effect 에서 읽을 수 있다.
 */
export const ScrollBoxContext = createContext<RefObject<HTMLElement | null> | null>(null);
