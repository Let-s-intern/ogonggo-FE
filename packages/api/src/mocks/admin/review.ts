import { http, HttpResponse, type HttpHandler } from 'msw';
import {
  ADMIN_BOOTCAMP_FIXTURES,
  ADMIN_JOB_FIXTURES,
  type AdminBootcampDetail,
  type AdminJobDetail,
} from '../fixtures/admin-content';
import { clearRejection, recordRejection } from '../fixtures/admin-rejection';
import { notFound, ok } from './paging';

/**
 * 검수 대기 큐.
 *
 * 비즈니스 회원이 올린 채용공고와 부트캠프만 대상이다. 크롤러가 수집한 것은 우리가 고른
 * 사이트에서 긁어온 것이라 한 건씩 통과시킬 대상이 아니다.
 *
 * 화면이 종류를 구분하지 않도록 여기서 미리 평평하게 만든다. 채용공고는 본문 칸이 일곱 개고
 * 부트캠프는 소개와 커리큘럼인데, 검수하는 사람이 보는 것은 "제목·회사·본문·원문"으로 같다.
 * 화면이 `type === 'JOB'` 으로 갈라지기 시작하면 키보드 흐름이 종류마다 어긋난다.
 *
 * 큐는 등록일 오래된 순이다. 밀린 것부터 처리하는 것이 큐의 뜻이고, 최신순이면 오래된 건이
 * 영영 아래에 남는다.
 */

export type ReviewTargetType = 'JOB' | 'BOOTCAMP';

/** 검수 화면이 그리는 본문 한 덩어리. */
export interface ReviewSection {
  /** 콘텐츠의 실제 칸 이름. 검수 화면에서 본문을 고칠 때 이 이름으로 되돌려 보낸다. */
  field: string;
  label: string;
  body: string;
}

/** 본문 위에 표로 붙는 값들. */
export interface ReviewMetaItem {
  label: string;
  value: string;
}

export interface ReviewQueueItem {
  type: ReviewTargetType;
  id: number;
  title: string;
  companyName: string;
  /** ISO 8601. */
  registeredAt: string;
  sourceUrl?: string;
  meta: ReviewMetaItem[];
  sections: ReviewSection[];
}

export interface ReviewDecisionRequest {
  decision: 'APPROVED' | 'REJECTED';
  /** 반려일 때만 쓰인다. 비어 있으면 400. */
  reason?: string;
}

/**
 * 메타 값은 여기서 한국어로 풀어 내보낸다.
 *
 * 화면이 아니라 목이 푸는 이유는, 검수 화면이 `meta` 를 종류 구분 없이 그대로 그리기
 * 때문이다. 화면에서 풀려면 어떤 칸이 enum 이고 어떤 칸이 이미 평문인지 알아야 하고, 그러면
 * 종류별 분기가 다시 생긴다. 백엔드가 이 API 를 만들 때도 같은 이유로 서버가 푸는 편이 낫다.
 */
const VALUE_LABELS: Record<string, string> = {
  FULL_TIME: '정규직',
  CONTRACT: '계약직',
  INTERN: '인턴',
  PART_TIME: '파트타임',
  ETC: '기타',
  ONLINE: '온라인',
  OFFLINE: '오프라인',
  HYBRID: '온·오프라인',
  FREE: '무료',
  PAID: '유료',
  GOVERNMENT_FUNDED: '국비지원',
};

const label = (value: string): string => VALUE_LABELS[value] ?? value;

function toJobItem(job: AdminJobDetail): ReviewQueueItem {
  const sections: ReviewSection[] = [
    {
      field: 'companyAndTeamIntroduction',
      label: '회사·팀 소개',
      body: job.companyAndTeamIntroduction,
    },
    { field: 'responsibilities', label: '주요 업무', body: job.responsibilities },
    { field: 'qualifications', label: '자격 요건', body: job.qualifications },
    { field: 'preferredQualifications', label: '우대 사항', body: job.preferredQualifications },
    { field: 'compensation', label: '보상', body: job.compensation },
    { field: 'benefits', label: '복지', body: job.benefits },
    { field: 'hiringProcess', label: '채용 절차', body: job.hiringProcess },
  ].filter((section): section is ReviewSection => Boolean(section.body));

  return {
    type: 'JOB',
    id: job.id,
    title: job.title,
    companyName: job.companyName,
    registeredAt: job.registeredAt,
    sourceUrl: job.sourceUrl,
    meta: [
      { label: '고용 형태', value: label(job.employmentType) },
      { label: '지역', value: job.region ?? '-' },
      { label: '모집 마감', value: job.recruitmentEndAt?.slice(0, 10) ?? '상시' },
    ],
    sections,
  };
}

