import { OPERATION_TYPE_LABELS } from '@/entities/side-study/model/labels';
import type { SideStudyDetail } from '@/entities/side-study/model/types';

export interface SideStudyInfoGridProps {
  sideStudy: SideStudyDetail;
}

const NO_VALUE = '정보 없음';
const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

/** 목업의 `2026/6/1 (월)` 형식. 헤더 카드의 모집 기간과 달리 시각은 쓰지 않는다. */
function formatDate(value?: string): string {
  if (!value) {
    return NO_VALUE;
  }
  const date = new Date(value);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} (${WEEKDAY_LABELS[date.getDay()]})`;
}

function InfoCell({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

/**
 * `사이드스터디 상세페이지.png`의 정보 그리드 7칸. 칸 모양·여백은 채용공고(`JobInfoGrid`, 4칸)·
 * 부트캠프(`BootcampInfoGrid`, 6칸)와 같은 값이다 — 세 상세 화면의 같은 자리가 다르게 보일
 * 이유가 없다.
 *
 * 칸이 홀수라 배치가 2열로 딱 떨어지지 않는다. 목업은 `기술 스택`을 한 줄 전체로 쓰고 나머지를
 * 2열로 채운다 — 그대로 옮긴다.
 *
 *     진행 방식 | 모집 인원
 *     기술 스택 (한 줄)
 *     모집 시작일 | 모집 마감일
 *     모집 포지션 | 소통 방법
 *
 * PRD 4.4와 이 Push의 task 파일은 같은 일곱 칸을 "진행 방식 / 모집 인원 / 기술 스택 /
 * 모집 시작일 / 모집 포지션 / 모집 마감일 / 소통 방법" 순으로 적었는데, 그것은 목업의 왼쪽
 * 칸을 위에서 아래로 읽고 오른쪽 칸을 다시 읽은 순서다. 칸 이름과 개수는 같다.
 *
 * 값이 없는 칸은 빈 칸으로 새지 않고 "정보 없음"이 들어간다(PRD 9절 4번). `기술 스택`이
 * 그 경로를 지나가는 유일한 칸이다(픽스처 id 3).
 */
export function SideStudyInfoGrid({ sideStudy }: SideStudyInfoGridProps) {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <InfoCell label="진행 방식" value={OPERATION_TYPE_LABELS[sideStudy.operationType]} />
      {/* 모집 인원은 정원만이 아니라 `현재/정원`이다 — 목록 카드 배지(`모집 중 2/6`)와 같은
          두 값을 쓰고, 남은 자리가 몇인지가 이 화면에서 가장 자주 보는 숫자다(PRD 5절). */}
      <InfoCell
        label="모집 인원"
        value={`${sideStudy.appliedCount}/${sideStudy.capacity}명`}
      />
      <InfoCell
        label="기술 스택"
        value={sideStudy.techStack.length > 0 ? sideStudy.techStack.join(', ') : NO_VALUE}
        className="col-span-2"
      />
      <InfoCell label="모집 시작일" value={formatDate(sideStudy.recruitmentStartAt)} />
      {/* 마감일이 없는 건은 상시 모집이다(`fixtures/side-study.ts`의 `recruitmentEndAt` 주석) —
          "정보 없음"이 아니라 그렇게 적는다. 헤더 카드의 모집 기간 문구와 같은 판단이다. */}
      <InfoCell
        label="모집 마감일"
        value={sideStudy.recruitmentEndAt ? formatDate(sideStudy.recruitmentEndAt) : '상시 모집'}
      />
      <InfoCell
        label="모집 포지션"
        value={sideStudy.positions.length > 0 ? sideStudy.positions.join(', ') : NO_VALUE}
      />
      {/* API 없음: `contactMethod`는 "오픈 채팅"처럼 수단 이름만 들어 있고 실제 주소가 없다
          (PRD 6.2 — 지어낸 목데이터에 남의 연락처를 넣지 않는다). 목업의 `카카오 오픈 채팅`
          자리에 링크가 걸리려면 연락 수단과 주소를 나눠 주는 필드가 실제 API에 있어야 한다. */}
      <InfoCell label="소통 방법" value={sideStudy.contactMethod} />
    </div>
  );
}
