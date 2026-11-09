import type {
  AdminBootcampDetailResponse,
  CreateProxyBootcampRequest,
  ReplaceAdminBootcampRequest,
} from '@ogonggo/api/src/admin';

/**
 * 부트캠프 대리 등록·전체 수정 화면의 값. 칸과 규칙은 비즈니스 앱의 부트캠프 폼(`apps/business/src/widgets/company-bootcamp-form/model`)을
 * 옮겼다. 다른 곳은 셋이다.
 *
 * - 강사 정보·교육 특징·수료 조건: 비즈니스 폼은 받을 칸이 없어 본문 뒤에 붙이지만, 대리 등록 요청에는 칸이 있어 그대로 싣는다.
 * - 모집 기간 유형: 비즈니스 폼은 마감일이 있는지로 정하지만, 여기서는 채용공고 대리 등록처럼 고른다.
 * - 모집 상태·노출 여부: 어드민에만 있다. 임시저장(`DRAFT`)은 고를 수 없다(`BOOTCAMP_RECRUITMENT_STATUS_OPTIONS` 와 같은 이유).
 *   노출은 대리 등록에서만 쓴다. 전체 수정은 노출을 받지 않는다(운영 값 수정이 바꾼다).
 *
 * 선택 칸은 고르기 전 빈 문자열이고, 숫자·날짜 칸도 입력 중인 문자열이다. 요청 모양은 `toProxyBootcampRequest`·
 * `toReplaceBootcampRequest` 가 만든다.
 */
export interface BootcampFormValues {
  companyName: string;
  logoUrl: string;
  title: string;
  programType: string;
  operationType: CreateProxyBootcampRequest['operationType'] | '';
  /** `YYYY-MM-DD` */
  programStartDate: string;
  programEndDate: string;
  capacity: string;
  tuitionType: CreateProxyBootcampRequest['tuitionType'] | '';
  tuitionAmount: string;
  representativeImageUrl: string;
  shortDescription: string;
  content: string;
  eligibilityAndSelectionProcess: string;
  instructorInfo: string;
  programFeatures: string;
  completionRequirements: string;
  /** 순서가 값이다. 저장할 때 자리에서 `displayOrder` 를 만든다. */
  partners: string[];
  curriculums: CurriculumRow[];
  recruitmentType: CreateProxyBootcampRequest['recruitmentType'];
  recruitmentStartAt: string;
  recruitmentEndAt: string;
  applicationMethod: CreateProxyBootcampRequest['applicationMethod'] | '';
  applicationUrl: string;
  managerEmail: string;
  inquiryUrl: string;
  /** 켜져 있으면 공개 기간을 모집 기간과 같게 두고 공개 기간 칸을 그리지 않는다(비즈니스 폼의 `모집 마감일까지 공개`). */
  publishUntilRecruitmentEnd: boolean;
  publicationStartAt: string;
  publicationEndAt: string;
  sourceUrl: string;
  status: Exclude<CreateProxyBootcampRequest['status'], 'DRAFT'>;
  visibility: NonNullable<CreateProxyBootcampRequest['visibility']>;
}

export interface CurriculumRow {
  /** `<input type="number">` 의 값이라 문자열이다. */
  startWeek: string;
  endWeek: string;
  subtitle: string;
}

export const EMPTY_CURRICULUM_ROW: CurriculumRow = { startWeek: '', endWeek: '', subtitle: '' };

/**
 * 비즈니스 폼의 프로그램 유형 목록. `programType` 은 자유 문자열(최대 50자)이지만 같은 과정이 `부트캠프`·`부트 캠프` 로 갈리지
 * 않게 고르게 한다.
 */
export const PROGRAM_TYPES = ['부트캠프', '직무 교육', '온라인 강의', '세미나 · 특강', '멘토링'];

/** 회사명과 로고는 회원의 기업 정보로 채운다. 목록 칸은 빈 줄 하나로 시작한다 — 줄이 없으면 무엇을 적는 자리인지 안 보인다. */
export function emptyBootcampFormValues(companyName: string, logoUrl: string): BootcampFormValues {
  return {
    companyName,
    logoUrl,
    title: '',
    programType: '',
    operationType: '',
    programStartDate: '',
    programEndDate: '',
    capacity: '',
    tuitionType: '',
    tuitionAmount: '',
    representativeImageUrl: '',
    shortDescription: '',
    content: '',
    eligibilityAndSelectionProcess: '',
    instructorInfo: '',
    programFeatures: '',
    completionRequirements: '',
    partners: [''],
    curriculums: [EMPTY_CURRICULUM_ROW],
    recruitmentType: 'PERIOD',
    recruitmentStartAt: '',
    recruitmentEndAt: '',
    applicationMethod: '',
    applicationUrl: '',
    managerEmail: '',
    inquiryUrl: '',
    publishUntilRecruitmentEnd: true,
    publicationStartAt: '',
    publicationEndAt: '',
    sourceUrl: '',
    status: 'RECRUITING',
    visibility: 'VISIBLE',
  };
}

