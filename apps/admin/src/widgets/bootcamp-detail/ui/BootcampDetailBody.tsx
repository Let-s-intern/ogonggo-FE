import { contentFieldLabel, enumLabel } from '@ogonggo/api/src/admin';
import { Card, CardTitle, DescriptionList } from '@ogonggo/ui';
import type { useBootcampDetail } from '@/entities/content/api/useContent';
import {
  RecruitmentStatusBadge,
  ContentSourceBadge,
  JobReviewStatusBadge,
  VisibilityBadge,
} from '@/shared/config/labels';
import { formatCount, formatDate, formatDateTime } from '@/shared/lib/format';
import { ContentActions } from '@/widgets/content-actions';

/**
 * 부트캠프 상세 본문(기본 정보·지표·내용·처리 버튼·파트너사·커리큘럼). 상세 화면과 목록의 상세 모달
 * (`BootcampDetailDialog`)이 같이 쓴다. `listPath` 는 들어온 목록(`/content/bootcamps` 또는 `/business/bootcamps`)이라
 * 삭제 뒤 돌아갈 곳과 `내용 수정` 화면(`<listPath>/<id>/edit`)이 들어온 쪽을 따른다.
 */
export function BootcampDetailBody({
  data,
  listPath,
  onEdit,
}: {
  data: NonNullable<ReturnType<typeof useBootcampDetail>['data']>;
  listPath: string;
  /** 있으면 `내용 수정` 이 수정 화면으로 가지 않고 이것을 부른다. 목록 모달이 모달 안 수정으로 바꾼다. */
  onEdit?: () => void;
}) {
  return (
    <>
      <Card>
        <CardTitle>기본 정보</CardTitle>
        <DescriptionList
          className="pt-4"
          columns={3}
          items={[
            { label: '운영사', value: data.companyName },
            {
              label: '모집 상태',
              value: (
                <RecruitmentStatusBadge enumName="BootcampRecruitmentStatus" value={data.status} />
              ),
            },
            { label: '노출', value: <VisibilityBadge value={data.visibility} /> },
            {
              label: '등록 경로',
              value: (
                <ContentSourceBadge value={data.source} adminRegistered={data.adminRegistered} />
              ),
            },
            { label: '검수 상태', value: <JobReviewStatusBadge value={data.reviewStatus} /> },
            { label: '등록일', value: formatDateTime(data.registeredAt) },
            { label: '프로그램 유형', value: data.programType },
            { label: '진행 방식', value: enumLabel('BootcampOperationType', data.operationType) },
            {
              label: '수강료',
              value:
                data.tuitionAmount == null
                  ? enumLabel('BootcampTuitionType', data.tuitionType)
                  : `${enumLabel('BootcampTuitionType', data.tuitionType)} (${formatCount(data.tuitionAmount)}원)`,
            },
            {
              label: '모집 유형',
              value: enumLabel('BootcampRecruitmentType', data.recruitmentType),
            },
            {
              label: '지원 방법',
              value: enumLabel('BootcampApplicationMethod', data.applicationMethod),
            },
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
          <CardTitle>{contentFieldLabel('BootcampContentField', 'content')}</CardTitle>
          <p className="whitespace-pre-wrap pt-4 text-sm text-gray-900">{data.content}</p>
        </Card>
      ) : null}

      {data.eligibilityAndSelectionProcess ? (
        <Card className="mt-4">
          <CardTitle>
            {contentFieldLabel('BootcampContentField', 'eligibilityAndSelectionProcess')}
          </CardTitle>
          <p className="whitespace-pre-wrap pt-4 text-sm text-gray-900">
            {data.eligibilityAndSelectionProcess}
          </p>
        </Card>
      ) : null}

      <ContentActions
        kind="bootcamps"
        id={data.id}
        title={data.title}
        listPath={listPath}
        operation={{
          visibility: data.visibility,
          source: data.source,
          reviewStatus: data.reviewStatus,
        }}
        // 상세는 `/content/bootcamps/:id` 와 `/business/bootcamps/:id` 두 곳에 있다. 들어온 쪽의 수정 화면으로 간다.
        editPath={`${listPath}/${data.id}/edit`}
        onEdit={onEdit}
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
