import type { AdApplicationFormValues } from './form';

/**
 * 단계별 필수 값 검사. 비어 있으면 화면에 보일 문구를 돌려준다. 형식 검사는 서버(목)가 한 번 더 본다.
 */

const NEW_JOB_LABELS: Record<string, string> = {
  title: '공고명',
  employmentType: '채용 형태',
  jobField: '직무',
  experienceType: '요구 경력',
  deadline: '마감일',
  locationAndPay: '근무지 · 급여',
  sourceUrl: '지원 링크',
};

/** 1단계. 공고를 골랐거나, 새 공고의 필수 칸이 다 찼는지. */
export function validateStep1(values: AdApplicationFormValues): string | null {
  if (values.postMode === 'EXISTING') {
    return values.post ? null : '광고할 공고를 골라 주세요.';
  }
  const job = values.newJob;
  const missing = Object.keys(NEW_JOB_LABELS).filter((field) => {
    if (field === 'deadline') return !job.alwaysOpen && !job.deadline;
    return !String(job[field as keyof typeof job]).trim();
  });
  if (missing.length > 0) {
    return `새 공고의 ${missing.map((field) => NEW_JOB_LABELS[field]).join(', ')}을(를) 입력해 주세요.`;
  }
  if (!/^https?:\/\/\S+\.\S+/.test(job.sourceUrl.trim())) {
    return '지원 링크는 http:// 또는 https:// 로 시작하는 주소로 입력해 주세요.';
  }
  return null;
}

/** 2단계. 지면이 하나 이상이고, 겹침·잔여 없는 주가 없는지. */
export function validateStep2(
  values: AdApplicationFormValues,
  hasConflict: boolean,
  hasSoldOut: boolean,
): string | null {
  if (values.items.length === 0) return '광고할 지면을 하나 이상 추가해 주세요.';
  if (hasConflict) return '같은 주에 겹치는 지면이 있어요. 표시된 항목의 주를 바꿔 주세요.';
  if (hasSoldOut) return '잔여 구좌가 없는 주가 있어요. 다른 주로 바꾸거나 지면을 빼 주세요.';
  return null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 3단계. 비회원 가입 칸(인증, 비밀번호, 개인 메일이면 사업자등록증)과 담당자 필수 칸. */
export function validateStep3(
  values: AdApplicationFormValues,
  { signedIn, password, freeMail }: { signedIn: boolean; password: string; freeMail: boolean },
): string | null {
  if (!signedIn) {
    const email = values.signUp.email.trim();
    if (!email || values.signUp.verifiedEmail !== email) return '회사 이메일 인증을 마쳐 주세요.';
    if (password.length < 8) return '비밀번호는 8자 이상으로 입력해 주세요.';
    if (freeMail && !values.signUp.businessLicenseUrl)
      return '개인 메일로 가입하려면 사업자등록증을 올려 주세요.';
  }
  const { contact } = values;
  if (
    !contact.name.trim() ||
    !contact.email.trim() ||
    !contact.phone.trim() ||
    !contact.companyName.trim()
  ) {
    return '담당자 이름, 이메일, 전화, 회사명을 입력해 주세요.';
  }
  const emails = [
    contact.email,
    contact.ccEmail,
    values.billing.contractEmail,
    values.billing.taxInvoiceEmail,
  ]
    .map((each) => each.trim())
    .filter(Boolean);
  if (emails.some((each) => !EMAIL.test(each))) return '이메일 형식을 확인해 주세요.';
  return null;
}

/** 4단계. 역량 키워드·수행 Task 각 1개 이상, 직접 업로드면 PC 배너. */
export function validateStep4(values: AdApplicationFormValues, hasBanner: boolean): string | null {
  const { creative } = values;
  if (creative.skillTags.length === 0 || creative.taskTags.length === 0) {
    return '필수 역량 키워드와 상세 수행 Task 를 하나 이상 입력해 주세요.';
  }
  if (creative.source === 'UPLOADED' && hasBanner && !creative.bannerImageUrlPc) {
    return '직접 업로드를 골랐다면 PC 배너 이미지를 올려 주세요.';
  }
  return null;
}

/** 5단계. 두 필수 동의. */
export function validateStep5(values: AdApplicationFormValues): string | null {
  return values.privacyAgreed && values.policyAgreed
    ? null
    : '개인정보 수집·이용과 광고 운영 정책에 동의해 주세요.';
}
