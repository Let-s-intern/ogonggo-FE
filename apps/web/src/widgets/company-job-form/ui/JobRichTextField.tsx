'use client';

import { Field, Textarea } from '@ogonggo/ui';
import { PLACEHOLDER_NOTICE } from '@/shared/lib/placeholderNotice';

/**
 * 목업의 서식 도구 막대 일곱. **전부 비활성이다.**
 *
 * 저장소에 편집기가 없다 — `@lexical/react` 는 설치돼 있지 않고 읽기용 여섯 패키지만 있다
 * (v4 모집글 폼이 같은 벽을 만났다, `.claude/tasks/memos/결정-마이페이지-push4-2026-09-21.md`
 * 1 절). 채용공고는 거기보다 사정이 단순하다 — 본문 다섯 칸이 `CreateCompanyJobRequest` 에서
 * 전부 평문 문자열이라 JSON 으로 옮길 것도 없다. 공개 상세도 그 문자열을
 * `whitespace-pre-line` 으로 그대로 그린다(`widgets/job-detail/ui/JobDetailView.tsx`).
 *
 * 막대를 아예 안 그리지 않고 비활성으로 남기는 것은 PRD 의 결정이다 — 자리가 통째로 비면
 * "이 화면에는 서식이 없다" 로 읽히는데, 사실은 준비 중이다.
 */
const TOOLBAR_BUTTONS: readonly { label: string; icon: string }[] = [
  { label: '굵게', icon: 'icon-[lucide--bold]' },
  { label: '기울임', icon: 'icon-[lucide--italic]' },
  { label: '밑줄', icon: 'icon-[lucide--underline]' },
  { label: '취소선', icon: 'icon-[lucide--strikethrough]' },
  { label: '글머리 기호 목록', icon: 'icon-[lucide--list]' },
  { label: '번호 매기기 목록', icon: 'icon-[lucide--list-ordered]' },
  { label: '링크', icon: 'icon-[lucide--link]' },
];

export interface JobRichTextFieldProps {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
}

/**
 * 2 단의 본문 칸 하나 — 비활성 서식 막대와 평문 한 칸(목업 `채용공고 등록.png`).
 *
 * 네 칸이 같은 모양이라 여기 한 번만 적는다. 안내 한 줄도 네 칸이 같다.
 */
export function JobRichTextField({
  id,
  label,
  required = false,
  value,
  onChange,
  placeholder,
  rows = 5,
}: JobRichTextFieldProps) {
  return (
    <Field
      label={label}
      htmlFor={id}
      required={required}
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
        id={id}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-t-none"
        placeholder={placeholder}
      />
    </Field>
  );
}
