import type { ReactNode } from 'react';
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
 * 부트캠프 상세 본문(기본 정보·지표·내용·처리 버튼). 내용은 공개 상세와 같은 순서로 모든 칸을 한 카드에 둔다
 * (2026-11-10 사용자). 상세 화면과 목록의 상세 모달
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

      <Card className="mt-4">
        <CardTitle>내용</CardTitle>
        <p className="pt-1 text-sm text-gray-500">
          공개 상세 화면과 같은 순서입니다. 비어 있는 칸은 공개 화면에서 숨겨집니다.
        </p>
        <div className="flex flex-col divide-y divide-gray-100 pt-2">
          <TextSection title="한 줄 소개" body={data.shortDescription} />
          <TextSection
            title={contentFieldLabel('BootcampContentField', 'content')}
            body={data.content}
          />
          <ContentSection title="커리큘럼" empty={data.curriculums.length === 0}>
            <ol>
              {data.curriculums.map((item) => (
                <li
                  key={`${item.startWeek}-${item.displayOrder}`}
                  className="flex gap-3 py-1.5 text-sm"
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
          </ContentSection>
          <TextSection title="강사 정보" body={data.instructorInfo} />
          <TextSection title="교육 특징/혜택" body={data.programFeatures} />
          <TextSection title="수료 조건" body={data.completionRequirements} />
          <TextSection
            title={contentFieldLabel('BootcampContentField', 'eligibilityAndSelectionProcess')}
            body={data.eligibilityAndSelectionProcess}
          />
          <ContentSection title="사진" empty={data.images.length === 0}>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[...data.images]
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((image) => (
                  <li key={image.url}>
                    <a href={image.url} target="_blank" rel="noreferrer">
                      <img
                        src={image.url}
                        alt={image.caption ?? ''}
                        className="aspect-[4/3] w-full rounded-md border border-gray-100 object-cover"
                      />
                    </a>
                    {image.caption ? (
                      <p className="pt-1 text-xs text-gray-500">{image.caption}</p>
                    ) : null}
                  </li>
                ))}
            </ul>
          </ContentSection>
          <ContentSection title="파트너사" empty={data.partners.length === 0}>
            <ul className="flex flex-wrap gap-2">
              {data.partners.map((partner) => (
                <li
                  key={partner.name}
                  className="rounded-sm bg-gray-100 px-2 py-1 text-sm text-gray-700"
                >
                  {partner.name}
                </li>
              ))}
            </ul>
          </ContentSection>
        </div>
      </Card>

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
    </>
  );
}

/** 내용 카드의 한 칸. 제목 왼쪽, 내용 오른쪽이다. 비어 있으면 `입력 안 함` 을 흐리게 보여 빠진 칸이 바로 보인다. */
function ContentSection({
  title,
  empty,
  children,
}: {
  title: string;
  empty: boolean;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-2 py-4 md:grid-cols-[10rem_minmax(0,1fr)] md:gap-6">
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      {empty ? <p className="text-sm text-gray-400">입력 안 함</p> : <div>{children}</div>}
    </section>
  );
}

/** 글 한 칸. 줄바꿈을 그대로 살린다(공개 상세의 `whitespace-pre-line` 과 같다). */
function TextSection({ title, body }: { title: string; body: string | undefined }) {
  return (
    <ContentSection title={title} empty={!body?.trim()}>
      <p className="text-sm leading-relaxed whitespace-pre-line text-gray-900">{body?.trim()}</p>
    </ContentSection>
  );
}