function toBootcampItem(bootcamp: AdminBootcampDetail): ReviewQueueItem {
  const sections: ReviewSection[] = [
    { field: 'content', label: '소개', body: bootcamp.content },
    {
      field: 'eligibilityAndSelectionProcess',
      label: '지원 자격과 선발 절차',
      body: bootcamp.eligibilityAndSelectionProcess,
    },
    {
      // 커리큘럼은 구조가 있는 값이라 여기서 고치지 않는다. 읽기만 한다.
      field: '',
      label: '커리큘럼',
      body: bootcamp.curriculums
        .map((item) =>
          item.startWeek === item.endWeek
            ? `${item.startWeek}주차 · ${item.subtitle}`
            : `${item.startWeek}-${item.endWeek}주차 · ${item.subtitle}`,
        )
        .join('\n'),
    },
  ].filter((section): section is ReviewSection => Boolean(section.body));

  return {
    type: 'BOOTCAMP',
    id: bootcamp.id,
    title: bootcamp.title,
    companyName: bootcamp.companyName,
    registeredAt: bootcamp.registeredAt,
    sourceUrl: bootcamp.applicationUrl ?? bootcamp.sourceUrl,
    meta: [
      { label: '프로그램 유형', value: bootcamp.programType },
      { label: '진행 방식', value: label(bootcamp.operationType) },
      { label: '수강료', value: label(bootcamp.tuitionType) },
    ],
    sections,
  };
}

/** 지금 대기 중인 것만. 처리하면 다음 요청에서 사라진다. */
function pendingQueue(): ReviewQueueItem[] {
  const jobs = ADMIN_JOB_FIXTURES.filter((job) => job.reviewStatus === 'PENDING').map(toJobItem);
  const bootcamps = ADMIN_BOOTCAMP_FIXTURES.filter(
    (bootcamp) => bootcamp.reviewStatus === 'PENDING',
  ).map(toBootcampItem);

  return [...jobs, ...bootcamps].sort(
    (a, b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime(),
  );
}

const listQueueHandler = http.get('*/api/v1/admin/review-queue', () =>
  HttpResponse.json(ok(pendingQueue()), { status: 200 }),
);

/**
 * 한 건을 통과시키거나 반려한다.
 *
 * 반려에는 사유를 반드시 받는다. 사유 없는 반려는 올린 사람이 무엇을 고쳐야 하는지 알 수 없어
 * 같은 글이 다시 올라온다. 화면에서도 막지만 여기서도 400 으로 거절한다 — 화면만 막으면 규칙이
 * 화면에만 있게 된다.
 *
 * 사유는 `fixtures/admin-rejection.ts` 에 기록되고 반려 보관 화면이 그것을 읽는다. 올린 회원에게
 * 실제로 알림이 가는 경로는 백엔드가 정할 일이라 여기서 지어내지 않는다.
 */
const decideHandler = http.patch(
  '*/api/v1/admin/review-queue/:type/:id',
  async ({ params, request }) => {
    const type = String(params.type).toUpperCase() as ReviewTargetType;
    const id = Number(params.id);

    const target =
      type === 'JOB'
        ? ADMIN_JOB_FIXTURES.find((job) => job.id === id)
        : ADMIN_BOOTCAMP_FIXTURES.find((bootcamp) => bootcamp.id === id);

    if (!target || (type !== 'JOB' && type !== 'BOOTCAMP')) {
      return HttpResponse.json(notFound('검수 대상을 찾을 수 없습니다.'), { status: 404 });
    }

    const body = (await request.json()) as ReviewDecisionRequest;

    if (body.decision === 'REJECTED') {
      const reason = body.reason?.trim() ?? '';
      if (reason.length === 0) {
        return HttpResponse.json(
          { status: 400, code: 'BAD_REQUEST', message: '반려 사유를 입력해 주세요.' },
          { status: 400 },
        );
      }
      recordRejection({
        type,
        id,
        title: target.title,
        companyName: target.companyName,
        reason,
      });
      target.reviewStatus = 'REJECTED';
    } else {
      clearRejection(type, id);
      target.reviewStatus = 'APPROVED';
    }

    return HttpResponse.json(
      ok({ type, id, reviewStatus: target.reviewStatus, remaining: pendingQueue().length }),
      { status: 200 },
    );
  },
);

/**
 * 방금 내린 판정을 되돌린다.
 *
 * 키 하나로 통과되는 화면이라 잘못 누르는 일이 실제로 일어난다. 되돌릴 길이 없으면 운영자는
 * 매 건 손을 멈추고 확인하게 되고, 그러면 키보드 흐름을 만든 이유가 사라진다.
 */
const undoHandler = http.patch('*/api/v1/admin/review-queue/:type/:id/undo', ({ params }) => {
  const type = String(params.type).toUpperCase() as ReviewTargetType;
  const id = Number(params.id);
  const target =
    type === 'JOB'
      ? ADMIN_JOB_FIXTURES.find((job) => job.id === id)
      : ADMIN_BOOTCAMP_FIXTURES.find((bootcamp) => bootcamp.id === id);

  if (!target) {
    return HttpResponse.json(notFound('검수 대상을 찾을 수 없습니다.'), { status: 404 });
  }

  clearRejection(type, id);
  target.reviewStatus = 'PENDING';

  return HttpResponse.json(ok({ type, id, remaining: pendingQueue().length }), { status: 200 });
});

export const reviewHandlers: HttpHandler[] = [
  // `/undo` 가 `:id` 뒤에 붙어 더 긴 경로라 먼저 등록한다.
  undoHandler,
  decideHandler,
  listQueueHandler,
];
