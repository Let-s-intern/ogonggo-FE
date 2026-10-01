'use client';

import { type ReactNode, useId } from 'react';
import { Input, Textarea } from '@ogonggo/ui';
import type { CardContent, CardSection } from '@/lib/card/types';

interface ContentPanelProps {
  content: CardContent;
  onChange: (content: CardContent) => void;
}

function Labeled({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-gray-800">
        {label}
      </label>
      {children(id)}
      {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

/** 섹션 하나. 제목 칸과 줄마다 한 항목인 목록 칸. */
function SectionEditor({
  section,
  onChange,
}: {
  section: CardSection;
  onChange: (section: CardSection) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-200 p-3">
      <Input
        aria-label="섹션 제목"
        className="h-9 text-sm font-semibold"
        value={section.label}
        onChange={(event) => onChange({ ...section, label: event.target.value })}
      />
      <Textarea
        aria-label={`${section.label} 항목`}
        rows={Math.max(2, section.items.length + 1)}
        className="text-sm"
        value={section.items.join('\n')}
        onChange={(event) => onChange({ ...section, items: event.target.value.split('\n') })}
      />
    </div>
  );
}

/** 카드 문구 편집. 모든 칸을 사람이 고칠 수 있다. */
export function ContentPanel({ content, onChange }: ContentPanelProps) {
  const set = <K extends keyof CardContent>(key: K, value: CardContent[K]) =>
    onChange({ ...content, [key]: value });
  const setSection = (
    key: 'summarySections' | 'detailSections',
    index: number,
    section: CardSection,
  ) =>
    set(
      key,
      content[key].map((current, currentIndex) => (currentIndex === index ? section : current)),
    );

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="text-base font-bold">문구</h2>
      <Labeled label="뱃지">
        {(id) => (
          <Input
            id={id}
            value={content.badge}
            onChange={(event) => set('badge', event.target.value)}
          />
        )}
      </Labeled>
      <Labeled
        label="제목 (1·2장)"
        hint="줄바꿈으로 줄을 나눕니다. *단어* 는 강조 상자, ~단어~ 는 강조색 글자입니다."
      >
        {(id) => (
          <Textarea
            id={id}
            rows={3}
            className="font-semibold"
            value={content.headline}
            onChange={(event) => set('headline', event.target.value)}
          />
        )}
      </Labeled>

      <Labeled label="직무명 (로고 탭 카드·썸네일 + 흰 판 2장의 제목)">
        {(id) => (
          <Input
            id={id}
            value={content.roleTitle}
            onChange={(event) => set('roleTitle', event.target.value)}
          />
        )}
      </Labeled>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-gray-800">1장 섹션</p>
        <p className="text-xs text-gray-500">
          항목은 한 줄에 하나씩 씁니다. 항목을 비운 섹션은 제목까지 그리지 않습니다.
        </p>
        {content.summarySections.map((section, index) => (
          <SectionEditor
            key={index}
            section={section}
            onChange={(next) => setSection('summarySections', index, next)}
          />
        ))}
      </div>
      <Labeled label="1장 아래 안내 (선택)">
        {(id) => (
          <Textarea
            id={id}
            rows={2}
            className="text-sm"
            placeholder="※ 상기 항목은 대표 예시입니다."
            value={content.note}
            onChange={(event) => set('note', event.target.value)}
          />
        )}
      </Labeled>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-gray-800">2장 섹션</p>
        {content.detailSections.map((section, index) => (
          <SectionEditor
            key={index}
            section={section}
            onChange={(next) => setSection('detailSections', index, next)}
          />
        ))}
      </div>

      <details className="flex flex-col gap-3">
        <summary className="cursor-pointer text-sm font-semibold text-gray-800">
          3장 프로필 안내
        </summary>
        <div className="mt-3 flex flex-col gap-3">
          <Labeled label="큰 문구">
            {(id) => (
              <Textarea
                id={id}
                rows={2}
                value={content.ctaHeadline}
                onChange={(event) => set('ctaHeadline', event.target.value)}
              />
            )}
          </Labeled>
          <Labeled label="작은 문구">
            {(id) => (
              <Textarea
                id={id}
                rows={2}
                value={content.ctaSub}
                onChange={(event) => set('ctaSub', event.target.value)}
              />
            )}
          </Labeled>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ['handle', '계정'],
                ['name', '이름'],
                ['posts', '게시물'],
                ['followers', '팔로워'],
                ['following', '팔로잉'],
              ] as const
            ).map(([key, label]) => (
              <Labeled key={key} label={label}>
                {(id) => (
                  <Input
                    id={id}
                    className="h-9 text-sm"
                    value={content.profile[key]}
                    onChange={(event) =>
                      set('profile', { ...content.profile, [key]: event.target.value })
                    }
                  />
                )}
              </Labeled>
            ))}
          </div>
          <Labeled label="소개">
            {(id) => (
              <Textarea
                id={id}
                rows={3}
                className="text-sm"
                value={content.profile.bio}
                onChange={(event) =>
                  set('profile', { ...content.profile, bio: event.target.value })
                }
              />
            )}
          </Labeled>
        </div>
      </details>
    </section>
  );
}
