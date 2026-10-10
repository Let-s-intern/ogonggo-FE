'use client';

import { useId, useState, type FormEvent } from 'react';
import { ConcernSummaryResponseCategory } from '@ogonggo/api';
import { Button, Chip, Input, Textarea, cn } from '@ogonggo/ui';
import { CONCERN_CATEGORIES, CONCERN_CATEGORY_LABELS } from '@/entities/concern/model/labels';
import {
  CONTENT_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  checkConcernForm,
  type ConcernFormValues,
} from '../model/values';

/** 새 글의 처음 주제. 시안이 첫 칩(`공고 질문`) 을 골라 둔 채로 그렸다. */
const DEFAULT_CATEGORY = ConcernSummaryResponseCategory.JOB_POSTING;
const TITLE_PLACEHOLDER = '제목을 입력해주세요';
const CONTENT_PLACEHOLDER =
  '궁금한 공고 링크, 지금 상황을 함께 적어주면 더 정확한 답변을 받을 수 있어요';

export interface ConcernFormProps {
  /** 수정 모드의 처음 값. 없으면 첫 주제(`공고 질문`) 를 고른 빈 폼이다. */
  initial?: ConcernFormValues;
  /** 등록 버튼 글자. 작성은 `등록하기`, 수정은 `수정하기`. */
  submitLabel: string;
  /** 보내는 동안 등록 버튼 글자. 작성은 `등록 중`, 수정은 `수정 중`. */
  pendingLabel: string;
  /** 보내는 중. 버튼을 막고 글자를 바꾼다. */
  pending?: boolean;
  /** 제목·본문은 앞뒤 공백을 뗀 값이다. 보낼 수 없는 상태에서는 불리지 않는다. */
  onSubmit: (values: ConcernFormValues) => void;
  onCancel: () => void;
}

/**
 * 고민 작성·수정 폼(시안 `고민 올리기 모달.png`). 주제 칩 다섯에서 하나, 제목, 내용, 취소·등록.
 * 시안의 이미지 첨부 칸은 그리지 않는다 — 저장 요청에 이미지 필드가 없다(PRD 결정 9).
 *
 * 값은 이 안에서 들고 있고 마운트될 때의 `initial` 로 시작한다. 모달이 열릴 때마다 새로 마운트되어
 * 앞서 쓰던 글이 남지 않는다.
 *
 * 글자 수는 입력을 잘라내지 않고 센다. 길이를 넘으면 카운터가 빨개지고 등록이 막힌다. 입력을 자르면
 * 긴 글을 붙여 넣었을 때 뒤가 말없이 사라진다.
 */
export function ConcernForm({
  initial,
  submitLabel,
  pendingLabel,
  pending = false,
  onSubmit,
  onCancel,
}: ConcernFormProps) {
  const ids = {
    category: useId(),
    title: useId(),
    content: useId(),
  };
  const [category, setCategory] = useState(initial?.category ?? DEFAULT_CATEGORY);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');

  const values: ConcernFormValues = { category, title, content };
  const check = checkConcernForm(values);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!check.submittable || pending) {
      return;
    }
    onSubmit({ category, title: title.trim(), content: content.trim() });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div>
        <p id={ids.category} className="pb-3 text-sm font-medium text-gray-900 md:text-base">
          주제
        </p>
        {/* 한 개만 고르는 칩이라 라디오처럼 보이지만 화살표 키 이동은 두지 않았다. 누름 상태를 가진 단추 묶음이다. */}
        <div role="group" aria-labelledby={ids.category} className="flex flex-wrap gap-2">
          {CONCERN_CATEGORIES.map((value) => {
            const selected = value === category;
            return (
              <Chip
                key={value}
                tone={selected ? 'blue' : 'ghost'}
                aria-pressed={selected}
                onClick={() => setCategory(value)}
                className={cn(
                  !selected && 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50',
                )}
              >
                {CONCERN_CATEGORY_LABELS[value]}
              </Chip>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between pb-3">
          <label htmlFor={ids.title} className="text-sm font-medium text-gray-900 md:text-base">
            제목
          </label>
          <Counter length={title.length} max={TITLE_MAX_LENGTH} />
        </div>
        <Input
          id={ids.title}
          value={title}
          placeholder={TITLE_PLACEHOLDER}
          aria-invalid={check.titleTooLong}
          aria-describedby={check.titleTooLong ? `${ids.title}-error` : undefined}
          data-autofocus
          onChange={(event) => setTitle(event.target.value)}
        />
        {check.titleTooLong ? (
          <p id={`${ids.title}-error`} className="pt-1.5 text-sm text-error">
            제목은 {TITLE_MAX_LENGTH}자까지 쓸 수 있어요.
          </p>
        ) : null}
      </div>

      <div>
        <div className="flex items-baseline justify-between pb-3">
          <label htmlFor={ids.content} className="text-sm font-medium text-gray-900 md:text-base">
            내용
          </label>
          <Counter length={content.length} max={CONTENT_MAX_LENGTH} />
        </div>
        <Textarea
          id={ids.content}
          rows={6}
          value={content}
          placeholder={CONTENT_PLACEHOLDER}
          aria-invalid={check.contentTooLong}
          aria-describedby={check.contentTooLong ? `${ids.content}-error` : undefined}
          onChange={(event) => setContent(event.target.value)}
          className="resize-none text-base"
        />
        {check.contentTooLong ? (
          <p id={`${ids.content}-error`} className="pt-1.5 text-sm text-error">
            내용은 {CONTENT_MAX_LENGTH}자까지 쓸 수 있어요.
          </p>
        ) : null}
      </div>

      <div className="flex gap-2.5">
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={onCancel}
          className="h-12 flex-1 border-gray-200 text-gray-500"
        >
          취소
        </Button>
        <Button type="submit" disabled={!check.submittable || pending} className="h-12 flex-1">
          {pending ? pendingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}

/** 글자 수. 길이를 넘으면 빨갛게 바뀐다. 색만으로 알리지 않도록 아래에 문구도 같이 나온다. */
function Counter({ length, max }: { length: number; max: number }) {
  return (
    <span
      className={cn(
        'text-xs tabular-nums',
        length > max ? 'font-medium text-error' : 'text-gray-400',
      )}
    >
      {length}/{max}
    </span>
  );
}
