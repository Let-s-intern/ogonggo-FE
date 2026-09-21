'use client';

import { Field, Textarea } from '@ogonggo/ui';
import { PLACEHOLDER_NOTICE } from '@/shared/lib/placeholderNotice';
import type { RecruitmentPostFormValues } from '../model/values';

/** `CreateRecruitmentPostRequest.summary` 의 `@maxLength`. */
const MAX_SUMMARY_LENGTH = 500;

/**
 * 목업의 서식 도구 막대 일곱. **전부 비활성이다.**
 *
 * 저장소에 편집기가 없다 — `@lexical/react` 는 설치돼 있지 않고 읽기용 여섯 패키지만 있어,
 * 본문 칸은 평문 한 칸이고 저장할 때 문단으로 나눠 `content` JSON 을 만든다
 * (`lib/content.ts`). 막대를 아예 안 그리지 않고 비활성으로 남기는 것은 PRD 의 결정이다 —
 * 자리가 통째로 비면 "이 화면에는 서식이 없다" 로 읽히는데 사실은 준비 중이다.
 */
const TOOLBAR_BUTTONS: readonly { label: string; icon: string }[] = [
  { label: '굵게', icon: 'icon-[lucide--bold]' },
  { label: '기울임', icon: 'icon-[lucide--italic]' },
  { label: '밑줄', icon: 'icon-[lucide--underline]' },
  { label: '글머리 기호 목록', icon: 'icon-[lucide--list]' },
  { label: '번호 매기기 목록', icon: 'icon-[lucide--list-ordered]' },
  { label: '링크', icon: 'icon-[lucide--link]' },
  { label: '이미지', icon: 'icon-[lucide--image]' },
];

export interface ContentSectionProps {
  values: RecruitmentPostFormValues;
  onChange: (patch: Partial<RecruitmentPostFormValues>) => void;
}

/**
 * 2 단 모집 내용(PRD 5 절). 한 줄 소개 · 모집 상세 내용 · 지원 자격 · 전형.
 *
 * 모집 상세 내용은 `content`(JSON) 이고 `shared/ui/LexicalContent.tsx` 가 읽는 형식을 따른다.
 * 그 형식을 만드는 것은 `lib/content.ts` 이고, 여기서 다루는 값은 평문이다.
 */
export function ContentSection({ values, onChange }: ContentSectionProps) {
  return (
    <div>
      <Field label="한 줄 소개" htmlFor="post-summary" required>
        <Textarea
          id="post-summary"
          rows={1}
          maxLength={MAX_SUMMARY_LENGTH}
          value={values.summary}
          onChange={(event) => onChange({ summary: event.target.value })}
          placeholder="모집글의 핵심 내용을 한 문장으로 소개해 주세요."
        />
      </Field>

      <Field
        label="모집 상세 내용"
        htmlFor="post-content"
        required
        hint="서식은 준비 중이에요. 줄바꿈은 적은 그대로 저장돼요."
      >
        <div className="flex items-center gap-1 rounded-t-md border border-b-0 border-gray-300 px-3 py-2">
          {TOOLBAR_BUTTONS.map((button) => (
            <button
              key={button.label}
              type="button"
              disabled
              aria-label={button.label}
              title={PLACEHOLDER_NOTICE}
              className="flex size-7 cursor-not-allowed items-center justify-center rounded text-gray-300"
            >
              <span aria-hidden="true" className={`${button.icon} block size-4`} />
            </button>
          ))}
        </div>
        <Textarea
          id="post-content"
          rows={8}
          value={values.contentText}
          onChange={(event) => onChange({ contentText: event.target.value })}
          className="rounded-t-none"
          placeholder="프로젝트 소개, 목표 및 예상 산출물, 진행 상황, 참고자료, 포지션별 담당 업무, 현재 팀 구성, 모임 방식 등을 자유롭게 작성해 주세요."
        />
      </Field>

      <Field label="지원 자격 · 전형" htmlFor="post-eligibility" className="pb-0">
        <Textarea
          id="post-eligibility"
          rows={4}
          value={values.eligibilityAndSelectionProcess}
          onChange={(event) => onChange({ eligibilityAndSelectionProcess: event.target.value })}
          placeholder="지원 대상, 필수 조건, 우대 사항, 전형 절차를 입력해 주세요."
        />
      </Field>
    </div>
  );
}
