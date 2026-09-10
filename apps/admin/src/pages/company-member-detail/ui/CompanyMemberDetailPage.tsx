import { useNavigate, useParams } from 'react-router';
import {
  Callout,
  Card,
  CardTitle,
  DataTable,
  DescriptionList,
  type DataTableColumn,
} from '@ogonggo/ui';
import { useCompanyMemberDetail, type CompanyMemberJob } from '@/entities/member/api/useMembers';
import { PageHeader } from '@/widgets/page-header';
import {
  JobPublicationStatusBadge,
  JobReviewStatusBadge,
  MemberStatusBadge,
} from '@/shared/config/labels';
import { formatCount, formatDate, formatDateTime } from '@/shared/lib/format';

/**
 * 비즈니스 회원 상세. 읽기 전용이다.
 *
 * 그 회사가 등록한 공고를 함께 보여준다. 검수 대기가 섞여 있으면 여기서 바로 채용공고 상세로
 * 넘어갈 수 있다.
 */
export function CompanyMemberDetailPage() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { data, isPending, isError } = useCompanyMemberDetail(Number(memberId));

  if (isPending) {
    return <p className="text-sm text-gray-500">불러오는 중입니다.</p>;
  }

  if (isError || !data) {
    return (
      <>
        <PageHeader
          title="비즈니스 회원"
          backTo={{ to: '/members/companies', label: '비즈니스 회원 목록' }}
        />
        <Callout tone="error">비즈니스 회원을 찾을 수 없습니다.</Callout>
      </>
    );
  }

  // 공고 현황 요약. 상세에 들어온 이유가 대개 "이 회사 것 중 밀린 게 있나"라서 위로 올린다.
  const pendingCount = data.jobs.filter((job) => job.reviewStatus === 'PENDING').length;
  const publishedCount = data.jobs.filter((job) => job.publicationStatus === 'PUBLISHED').length;
  const totalViewCount = data.jobs.reduce((sum, job) => sum + job.viewCount, 0);

  const jobColumns: DataTableColumn<CompanyMemberJob>[] = [
    { key: 'title', header: '제목', render: (row) => row.title },
    {
      key: 'publicationStatus',
      header: '게시 상태',
      width: 'w-28',
      render: (row) => <JobPublicationStatusBadge value={row.publicationStatus} />,
    },
    {
      key: 'reviewStatus',
      header: '검수',
      width: 'w-28',
      render: (row) => <JobReviewStatusBadge value={row.reviewStatus} />,
    },
    {
      key: 'viewCount',
      header: '조회 수',
      align: 'right',
      width: 'w-24',
      render: (row) => formatCount(row.viewCount),
    },
    {
      key: 'registeredAt',
      header: '등록일',
      width: 'w-32',
      render: (row) => formatDate(row.registeredAt),
    },
  ];

  return (
    <>
      <PageHeader
        title={data.companyName}
        backTo={{ to: '/members/companies', label: '비즈니스 회원 목록' }}
      />

      <Card>
        <CardTitle>기본 정보</CardTitle>
        <DescriptionList
          className="pt-4"
          columns={2}
          items={[
            { label: '회사명', value: data.companyName },
            { label: '사업자등록번호', value: data.businessRegistrationNumber },
            { label: '담당자', value: data.managerName },
            { label: '담당자 이메일', value: data.managerEmail },
            { label: '상태', value: <MemberStatusBadge value={data.status} /> },
            { label: '가입일', value: formatDateTime(data.joinedAt) },
          ]}
        />
      </Card>

      {data.status === 'SUSPENDED' ? (
        <Callout tone="warning" className="mt-4">
          정지된 회원입니다. 이 회사의 공고를 함께 내릴지는 운영 쿼리로 판단합니다.
        </Callout>
      ) : null}

      <Card className="mt-4">
        <CardTitle>공고 현황</CardTitle>
        <DescriptionList
          className="pt-4"
          columns={4}
          items={[
            { label: '전체', value: formatCount(data.jobs.length) },
            { label: '검수 대기', value: formatCount(pendingCount) },
            { label: '게시 중', value: formatCount(publishedCount) },
            { label: '누적 조회', value: formatCount(totalViewCount) },
          ]}
        />
        {pendingCount > 0 ? (
          <Callout tone="warning" className="mt-4">
            검수 대기 {formatCount(pendingCount)}건이 있습니다. 아래 목록에서 해당 공고로 넘어갈 수
            있습니다.
          </Callout>
        ) : null}
      </Card>

      <div className="pt-6">
        <h2 className="pb-3 text-base font-bold text-gray-900">
          등록 공고 {formatCount(data.jobs.length)}건
        </h2>
        <DataTable
          columns={jobColumns}
          rows={data.jobs}
          rowKey={(row) => row.id}
          onRowClick={(row) => navigate(`/content/jobs/${row.id}`)}
          emptyMessage="등록한 공고가 없습니다."
        />
      </div>
    </>
  );
}
