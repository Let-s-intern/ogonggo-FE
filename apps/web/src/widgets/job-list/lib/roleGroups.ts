import { jobRolesOf } from '@/entities/job/model/labels';
import type { JobField, JobRole } from '@/entities/job/model/types';

/** 직군 안의 중간 묶음. 직무 창(`ui/JobRoleSheet.tsx`)에서 직군과 직무 사이에 선다. */
export interface JobRoleGroup {
  label: string;
  roles: JobRole[];
}

/**
 * 직무 칩 다섯 직군의 중간 묶음(LC-3566, PRD `prd-job-filter-improve.md` 결정 1 A). BE 가 2026-10-12 에
 * 직군을 합쳐 `HR·총무` 안에 회계·고객상담이, `마케팅·광고` 안에 미디어가 들어갔다. 이름만 보고는 그 안에
 * 무엇이 있는지 알 수 없고, "인사만" 고르려면 직무 넷을 눌러야 해서 FE 에서 다시 묶는다. 묶음은 화면의
 * 단위일 뿐이고 요청과 주소에는 지금처럼 `jobRole` 여럿으로 실린다.
 *
 * 대부분 BE 가 합치기 전 직군(`회계·세무·재무`, `고객상담·TM`, `미디어·엔터`, `AI·데이터`, `디자인`,
 * `상품기획·MD`)과 같다. 직무 목록의 원본은 BE `JobRole` enum 이다.
 */
const GROUPS: Partial<Record<JobField, JobRoleGroup[]>> = {
  MARKETING_ADVERTISING: [
    {
      label: '마케팅',
      roles: [
        'MARKETING_STRATEGY',
        'MARKETING_PERFORMANCE',
        'MARKETING_CONTENT',
        'MARKETING_SNS',
        'MARKETING_BRAND',
        'MARKETING_CRM',
        'MARKETING_GLOBAL',
        'MARKETING_AD_PLANNING_AE',
        'MARKETING_PR',
        'MARKETING_EXHIBITION_EVENT',
        'MARKETING_ETC',
      ],
    },
    {
      label: '미디어·콘텐츠',
      roles: [
        'MEDIA_PD_DIRECTOR',
        'MEDIA_CONTENT_PLANNING_EDITOR',
        'MEDIA_VIDEO_EDITOR',
        'MEDIA_CREATOR_INFLUENCER',
      ],
    },
  ],
  HR_GENERAL_AFFAIRS: [
    {
      label: '인사',
      roles: ['HR_PLANNING', 'HR_COMPENSATION', 'HR_HRD_CULTURE', 'HR_LABOR_RELATIONS'],
    },
    { label: '총무', roles: ['HR_GENERAL_AFFAIRS_SECRETARY', 'HR_ETC'] },
    {
      label: '회계·재무',
      roles: ['ACCOUNTING_FINANCE', 'ACCOUNTING_ACCOUNTING', 'ACCOUNTING_TAX', 'ACCOUNTING_ETC'],
    },
    { label: '고객상담', roles: ['CS_CS', 'CS_CX_MANAGER'] },
  ],
  PLANNING_STRATEGY: [
    {
      label: '기획·전략',
      roles: [
        'PLANNING_PM_PO',
        'PLANNING_SERVICE_PRODUCT_PLANNING',
        'PLANNING_BUSINESS_STRATEGY',
        'PLANNING_CONSULTING',
        'PLANNING_BUSINESS_DEVELOPMENT',
        'PLANNING_PROJECT_MANAGER',
        'PLANNING_OPERATIONS_MANAGEMENT',
        'PLANNING_MANAGEMENT_SUPPORT',
        'PLANNING_ETC',
      ],
    },
    { label: '디자인', roles: ['DESIGN_UX_UI_PRODUCT', 'DESIGN_RESEARCH'] },
    {
      label: '상품기획·MD',
      roles: [
        'MD_PRODUCT_PLANNING',
        'MD_ONLINE',
        'MD_FOOD',
        'MD_FASHION',
        'MD_BEAUTY',
        'MD_SALES',
        'MD_RETAIL',
        'MD_ETC',
      ],
    },
  ],
  IT_DEVELOPMENT: [
    {
      label: '개발',
      roles: [
        'IT_BACKEND',
        'IT_FRONTEND_FULLSTACK',
        'IT_WEB',
        'IT_ANDROID',
        'IT_IOS',
        'IT_INFRA_DEVOPS',
        'IT_SECURITY',
        'IT_EMBEDDED_IOT_ROBOTICS',
        'IT_ERP_SAP',
        'IT_DEV_PM',
        'IT_ETC',
      ],
    },
    {
      label: 'AI·데이터',
      roles: [
        'AI_DATA_ANALYST_SCIENTIST',
        'AI_DATA_ENGINEER',
        'AI_ML_MLOPS',
        'AI_LLM_GENERATIVE_AI',
        'AI_ETC',
      ],
    },
  ],
};

/**
 * 직군의 묶음들. 묶음을 정하지 않은 직군(`영업`)은 직군 이름의 묶음 하나다. 위 표에 없는 직무 — BE 가
 * 직무를 더하고 codegen 만 돌린 경우 — 는 `기타` 묶음으로 보여 창에서 말없이 사라지지 않게 한다.
 */
export function jobRoleGroupsOf(field: JobField, fieldLabel: string): JobRoleGroup[] {
  const roles = jobRolesOf(field);
  const groups = (GROUPS[field] ?? []).map((group) => ({
    label: group.label,
    roles: group.roles.filter((role) => roles.includes(role)),
  }));
  const grouped = new Set(groups.flatMap((group) => group.roles));
  const rest = roles.filter((role) => !grouped.has(role));
  if (groups.length === 0) {
    return [{ label: fieldLabel, roles }];
  }
  return rest.length > 0 ? [...groups, { label: '기타', roles: rest }] : groups;
}
