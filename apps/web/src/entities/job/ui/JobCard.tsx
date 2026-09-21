import Link from 'next/link';
import { Badge } from '@ogonggo/ui';
import { BookmarkButton } from '@/features/bookmark';
import { computeDday, isDdayUrgent, isRecruitmentClosed } from '@/shared/lib/dday';
import { getJobMajor } from '../model/job-major';
import { EMPLOYMENT_TYPE_LABELS, EXPERIENCE_TYPE_LABELS } from '../model/labels';
import type { JobSummary } from '../model/types';
import { JobMeta } from './JobMeta';
import { JobThumbnail } from './JobThumbnail';

export interface JobCardProps {
  job: JobSummary;
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
 * 상시채용과 마감일 미정은 지금처럼 배지가 없다.
 *
 * 뿌리가 `<Link>`가 아니라 `relative`인 `div`인 이유는 북마크 버튼이다. 링크 안에 버튼을 두면
 * 잘못된 마크업이고 누를 때 이동까지 함께 일어난다 — 링크와 버튼을 형제로 두고 버튼을 썸네일
 * 오른쪽 위에 겹친다(PRD "카드 안의 버튼은 링크 밖에 둔다"). 겹치는 자리는 전에 아이콘이 있던
 * 자리 그대로라 생김새는 바뀌지 않는다. `h-full`은 링크와 뿌리 둘 다에 있어야 한다 — 칸을
 * 채우는 것은 뿌리이고, 그 높이를 카드 내용에 넘기는 것은 링크다.
 */
export function JobCard({ job }: JobCardProps) {
  const dday = computeDday(job.recruitmentType, job.recruitmentEndAt);
  const urgent = isDdayUrgent(job.recruitmentType, job.recruitmentEndAt);
  const closed = isRecruitmentClosed(job.recruitmentType, job.recruitmentEndAt, job.closedAt);
  const jobMajor = getJobMajor(job.id);
  const metaParts = [
    EMPLOYMENT_TYPE_LABELS[job.employmentType],
    jobMajor,
    EXPERIENCE_TYPE_LABELS[job.experienceType],
  ].filter((part): part is string => Boolean(part));
  // 크롤링된 region에 지역명 대신 공고의 안내 문장이 들어오는 경우가 있다
  // (예: "※ 근무 지역은 서울입니다."). 카드의 지역 자리에는 싣지 않는다.
  const region = job.region?.startsWith('※') ? undefined : job.region;

  return (
    <div className="relative h-full">
      <Link href={`/jobs/${job.id}`} className="flex h-full flex-col gap-2">
        <JobThumbnail companyName={job.companyName} />
        <p className="flex items-center justify-between text-xs text-gray-400">
          <span>{metaParts.join(' · ')}</span>
          {dday ? (
            <Badge
              tone={urgent ? 'urgent' : 'main'}
              className="rounded-full px-2 py-0.5 text-xs font-bold"
            >
              {dday}
            </Badge>
          ) : closed ? (
            <Badge tone="neutral" className="rounded-full px-2 py-0.5 text-xs font-bold">
              마감
            </Badge>
          ) : null}
        </p>
        <JobMeta
          companyName={job.companyName}
          region={region}
          recruitmentType={job.recruitmentType}
          recruitmentEndAt={job.recruitmentEndAt}
          showDeadline={false}
        />
        <p className="line-clamp-2 text-sm font-bold text-gray-900">{job.title}</p>
      </Link>
      <BookmarkButton
        kind="jobs"
        id={job.id}
        bookmarked={job.bookmarked}
        className="absolute top-2 right-2"
      />
    </div>
  );
}
