'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect } from 'react';
import { enumOptions } from '@ogonggo/api';
import { Badge, Checkbox, Field, Input, Select, cn } from '@ogonggo/ui';
import { fetchSelectablePosts } from '../lib/myPosts';
import {
  type AdApplicationFormValues,
  EMPTY_NEW_JOB,
  type NewJobDraft,
  PURPOSES,
} from '../model/form';

export interface StepPostProps {
  values: AdApplicationFormValues;
  signedIn: boolean;
  /** `?jobId=` 로 들어오면 그 공고를 고른다. */
  preselectJobId?: number;
  patch: (next: Partial<AdApplicationFormValues>) => void;
}

const withBlank = (options: { value: string; label: string }[]) => [
  { value: '', label: '선택해 주세요' },
  ...options,
];
const EMPLOYMENT_OPTIONS = withBlank(enumOptions('JobEmploymentType'));
const EXPERIENCE_OPTIONS = withBlank(enumOptions('JobExperienceType'));
const JOB_FIELD_OPTIONS = withBlank(enumOptions('JobField'));

/**
 * 1단계 공고 선택(시안 B-04). 로그인했으면 게시 중인 내 공고를 라디오로 고르고, 없거나 비로그인이면 `새 공고 바로 등록`
 * 칸이 열린다. 새 공고는 신청할 때 함께 등록된다(공고 검수와 광고 검수가 함께 진행). 아래에 광고 목적 셋.
 */