/**
 * 줄 하나를 다른 자리로 옮긴다. 범위 밖이면 그대로 둔다 — 맨 위 줄의 위 버튼이 줄을 맨 아래로 보내면 옮길 뜻이 없던 순서가
 * 바뀐다(비즈니스 폼 `model/rows.ts` 의 `moveRow`).
 */
export function moveRow<T>(rows: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= rows.length || to >= rows.length) {
    return [...rows];
  }
  const next = [...rows];
  const [moved] = next.splice(from, 1);
  if (moved === undefined) {
    return [...rows];
  }
  next.splice(to, 0, moved);
  return next;
}

/** 다 비운 커리큘럼 줄. 저장할 때 빠지고 검증도 하지 않는다. */
export const isBlankCurriculum = (row: CurriculumRow): boolean =>
  !row.startWeek.trim() && !row.endWeek.trim() && !row.subtitle.trim();

const text = (value: string): string | undefined => value.trim() || undefined;
const number = (value: string): number | undefined =>
  value.trim() === '' ? undefined : Number(value);
const startOfDay = (value: string): string | undefined => (value ? `${value}T00:00:00` : undefined);
const endOfDay = (value: string): string | undefined => (value ? `${value}T23:59:59` : undefined);

/**
 * 화면 값을 `CreateProxyBootcampRequest` 로. `validateBootcampForm` 를 통과한 값만 들어온다.
 *
 * 빈 칸은 싣지 않는다 — 백엔드는 빈 문자열을 `공백일 수 없습니다` 로 거절한다. 상시 모집이면 마감일을, 이메일 지원이면 지원 링크를
 * 싣지 않는다(둘 다 백엔드가 400 을 준다). 빈 제휴사·커리큘럼 줄은 빠지고, 남은 줄의 자리가 `displayOrder` 가 된다.
 */
export function toProxyBootcampRequest(values: BootcampFormValues): CreateProxyBootcampRequest {
  const alwaysOpen = values.recruitmentType === 'ALWAYS_OPEN';
  const recruitmentEnd = alwaysOpen ? '' : values.recruitmentEndAt;
  const publicationStart = values.publishUntilRecruitmentEnd
    ? values.recruitmentStartAt
    : values.publicationStartAt;
  const publicationEnd = values.publishUntilRecruitmentEnd
    ? recruitmentEnd
    : values.publicationEndAt;

  return {
    companyName: values.companyName.trim(),
    logoUrl: text(values.logoUrl),
    title: values.title.trim(),
    programType: values.programType.trim(),
    operationType: values.operationType as CreateProxyBootcampRequest['operationType'],
    recruitmentType: values.recruitmentType,
    recruitmentStartAt: startOfDay(values.recruitmentStartAt),
    recruitmentEndAt: endOfDay(recruitmentEnd),
    programStartDate: values.programStartDate,
    programEndDate: values.programEndDate,
    capacity: number(values.capacity),
    tuitionType: values.tuitionType as CreateProxyBootcampRequest['tuitionType'],
    tuitionAmount: number(values.tuitionAmount),
    representativeImageUrl: values.representativeImageUrl.trim(),
    shortDescription: values.shortDescription.trim(),
    content: values.content.trim(),
    eligibilityAndSelectionProcess: text(values.eligibilityAndSelectionProcess),
    instructorInfo: text(values.instructorInfo),
    programFeatures: text(values.programFeatures),
    completionRequirements: text(values.completionRequirements),
    applicationMethod: values.applicationMethod as CreateProxyBootcampRequest['applicationMethod'],
    applicationUrl: values.applicationMethod === 'EMAIL' ? undefined : text(values.applicationUrl),
    managerEmail: text(values.managerEmail),
    inquiryUrl: text(values.inquiryUrl),
    publicationStartAt: startOfDay(publicationStart),
    publicationEndAt: endOfDay(publicationEnd),
    sourceUrl: text(values.sourceUrl),
    partners: values.partners
      .map((name) => name.trim())
      .filter((name) => name.length > 0)
      .map((partnerName, index) => ({ partnerName, displayOrder: index + 1 })),
    curriculums: values.curriculums
      .filter((row) => !isBlankCurriculum(row))
      .map((row, index) => ({
        startWeek: Number(row.startWeek),
        endWeek: Number(row.endWeek || row.startWeek),
        subtitle: row.subtitle.trim(),
        displayOrder: index + 1,
      })),
    status: values.status,
    visibility: values.visibility,
  };
}

