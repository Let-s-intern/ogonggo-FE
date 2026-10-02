'use client';

import type { JsonNode } from '@ogonggo/api';
import { Field, Textarea } from '@ogonggo/ui';
import { RichTextEditor } from '@ogonggo/ui/src/editor/RichTextEditor';
import { uploadImageAsset } from '@/shared/lib/uploadImage';
import { hasContentBody, type RecruitmentPostFormValues } from '../model/values';

/** `CreateRecruitmentPostRequest.summary` 의 `@maxLength`. */
const MAX_SUMMARY_LENGTH = 500;

export interface ContentSectionProps {
  values: RecruitmentPostFormValues;
  onChange: (patch: Partial<RecruitmentPostFormValues>) => void;
}

/**
 * 2 단 모집 내용(PRD 5 절). 한 줄 소개 · 모집 상세 내용 · 지원 자격 · 전형.
 *
 * 모집 상세 내용은 공용 Lexical 편집기(`RichTextEditor`)이고 값은 EditorState JSON(`content`)
 * 그대로다. 본문 이미지는 `POST /api/v1/images` 로 올린다(`uploadImageAsset`).
 * 상세 화면(`shared/ui/LexicalContent.tsx`)이 같은 노드로 읽는다.
 */
export function ContentSection({ values, onChange }: ContentSectionProps) {
  return (
    <div>
      <Field
        label="한 줄 소개"
        htmlFor="post-summary"
        required
        done={Boolean(values.summary.trim())}
      >
        <Textarea
          id="post-summary"
          rows={1}
          maxLength={MAX_SUMMARY_LENGTH}
          value={values.summary}
          onChange={(event) => onChange({ summary: event.target.value })}
          placeholder="모집글의 핵심 내용을 한 문장으로 소개해 주세요."
        />
      </Field>

      <Field label="모집 상세 내용" htmlFor="post-content" required done={hasContentBody(values)}>
        <RichTextEditor
          id="post-content"
          initialContent={values.content}
          onChange={(content, contentText, contentHasImage) =>
            onChange({ content: content as unknown as JsonNode, contentText, contentHasImage })
          }
          onUploadImage={uploadImageAsset}
          placeholder="프로젝트 소개, 목표 및 예상 산출물, 진행 상황, 참고자료, 포지션별 담당 업무, 현재 팀 구성, 모임 방식 등을 자유롭게 작성해 주세요."
        />
      </Field>

      <Field
        label="지원 자격 · 전형"
        htmlFor="post-eligibility"
        done={Boolean(values.eligibilityAndSelectionProcess.trim())}
        className="pb-0"
      >
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
