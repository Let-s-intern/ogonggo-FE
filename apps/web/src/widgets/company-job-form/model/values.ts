import type {
  CompanyJobDetailResponse,
  CreateCompanyJobRequestApplicationMethod,
  CreateCompanyJobRequestEducationLevel,
  CreateCompanyJobRequestEmploymentType,
  CreateCompanyJobRequestExperienceType,
} from '@ogonggo/api';

/**
 * 채용공고 작성 화면이 들고 있는 값(v5 PRD 3 절). `CreateCompanyJobRequest` 와 한 칸씩 짝이
 * 맞되, 고르지 않은 드롭다운을 빈 문자열로 들고 있어 타입이 다르다 — `<select>` 의 값은 늘
 * 문자열이고, 숫자 칸(`recruitmentHeadcount`) 도 적기 전에는 값이 없다.
 *
 * **목업에 있는데 여기 없는 칸 셋**(기업 로고, 근무 방식, 담당자 이메일) 은 받을 필드가 없어
 * 화면에만 비활성으로 그린다(v5 PRD 3 절). 값을 들고 있지 않는 것이 그 결정의 전부다 —
 * 들고 있으면 언젠가 저장되는 것처럼 보인다.
 */
export interface CompanyJobFormValues {
  companyName: string;
  title: string;
  jobField: string;
  employmentType: CreateCompanyJobRequestEmploymentType | '';
  experienceType: CreateCompanyJobRequestExperienceType | '';
  educationLevel: CreateCompanyJobRequestEducationLevel | '';
  region: string;
  recruitmentHeadcount: string;
  coverImageUrl: string;
  responsibilities: string;
  qualifications: string;
  preferredQualifications: string;
  benefits: string;
  hiringProcess: string;
  /** `YYYY-MM-DD`. 백엔드는 일시로 받고, 화면은 날짜만 다룬다(`lib/datetime.ts`). */
  recruitmentStartAt: string;
  recruitmentEndAt: string;
  applicationMethod: CreateCompanyJobRequestApplicationMethod | '';
  sourceUrl: string;
  recruitmentNotice: string;
  autoCloseEnabled: boolean;
}

/**
 * 목업에 칸이 없는데 응답에는 있는 값들. **화면이 그리지 않고 그대로 되돌려 보낸다.**
 *
 * 수정은 `PUT` 전체 교체라 보내지 않은 칸이 비워진다. 크롤러가 넣었거나 운영자가 채운
 * `jobRole`·`compensation` 같은 값이, 기업이 제목 한 줄을 고쳤다는 이유로 사라지면 안 된다.
 *
 * 새 공고에는 전부 비어 있다. 목업에 칸이 없으니 채울 방법도 없다.
 */
export interface CompanyJobPassthrough {
  parentCompanyName?: string;
  jobRole?: string;
  industry?: string;
  experienceMinYears?: number;
  companyAndTeamIntroduction?: string;
  compensation?: string;
  closesWhenFilled?: boolean;
}

export const EMPTY_COMPANY_JOB_VALUES: CompanyJobFormValues = {
  companyName: '',
  title: '',
  jobField: '',
  employmentType: '',
  experienceType: '',
  educationLevel: '',
  region: '',
  recruitmentHeadcount: '',
  coverImageUrl: '',
  responsibilities: '',
  qualifications: '',
  preferredQualifications: '',
  benefits: '',
  hiringProcess: '',
  recruitmentStartAt: '',
  recruitmentEndAt: '',
  applicationMethod: '',
  sourceUrl: '',
  recruitmentNotice: '',
  autoCloseEnabled: false,
};

export const EMPTY_COMPANY_JOB_PASSTHROUGH: CompanyJobPassthrough = {};

/** 일시(`2026-09-21T23:59:59`) 에서 달력 날짜만 꺼낸다. 화면의 날짜 칸이 그 모양이다. */
const dateOnly = (value?: string) => value?.slice(0, 10) ?? '';

/** 읽어 온 공고를 화면 값으로(v5 PRD 3 절). */
export function toCompanyJobValues(job: CompanyJobDetailResponse): CompanyJobFormValues {
  return {
    companyName: job.companyName,
    title: job.title,
    jobField: job.jobField ?? '',
    employmentType: job.employmentType,
    experienceType: job.experienceType,
    educationLevel: job.educationLevel,
    region: job.region ?? '',
    recruitmentHeadcount:
      job.recruitmentHeadcount === undefined ? '' : String(job.recruitmentHeadcount),
    coverImageUrl: job.coverImageUrl ?? '',
    responsibilities: job.responsibilities ?? '',
    qualifications: job.qualifications ?? '',
    preferredQualifications: job.preferredQualifications ?? '',
    benefits: job.benefits ?? '',
    hiringProcess: job.hiringProcess ?? '',
    recruitmentStartAt: dateOnly(job.recruitmentStartAt),
    recruitmentEndAt: dateOnly(job.recruitmentEndAt),
    applicationMethod: job.applicationMethod ?? '',
    sourceUrl: job.sourceUrl ?? '',
    recruitmentNotice: job.recruitmentNotice ?? '',
    autoCloseEnabled: job.autoCloseEnabled ?? false,
  };
}

/** 화면이 그리지 않는 값들을 따로 들고 있는다(`CompanyJobPassthrough`). */
export function toCompanyJobPassthrough(job: CompanyJobDetailResponse): CompanyJobPassthrough {
  return {
    parentCompanyName: job.parentCompanyName,
    jobRole: job.jobRole,
    industry: job.industry,
    experienceMinYears: job.experienceMinYears,
    companyAndTeamIntroduction: job.companyAndTeamIntroduction,
    compensation: job.compensation,
    closesWhenFilled: job.closesWhenFilled,
  };
}
