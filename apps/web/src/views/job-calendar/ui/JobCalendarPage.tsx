import { Suspense } from 'react';
import { DetailPageSkeleton } from '@/shared/ui/DetailPageSkeleton';
import { CalendarFilterBar } from '@/widgets/job-calendar/ui/CalendarFilterBar';
import { CalendarHeader } from '@/widgets/job-calendar/ui/CalendarHeader';
import { JobCalendarView } from '@/widgets/job-calendar/ui/JobCalendarView';
import { JobDetailModal, JobDetailModalMissing } from '@/widgets/job-calendar/ui/JobDetailModal';
import { JobDetailView } from '@/widgets/job-detail';
import { buildJobCalendarHref, type JobCalendarQuery } from '@/widgets/job-calendar/lib/query';

export interface JobCalendarPageProps extends JobCalendarQuery {
  /** `?job=<id>`. 있으면 그 공고의 상세 모달이 달력 위에 뜬다(PRD 8.6). */
  job?: number;
}

/**
 * `공고달력.png` — 제목 + 필터 줄, 날짜 이동 줄, 그 아래 격자. 다른 화면들과 같이 페이지
 * 조합은 view 레이어가 맡고 라우트(`app/calendar/page.tsx`)는 쿼리 파싱만 한다(PRD 7절).
 *
 * 상세 모달의 **내용은 여기서 서버로 그린다**(`docs/asset/공고달력 클릭시.png`). 모달
 * 껍데기(`JobDetailModal`)만 클라이언트 컴포넌트이고 안에 들어가는 상세는 `/jobs/{id}` 가
 * 쓰는 `JobDetailView` 를 그대로 꽂는다 — 새로 그리지 않는다.
 *
 * 브라우저에서 `getJob` 을 부르지 않는 이유가 있다. 이 저장소의 MSW 는 서버에만 붙어 있고
 * (`apps/web/src/instrumentation.ts`), 브라우저 쪽 워커는 띄우지 않는다 — `public/` 에
 * `mockServiceWorker.js` 가 없고 `worker.start()` 를 부르는 자리도 없다. 클라이언트에서 부르면
 * `/api/v1/jobs/{id}` 가 rewrite 를 타고 실제 백엔드로 나가 목데이터를 못 받는다. 달력 격자가
 * 이미 서버에서 받아 props 로 내려주는 것과 같은 이유이자 같은 방식이다(PRD 6.1, AC 10).
 */
export function JobCalendarPage({ job, ...query }: JobCalendarPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-white px-6 py-10">
      <div className="flex w-full max-w-6xl flex-col gap-6 px-8">
        {/* 목업에서 제목과 필터 줄은 같은 줄이고 세로 가운데가 맞는다. */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">공고 달력</h1>
          <CalendarFilterBar query={query} />
        </div>
        {/*
          목업에서 필터 줄 아래와 날짜 이동 줄 사이는 47px 인데, 이 열의 기본 간격(24px)에
          화살표 버튼 자체의 위쪽 여백 8px 을 더해도 32px 밖에 안 된다. 모자란 만큼만 더 준다.
        */}
        <div className="mt-4">
          <CalendarHeader query={query} />
        </div>
        <JobCalendarView baseDate={query.date} brief={query.brief} />
      </div>

      {job === undefined ? null : (
        <JobDetailModal closeHref={buildJobCalendarHref(query)}>
          {/*
            이 `Suspense` 는 `?job=` 이 붙을 때 새로 생기는 경계라 폴백이 실제로 보인다 —
            상세를 받아오는 동안 스켈레톤이 뜨고 달력은 뒤에 그대로 남는다. 페이지를 감싸는
            바깥 경계(`app/(site)/loading.tsx`)는 이미 마운트돼 있어 다시 뜨지 않는다.

            스켈레톤 값은 `app/(site)/jobs/[jobId]/loading.tsx` 와 같다. 모달에는
            브레드크럼이 없으므로 그것만 끈다.
          */}
          <Suspense
            fallback={
              <DetailPageSkeleton
                avatarClass="h-16 w-16"
                infoRows={2}
                sectionCount={3}
                sectionLines={3}
                sidebarListCount={2}
                bodyGapClass="gap-4"
                showBreadcrumb={false}
              />
            }
          >
            <JobDetailView
              jobId={job}
              showBreadcrumb={false}
              missingFallback={<JobDetailModalMissing />}
            />
          </Suspense>
        </JobDetailModal>
      )}
    </main>
  );
}
