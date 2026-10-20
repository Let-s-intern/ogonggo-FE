import { useParams } from 'react-router';
import { contentFieldLabel, enumLabel } from '@ogonggo/api/src/admin';
import { Callout, Card, CardTitle, DescriptionList } from '@ogonggo/ui';
import { useJobDetail } from '@/entities/content/api/useContent';
import { PageHeader } from '@/widgets/page-header';
import {
  ContentSourceBadge,
  JobReviewStatusBadge,
  RecruitmentStatusBadge,
  VisibilityBadge,
} from '@/shared/config/labels';
import { formatCount, formatDate, formatDateTime } from '@/shared/lib/format';
import { ContentActions } from '@/widgets/content-actions';
import { JOB_BODY_FIELDS } from '@/widgets/job-editor';
import { TodayJobCard } from './TodayJobCard';

/** 참·거짓 칸. 값이 없으면 다른 빈 칸처럼 `-` 다 — `아니요` 로 그리면 정한 적 없는 값이 정한 것처럼 보인다. */
const yesNo = (value: boolean | null | undefined): string =>
  value == null ? '-' : value ? '예' : '아니요';

/**
 * 채용공고 상세. 오늘의 공고(PICK) 카드와 운영 값·본문 수정(`ContentActions`)을 빼면 읽기 전용이다.
 *
 * 본문 칸이 여럿이고 대부분 비어 있을 수 있어(크롤링 수집분은 원문 구조에 따라 다르다) 값이
 * 있는 칸만 그린다. 빈 제목만 늘어서면 무엇이 실제로 수집됐는지 알아볼 수 없다.
 */
export function JobDetailPage() {
  const { jobId } = useParams();
  const { data, isPending, isError } = useJobDetail(Number(jobId));

  if (isPending) {
    return <p className="text-sm text-gray-500">불러오는 중입니다.</p>;
  }

  if (isError || !data) {
    return (
      <>
        <PageHeader title="채용공고" backTo={{ to: '/content/jobs', label: '채용공고 목록' }} />
        <Callout tone="error">채용공고를 찾을 수 없습니다.</Callout>
      </>
    );
  }

  const bodyFields = JOB_BODY_FIELDS.map((field) => ({
    label: contentFieldLabel('JobContentField', field),
    value: data[field],
  })).filter((field): field is { label: string; value: string } => Boolean(field.value));

  return (
    <>
      <PageHeader title={data.title} backTo={{ to: '/content/jobs', label: '채용공고 목록' }} />

      <Card>
        <CardTitle>기본 정보</CardTitle>
        <DescriptionList
          className="pt-4"
          columns={3}
          items={[
            { label: '회사', value: data.companyName },
            { label: '모회사', value: data.parentCompanyName || '-' },
            { label: '산업', value: data.industry || '-' },
            { label: '노출', value: <VisibilityBadge value={data.visibility} /> },
            { label: '등록 경로', value: <ContentSourceBadge value={data.source} /> },
            { label: '검수 상태', value: <JobReviewStatusBadge value={data.reviewStatus} /> },
            { label: '등록일', value: formatDateTime(data.registeredAt) },
            { label: '직군', value: data.jobField ? enumLabel('JobField', data.jobField) : '-' },
            { label: '직무', value: data.jobRole ? enumLabel('JobRole', data.jobRole) : '-' },
            { label: '지역', value: data.region ? enumLabel('Region', data.region) : '-' },
            { label: '고용 형태', value: enumLabel('JobEmploymentType', data.employmentType) },
            { label: '경력', value: enumLabel('JobExperienceType', data.experienceType) },
            {
              label: '최소 경력 연수',
              value: data.experienceMinYears == null ? '-' : `${data.experienceMinYears}년`,
            },
            { label: '학력', value: enumLabel('JobEducationLevel', data.educationLevel) },
            { label: '모집 유형', value: enumLabel('JobRecruitmentType', data.recruitmentType) },
            {
              label: '모집 상태',
              value: (
                <RecruitmentStatusBadge
                  enumName="JobRecruitmentStatus"
                  value={data.recruitmentStatus}
                />
              ),
            },
            { label: '모집 시작', value: formatDate(data.recruitmentStartAt) },
            { label: '모집 마감', value: formatDate(data.recruitmentEndAt) },
            { label: '마감 처리', value: formatDateTime(data.closedAt) },
            {
              label: '모집 인원',
              value: data.recruitmentHeadcount == null ? '-' : `${data.recruitmentHeadcount}명`,
            },
            { label: '충원 시 마감', value: yesNo(data.closesWhenFilled) },
            { label: '자동 마감', value: yesNo(data.autoCloseEnabled) },
            {
              label: '지원 방법',
              value: data.applicationMethod
                ? enumLabel('JobApplicationMethod', data.applicationMethod)
                : '-',
            },
            { label: '지원 이메일', value: data.applyEmail || '-' },
            { label: '문의 이메일', value: data.inquiryEmail || '-' },
            {
              label: '원문',
              full: true,
              value: data.sourceUrl ? (
                <a
                  href={data.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-blue-600 underline"
                >
                  {data.sourceUrl}
                </a>
              ) : (
                '-'
              ),
            },
            {
              label: '모집 안내',
              full: true,
              value: data.recruitmentNotice ? (
                <span className="whitespace-pre-wrap">{data.recruitmentNotice}</span>
              ) : (
                '-'
              ),
            },
          ]}
        />
      </Card>

      <TodayJobCard key={data.id} jobId={data.id} isHidden={data.visibility === 'HIDDEN'} />

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

      <ContentActions
        kind="jobs"
        id={data.id}
        title={data.title}
        listPath="/content/jobs"
        operation={{
          visibility: data.visibility,
          source: data.source,
          reviewStatus: data.reviewStatus,
        }}
        job={data}
      />

      {bodyFields.length > 0 ? (
        <Card className="mt-4">
          <CardTitle>본문</CardTitle>
          <div className="pt-4">
            {bodyFields.map((field) => (
              <section key={field.label} className="pb-4 last:pb-0">
                <h3 className="pb-1 text-sm font-medium text-gray-500">{field.label}</h3>
                <p className="whitespace-pre-wrap text-sm text-gray-900">{field.value}</p>
              </section>
            ))}
          </div>
        </Card>
      ) : (
        <Callout tone="warning" className="mt-4">
          수집된 본문이 없습니다. 원문 구조가 바뀌었을 수 있습니다.
        </Callout>
      )}
    </>
  );
}
