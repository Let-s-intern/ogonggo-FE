import { http, HttpResponse, type HttpHandler } from 'msw';
import { JOB_FIXTURES } from './fixtures/job';
import { OGONGGO_SIDE_BANNERS, mockBannerAt } from './fixtures/ogonggo-banners';

/**
 * 공고 상세의 배너 자리 둘(PC 사이드, MO 본문 중간). 상품 시안에 없는 자리라 구좌 키가 공용 목
 * (`fixtures/advertisement-types.ts` 의 `AdPlacementKey`)에 없다(PRD `결정 필요` 10). web 이 먼저 그려 보려고 키 둘을
 * 가칭으로 두고 여기서만 받는다. 요청서: `.claude/tasks/memos/백엔드-요청-광고-시스템-web.md` 2.
 *
 * 같은 경로(`/api/v1/advertisements/exposures`)를 공용 목과 나눠 쓴다. 이 두 키가 아니면 손대지 않고 다음 핸들러
 * (`advertisements.ts`)로 넘긴다. 그래서 `handlers.ts` 에서 공용 광고 핸들러보다 앞에 둔다.
 */
const DETAIL_BANNER_KEYS = ['DETAIL_SIDE_BANNER_RECRUIT', 'DETAIL_MO_BANNER_RECRUIT'] as const;

const getDetailBannerHandler = http.get('*/api/v1/advertisements/exposures', ({ request }) => {
  const placementKey = new URL(request.url).searchParams.get('placementKey');
  const index = DETAIL_BANNER_KEYS.indexOf(placementKey as (typeof DETAIL_BANNER_KEYS)[number]);
  if (index < 0) {
    // 아무것도 돌려주지 않으면 MSW 가 다음 핸들러로 넘긴다(`passthrough()` 는 실서버로 보내 버린다).
    return undefined;
  }
  const job = JOB_FIXTURES[index + 5] ?? JOB_FIXTURES[0];
  if (!job) {
    return HttpResponse.json({ status: 200, message: '요청이 성공했습니다.', data: [] });
  }
  return HttpResponse.json({
    status: 200,
    message: '요청이 성공했습니다.',
    data: [
      {
        itemId: 9800 + index,
        placementKey,
        displayOrder: 1,
        target: 'JOB',
        postId: job.id,
        postTitle: job.title,
        companyName: job.companyName,
        companyLogoUrl: job.logoUrl,
        skillTags: [],
        // 사이드 자리는 4:5 라 세로 소재를, MO 본문 자리는 가로 배너를 준다.
        bannerImageUrlPc: index === 0 ? OGONGGO_SIDE_BANNERS[0] : mockBannerAt(1).pc,
        bannerImageUrlMo: index === 0 ? OGONGGO_SIDE_BANNERS[0] : mockBannerAt(1).mo,
      },
    ],
  });
});

export const detailAdBannerHandlers: HttpHandler[] = [getDetailBannerHandler];
