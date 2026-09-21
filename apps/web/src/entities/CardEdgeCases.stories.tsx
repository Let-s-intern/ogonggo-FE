import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { BootcampCard } from './bootcamp/ui/BootcampCard';
import { BOOTCAMP_MOCK, JOB_MOCK, SIDE_STUDY_MOCK } from './card-mocks';
import { JobCard } from './job/ui/JobCard';
import { SideStudyCard } from './side-study/ui/SideStudyCard';

/**
 * 카드가 실제 목록에서 만나는 경계 상태들. 목데이터 한 벌로 잘 나오는 그림은 아무것도
 * 증명하지 않는다 — 제목 길이, 빠진 이미지, 마감, 북마크가 카드를 어떻게 흔드는지가 이 화면이
 * 답할 것이다.
 *
 * 모든 행은 세 목록 화면이 실제로 쓰는 그리드 그대로다
 * (`max-w-6xl px-4` 안의 `grid grid-cols-4 gap-x-4 gap-y-8`, 카드 폭 268px). `items-start` 를
 * 더하지 않는다 — 기본값 `stretch` 가 실제 동작이고, 이 화면이 보려는 것이 바로 그 동작이다.
 *
 * 실측 (2026-09-21, 헤드리스 크롬, 행마다 세 카드의 아랫변을 비교):
 *
 * | 행 | 칸 높이 | 실제로 그려진 높이 | 아랫변 |
 * |---|---|---|---|
 * | 제목 한 줄 | 251.5px | 251.5 / 251.5 / 251.5 | 일치 |
 * | 제목 두 줄 | 271.5px | 271.5 / 271.5 / 271.5 | 일치 |
 * | 한 줄과 두 줄이 같은 행에 | 271.5px | 271.5 / 271.5 / 271.5 | 일치 |
 * | 썸네일 있음 | 251.5px | 251.5 / 251.5 / 251.5 | 일치 |
 * | 썸네일 없음 | 251.5px | 251.5 / 251.5 / 251.5 | 일치 |
 * | 마감된 글 | 251.5px | 251.5 / 251.5 / 251.5 | 일치 |
 * | 북마크 꺼짐·켜짐 | 251.5px | 251.5 / 251.5 / 251.5 | 일치 |
 *
 * 이 화면이 처음 찾아낸 어긋남은 둘이었고 둘 다 `JobCard` 였다. 하나는 `h-full` 이 없어 칸을
 * 채우지 않은 것(한 줄·두 줄이 섞인 행에서 20px), 하나는 마감된 공고에서 D-day 배지가 통째로
 * 사라져 메타 줄이 20px 에서 16px 이 된 것(4px)이다. 둘 다
 * `prd-design-system-followup.md` 3 절에서 고쳤다 — `JobCard` 와 `BootcampCard` 에 `h-full` 을
 * 주고, 마감된 공고는 그 자리에 회색 `마감` 배지를 그린다.
 */
const meta: Meta = {
  title: '카드 경계/상태',
  parameters: { layout: 'fullscreen' },
};
export default meta;

/** 실제 목록의 4열 그리드 한 행. */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-6">
      <p className="mb-3 text-xs font-bold text-gray-500">{label}</p>
      <ul data-row={label} className="grid grid-cols-4 gap-x-4 gap-y-8">
        {children}
      </ul>
    </section>
  );
}

const ONE_LINE = '한 줄 제목';
const TWO_LINES = '두 줄로 넘어갈 만큼 긴 제목을 가진 공고 카드의 경계 상태 확인용 문구';

/**
 * 제목이 한 줄일 때와 두 줄일 때. 셋 다 `line-clamp-2` 라 세 줄로는 넘어가지 않는다.
 * 같은 행에 섞어 놓아서 한 줄짜리 카드의 아래가 어떻게 되는지 같이 본다.
 */
export const TitleOneLineVsTwo: StoryObj = {
  name: '제목 한 줄 / 두 줄',
  render: () => (
    <>
      <Row label="제목 한 줄">
        <li data-card="job">
          <JobCard job={{ ...JOB_MOCK, title: ONE_LINE }} />
        </li>
        <li data-card="bootcamp">
          <BootcampCard bootcamp={{ ...BOOTCAMP_MOCK, title: ONE_LINE }} />
        </li>
        <li data-card="side-study">
          <SideStudyCard sideStudy={{ ...SIDE_STUDY_MOCK, title: ONE_LINE }} />
        </li>
      </Row>
      <Row label="제목 두 줄">
        <li data-card="job">
          <JobCard job={{ ...JOB_MOCK, title: TWO_LINES }} />
        </li>
        <li data-card="bootcamp">
          <BootcampCard bootcamp={{ ...BOOTCAMP_MOCK, title: TWO_LINES }} />
        </li>
        <li data-card="side-study">
          <SideStudyCard sideStudy={{ ...SIDE_STUDY_MOCK, title: TWO_LINES }} />
        </li>
      </Row>
      <Row label="한 줄과 두 줄이 같은 행에">
        <li data-card="job">
          <JobCard job={{ ...JOB_MOCK, title: ONE_LINE }} />
        </li>
        <li data-card="bootcamp">
          <BootcampCard bootcamp={{ ...BOOTCAMP_MOCK, title: TWO_LINES }} />
        </li>
        <li data-card="side-study">
          <SideStudyCard sideStudy={{ ...SIDE_STUDY_MOCK, title: ONE_LINE }} />
        </li>
      </Row>
    </>
  ),
};

