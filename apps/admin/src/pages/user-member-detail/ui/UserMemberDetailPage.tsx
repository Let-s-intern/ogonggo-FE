import { useNavigate, useParams } from 'react-router';
import {
  Badge,
  Callout,
  Card,
  CardTitle,
  DataTable,
  DescriptionList,
  type DataTableColumn,
} from '@ogonggo/ui';
import type {
  AuthoredSideStudy,
  BookmarkedBootcamp,
  BookmarkedJob,
} from '@ogonggo/api/src/mocks/fixtures/admin-member-activity';
import { useUserMemberDetail } from '@/entities/member/api/useMembers';
import { PageHeader } from '@/widgets/page-header';
import { BootcampStatusBadge, MemberStatusBadge, sideStudyKindLabel } from '@/shared/config/labels';
import { formatCount, formatDateTime } from '@/shared/lib/format';

/**
 * 일반 회원 상세. 읽기 전용이다.
 *
 * 기본 정보 아래로 이 회원이 무엇을 했는지를 붙인다. 북마크한 공고·부트캠프, 작성한
 * 사이드·스터디 글이다. 각 행은 그 콘텐츠의 상세로 넘어간다 — 이상한 글을 찾아 들어가는 통로가
 * 여기다.
 *
 * 제재는 걸지 않는다. 운영자가 쿼리로 처리하고 이 화면은 결과를 보여주기만 한다
 * (PRD "하지 않는 것").
 */
export function UserMemberDetailPage() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { data, isPending, isError } = useUserMemberDetail(Number(memberId));

  if (isPending) {
    return <p className="text-sm text-gray-500">불러오는 중입니다.</p>;
  }

  if (isError || !data) {
    return (
      <>
        <PageHeader title="일반 회원" backTo={{ to: '/members/users', label: '일반 회원 목록' }} />
        <Callout tone="error">회원을 찾을 수 없습니다.</Callout>
      </>
    );
  }

  const jobColumns: DataTableColumn<BookmarkedJob>[] = [
    { key: 'title', header: '제목', render: (row) => row.title },
    { key: 'companyName', header: '회사', width: 'w-40', render: (row) => row.companyName },
    {
      key: 'viewCount',
      header: '조회 수',
      align: 'right',
      width: 'w-24',
      render: (row) => formatCount(row.viewCount),
    },
  ];

  const bootcampColumns: DataTableColumn<BookmarkedBootcamp>[] = [
    { key: 'title', header: '과정명', render: (row) => row.title },
    { key: 'companyName', header: '운영사', width: 'w-40', render: (row) => row.companyName },
    {
      key: 'status',
      header: '게시 상태',
      width: 'w-28',
      render: (row) => <BootcampStatusBadge value={row.status} />,
    },
  ];

  const studyColumns: DataTableColumn<AuthoredSideStudy>[] = [
    { key: 'title', header: '제목', render: (row) => row.title },
    {
      key: 'kind',
      header: '종류',
      width: 'w-36',
      render: (row) => <Badge tone="neutral">{sideStudyKindLabel(row.kind)}</Badge>,
    },
    {
      key: 'applied',
      header: '모집',
      align: 'right',
      width: 'w-24',
      render: (row) => `${row.appliedCount}/${row.capacity}`,
    },
    {
      key: 'closed',
      header: '상태',
      width: 'w-24',
      render: (row) => (
        <Badge tone={row.closed ? 'neutral' : 'success'}>{row.closed ? '마감' : '모집 중'}</Badge>
      ),
    },
    {
      key: 'viewCount',
      header: '조회 수',
      align: 'right',
      width: 'w-24',
      render: (row) => formatCount(row.viewCount),
    },
  ];

  return (
    <>
      <PageHeader
        title={data.nickname}
        backTo={{ to: '/members/users', label: '일반 회원 목록' }}
      />

      <Card>
        <CardTitle>기본 정보</CardTitle>
        <DescriptionList
          className="pt-4"
          columns={2}
          items={[
            { label: '닉네임', value: data.nickname },
            { label: '이메일', value: data.email },
            { label: '상태', value: <MemberStatusBadge value={data.status} /> },
            { label: '가입일', value: formatDateTime(data.joinedAt) },
            { label: '최근 접속', value: formatDateTime(data.lastAccessedAt) },
          ]}
        />
      </Card>

      {data.status === 'SUSPENDED' ? (
        <Callout tone="warning" className="mt-4">
          정지된 회원입니다. 제재 해제는 콘솔이 아니라 운영 쿼리로 처리합니다.
        </Callout>
      ) : null}

      {data.status === 'WITHDRAWN' ? (
        <Callout className="mt-4">
          탈퇴한 회원입니다. 작성 글과 북마크는 탈퇴와 함께 지워집니다.
        </Callout>
      ) : (
        <>
          <ActivitySection title="작성한 사이드·스터디" count={data.authoredSideStudies.length}>
            <DataTable
              columns={studyColumns}
              rows={data.authoredSideStudies}
              rowKey={(row) => row.id}
              onRowClick={(row) => navigate(`/content/side-studies/${row.id}`)}
              emptyMessage="작성한 글이 없습니다."
            />
          </ActivitySection>

          <ActivitySection title="북마크한 채용공고" count={data.bookmarkedJobs.length}>
            <DataTable
              columns={jobColumns}
              rows={data.bookmarkedJobs}
              rowKey={(row) => row.id}
              onRowClick={(row) => navigate(`/content/jobs/${row.id}`)}
              emptyMessage="북마크한 공고가 없습니다."
            />
          </ActivitySection>

          <ActivitySection title="북마크한 부트캠프" count={data.bookmarkedBootcamps.length}>
            <DataTable
              columns={bootcampColumns}
              rows={data.bookmarkedBootcamps}
              rowKey={(row) => row.id}
              onRowClick={(row) => navigate(`/content/bootcamps/${row.id}`)}
              emptyMessage="북마크한 부트캠프가 없습니다."
            />
          </ActivitySection>
        </>
      )}
    </>
  );
}

function ActivitySection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="pt-6">
      <h2 className="pb-3 text-base font-bold text-gray-900">
        {title} {formatCount(count)}건
      </h2>
      {children}
    </section>
  );
}
