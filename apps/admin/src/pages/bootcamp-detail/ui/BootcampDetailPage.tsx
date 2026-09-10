import { useParams } from 'react-router';
import { Callout, Card, CardTitle, DescriptionList } from '@ogonggo/ui';
import { useBootcampDetail } from '@/entities/content/api/useContent';
import { PageHeader } from '@/widgets/page-header';
import {
  RecruitmentStatusBadge,
  ContentSourceBadge,
  JobReviewStatusBadge,
  VisibilityBadge,
  plainLabel,
} from '@/shared/config/labels';
import { formatCount, formatDate, formatDateTime } from '@/shared/lib/format';
import { ContentActions } from '@/widgets/content-actions';

/** 부트캠프 상세. 읽기 전용이다. */
export function BootcampDetailPage() {
  const { bootcampId } = useParams();
  const { data, isPending, isError } = useBootcampDetail(Number(bootcampId));

  if (isPending) {
    return <p className="text-sm text-gray-500">불러오는 중입니다.</p>;
  }

  if (isError || !data) {
    return (
      <>
        <PageHeader
          title="부트캠프"
          backTo={{ to: '/content/bootcamps', label: '부트캠프 목록' }}
        />
        <Callout tone="error">부트캠프를 찾을 수 없습니다.</Callout>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={data.title}
        backTo={{ to: '/content/bootcamps', label: '부트캠프 목록' }}
      />

      <Card>
        <CardTitle>기본 정보</CardTitle>
        <DescriptionList
          className="pt-4"
          columns={3}
          items={[
            { label: '운영사', value: data.companyName },
            {
              label: '모집 상태',
              value: <RecruitmentStatusBadge value={data.recruitmentStatus} />,
            },
            { label: '노출', value: <VisibilityBadge value={data.visibility} /> },
            { label: '등록 경로', value: <ContentSourceBadge value={data.source} /> },
            { label: '검수 상태', value: <JobReviewStatusBadge value={data.reviewStatus} /> },
            { label: '등록일', value: formatDateTime(data.registeredAt) },
            { label: '프로그램 유형', value: data.programType },
            { label: '진행 방식', value: plainLabel(data.operationType) },
            {
              label: '수강료',
              value:
                data.tuitionAmount === undefined
                  ? plainLabel(data.tuitionType)
                  : `${plainLabel(data.tuitionType)} (${formatCount(data.tuitionAmount)}원)`,
            },
            { label: '모집 유형', value: plainLabel(data.recruitmentType) },
            { label: '지원 방법', value: plainLabel(data.applicationMethod) },
            { label: '모집 시작', value: formatDate(data.recruitmentStartAt) },
            { label: '모집 마감', value: formatDate(data.recruitmentEndAt) },
            { label: '정원', value: formatCount(data.capacity) },
            // programStartDate/EndDate 는 `YYYY-MM-DD` 문자열이라 그대로 두면 위의 모집일과
            // 형식이 어긋난다.
            { label: '과정 시작', value: formatDate(data.programStartDate) },
            { label: '과정 종료', value: formatDate(data.programEndDate) },
            { label: '문의 메일', value: data.managerEmail ?? '-' },
            {
              label: '지원 페이지',
              full: true,
              value: data.applicationUrl ? (
                <a
                  href={data.applicationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-blue-600 underline"
                >
                  {data.applicationUrl}
                </a>
              ) : (
                '-'
              ),
            },
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
            { label: '북마크 수', value: formatCount(data.bookmarkCount) },
            { label: '댓글 수', value: formatCount(data.commentCount) },
          ]}
        />
      </Card>

      {data.content ? (
        <Card className="mt-4">
          <CardTitle>소개</CardTitle>
          <p className="whitespace-pre-wrap pt-4 text-sm text-gray-900">{data.content}</p>
        </Card>
      ) : null}

      {data.eligibilityAndSelectionProcess ? (
        <Card className="mt-4">
          <CardTitle>지원 자격과 선발 절차</CardTitle>
          <p className="whitespace-pre-wrap pt-4 text-sm text-gray-900">
            {data.eligibilityAndSelectionProcess}
          </p>
        </Card>
      ) : null}

      <ContentActions
        kind="bootcamps"
        id={data.id}
        title={data.title}
        listPath="/content/bootcamps"
        operation={{
          visibility: data.visibility,
          source: data.source,
          reviewStatus: data.reviewStatus,
        }}
        fields={[
          { field: 'content', label: '소개', value: data.content ?? '' },
          {
            field: 'eligibilityAndSelectionProcess',
            label: '지원 자격과 선발 절차',
            value: data.eligibilityAndSelectionProcess ?? '',
          },
        ]}
      />

      {data.partners.length > 0 ? (
        <Card className="mt-4">
          <CardTitle>파트너사</CardTitle>
          <ul className="flex flex-wrap gap-2 pt-4">
            {data.partners.map((partner) => (
              <li
                key={partner.name}
                className="rounded-sm bg-gray-100 px-2 py-1 text-sm text-gray-700"
              >
                {partner.name}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {data.curriculums.length > 0 ? (
        <Card className="mt-4">
          <CardTitle>커리큘럼</CardTitle>
          <ol className="pt-4">
            {data.curriculums.map((item) => (
              <li
                key={`${item.startWeek}-${item.displayOrder}`}
                className="flex gap-3 border-b border-gray-100 py-2 text-sm last:border-b-0"
              >
                <span className="w-20 shrink-0 text-gray-500">
                  {item.startWeek === item.endWeek
                    ? `${item.startWeek}주차`
                    : `${item.startWeek}-${item.endWeek}주차`}
                </span>
                <span className="text-gray-900">{item.subtitle}</span>
              </li>
            ))}
          </ol>
        </Card>
      ) : null}
    </>
  );
}
