import { cn } from '../lib/cn';

/*
 * 라벨이 붙는 모서리별 위치와, 화면 안쪽을 향한 모서리만 둥글게 하는 값. 라벨은 테두리 위에
 * 겹쳐 앉아 화면 밖으로 삐져나오지 않는다.
 */
const CORNER_CLASSES = {
  'top-left': 'top-0 left-0 rounded-br-md',
  'top-right': 'top-0 right-0 rounded-bl-md',
  'bottom-left': 'bottom-0 left-0 rounded-tr-md',
  'bottom-right': 'right-0 bottom-0 rounded-tl-md',
} as const;

export interface MockModeFrameProps {
  /** 거짓이면 아무것도 그리지 않는다. 목 판정은 앱마다 달라서 환경변수는 앱이 읽어 넘긴다. */
  enabled: boolean;
  /**
   * 라벨이 앉는 모서리. 기본은 왼쪽 아래다. 오른쪽 아래는 웹의 피드백 버튼, 비즈니스의 무료 홍보 신청
   * 버튼, 어드민의 수정 버튼과 AI 비서 패널이 이미 차지하고 있다.
   */
  corner?: keyof typeof CORNER_CLASSES;
}

/**
 * 목데이터로 동작 중임을 알리는 화면 테두리와 `목데이터` 라벨.
 *
 * 화면 전체 크기의 고정 요소에 테두리만 그리므로 레이아웃이 밀리지 않고, `pointer-events-none` 이라
 * 아래의 버튼과 링크는 그대로 눌린다. 모달(`z-50`)과 토스트(`z-50`) 위에 보이도록 `z` 를 그보다 높게 둔다.
 *
 * 테두리와 라벨은 장식이 아니라 상태 표시지만 화면 읽기 도구에 읽어 줄 이유는 없어 `aria-hidden` 이다.
 * 빨강은 오류 표시와 헷갈릴 수 있어 글자로 뜻을 함께 적는다.
 */
export function MockModeFrame({ enabled, corner = 'bottom-left' }: MockModeFrameProps) {
  if (!enabled) {
    return null;
  }
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100] border-4 border-red-600"
    >
      <span
        className={cn(
          'pointer-events-none absolute bg-red-600 px-2 text-xs leading-4 font-bold text-white',
          CORNER_CLASSES[corner],
        )}
      >
        목데이터
      </span>
    </div>
  );
}
