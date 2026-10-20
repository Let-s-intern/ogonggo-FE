'use client';

import { enumLabel, enumOptions } from '@ogonggo/api';
import { EMPLOYMENT_TYPE_FILTER_OPTIONS } from '@/entities/job/model/labels';
import {
  stagesOf,
  type ApplicationBoardTab,
  type ApplicationStageId,
} from '@/features/application-board';
import { SortToggle } from '@/shared/ui/SortToggle';
import { MyPageFilterDropdown, MyPageFilterRow } from '@/widgets/mypage-list';
import {
  buildApplicationBoardHref,
  buildApplicationBoardResetHref,
  hasApplicationBoardFilter,
  type ApplicationBoardQuery,
} from '../lib/query';
import { ApplicationBoardViewToggle } from './ApplicationBoardViewToggle';

/**
 * `마감 상태` 드롭다운. 세 탭이 같은 두 값을 보낸다(부트캠프만 파라미터 이름이 `status` 다). 라벨은
 * 탭마다 그 콘텐츠의 모집 상태 enum 이라 문구가 조금씩 다르다. 부트캠프의 `DRAFT`(임시저장)는
 * 공개된 것만 스크랩할 수 있어 두지 않는다.
 */
const RECRUITMENT_STATUS_ENUMS = {
  jobs: 'JobRecruitmentStatus',
  bootcamps: 'BootcampRecruitmentStatus',
  'side-studies': 'RecruitmentPostRecruitmentStatus',
} as const satisfies Record<ApplicationBoardTab, string>;

function recruitmentStatusOptions(tab: ApplicationBoardTab) {
  return (['RECRUITING', 'CLOSED'] as const).map(
    (value) => [value, enumLabel(RECRUITMENT_STATUS_ENUMS[tab], value)] as const,
  );
}

/** `고용 형태` 드롭다운. 채용공고 목록 필터와 같은 라벨 맵에서 만든다. */
const EMPLOYMENT_TYPE_OPTIONS = EMPLOYMENT_TYPE_FILTER_OPTIONS;

/**
 * `최근 저장순` 하나뿐이다. `BookmarkSortType` 에 값이 이것 하나라 고를 것이 없고, v4 의 정렬
 * 드롭다운도 같은 처지였다(PRD "필터 줄"). 값이 늘면 카탈로그를 따라 줄이 는다.
 */
const SORT_OPTIONS = enumOptions('BookmarkSortType');

export interface ApplicationBoardFilterRowProps {
  query: ApplicationBoardQuery;
}

/**
 * 칸반 위 필터 한 줄(목업 `docs/asset/v7 스크랩한 공고 칸반/image.png`).
 * `전체` 칩 + `마감 상태` · `지원 상태`, 오른쪽에 `공고 검색` + `최근 저장순` 이다. 채용공고 탭에는
 * `고용 형태` 가 더 붙는다 — 미래내일 일경험처럼 고용24 공고를 골라 보려는 것이다.
 *
 * 줄 자체는 v4 가 만든 `MyPageFilterRow` 다 — 목업의 구성이 v4 필터 줄과 같고, 검색이
 * `<form method="GET">` 이 아니라 `onSubmit` 이어야 하는 이유도 같다(로그인 토큰을 브라우저에서
 * 읽는 화면이라 전체 새로고침이 계정 조회를 매 검색마다 다시 돌린다).
 *
 * **`공고 검색` 은 살아 있다.** task 파일은 비활성으로 두라고 적었지만 세 목록 파라미터 모두에
 * `keyword` 가 있고 v4 스크랩 화면이 이미 보내고 있다(Push 1 이 확인).
 *
 * **`지원 상태` 만 요청이 아니다.** 단계는 칸 자체라 이미 칸마다 요청이 갈라져 있어, 고르면
 * 그 칸만 남긴다. 오른쪽 끝의 보기 전환은 `MyPageFilterRow` 의 `trailing` 자리에 온다.
 */
export function ApplicationBoardFilterRow({ query }: ApplicationBoardFilterRowProps) {
  const stageOptions = stagesOf(query.tab).map(
    (stage) => [stage.id, stage.label] as readonly [ApplicationStageId, string],
  );

  return (
    <MyPageFilterRow
      resetHref={buildApplicationBoardResetHref(query)}
      filtered={hasApplicationBoardFilter(query)}
      search={{
        placeholder: '공고 검색',
        defaultValue: query.keyword,
        buildHref: (keyword) => buildApplicationBoardHref(query, { keyword }),
      }}
      sort={
        <SortToggle
          options={SORT_OPTIONS}
          current="RECENTLY_SAVED"
          buildHref={() => buildApplicationBoardHref(query)}
        />
      }
      trailing={<ApplicationBoardViewToggle query={query} />}
    >
      <MyPageFilterDropdown
        label="마감 상태"
        selected={query.recruitmentStatus}
        options={recruitmentStatusOptions(query.tab)}
        buildHref={(recruitmentStatus) => buildApplicationBoardHref(query, { recruitmentStatus })}
      />
      <MyPageFilterDropdown
        label="지원 상태"
        selected={query.stage}
        options={stageOptions}
        buildHref={(stage) => buildApplicationBoardHref(query, { stage })}
        className="w-52"
      />
      {query.tab === 'jobs' ? (
        <MyPageFilterDropdown
          label="고용 형태"
          selected={query.employmentType}
          options={EMPLOYMENT_TYPE_OPTIONS}
          buildHref={(employmentType) => buildApplicationBoardHref(query, { employmentType })}
        />
      ) : null}
    </MyPageFilterRow>
  );
}
