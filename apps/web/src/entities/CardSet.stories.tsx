import type { Meta, StoryObj } from '@storybook/react';
import { BootcampCard } from './bootcamp/ui/BootcampCard';
import { BOOTCAMP_MOCK, JOB_MOCK, SIDE_STUDY_MOCK } from './card-mocks';
import { JobCard } from './job/ui/JobCard';
import { SideStudyCard } from './side-study/ui/SideStudyCard';

/**
 * 카드 세 종류를 한 행에 나란히 놓는다. 세 카드의 주석이 "글자 크기는 서로 같다" 를 주장하는데
 * (`entities/job/ui/JobCard.tsx`, `entities/bootcamp/ui/BootcampCard.tsx`,
 * `entities/side-study/ui/SideStudyCard.tsx`), 셋을 한 화면에서 볼 수 없어 아무도 확인한 적이
 * 없다. 이 스토리가 그 확인 자리다.
 *
 * 그리드는 세 목록 화면이 실제로 쓰는 것 그대로다 —
 * `max-w-6xl px-4` 안의 `grid grid-cols-4 gap-x-4 gap-y-8`(`widgets/job-list/ui/JobList.tsx`,
 * `widgets/bootcamp-list/ui/BootcampList.tsx`, `widgets/side-study-list/ui/SideStudyList.tsx`).
 * 카드 한 장의 폭은 268px 가 된다. 폭을 임의로 잡으면 제목 줄바꿈이 달라져 높이 비교가
 * 거짓말이 된다.
 *
 * 한 곳만 실제 목록과 다르다 — `items-start` 를 더했다. 실제 그리드는 기본값(`stretch`)이라
 * 같은 행의 칸이 전부 가장 높은 카드만큼 늘어나서, 그 상태로 재면 세 카드가 원래 얼마나
 * 높은지를 알 수 없다. 같은 행에 놓았을 때 어떻게 보이는지는 `카드 경계/같은 행` 에 있다.
 *
 * 실측 (2026-09-21, 헤드리스 크롬 1400x1000, `getComputedStyle` + `getBoundingClientRect`):
 *
 * | 항목 | JobCard | BootcampCard | SideStudyCard |
 * |---|---|---|---|
 * | 카드 폭 | 268px | 268px | 268px |
 * | 제목 글자 | 14px / 700 / 20px | 14px / 700 / 20px | 14px / 700 / 20px |
 * | 메타 줄 글자 | 12px / 400 | 12px / 400 | 12px / 400 |
 * | 회사·닉네임 줄 글자 | 14px / 400 | 14px / 400 | 14px / 400 |
 * | 안쪽 여백 | 0 | 0 | 16px |
 * | 요소 사이 간격 | 8px | 8px | 12px |
 * | 테두리 | 없음 | 없음 | 1px rgb(243,244,246) |
 * | 모서리 | 0 (썸네일만 8px) | 0 (썸네일만 8px) | 16px |
 * | 배지 높이 | 20px | 20px | 24px |
 * | 카드 높이 | 251.5px | 251.5px | 198px |
 *
 * 글자 크기는 세 주석의 주장대로 셋이 정확히 같다. 같지 않은 것은 글자가 아니라 상자다 —
 * 안쪽 여백, 요소 간격, 배지 높이, 그리고 카드 높이. 고치지 않는다(이 PRD 의 비목표).
 * 무엇이 왜 다른지는 `.claude/tasks/todo/tasks-design-system-push6.md` 의 6.3.V 에 적었다.
 */
const meta: Meta = {
  title: '카드 셋/셋 나란히',
  parameters: { layout: 'fullscreen' },
};
export default meta;

export const SideBySide: StoryObj = {
  render: () => (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <ul className="grid grid-cols-4 items-start gap-x-4 gap-y-8">
        <li data-card="job">
          <JobCard job={JOB_MOCK} />
        </li>
        <li data-card="bootcamp">
          <BootcampCard bootcamp={BOOTCAMP_MOCK} />
        </li>
        <li data-card="side-study">
          <SideStudyCard sideStudy={SIDE_STUDY_MOCK} />
        </li>
      </ul>
    </div>
  ),
};
