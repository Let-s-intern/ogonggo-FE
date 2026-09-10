import { useParams } from 'react-router';
import { Callout, Card, CardTitle, DescriptionList } from '@ogonggo/ui';
import { useBootcampDetail } from '@/entities/content/api/useContent';
import { PageHeader } from '@/widgets/page-header';
import { BootcampStatusBadge } from '@/shared/config/labels';
import { formatCount, formatDate, formatDateTime } from '@/shared/lib/format';

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
            { label: '게시 상태', value: <BootcampStatusBadge value={data.status} /> },
            { label: '등록일', value: formatDateTime(data.registeredAt) },
            { label: '프로그램 유형', value: data.programType },
            { label: '진행 방식', value: data.operationType },
            { label: '수강료', value: data.tuitionType },
            { label: '모집 시작', value: formatDate(data.recruitmentStartAt) },
            { label: '모집 마감', value: formatDate(data.recruitmentEndAt) },
            { label: '정원', value: formatCount(data.capacity) },
            { label: '과정 시작', value: data.programStartDate ?? '-' },
            { label: '과정 종료', value: data.programEndDate ?? '-' },
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