export function StepPost({ values, signedIn, preselectJobId, patch }: StepPostProps) {
  const {
    data: posts,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['ad-application', 'selectable-posts'],
    queryFn: fetchSelectablePosts,
    enabled: signedIn,
  });
  const hasPosts = signedIn && (posts?.length ?? 0) > 0;

  // 고를 공고가 없으면 새 공고 칸을 연다. `?jobId=` 의 공고가 게시 중이면 그것을 고른다.
  useEffect(() => {
    if (!signedIn) {
      if (values.postMode !== 'NEW') patch({ postMode: 'NEW', post: undefined });
      return;
    }
    if (!posts) return;
    if (preselectJobId !== undefined && !values.post) {
      const found = posts.find((post) => post.target === 'JOB' && post.id === preselectJobId);
      if (found) patch({ postMode: 'EXISTING', post: found });
    } else if (posts.length === 0 && values.postMode !== 'NEW') {
      patch({ postMode: 'NEW', post: undefined });
    }
    // 들어올 때(로그인 상태와 공고 목록이 정해질 때) 한 번 맞춘다. 그 뒤로는 사용자가 고른다.
  }, [signedIn, posts]);

  const setJob = <K extends keyof NewJobDraft>(field: K, value: NewJobDraft[K]) =>
    patch({ newJob: { ...values.newJob, [field]: value } });

  return (
    <>
      <fieldset className="flex flex-col gap-2">
        <legend className="pb-3 text-sm font-semibold text-gray-900">
          공고<span className="pl-0.5 text-error">*</span>
        </legend>
        {signedIn && isPending ? (
          <p className="text-sm text-gray-500">내 공고를 불러오는 중입니다.</p>
        ) : null}
        {isError ? (
          <p role="alert" className="text-sm text-error">
            내 공고를 불러오지 못했습니다. 새 공고로 등록하거나 잠시 후 다시 시도해 주세요.
          </p>
        ) : null}
        {hasPosts
          ? posts!.map((post) => (
              <label
                key={`${post.target}-${post.id}`}
                className="flex cursor-pointer items-center gap-3 rounded-md border border-gray-200 px-4 py-3 has-checked:border-blue-500 has-checked:bg-blue-00"
              >
                <input
                  type="radio"
                  name="post"
                  checked={
                    values.postMode === 'EXISTING' &&
                    values.post?.target === post.target &&
                    values.post.id === post.id
                  }
                  onChange={() =>
                    patch({
                      postMode: 'EXISTING',
                      post: { target: post.target, id: post.id, title: post.title },
                    })
                  }
                  className="accent-blue-500"
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold text-gray-900">{post.title}</span>
                  <span className="text-xs text-gray-500">{post.meta}</span>
                </span>
                <Badge tone="success" className="shrink-0 rounded-full">
                  게시 중
                </Badge>
              </label>
            ))
          : null}
        {!hasPosts && !(signedIn && isPending) ? (
          <div className="rounded-md bg-gray-50 px-4 py-3 text-sm text-gray-600">
            <p className="font-semibold text-gray-900">
              {signedIn
                ? '아직 게시 중인 공고가 없어요'
                : '로그인 없이 신청 중이라 선택할 공고가 없어요'}
            </p>
            <p className="pt-1">광고할 공고를 아래에서 바로 등록하면 돼요. 공고 등록은 무료예요.</p>
            {!signedIn ? (
              <Link
                href={`/login?redirect=${encodeURIComponent('/apply')}`}
                className="inline-block pt-2 font-semibold text-blue-500 hover:underline"
              >
                이미 회원이에요 — 로그인
              </Link>
            ) : null}
          </div>
        ) : null}
        <label
          className={cn(
            'flex cursor-pointer items-start gap-3 rounded-md border border-dashed px-4 py-3',
            values.postMode === 'NEW' ? 'border-blue-500 bg-blue-00' : 'border-gray-300',
          )}
        >
          <input
            type="radio"
            name="post"
            checked={values.postMode === 'NEW'}
            onChange={() => patch({ postMode: 'NEW', post: undefined })}
            className="mt-1 accent-blue-500"
          />
          <span className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900">
              새 공고 바로 등록하고 광고하기
            </span>
            <span className="text-xs text-gray-500">
              아직 올리지 않은 공고라면 여기서 등록해요 · 공고 검수와 광고 검수가 함께 진행돼요
            </span>
          </span>
        </label>
      </fieldset>

      {values.postMode === 'NEW' ? (
        <div className="flex flex-col gap-4 rounded-md border border-gray-200 p-4 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-gray-900">
              새 공고 등록 · 광고 신청과 함께 접수돼요
            </p>
            {hasPosts ? (
              <button
                type="button"
                onClick={() => patch({ postMode: 'EXISTING', newJob: EMPTY_NEW_JOB })}
                className="text-xs font-semibold text-gray-500 hover:underline"
              >
                기존 공고 선택으로 돌아가기
              </button>
            ) : null}
          </div>
          <Field label="공고명" htmlFor="ad-new-title" required>
            <Input
              id="ad-new-title"
              value={values.newJob.title}
              maxLength={255}
              onChange={(event) => setJob('title', event.target.value)}
              placeholder="예) [전환형 인턴] B2B Product Owner"
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="채용 형태" htmlFor="ad-new-employment" required>
              <Select
                id="ad-new-employment"
                value={values.newJob.employmentType}
                options={EMPLOYMENT_OPTIONS}
                onChange={(event) => setJob('employmentType', event.target.value)}
              />
            </Field>
            <Field label="직무" htmlFor="ad-new-job-field" required>
              <Select
                id="ad-new-job-field"
                value={values.newJob.jobField}
                options={JOB_FIELD_OPTIONS}
                onChange={(event) => setJob('jobField', event.target.value)}
              />
            </Field>
            <Field label="요구 경력" htmlFor="ad-new-experience" required>
              <Select
                id="ad-new-experience"
                value={values.newJob.experienceType}
                options={EXPERIENCE_OPTIONS}
                onChange={(event) => setJob('experienceType', event.target.value)}
              />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="마감일" htmlFor="ad-new-deadline" required>
              <div className="flex items-center gap-3">
                <Input
                  id="ad-new-deadline"
                  type="date"
                  value={values.newJob.deadline}
                  disabled={values.newJob.alwaysOpen}
                  onChange={(event) => setJob('deadline', event.target.value)}
                />
                <Checkbox
                  checked={values.newJob.alwaysOpen}
                  onChange={(checked) =>
                    patch({
                      newJob: {
                        ...values.newJob,
                        alwaysOpen: checked,
                        deadline: checked ? '' : values.newJob.deadline,
                      },
                    })
                  }
                  label="상시 모집"
                />
              </div>
            </Field>
            <Field label="근무지 · 급여" htmlFor="ad-new-location" required>
              <Input
                id="ad-new-location"
                value={values.newJob.locationAndPay}
                onChange={(event) => setJob('locationAndPay', event.target.value)}
                placeholder="예) 서울 강남 · 월 250만원"
              />
            </Field>
          </div>
          <Field label="지원 링크" htmlFor="ad-new-link" required>
            <Input
              id="ad-new-link"
              type="url"
              inputMode="url"
              value={values.newJob.sourceUrl}
              onChange={(event) => setJob('sourceUrl', event.target.value)}
              placeholder="https://"
            />
          </Field>
          <p className="text-xs text-gray-500">
            정규직·인턴 공고를 우선하며, 근무 조건이 불명확한 공고는 검수에서 반려될 수 있어요.
          </p>
        </div>
      ) : null}

      <fieldset className="flex flex-col gap-3">
        <legend className="pb-3 text-sm font-semibold text-gray-900">
          광고 목적<span className="pl-0.5 text-error">*</span>
        </legend>
        <div className="grid gap-2 md:grid-cols-3">
          {PURPOSES.map((purpose) => (
            <label
              key={purpose.value}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 px-4 py-3 text-sm has-checked:border-blue-500 has-checked:bg-blue-00"
            >
              <input
                type="radio"
                name="purpose"
                value={purpose.value}
                checked={values.purpose === purpose.value}
                onChange={() => patch({ purpose: purpose.value })}
                className="accent-blue-500"
              />
              <span className="font-semibold text-gray-900">{purpose.label}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500">목적에 맞는 지면을 2단계에서 추천해 드려요.</p>
      </fieldset>
    </>
  );
}
