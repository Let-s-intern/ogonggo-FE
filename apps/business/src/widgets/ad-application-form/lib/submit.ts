import {
  type CreateCompanyJobRequest,
  type CreateCompanyJobRequestEmploymentType,
  type CreateCompanyJobRequestExperienceType,
  type CreateCompanyJobRequestJobField,
  type SuccessResponseAuthTokenResponse,
  type SuccessResponseCreateCompanyJobResponse,
  createMyJob,
  signUpCompany,
} from '@ogonggo/api';
import {
  type AdPlacement,
  type AdPlacementKey,
  type AdTargetType,
  createAdApplication,
} from '@/entities/advertisement';
import { saveTokens } from '@/shared/api/authTokens';
import type { AdApplicationFormValues, NewJobDraft } from '../model/form';
import { HEADLINE_PLACEMENTS } from '../model/creative';

export interface SubmitContext {
  signedIn: boolean;
  password: string;
  couponId?: number;
  placements: Map<AdPlacementKey, AdPlacement>;
  /** 앞선 시도에서 만든 새 공고 id. 신청만 실패했을 때 다시 누르면 공고를 또 만들지 않는다. */
  createdPostId?: number;
  onPostCreated: (id: number) => void;
}

export interface SubmitResult {
  applicationNo: string;
  newAccount: boolean;
}

/**
 * 신청 제출. 비회원이면 기업회원 가입(`signUpCompany`) → 토큰 저장, 새 공고면 공고 등록(`createMyJob`), 그다음 광고
 * 신청(`POST /api/v1/users/me/advertisements`) 순서다. 가입·공고는 이미 끝난 단계를 다시 하지 않는다 — 가입하면 로그인
 * 상태가 되어 다음 시도에서 건너뛰고, 만든 공고 id 는 `onPostCreated` 로 들고 있는다.
 *
 * 사업자등록증 이미지와 이메일 인증 결과는 지금 가입 API 에 받을 칸이 없어 보내지 않는다(요청서).
 */
export async function submitApplication(
  values: AdApplicationFormValues,
  context: SubmitContext,
): Promise<SubmitResult> {
  const { contact } = values;
  let newAccount = false;
  if (!context.signedIn) {
    const body = (await signUpCompany({
      email: values.signUp.email.trim(),
      password: context.password,
      organizationName: contact.companyName.trim(),
      managerName: contact.name.trim(),
      managerTitle: contact.title.trim() || undefined,
      managerPhone: contact.phone.trim() || undefined,
    })) as unknown as SuccessResponseAuthTokenResponse;
    if (!body.data) throw new Error('가입 응답에 토큰이 없습니다.');
    saveTokens(body.data);
    newAccount = true;
  }

  let target: AdTargetType = 'JOB';
  let postId: number;
  if (values.postMode === 'NEW') {
    if (context.createdPostId === undefined) {
      const body = (await createMyJob(
        toCreateJobRequest(values.newJob, contact.companyName.trim()),
      )) as unknown as SuccessResponseCreateCompanyJobResponse;
      if (!body.data?.id) throw new Error('공고 등록 응답에 id 가 없습니다.');
      context.onPostCreated(body.data.id);
      postId = body.data.id;
    } else {
      postId = context.createdPostId;
    }
  } else {
    target = values.post!.target;
    postId = values.post!.id;
  }

  const hasHeadline = values.items.some((item) => HEADLINE_PLACEMENTS.includes(item.placementKey));
  const hasBanner = values.items.some(
    (item) => context.placements.get(item.placementKey)?.format === 'BANNER',
  );
  const uploaded = values.creative.source === 'UPLOADED' && hasBanner;
  const { applicationNo } = await createAdApplication({
    postTarget: target,
    postId,
    purpose: values.purpose,
    items: values.items.map(({ placementKey, jobField, startDate, weeks }) => ({
      placementKey,
      jobField,
      startDate,
      weeks,
    })),
    couponId: context.couponId,
    contact: {
      name: contact.name.trim(),
      phone: contact.phone.trim(),
      email: contact.email.trim(),
      companyName: contact.companyName.trim(),
    },
    billing: {
      contractEmail: values.billing.contractEmail.trim() || contact.email.trim(),
      taxInvoiceEmail: values.billing.taxInvoiceEmail.trim() || contact.email.trim(),
      taxInvoiceType: values.billing.taxInvoiceType,
    },
    waitlist: values.waitlist,
    creative: {
      source: uploaded ? 'UPLOADED' : 'OGONGGO_MADE',
      headline: hasHeadline ? values.creative.headline.trim() || undefined : undefined,
      skillTags: values.creative.skillTags,
      taskTags: values.creative.taskTags,
      bannerImageUrlPc: uploaded ? values.creative.bannerImageUrlPc || undefined : undefined,
      bannerImageUrlMo: uploaded ? values.creative.bannerImageUrlMo || undefined : undefined,
    },
    memo: values.memo.trim() || undefined,
    privacyAgreed: values.privacyAgreed,
    policyAgreed: values.policyAgreed,
  });
  return { applicationNo, newAccount };
}

/**
 * 1단계 새 공고를 공고 등록 요청으로. 근무지·급여는 한 칸이라 `compensation` 에 그대로 넣는다. 나머지 공고 칸(상세 내용,
 * 대표 이미지 등)은 마이페이지 공고 수정에서 채운다.
 */
function toCreateJobRequest(job: NewJobDraft, companyName: string): CreateCompanyJobRequest {
  return {
    companyName,
    title: job.title.trim(),
    employmentType: job.employmentType as CreateCompanyJobRequestEmploymentType,
    experienceType: job.experienceType as CreateCompanyJobRequestExperienceType,
    jobField: job.jobField as CreateCompanyJobRequestJobField,
    recruitmentType: job.alwaysOpen ? 'ALWAYS_OPEN' : 'PERIOD',
    recruitmentEndAt: job.alwaysOpen ? undefined : `${job.deadline}T23:59:59`,
    compensation: job.locationAndPay.trim(),
    applicationMethod: 'EXTERNAL_PAGE',
    sourceUrl: job.sourceUrl.trim(),
  };
}
