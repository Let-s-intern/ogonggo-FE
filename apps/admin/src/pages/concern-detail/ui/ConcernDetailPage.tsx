import { useParams } from 'react-router';
import { Badge, Callout, Card, CardTitle, DescriptionList, Toggle } from '@ogonggo/ui';
import { useChangeVisibilities, useConcernDetail } from '@/entities/content/api/useContent';
import { PageHeader } from '@/widgets/page-header';
import { concernCategoryLabel } from '@/shared/config/labels';
import { formatCount, formatDateTime } from '@/shared/lib/format';

const BACK_TO = { to: '/content/concerns', label: '취준고민 목록' };

/**
 * 취준고민 고민글 상세(`GET /api/v1/admin/concerns/{concernId}`).
 *
 * 운영자가 바꿀 수 있는 것은 노출 하나다. 건별 수정 API 가 없어 목록과 같이 일괄 변경 API 에 id
 * 하나를 실어 보낸다. 답변은 어드민 API 가 아직 주지 않아 수만 보인다.
 */
export function ConcernDetailPage() {
  const { concernId } = useParams();
  const { data, isPending, isError } = useConcernDetail(Number(concernId));
  const mutation = useChangeVisibilities('concerns');

  if (isPending) {
    return <p className="text-sm text-gray-500">불러오는 중입니다.</p>;
  }

  if (isError || !data) {
    return (
      <>
        <PageHeader title="취준고민" backTo={BACK_TO} />
        <Callout tone="error">글을 찾을 수 없습니다.</Callout>
      </>
    );
  }

  const visible = data.visibility === 'VISIBLE';

  return (
    <>
      <PageHeader title={data.title} backTo={BACK_TO} />

      <Card>
        <CardTitle>기본 정보</CardTitle>
        <DescriptionList
          className="pt-4"
          columns={3}
          items={[
            {
              label: '카테고리',
              value: <Badge tone="neutral">{concernCategoryLabel(data.category)}</Badge>,
            },
            {
              label: '작성자',
              value: data.authorNickname ?? <span className="text-gray-400">프로필 없음</span>,
            },
            {
              label: '노출',
              value: (
                <Toggle
                  checked={visible}
                  disabled={mutation.isPending}
                  label={visible ? '노출' : '비노출'}
                  onChange={(next) =>
                    mutation.mutate({ ids: [data.id], visibility: next ? 'VISIBLE' : 'HIDDEN' })
                  }
                />
              ),
            },
            { label: '등록일', value: formatDateTime(data.registeredAt) },
            { label: '수정일', value: formatDateTime(data.updatedAt) },
          ]}
        />
        {mutation.isError ? (
          <Callout tone="error" className="mt-4">
            노출을 바꾸지 못했습니다.
          </Callout>
        ) : null}
      </Card>

      <Card className="mt-4">
        <CardTitle>지표</CardTitle>
        <DescriptionList
          className="pt-4"
          columns={3}
          items={[
            { label: '조회 수', value: formatCount(data.viewCount) },
            { label: '답변 수', value: formatCount(data.commentCount) },
            { label: '공식 답변', value: data.hasOfficialComment ? '있음' : '없음' },
          ]}
        />
      </Card>

      <Card className="mt-4">
        <CardTitle>본문</CardTitle>
        <p className="whitespace-pre-wrap pt-4 text-sm text-gray-900">{data.content}</p>
      </Card>
    </>
  );
}
