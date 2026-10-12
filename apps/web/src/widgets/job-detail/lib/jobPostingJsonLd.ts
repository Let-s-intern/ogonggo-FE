import type { JobDetail, JobEmploymentType } from '@/entities/job/model/types';
import { REGION_LABELS } from '@/entities/job/model/labels';
import { SITE_ORIGIN } from '@/shared/config/site';
import { buildSections } from '../ui/OriginalTab';

/**
 * schema.org `JobPosting` 구조화 데이터(https://schema.org/JobPosting). 검색 엔진이 공고 상세를
 * 채용공고로 알아보게 한다 — 구글 채용 검색이 이것을 읽는다.
 *
 * 필수인 `datePosted` 를 채울 값이 `recruitmentStartAt` 뿐이라, 그것이 없는 공고는 아예 내지 않는다
 * (`null`). 필수 칸이 빈 데이터는 검색 엔진이 오류로 본다.
 *
 * 백엔드 시각은 시간대가 없는 한국 시간(`2026-10-10T00:00:00`)이라 `+09:00` 을 붙인다.
 */
const EMPLOYMENT_TYPES: Record<JobEmploymentType, string> = {
  FULL_TIME: 'FULL_TIME',
  CONTRACT: 'CONTRACTOR',
  INTERN: 'INTERN',
  PART_TIME: 'PART_TIME',
  WORK_STUDY: 'OTHER',
  WORK_EXPERIENCE: 'OTHER',
  ETC: 'OTHER',
};

const withKstOffset = (localDateTime: string) =>
  /[zZ]|[+-]\d{2}:\d{2}$/.test(localDateTime) ? localDateTime : `${localDateTime}+09:00`;

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** 공고 원문 탭과 같은 순서·라벨로 본문을 HTML 로 엮는다. 구글은 `description` 에 HTML 을 권한다. */
function buildDescription(job: JobDetail): string {
  const body = buildSections(job)
    .filter((section) => section.value?.trim())
    .map(
      ({ label, value }) =>
        `<h3>${escapeHtml(label)}</h3><p>${escapeHtml(value ?? '').replace(/\n/g, '<br>')}</p>`,
    )
    .join('');
  return body || escapeHtml(`${job.companyName} ${job.title}`);
}

/** 지역이 시·도로 정해진 공고만 근무지를 적는다. 전국·해외는 주소로 나타낼 수 없다. */
function buildJobLocation(job: JobDetail) {
  if (job.region === 'OVERSEAS') {
    return undefined;
  }
  const regional = job.region && job.region !== 'NATIONWIDE';
  return {
    '@type': 'Place',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'KR',
      ...(regional ? { addressRegion: REGION_LABELS[job.region!] } : {}),
    },
  };
}

export function buildJobPostingJsonLd(job: JobDetail): Record<string, unknown> | null {
  if (!job.recruitmentStartAt) {
    return null;
  }
  const validThrough = job.recruitmentEndAt ?? job.closedAt;

  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: buildDescription(job),
    datePosted: withKstOffset(job.recruitmentStartAt),
    ...(validThrough ? { validThrough: withKstOffset(validThrough) } : {}),
    employmentType: EMPLOYMENT_TYPES[job.employmentType],
    hiringOrganization: {
      '@type': 'Organization',
      name: job.companyName,
      ...(job.logoUrl ? { logo: job.logoUrl } : {}),
    },
    ...(buildJobLocation(job) ? { jobLocation: buildJobLocation(job) } : {}),
    identifier: { '@type': 'PropertyValue', name: '오늘의 공고', value: String(job.id) },
    url: `${SITE_ORIGIN}/jobs/${job.id}`,
    directApply: false,
  };
}

/** `<script type="application/ld+json">` 에 넣을 문자열. `<` 를 바꿔 본문 글자가 스크립트를 닫지 못하게 한다. */
export const serializeJsonLd = (data: Record<string, unknown>) =>
  JSON.stringify(data).replace(/</g, '\\u003c');
