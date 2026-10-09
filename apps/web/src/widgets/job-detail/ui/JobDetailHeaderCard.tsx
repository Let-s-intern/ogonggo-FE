import { Card } from '@ogonggo/ui';
import { CompanyLogo } from '@/entities/job/ui/CompanyLogo';
import type { JobRecruitmentType } from '@/entities/job/model/types';
import { DdayBadge } from '@/shared/ui/DdayBadge';
import { EyeIcon } from '@/shared/ui/icons';
import { ALWAYS_OPEN_LABEL } from '@/shared/lib/dday';

export interface JobDetailHeaderCardProps {
  companyName: string;
  logoUrl?: string;
  region?: string;
  title: string;
  recruitmentType: JobRecruitmentType;
  recruitmentEndAt?: string;
  viewCount: number;
  /**
   * `page` 는 `/jobs/[jobId]` 화면(v12 시안), `modal` 은 공고 달력의 상세 모달이다. 모달은 v6 시안
   * (`docs/asset/v6 공고달력/공고 상세 모달.png`)의 회색 카드 모양을 그대로 유지한다.
   */
  layout?: 'page' | 'modal';
}

/**
 * `page` 는 v12 시안 실측값이다. `modal` 은 v12 이전 원본 클래스(`0cb382b`)를 한 글자도 바꾸지 않고 옮겼다.
 */
const STYLES = {
  page: {
    root: 'p-4 md:px-0 md:py-6',
    logo: 'h-10 w-10 md:h-13 md:w-13',
    name: 'text-sm font-semibold text-gray-600 md:text-base',
    region: 'mt-1 text-xs text-gray-400 md:text-sm',
    title: 'mt-7 text-lg font-bold text-gray-800 md:text-3xl',
    row: 'mt-5 flex items-center gap-3 text-sm md:mt-6 md:gap-5 md:text-base',
    views: 'ml-auto flex items-center gap-1 text-xs text-gray-400',
    eye: 'h-3.5 w-3.5',
  },
  modal: {
    root: 'bg-gray-50 p-4 md:p-8',
    logo: 'h-10 w-10 md:h-16 md:w-16',
    name: 'font-bold text-gray-900',
    region: 'text-sm text-gray-500',
    title: 'mt-4 text-xl font-bold text-gray-900 md:mt-6 md:text-3xl',
    row: 'flex items-center gap-3 text-sm',
    views: 'ml-auto flex items-center gap-1 text-gray-400',
    eye: 'h-4 w-4',
  },
} as const;

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 상세 헤더 마감일시 문구("7/25(토) 23:59 마감"). `entities/job/ui/JobMeta.tsx`의
 * `formatDeadline`은 목록 카드용 짧은 표기("~7.25 마감")라 요일·시각이 없다 — 이 화면
 * 전용으로 로컬에 둔다.
 */
export function formatDeadlineText(
  recruitmentType: JobRecruitmentType,
  recruitmentEndAt?: string,
): string {
  if (recruitmentType === 'ALWAYS_OPEN' || !recruitmentEndAt) {
    return ALWAYS_OPEN_LABEL;
  }
  const end = new Date(recruitmentEndAt);
  const weekday = WEEKDAY_LABELS[end.getDay()];
  const hours = String(end.getHours()).padStart(2, '0');
  const minutes = String(end.getMinutes()).padStart(2, '0');
  return `${end.getMonth() + 1}/${end.getDate()}(${weekday}) ${hours}:${minutes} 마감`;
}

/**
 * 상세 페이지 상단 회사 정보 헤더 — 로고, 회사명·지역(업종은 대응 필드 없어 뺀다, PRD 10절), 제목,
 * D-day 배지·마감일시, 조회수. "댓글" 아이콘·수는 뺀다(PRD 10절).
 *
 * v12 시안(`docs/asset/v12 채용공고 상세/상세 기본.webp`, `모바일 상세 하단 고정바.png`)은 헤더에
 * 카드 배경·테두리·구분선이 없다. 데스크톱은 글자가 아래 본문 열의 가장자리에서 바로 시작하고
 * (`md:px-0`), 모바일은 카드가 있던 자리만큼 안쪽으로 16px 들어간다(`p-4`). 크기는 시안 실측이다 —
 * 모바일은 제목 18px · 회사명 14px · 로고 40px, 데스크톱은 제목 24px · 회사명 16px · 로고 52px.
 *
 * `layout="modal"` 이면 카드 배경·구분선이 있는 v12 이전 모양이다. 부르는 쪽(`JobDetailView`)이 같은
 * `layout` 을 넘겨야 모달이 옛 모양을 지킨다.
 */
export function JobDetailHeaderCard({
  companyName,
  logoUrl,
  region,
  title,
  recruitmentType,
  recruitmentEndAt,
  viewCount,
  layout = 'page',
}: JobDetailHeaderCardProps) {
  const styles = STYLES[layout];
  const content = (
    <>
      <div className="flex items-center gap-3">
        <CompanyLogo companyName={companyName} logoUrl={logoUrl} className={styles.logo} />
        <div>
          <p className={styles.name}>{companyName}</p>
          {region ? <p className={styles.region}>{region}</p> : null}
        </div>
      </div>
      <h1 className={styles.title}>{title}</h1>
      {layout === 'modal' ? <hr className="my-4 border-gray-200 md:my-6" /> : null}
      <div className={styles.row}>
        <DdayBadge recruitmentType={recruitmentType} recruitmentEndAt={recruitmentEndAt} />
        <span className="text-gray-500">
          {formatDeadlineText(recruitmentType, recruitmentEndAt)}
        </span>
        <span className={styles.views}>
          <EyeIcon className={styles.eye} />
          {viewCount}
        </span>
      </div>
    </>
  );

  return layout === 'modal' ? (
    <Card className={styles.root}>{content}</Card>
  ) : (
    <div className={styles.root}>{content}</div>
  );
}
