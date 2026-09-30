import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  isStageId,
  type ApplicationBoardItem,
  type ApplicationBoardTab,
  type ApplicationStageId,
  type MoveStage,
} from '@/features/application-board';

/**
 * 칸반(`ApplicationBoardKanban`)과 리스트(`ApplicationBoardList`)가 같이 쓰는 끌어 옮기기.
 * 끄는 것은 카드(`useDraggable`, `data: { item, from }`), 놓는 곳은 단계(`useDroppable`,
 * `id` = 단계 id)다.
 *
 * 카드 전체가 드래그 영역이라 누름(상세 열기)과 끌기를 센서가 가른다. 마우스는 5px 움직여야
 * 끌기다. 터치는 250ms 눌러야 끌기다 — 거리로 가르면 화면을 밀어 스크롤하는 손가락이 전부
 * 끌기가 된다. 키보드는 Space 로만 시작한다. Enter 는 카드가 상세 열기로 쓴다.
 *
 * 놓았을 때 그대로 이동 훅을 부른다. `over`가 없으면(단계 밖에 놓았다) 아무 일도 하지 않는다.
 * 막힌 전이는 여기서 막지 않는다 — `move.move`가 이미 `canMoveStage`로 걸러 토스트를 띄운다.
 */
export function useBoardDrag(tab: ApplicationBoardTab, move: MoveStage) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, {
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter', 'Tab'] },
    }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      return;
    }
    const data = active.data.current as { item: ApplicationBoardItem; from: ApplicationStageId };
    const to = String(over.id);
    if (!isStageId(tab, to)) {
      return;
    }
    move.move({ item: data.item, from: data.from, to });
  };

  return { sensors, onDragEnd };
}
