import { notFound } from 'next/navigation';
import { getPublicJob } from '@ogonggo/api';
import type { SuccessResponseUserJobDetailResponse } from '@ogonggo/api';
import { toJobInfo } from '@/entities/job/model/analytics';
import { formatRegion } from '@/entities/job/model/labels';
import type { JobDetail } from '@/entities/job/model/types';
import { ApplyCta } from '@/shared/ui/ApplyCta';
import { DdayBadge } from '@/shared/ui/DdayBadge';
import { StickyApplyBar } from '@/shared/ui/StickyApplyBar';
import { DetailSidebarSection } from '@/shared/ui/DetailSidebarSection';
import {
  CrossSellWidget,
  JOB_PREPARATION_CARDS,
  JOB_PREPARATION_TITLE,
} from '@/widgets/cross-sell';
import { JobDetailBreadcrumb } from './JobDetailBreadcrumb';
import { JobDetailViewTracker } from './JobDetailViewTracker';
import { AnalysisTab } from './AnalysisTab';
import { formatDeadlineText, JobDetailHeaderCard } from './JobDetailHeaderCard';
import { JobDetailTabs } from './JobDetailTabs';
import { OriginalTab } from './OriginalTab';
import { SimilarJobs } from './SimilarJobs';

export interface JobDetailViewProps {
  jobId: number;
  /**
   * `page`는 `/jobs/[jobId]` 화면, `modal`은 공고 달력에서 여는 모달이다
   * (`docs/asset/v6 공고달력/공고 상세 모달.png`). 모달은 브레드크럼이 없고 헤더 카드와 정보
   * 그리드가 본문과 같은 왼쪽 열에 들어간다.
   */
  layout?: 'page' | 'modal';
}

/**
 * `getPublicJob`(packages/api/src/generated/user/endpoints.ts)의 선언 타입도
 * `widgets/job-list/ui/JobList.tsx`의 `fetchJobPage`와 같은 이유로 `{ data, status, headers }`로
 * 감싼 응답을 가정하지만, 이 저장소의 `httpClient`(packages/api/src/lib/http-client.ts)는 파싱된
 * body를 그대로 반환한다 — 여기서도 같은 방식으로 그 차이를 흡수한다.
 *
 * 404(JOB_NOT_FOUND)는 `httpClient`가 구조화된 응답 대신
 * `Error("GET /api/v1/jobs/{id} failed: 404")`를 던지므로(응답이 `ok`가 아니면 무조건 던짐),
 * 메시지 끝의 상태 코드로 404를 가려내 `notFound()`(node_modules/next/dist/docs/01-app/
 * 03-api-reference/04-functions/not-found.md)로 변환한다. 그 외 오류(전송 실패 등)는 그대로
 * 다시 던진다.
 */
export async function fetchJobDetail(jobId: number): Promise<JobDetail> {
  let response: SuccessResponseUserJobDetailResponse;
  try {
    response = (await getPublicJob(jobId)) as unknown as SuccessResponseUserJobDetailResponse;
  } catch (error) {
    if (error instanceof Error && error.message.endsWith(': 404')) {
      notFound();
    }
    throw error;
  }

  if (!response.data) {
    notFound();
  }

  return response.data;
}

/**
 * 채용공고 상세 — `docs/asset/v12 채용공고 상세/` 순서(헤더 카드 → `공고 분석`·`공고 원문` 탭 →
 * 사이드바)로 조합한다. 요약 박스와 본문 섹션은 탭 안에 있다(`AnalysisTab`, `OriginalTab`). 본문
 * (왼쪽)과 사이드바(오른쪽)는 데스크톱에서 2단, 좁은 화면에서는 세로로 쌓인다.
 */
