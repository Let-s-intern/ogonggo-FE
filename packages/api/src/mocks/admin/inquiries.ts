import { http, HttpResponse, type HttpHandler } from 'msw';
import {
  INQUIRY_FIXTURES,
  type InquiryDetail,
  type InquirySummary,
} from '../fixtures/admin-inquiry';
import { matches, notFound, ok, paginate, readPaging, type PageResponse } from './paging';

/**
 * 문의 핸들러.
 *
 * 콘솔에서 쓰기가 일어나는 두 곳 중 하나다(다른 하나는 공지사항). 답변을 받아 **모듈 안의
 * 배열을 실제로 고친다** — 요청을 받고 200 만 돌려주면 저장 후 목록으로 돌아왔을 때 상태가
 * 그대로라, 화면이 저장을 제대로 반영하는지 확인할 수 없다.
 *
 * 새로고침하면 되돌아간다. 브라우저 메모리에만 있기 때문이고, 그것으로 충분하다 — 목의 일은
 * 계약을 보여주는 것이지 데이터를 보관하는 것이 아니다.
 */

/**
 * 픽스처 배열을 그대로 쓴다. 복사본을 두면 대시보드의 미답변 수가 답변 뒤에도 줄지 않는다 —
 * `../fixtures/admin-inquiry.ts` 의 배열 주석에 이유가 적혀 있다.
 */
const inquiries = INQUIRY_FIXTURES;

const toSummary = ({
  content: _content,
  answer: _answer,
  answeredAt: _answeredAt,
  ...summary
}: InquiryDetail): InquirySummary => summary;

const listInquiriesHandler = http.get('*/api/v1/admin/inquiries', ({ request }) => {
  const url = new URL(request.url);
  const keyword = url.searchParams.get('keyword')?.trim() ?? '';
  const status = url.searchParams.get('status') ?? '';
  const category = url.searchParams.get('category') ?? '';
  const { page, size } = readPaging(url);

  const filtered = inquiries.filter((inquiry) => {
    if (keyword && !matches(`${inquiry.title} ${inquiry.authorName}`, keyword)) {
      return false;
    }
    // 대시보드가 넘기는 `status=unanswered` 는 접수와 처리중을 합한 것이다.
    if (status === 'unanswered' && inquiry.status === 'ANSWERED') {
      return false;
    }
    if (status && status !== 'unanswered' && inquiry.status !== status) {
      return false;
    }
    if (category && inquiry.category !== category) {
      return false;
    }
    return true;
  });

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const paged = paginate(sorted, page, size);
  const body: PageResponse<InquirySummary> = {
    items: paged.items.map(toSummary),
    pageInfo: paged.pageInfo,
  };
  return HttpResponse.json(ok(body), { status: 200 });
});

const getInquiryHandler = http.get('*/api/v1/admin/inquiries/:inquiryId', ({ params }) => {
  const inquiry = inquiries.find((fixture) => fixture.id === Number(params.inquiryId));
  if (!inquiry) {
    return HttpResponse.json(notFound('문의를 찾을 수 없습니다.'), { status: 404 });
  }
  return HttpResponse.json(ok(inquiry), { status: 200 });
});

interface AnswerInquiryRequest {
  answer: string;
  /** 답변만 저장하고 상태는 그대로 두고 싶을 때가 있어 따로 받는다. */
  status?: InquiryDetail['status'];
}

/**
 * 답변 저장. 지우는 길은 없다 — 한 번 쓴 답변은 수정만 된다(PRD "고객 지원 · 문의").
 *
 * 빈 문자열은 거절한다. 실수로 저장을 눌러 답변이 사라지는 것을 막는 유일한 장치다.
 */
const answerInquiryHandler = http.patch(
  '*/api/v1/admin/inquiries/:inquiryId',
  async ({ params, request }) => {
    const inquiry = inquiries.find((fixture) => fixture.id === Number(params.inquiryId));
    if (!inquiry) {
      return HttpResponse.json(notFound('문의를 찾을 수 없습니다.'), { status: 404 });
    }

    const body = (await request.json()) as AnswerInquiryRequest;
    const answer = body.answer?.trim() ?? '';
    if (answer.length === 0) {
      return HttpResponse.json(
        { status: 400, code: 'BAD_REQUEST', message: '답변 내용을 입력해 주세요.' },
        { status: 400 },
      );
    }

    inquiry.answer = answer;
    inquiry.answeredAt = new Date().toISOString();
    inquiry.status = body.status ?? 'ANSWERED';

    return HttpResponse.json(ok(inquiry), { status: 200 });
  },
);

export const inquiryHandlers: HttpHandler[] = [
  listInquiriesHandler,
  getInquiryHandler,
  answerInquiryHandler,
];
