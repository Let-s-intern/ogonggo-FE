import { http, HttpResponse } from 'msw';
import { JOB_SCENARIO_IDS } from './fixtures/job';
import { UserRecommendedLetsCareerContentResponseKind } from '../generated/user/models/userRecommendedLetsCareerContentResponseKind';
import type { SuccessResponseListUserRecommendedLetsCareerContentResponse } from '../generated/user/models/successResponseListUserRecommendedLetsCareerContentResponse';
import type { UserRecommendedLetsCareerContentResponse } from '../generated/user/models/userRecommendedLetsCareerContentResponse';

const THUMBNAIL_URL =
  'https://letsintern-bucket.s3.ap-northeast-2.amazonaws.com/images/work24/3e73c50619eb40de51e78fd8da445c1bb850fb2b.jpg';

/**
 * 공고마다 같은 세 개. 백엔드는 공고의 직군·직무와 요구 서류·전형으로 고르지만 목은 고르지 않는다.
 * 종류를 섞고, 설명이 없는 것(`null`)과 썸네일이 없는 것을 하나씩 둬서 항목의 빈 칸 처리를 볼 수 있게 한다.
 * `null` 은 생성 타입(`description?: string`)이 받지 않지만 백엔드는 실제로 `null` 을 준다.
 */
const RECOMMENDED_CONTENTS = [
  {
    kind: UserRecommendedLetsCareerContentResponseKind.CHALLENGE,
    letsCareerContentId: 101,
    title: '[인턴·실무 경험자 Ver.] 포트폴리오 2주 완성 챌린지 41기',
    description: '내 경험을 직무 언어로 정리하는 2주',
    thumbnailUrl: THUMBNAIL_URL,
    url: 'https://www.letscareer.co.kr/program/challenge/101',
    recruitmentStartAt: '2026-10-01T00:00:00',
    recruitmentEndAt: '2026-10-31T23:59:59',
  },
  {
    kind: UserRecommendedLetsCareerContentResponseKind.MATERIAL,
    letsCareerContentId: 7,
    title: '합격 자기소개서 문항별 예시 모음',
    description: null as unknown as string,
    thumbnailUrl: THUMBNAIL_URL,
    url: 'https://www.letscareer.co.kr/material/7',
  },
  {
    kind: UserRecommendedLetsCareerContentResponseKind.BLOG,
    letsCareerContentId: 32,
    title: '서류 합격률을 높이는 직무 경험 쓰는 법',
    description: '면접관이 이력서에서 먼저 보는 세 가지',
    url: 'https://www.letscareer.co.kr/blog/32',
  },
] satisfies UserRecommendedLetsCareerContentResponse[];

/** 렛츠커리어 콘텐츠를 아직 받지 못한 상태를 흉내 내는 공고. 빈 배열을 주고, 화면은 구역을 숨긴다. */
const EMPTY_RECOMMENDATION_JOB_ID = JOB_SCENARIO_IDS.noBodyFields;

/**
 * `GET /api/v1/jobs/{jobId}/recommended-lets-career-contents`. 로그인 없이 부르고 페이지 정보는 없다.
 *
 * `getJobHandler`의 경로 패턴(`/api/v1/jobs/:jobId`)은 한 마디만 잡아 이 경로와 겹치지 않지만,
 * `getTodayJobsHandler`처럼 `handlers` 배열에서 그보다 앞에 둔다.
 */
export const getJobRecommendedContentsHandler = http.get(
  '*/api/v1/jobs/:jobId/recommended-lets-career-contents',
  ({ params }) => {
    const data = Number(params.jobId) === EMPTY_RECOMMENDATION_JOB_ID ? [] : RECOMMENDED_CONTENTS;
    const body: SuccessResponseListUserRecommendedLetsCareerContentResponse = {
      status: 200,
      message: '공고 맞춤 렛츠커리어 콘텐츠를 조회했습니다.',
      data,
    };
    return HttpResponse.json(body, { status: 200 });
  },
);
