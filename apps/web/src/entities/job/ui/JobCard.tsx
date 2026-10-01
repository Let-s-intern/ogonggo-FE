import { Badge } from '@ogonggo/ui';
import { BookmarkButton } from '@/features/bookmark';
import {
  computeDday,
  isDdayUrgent,
  isRecruitmentClosed,
  ALWAYS_OPEN_LABEL,
  isAlwaysOpen,
} from '@/shared/lib/dday';
import { toJobInfo } from '../model/analytics';
import { getJobMajor } from '../model/job-major';
import { EMPLOYMENT_TYPE_LABELS, EXPERIENCE_TYPE_LABELS } from '../model/labels';
import type { JobSummary } from '../model/types';
import { JobCardLink, type JobCardTracking } from './JobCardLink';
import { JobMeta } from './JobMeta';
import { JobThumbnail } from './JobThumbnail';

export interface JobCardProps {
  job: JobSummary;
  /** 목록 안의 자리. 주면 누를 때 `job_card_click` 이 나간다. 스토리처럼 목록 밖이면 뺀다. */
  tracking?: JobCardTracking;
}

/**
 * "인기 공고"와 "전체 공고" 두 섹션이 완전히 같은 카드 디자인을 쓰도록 만든 단일 컴포넌트다
 * (`widgets/job-list/ui/JobList.tsx`와 `widgets/popular-jobs/ui/PopularJobCard.tsx`가 예전엔
 * 따로 그려서 D-day 표시 방식이 서로 달랐다 — 사용자가 그 차이를 지적해 하나로 합쳤다).
 * 썸네일(북마크만) → "고용형태 · 직무 · 경력  D-day 배지" 한 줄 → "회사명 · 지역" 한 줄 → 제목.
 * "직무"(`job_major`)는 처음엔 대응 API 필드가 없다고 뺐었는데, 실제 목업(`상세 채용공고.png`
 * 리스트 카드 크롭)을 다시 보니 있었다 — 크롤러 DB엔 이 필드가 실제로 있어서(`job-major.ts`)
 * 넣는다, 없는 공고는 그 세그먼트만 뺀다.
 *
 * `h-full`은 같은 행에 제목 한 줄짜리와 두 줄짜리가 섞일 때를 위한 것이다. 없으면 카드가
 * 내용만큼만 높아 짧은 쪽 아랫변이 20px 떠 보인다(`entities/CardEdgeCases.stories.tsx` 실측).
 *
 * 마감된 공고는 D-day 자리에 회색 `마감` 배지가 들어간다. 전에는 배지가 통째로 빠져 메타 줄이
 * 20px에서 16px로 줄었다. 빈 자리로 두는 쪽도 높이는 맞지만 읽는 사람에게 아무 말도 하지
 * 않는다 — `BootcampCard`·`SideStudyCard`가 이미 같은 자리에 `마감`을 그린다.
 * 마감일이 없는 공고(상시채용·마감일 미정)는 같은 자리에 `상시모집` 배지다(`ALWAYS_OPEN_LABEL`).
 *
 * 뿌리가 `<Link>`가 아니라 `relative`인 `div`인 이유는 북마크 버튼이다. 링크 안에 버튼을 두면
 * 잘못된 마크업이고 누를 때 이동까지 함께 일어난다 — 링크와 버튼을 형제로 두고 버튼을 썸네일
 * 오른쪽 위에 겹친다(PRD "카드 안의 버튼은 링크 밖에 둔다"). 겹치는 자리는 전에 아이콘이 있던
 * 자리 그대로라 생김새는 바뀌지 않는다. `h-full`은 링크와 뿌리 둘 다에 있어야 한다 — 칸을
 * 채우는 것은 뿌리이고, 그 높이를 카드 내용에 넘기는 것은 링크다.
 */
export function JobCard({ job, tracking }: JobCardProps) {
  const dday = computeDday(job.recruitmentType, job.recruitmentEndAt);
  const urgent = isDdayUrgent(job.recruitmentType, job.recruitmentEndAt);
  const closed = isRecruitmentClosed(job.recruitmentType, job.recruitmentEndAt, job.closedAt);
  const jobMajor = getJobMajor(job.id);
  const jobInfo = toJobInfo(job);
  const metaParts = [
    EMPLOYMENT_TYPE_LABELS[job.employmentType],
    jobMajor,
    EXPERIENCE_TYPE_LABELS[job.experienceType],
  ].filter((part): part is string => Boolean(part));

  /*
   * 데스크톱은 메타 줄 오른쪽, 모바일은 제목 아래다(`docs/asset/v9 mobile/채용공고 목록.png`).
   * 카드 폭이 158px 안팎이라 메타 줄 끝에 두면 `D-102` 가 두 줄로 꺾인다.
   */
  const deadlineBadge = dday ? (
    <Badge tone={urgent ? 'urgent' : 'main'} className="rounded-full px-2 py-0.5 text-xs font-bold">
      {dday}
    </Badge>
  ) : closed ? (
    <Badge tone="neutral" className="rounded-full px-2 py-0.5 text-xs font-bold">
      마감
    </Badge>
  ) : isAlwaysOpen(job.recruitmentType, job.recruitmentEndAt) ? (
    <Badge tone="main" className="rounded-full px-2 py-0.5 text-xs font-bold">
      {ALWAYS_OPEN_LABEL}
    </Badge>
  ) : null;

  return (
    <div className="relative h-full">
      <JobCardLink
        href={`/jobs/${job.id}`}
        className="group flex h-full flex-col gap-2"
        jobId={job.id}
        jobInfo={jobInfo}
        tracking={tracking}
      >
        <JobThumbnail
          companyName={job.companyName}
          coverImageUrl={job.coverImageUrl}
          logoUrl={job.logoUrl}
        />
        <p className="flex items-center justify-between text-xs text-gray-400">
          <span>{metaParts.join(' · ')}</span>
          {deadlineBadge ? <span className="hidden md:inline-flex">{deadlineBadge}</span> : null}
        </p>
        <JobMeta
          companyName={job.companyName}
          recruitmentType={job.recruitmentType}
          recruitmentEndAt={job.recruitmentEndAt}
          showDeadline={false}
        />
        <p className="line-clamp-2 text-sm font-bold text-gray-900">{job.title}</p>
        {deadlineBadge ? <span className="flex md:hidden">{deadlineBadge}</span> : null}
      </JobCardLink>
      <BookmarkButton
        kind="jobs"
        id={job.id}
        bookmarked={job.bookmarked}
        scrapParams={{ ...jobInfo, click_location: 'card' }}
        className="absolute top-2 right-2"
      />
    </div>
  );
}
