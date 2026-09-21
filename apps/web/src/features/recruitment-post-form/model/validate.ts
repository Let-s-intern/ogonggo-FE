import type { RecruitmentPostFormValues } from './values';

/**
 * 게시(`PUBLISH`) 에 필요한 값이 다 있는지 본다. 모자라면 첫 한 줄을 돌려준다.
 *
 * `DRAFT` 는 검사하지 않는다 — 생성 타입이 "`DRAFT` 는 제목만 필수" 라고 적고 있어, 쓰다 만
 * 글을 그대로 담아 두는 것이 임시저장의 일이다.
 *
 * 필수 칸의 목록은 목업의 별표(`*`) 그대로다. 두 곳만 목업에서 읽어낼 수 없어 여기서 정한다.
 *
 * - 오픈 카톡방 링크에는 별표가 없지만, 공개 상세(`RecruitmentPostDetailResponse.contact`) 는
 *   수단과 주소를 함께 요구한다. 주소 없이 게시하면 본 사람이 연락할 방법이 없다.
 * - 마감일이 시작일보다 앞서면 백엔드에 보내기 전에 막는다. D-day 계산이 음수가 되는 글이
 *   목록에 생긴다.
 */
export function validateForPublish(values: RecruitmentPostFormValues): string | null {
  if (!values.title.trim()) {
    return '사이드 프로젝트 · 스터디명을 입력해 주세요.';
  }
  if (!values.recruitmentType) {
    return '모집 구분을 선택해 주세요.';
  }
  if (!values.capacity) {
    return '모집 인원을 선택해 주세요.';
  }
  if (!values.progressMethod) {
    return '진행 방식을 선택해 주세요.';
  }
  if (!values.activityDurationMonths) {
    return '진행 기간을 선택해 주세요.';
  }
  if (!values.summary.trim()) {
    return '한 줄 소개를 입력해 주세요.';
  }
  if (!values.contentText.trim()) {
    return '모집 상세 내용을 입력해 주세요.';
  }
  if (!values.recruitmentStartDate) {
    return '모집 시작일을 입력해 주세요.';
  }
  if (!values.recruitmentEndDate) {
    return '모집 마감일을 입력해 주세요.';
  }
  if (values.recruitmentEndDate < values.recruitmentStartDate) {
    return '모집 마감일은 모집 시작일과 같거나 그 뒤여야 합니다.';
  }
  if (values.positions.length === 0) {
    return '모집 포지션을 한 개 이상 선택해 주세요.';
  }
  if (!values.contactMethod) {
    return '소통 방법을 선택해 주세요.';
  }
  if (!values.contactValue.trim()) {
    return values.contactMethod === 'EMAIL'
      ? '이메일 주소를 입력해 주세요.'
      : '오픈 카톡방 링크를 입력해 주세요.';
  }
  if (!values.agreedToPolicy) {
    return '정보 제공 및 운영 정책에 동의해 주세요.';
  }
  return null;
}