/** 일시(`YYYY-MM-DDTHH:mm:ss`)의 날짜 부분. 날짜 칸은 날짜만 다룬다. */
const datePart = (value: string | undefined): string => value?.slice(0, 10) ?? '';

/**
 * 저장된 부트캠프를 전체 수정 화면 값으로. 전체 교체라 화면에 채우지 않은 값은 저장할 때 지워진다 — 응답의 칸을 빠짐없이 옮긴다.
 *
 * - 공개 기간이 모집 기간과 날짜가 같으면 `모집 마감일까지 공개` 를 켠 것으로 본다. 저장된 것은 날짜뿐이라 달리 알 길이 없다.
 * - 임시저장(`DRAFT`) 과정은 모집 중으로 채운다. 화면에서 고를 수 없는 상태라, 저장하면 모집 중이 된다.
 */
export function bootcampFormValuesFromDetail(
  bootcamp: AdminBootcampDetailResponse,
): BootcampFormValues {
  const recruitmentStartAt = datePart(bootcamp.recruitmentStartAt);
  const recruitmentEndAt = datePart(bootcamp.recruitmentEndAt);
  const publicationStartAt = datePart(bootcamp.publicationStartAt);
  const publicationEndAt = datePart(bootcamp.publicationEndAt);
  const partners = [...bootcamp.partners]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(({ name }) => name);
  const curriculums = [...bootcamp.curriculums]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((row) => ({
      startWeek: String(row.startWeek),
      endWeek: String(row.endWeek),
      subtitle: row.subtitle,
    }));

  return {
    companyName: bootcamp.companyName,
    logoUrl: bootcamp.logoUrl ?? '',
    title: bootcamp.title,
    programType: bootcamp.programType,
    operationType: bootcamp.operationType,
    programStartDate: bootcamp.programStartDate,
    programEndDate: bootcamp.programEndDate,
    capacity: bootcamp.capacity == null ? '' : String(bootcamp.capacity),
    tuitionType: bootcamp.tuitionType,
    tuitionAmount: bootcamp.tuitionAmount == null ? '' : String(bootcamp.tuitionAmount),
    representativeImageUrl: bootcamp.representativeImageUrl ?? '',
    shortDescription: bootcamp.shortDescription,
    content: bootcamp.content,
    eligibilityAndSelectionProcess: bootcamp.eligibilityAndSelectionProcess ?? '',
    instructorInfo: bootcamp.instructorInfo ?? '',
    programFeatures: bootcamp.programFeatures ?? '',
    completionRequirements: bootcamp.completionRequirements ?? '',
    partners: partners.length > 0 ? partners : [''],
    curriculums: curriculums.length > 0 ? curriculums : [EMPTY_CURRICULUM_ROW],
    recruitmentType: bootcamp.recruitmentType,
    recruitmentStartAt,
    recruitmentEndAt,
    applicationMethod: bootcamp.applicationMethod,
    applicationUrl: bootcamp.applicationUrl ?? '',
    managerEmail: bootcamp.managerEmail ?? '',
    inquiryUrl: bootcamp.inquiryUrl ?? '',
    publishUntilRecruitmentEnd:
      publicationStartAt === recruitmentStartAt && publicationEndAt === recruitmentEndAt,
    publicationStartAt,
    publicationEndAt,
    sourceUrl: bootcamp.sourceUrl ?? '',
    status: bootcamp.status === 'DRAFT' ? 'RECRUITING' : bootcamp.status,
    visibility: bootcamp.visibility,
  };
}

/**
 * 화면 값을 `ReplaceAdminBootcampRequest` 로. 대리 등록 요청에서 노출을 빼고, 대표 이미지를 비웠으면 싣지 않는다.
 * `validateBootcampForm(values, { requireRepresentativeImage: false })` 를 통과한 값만 들어온다.
 */
export function toReplaceBootcampRequest(values: BootcampFormValues): ReplaceAdminBootcampRequest {
  const {
    visibility: _visibility,
    representativeImageUrl,
    ...request
  } = toProxyBootcampRequest(values);
  return { ...request, representativeImageUrl: text(representativeImageUrl) };
}
