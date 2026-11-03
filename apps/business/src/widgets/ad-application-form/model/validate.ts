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
