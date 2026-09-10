import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Button, Callout, Card, CardTitle, DescriptionList, Field, Textarea } from '@ogonggo/ui';
import { useAnswerInquiry, useInquiryDetail } from '@/entities/inquiry/api/useInquiries';
import { PageHeader } from '@/widgets/page-header';
import { InquiryStatusBadge, inquiryCategoryLabel } from '@/shared/config/labels';
import { formatDateTime } from '@/shared/lib/format';

/**
 * 문의 상세와 답변 작성.
 *
 * 콘솔에서 쓰기가 일어나는 두 곳 중 하나다. 답변은 한 번 쓰면 수정만 되고 지워지지 않는다
 * (PRD "고객 지원 · 문의") — 그래서 빈 내용으로 저장하는 길을 막는다. 저장 버튼이 비활성이고,
 * 목 핸들러도 빈 답변을 400 으로 거절한다. 화면만 막으면 규칙이 화면에만 있게 된다.
 */
export function InquiryDetailPage() {
  const { inquiryId } = useParams();
  const id = Number(inquiryId);
  const { data, isPending, isError } = useInquiryDetail(id);
  const answerMutation = useAnswerInquiry(id);

  const [draft, setDraft] = useState('');

  // 불러온 답변을 편집 상자의 초기값으로 넣는다. 답변 전이면 빈 상자다.
  useEffect(() => {
    setDraft(data?.answer ?? '');
  }, [data?.answer]);

  if (isPending) {
    return <p className="text-sm text-gray-500">불러오는 중입니다.</p>;
  }

  if (isError || !data) {
    return (
      <>
        <PageHeader title="문의" backTo={{ to: '/support/inquiries', label: '문의 목록' }} />
        <Callout tone="error">문의를 찾을 수 없습니다.</Callout>
      </>
    );
  }

  const trimmed = draft.trim();
  const unchanged = trimmed === (data.answer ?? '').trim();

  return (
    <>
      <PageHeader title={data.title} backTo={{ to: '/support/inquiries', label: '문의 목록' }} />

      <Card>
        <CardTitle>문의 정보</CardTitle>
        <DescriptionList
          className="pt-4"
          columns={3}
          items={[
            { label: '작성자', value: data.authorName },
            { label: '이메일', value: data.authorEmail },
            { label: '분류', value: inquiryCategoryLabel(data.category) },
            { label: '처리 상태', value: <InquiryStatusBadge value={data.status} /> },
            { label: '접수일', value: formatDateTime(data.createdAt) },
            { label: '답변일', value: formatDateTime(data.answeredAt) },
          ]}
        />
      </Card>

      <Card className="mt-4">
        <CardTitle>문의 내용</CardTitle>
        <p className="whitespace-pre-wrap pt-4 text-sm text-gray-900">{data.content}</p>
      </Card>

      <Card className="mt-4">
        <CardTitle>{data.answer ? '답변 수정' : '답변 작성'}</CardTitle>

        {answerMutation.isSuccess ? (
          <Callout tone="success" className="mt-4">
            답변을 저장했습니다.
          </Callout>
        ) : null}

        {answerMutation.isError ? (
          <Callout tone="error" className="mt-4">
            저장하지 못했습니다. 내용을 확인하고 다시 시도해 주세요.
          </Callout>
        ) : null}

        <div className="pt-4">
          <Field
            label="답변 내용"
            htmlFor="answer"
            hint="저장한 답변은 지울 수 없고 수정만 됩니다."
            required
          >
            <Textarea
              id="answer"
              rows={8}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="문의에 대한 답변을 작성합니다."
            />
          </Field>

          <div className="flex gap-2">
            <Button
              onClick={() => answerMutation.mutate({ answer: trimmed })}
              disabled={trimmed.length === 0 || unchanged || answerMutation.isPending}
            >
              {answerMutation.isPending ? '저장 중' : '답변 저장'}
            </Button>
            {data.status !== 'IN_PROGRESS' && data.answer === undefined ? (
              <Button
                variant="secondary"
                onClick={() => answerMutation.mutate({ answer: trimmed, status: 'IN_PROGRESS' })}
                disabled={trimmed.length === 0 || answerMutation.isPending}
              >
                처리중으로 저장
              </Button>
            ) : null}
          </div>
        </div>
      </Card>
    </>
  );
}