export async function JobDetailView({ jobId, layout = 'page' }: JobDetailViewProps) {
  const job = await fetchJobDetail(jobId);
  const jobInfo = toJobInfo(job);
  const viewTracker = <JobDetailViewTracker jobId={job.id} jobInfo={jobInfo} />;

  const headerCard = (
    <JobDetailHeaderCard
      companyName={job.companyName}
      logoUrl={job.logoUrl}
      region={formatRegion(job.region)}
      title={job.title}
      recruitmentType={job.recruitmentType}
      recruitmentEndAt={job.recruitmentEndAt}
      viewCount={job.viewCount}
      layout={layout}
    />
  );
  // 페이지는 탭을 주소(`?tab=original`)와 맞춘다. 모달은 아래 화면의 주소를 건드리지 않도록 상태로만 둔다.
  const tabs = (
    <JobDetailTabs
      syncUrl={layout === 'page'}
      analysis={<AnalysisTab job={job} layout={layout} />}
      original={<OriginalTab job={job} layout={layout} />}
    />
  );
  const applyCta = (
    <ApplyCta
      href={job.sourceUrl}
      label="지원하러 가기"
      kind="jobs"
      id={job.id}
      bookmarked={job.bookmarked}
      bookmarkCount={job.bookmarkCount}
      applyEvent={{ event: 'apply_click', params: { ...jobInfo, click_location: 'detail' } }}
      scrapParams={{ ...jobInfo, click_location: 'detail' }}
      share={{
        kind: 'jobs',
        title: job.title,
        organizationName: job.companyName,
        logoUrl: job.logoUrl,
        path: `/jobs/${job.id}`,
        // 상시채용은 마감일이 없어 캘린더에 넣을 날이 없다.
        recruitmentEndAt: job.recruitmentType === 'ALWAYS_OPEN' ? undefined : job.recruitmentEndAt,
      }}
    />
  );

  if (layout === 'modal') {
    return (
      // 모달 목업의 2단은 본문 640px : 사이드바 300px, 사이 20px 이다.
      //
      // 목업 오른쪽 맨 위의 `오늘의 공고의 코멘트`는 그리지 않는다. API 없음: 상세 응답에 코멘트
      // 필드가 없다. 그 아래 회색 판은 광고 자리인데, 내용이 정해지지 않아 빈 상자만 보여서
      // 그리지 않는다(홈의 배너 자리와 같다).
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,640fr)_minmax(0,300fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          {viewTracker}
          {headerCard}
          {tabs}
        </div>
        <aside className="flex min-w-0 flex-col gap-6">
          {applyCta}
          <SimilarJobs excludeJobId={job.id} jobRole={job.jobRole} />
          {/* 준비 위젯의 제목·고정 카드는 페이지 전용이다. 모달은 v6 시안대로 `함께 보면 좋아요` 와
              챌린지 목록만 둔다(헤더·요약 박스를 옛 모양으로 둔 것과 같은 기준). */}
          <CrossSellWidget />
        </aside>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-6xl flex-col gap-4">
      {viewTracker}
      <JobDetailBreadcrumb />
      {headerCard}
      {/* 본문 2단은 좌우 여백 없이 위 헤더 카드와 아래 `ForBusinessBanner`의 바깥 가장자리에 맞춘다.
          전에는 카드 안쪽 글자 위치에 맞춰 `md:px-8`을 뒀는데, 블록 가장자리가 어긋나 보인다는
          요청으로 가장자리 기준으로 바꿨다(2026-09-30). */}
      {/* 헤더 마지막 줄 아래에서 탭 줄까지는 시안 실측 약 72px 이다(탭 글자까지는 약 76px, 모바일·데스크톱
          모두). 헤더의 아래 여백(`p-4`, `md:py-6`)과 위 `gap-4` 가 이미 32·40px 이라 모자란 만큼을 2단 위에
          더한다. */}
      {/* 2단 비율은 `상세 채용공고.png` 실측값(본문 739px : 사이드바 323px, 사이 간격 60px,
          1440px 기준)을 그대로 `fr`로 옮긴 것이다. 3:2로 뒀을 때 사이드바가 목업보다 넓고
          본문이 좁았다. */}
      <div className="mt-10 grid grid-cols-1 gap-6 md:mt-8 lg:grid-cols-[minmax(0,739fr)_minmax(0,323fr)] lg:gap-15">
        <div className="min-w-0">{tabs}</div>
        <aside className="flex flex-col gap-6">
          <StickyApplyBar
            summary={
              <>
                <span>{formatDeadlineText(job.recruitmentType, job.recruitmentEndAt)}</span>
                <DdayBadge
                  recruitmentType={job.recruitmentType}
                  recruitmentEndAt={job.recruitmentEndAt}
                />
              </>
            }
          >
            {applyCta}
          </StickyApplyBar>
          <DetailSidebarSection>
            <SimilarJobs excludeJobId={job.id} jobRole={job.jobRole} />
          </DetailSidebarSection>
          <DetailSidebarSection>
            <CrossSellWidget title={JOB_PREPARATION_TITLE} leadingCards={JOB_PREPARATION_CARDS} />
          </DetailSidebarSection>
        </aside>
      </div>
    </div>
  );
}
