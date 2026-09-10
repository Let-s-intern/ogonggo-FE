import { useParams } from 'react-router';
import { Badge, Callout, Card, CardTitle, DescriptionList } from '@ogonggo/ui';
import { useSideStudyDetail } from '@/entities/content/api/useContent';
import { PageHeader } from '@/widgets/page-header';
import { plainLabel, sideStudyKindLabel } from '@/shared/config/labels';
import { formatCount, formatDate, formatDateTime } from '@/shared/lib/format';
import { ContentActions } from '@/widgets/content-actions';

/** 사이드·스터디 상세. 읽기 전용이다. */
export function SideStudyDetailPage() {
  const { postId } = useParams();
  const { data, isPending, isError } = useSideStudyDetail(Number(postId));

  if (isPending) {
    return <p className="text-sm text-gray-500">불러오는 중입니다.</p>;
  }

  if (isError || !data) {
    return (
      <>
        <PageHeader
          title="사이드·스터디"
          backTo={{ to: '/content/side-studies', label: '사이드·스터디 목록' }}
        />
        <Callout tone="error">글을 찾을 수 없습니다.</Callout>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={data.title}
        backTo={{ to: '/content/side-studies', label: '사이드·스터디 목록' }}
      />

      <Card>
        <CardTitle>기본 정보</CardTitle>
        <DescriptionList
          className="pt-4"
          columns={3}
          items={[
            { label: '종류', value: <Badge tone="neutral">{sideStudyKindLabel(data.kind)}</Badge> },
            { label: '모집장', value: data.authorNickname },
            { label: '진행 방식', value: plainLabel(data.operationType) },
            { label: '등록일', value: formatDateTime(data.registeredAt) },
            { label: '모집 시작', value: formatDate(data.recruitmentStartAt) },
            { label: '모집 마감', value: formatDate(data.recruitmentEndAt) },
            { label: '모집 인원', value: `${data.appliedCount}/${data.capacity}` },
            { label: '예상 기간', value: data.expectedDuration ?? '-' },
            { label: '연락 방법', value: data.contactMethod },
            { label: '모집 포지션', full: true, value: data.positions.join(', ') || '-' },
            { label: '기술 스택', full: true, value: data.techStack.join(', ') || '-' },
          ]}
        />
      </Card>

      <Card className="mt-4">
        <CardTitle>지표</CardTitle>
        <DescriptionList
          className="pt-4"
          columns={3}
          items={[
            { label: '조회 수', value: formatCount(data.viewCount) },
            { label: '댓글 수', value: formatCount(data.commentCount) },
            { label: '마감 여부', value: data.closed ? '마감' : '모집 중' },
          ]}
        />
      </Card>

      <ContentActions
        kind="side-studies"
        id={data.id}
        title={data.title}
        listPath="/content/side-studies"
      />

      <Card className="mt-4">
        <CardTitle>본문</CardTitle>
        <p className="pt-4 text-sm text-gray-500">{data.shortDescription}</p>
        <p className="whitespace-pre-wrap pt-3 text-sm text-gray-900">{data.content}</p>
      </Card>

      {data.eligibility ? (
        <Card className="mt-4">
          <CardTitle>지원 자격</CardTitle>
          <p className="whitespace-pre-wrap pt-4 text-sm text-gray-900">{data.eligibility}</p>
        </Card>
      ) : null}
    </>
  );
}