/**
 * 썸네일이 있을 때와 없을 때. 셋이 서로 다르게 떨어진다 —
 * `JobCard` 는 `CompanyLogo` 가 회사 로고를 모르면 기본 썸네일로,
 * `BootcampCard` 는 `representativeImageUrl` 이 비면 `Thumbnail` 이 기본 이미지로,
 * `SideStudyCard` 는 `AuthorThumbnail` 이 일부러 회색 사각형만 남긴다
 * ("원래 없다" 가 흔한 선택 필드라서다 — 컴포넌트 주석 참고).
 *
 * `JobCard` 의 로고는 크롤러가 실제로 수집한 회사만 있다
 * (`entities/job/model/company-logo.ts`). 윗줄의 `롯데컬처웍스` 는 그 목록에 있고, 목데이터의
 * `넥스트웨이브` 는 없다 — 그래서 다른 스토리의 채용공고 카드는 늘 기본 썸네일로 보인다.
 */
export const NoThumbnail: StoryObj = {
  name: '썸네일 있음 / 없음',
  render: () => (
    <>
      <Row label="썸네일 있음">
        <li data-card="job">
          <JobCard job={{ ...JOB_MOCK, companyName: '롯데컬처웍스' }} />
        </li>
        <li data-card="bootcamp">
          <BootcampCard
            bootcamp={{ ...BOOTCAMP_MOCK, representativeImageUrl: '/default-thumbnail.jpg' }}
          />
        </li>
        <li data-card="side-study">
          <SideStudyCard
            sideStudy={{
              ...SIDE_STUDY_MOCK,
              author: { userId: 1, nickname: '오공고', profileImageUrl: '/default-thumbnail.jpg' },
            }}
          />
        </li>
      </Row>
      <Row label="썸네일 없음">
        <li data-card="job">
          <JobCard job={{ ...JOB_MOCK, companyName: '로고가 없는 회사' }} />
        </li>
        <li data-card="bootcamp">
          <BootcampCard bootcamp={{ ...BOOTCAMP_MOCK, representativeImageUrl: '' }} />
        </li>
        <li data-card="side-study">
          <SideStudyCard
            sideStudy={{ ...SIDE_STUDY_MOCK, author: { userId: 1, nickname: '오공고' } }}
          />
        </li>
      </Row>
    </>
  ),
};

/**
 * 마감된 글. 셋 다 회색 `마감` 배지다. `JobCard` 는 D-day 자리(지난 마감에 D-day 를 그리지
 * 않는다)에, `SideStudyCard` 는 제목 아래 자기 줄에 그린다.
 */
export const Closed: StoryObj = {
  name: '마감된 글',
  render: () => (
    <Row label="마감된 글">
      <li data-card="job">
        <JobCard
          job={{
            ...JOB_MOCK,
            recruitmentEndAt: '2026-01-01T23:59:00Z',
            closedAt: '2026-01-02T00:00:00Z',
          }}
        />
      </li>
      <li data-card="bootcamp">
        <BootcampCard bootcamp={{ ...BOOTCAMP_MOCK, status: 'CLOSED' }} />
      </li>
      <li data-card="side-study">
        <SideStudyCard sideStudy={{ ...SIDE_STUDY_MOCK, recruitmentStatus: 'CLOSED' }} />
      </li>
    </Row>
  ),
};

/**
 * 북마크 켜짐·꺼짐. 표시 전용이라 눌러도 바뀌지 않는다(PRD 8 절).
 *
 * `BootcampCard` 는 두 행이 같다 — `UserBootcampSummaryResponse` 에 북마크 여부 필드가 아예
 * 없어서 아이콘이 항상 빈 모양이다(컴포넌트 주석의 "API 없음").
 */
export const Bookmark: StoryObj = {
  name: '북마크 켜짐 / 꺼짐',
  render: () => (
    <>
      <Row label="북마크 꺼짐">
        <li data-card="job">
          <JobCard job={{ ...JOB_MOCK, bookmarked: false }} />
        </li>
        <li data-card="bootcamp">
          <BootcampCard bootcamp={BOOTCAMP_MOCK} />
        </li>
        <li data-card="side-study">
          <SideStudyCard sideStudy={{ ...SIDE_STUDY_MOCK, bookmarked: false }} />
        </li>
      </Row>
      <Row label="북마크 켜짐">
        <li data-card="job">
          <JobCard job={{ ...JOB_MOCK, bookmarked: true }} />
        </li>
        <li data-card="bootcamp">
          <BootcampCard bootcamp={BOOTCAMP_MOCK} />
        </li>
        <li data-card="side-study">
          <SideStudyCard sideStudy={{ ...SIDE_STUDY_MOCK, bookmarked: true }} />
        </li>
      </Row>
    </>
  ),
};
