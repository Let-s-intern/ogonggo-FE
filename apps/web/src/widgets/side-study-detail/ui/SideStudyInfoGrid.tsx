import type { ReactNode } from 'react';
import {
  CONTACT_METHOD_LABELS,
  OPERATION_TYPE_LABELS,
  POSITION_LABELS,
} from '@/entities/side-study/model/labels';
import type { SideStudyDetail } from '@/entities/side-study/model/types';
import { parseLocalDate } from '@/shared/lib/localDate';

export interface SideStudyInfoGridProps {
  sideStudy: SideStudyDetail;
}

const NO_VALUE = '정보 없음';
const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

/** 목업의 `2026/6/1 (월)` 형식. 날짜만 온 값이라 시간대 없이 읽는다(`shared/lib/localDate.ts`). */
function formatDate(value: string): string {
  const date = parseLocalDate(value);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} (${WEEKDAY_LABELS[date.getDay()]})`;
}

function InfoCell({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-gray-500">{label}</p>
      <div className="text-sm font-semibold text-gray-900">{value}</div>
    </div>
  );
}

/**
 * 소통 방법 칸 — 수단 이름(`이메일`·`카카오톡 오픈채팅`)만 보인다. 실제 주소는 `신청하러 가기`를
 * 누른 회원에게만 보여 준다(`SideStudyContactButton`).
 */
function ContactValue({ contact }: { contact: SideStudyDetail['contact'] }) {
  return <p>{CONTACT_METHOD_LABELS[contact.method]}</p>;
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
 * 값이 없는 칸은 빈 칸으로 새지 않고 "정보 없음"이 들어간다(PRD 9절 4번). 모집글 응답은
 * 기술 스택·포지션만 빈 배열일 수 있고 나머지는 필수다.
 */
export function SideStudyInfoGrid({ sideStudy }: SideStudyInfoGridProps) {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <InfoCell label="진행 방식" value={OPERATION_TYPE_LABELS[sideStudy.progressMethod]} />
      {/* 정원만 적는다. 목록 카드 배지는 `지원 수/정원` 이지만 상세 응답에는 지원 수가 없다
          (PRD Push 5 "사용자 결정" — 백엔드에 필드를 요청하지 않는다). */}
      <InfoCell label="모집 인원" value={`${sideStudy.capacity}명`} />
      <InfoCell
        label="기술 스택"
        value={
          sideStudy.technologyStacks.length > 0 ? sideStudy.technologyStacks.join(', ') : NO_VALUE
        }
        className="col-span-2"
      />
      <InfoCell label="모집 시작일" value={formatDate(sideStudy.recruitmentStartDate)} />
      <InfoCell label="모집 마감일" value={formatDate(sideStudy.recruitmentEndDate)} />
      <InfoCell
        label="모집 포지션"
        value={
          sideStudy.positions.length > 0
            ? sideStudy.positions.map((position) => POSITION_LABELS[position]).join(', ')
            : NO_VALUE
        }
      />
      <InfoCell label="지원 및 소통 방법" value={<ContactValue contact={sideStudy.contact} />} />
    </div>
  );
}
