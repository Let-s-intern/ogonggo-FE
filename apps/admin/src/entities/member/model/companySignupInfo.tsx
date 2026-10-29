import { enumLabel } from '@ogonggo/api';
import type { AdminCompanyMemberResponse } from '@ogonggo/api/src/admin';
import type { DescriptionItem } from '@ogonggo/ui';

/**
 * 기업 회원이 가입 때 낸 기업·담당자 정보(LC-3526)를 `DescriptionList` 줄로 바꾼다. 목록 모달과 상세 화면이
 * 같은 줄을 쓴다. 목록 항목과 상세 응답이 같은 필드를 가져 목록 항목 타입으로 받는다.
 *
 * 그 전에 가입한 회원은 값이 없어 `-` 다. 빈 칸은 값이 안 그려진 것과 구분되지 않는다.
 */
type CompanySignupInfo = Pick<
  AdminCompanyMemberResponse,
  | 'businessNumberType'
  | 'businessNumber'
  | 'companyType'
  | 'employeeCountRange'
  | 'industry'
  | 'address'
  | 'homepageUrl'
  | 'managerTitle'
  | 'managerDuty'
  | 'recommender'
>;

const orDash = (value: string | undefined) => value ?? '-';

/** 카탈로그 라벨. 값이 없으면 `-` 다. */
const labelOrDash = (
  name: 'CompanyType' | 'CompanyEmployeeCountRange' | 'CompanyManagerDuty',
  value: string | undefined,
) => (value ? enumLabel(name, value) : '-');

/**
 * 사업자 번호 칸. 종류 라벨과 하이픈 넣은 번호(가입 화면과 같은 자리), 해외 기업은 종류 라벨만 보인다.
 * 서버는 숫자만 저장한다.
 */
function businessNumberOf(member: CompanySignupInfo): string {
  const { businessNumberType: type, businessNumber: number } = member;
  if (!type) return '-';
  const label = enumLabel('CompanyBusinessNumberType', type);
  if (!number) return label;
  const formatted =
    type === 'CORPORATE_REGISTRATION'
      ? `${number.slice(0, 6)}-${number.slice(6)}`
      : `${number.slice(0, 3)}-${number.slice(3, 5)}-${number.slice(5)}`;
  return `${label} ${formatted}`;
}

export function companyInfoItems(member: CompanySignupInfo): DescriptionItem[] {
  return [
    { label: '사업자 번호', value: businessNumberOf(member), full: true },
    { label: '기업 형태', value: labelOrDash('CompanyType', member.companyType) },
    {
      label: '직원 수',
      value: labelOrDash('CompanyEmployeeCountRange', member.employeeCountRange),
    },
    { label: '산업', value: orDash(member.industry) },
    {
      label: '홈페이지',
      value: member.homepageUrl ? (
        <a
          href={member.homepageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-blue-600 hover:underline"
        >
          {member.homepageUrl}
        </a>
      ) : (
        '-'
      ),
    },
    { label: '주소', value: orDash(member.address), full: true },
  ];
}

export function managerInfoItems(member: CompanySignupInfo): DescriptionItem[] {
  return [
    { label: '직책', value: orDash(member.managerTitle) },
    { label: '담당 업무', value: labelOrDash('CompanyManagerDuty', member.managerDuty) },
    { label: '추천인', value: orDash(member.recommender), full: true },
  ];
}
