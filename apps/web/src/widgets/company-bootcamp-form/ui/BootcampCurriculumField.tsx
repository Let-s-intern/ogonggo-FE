'use client';

import { Button, Field, Input } from '@ogonggo/ui';
import { EMPTY_CURRICULUM_ROW, moveRow, type BootcampCurriculumRow } from '../model/rows';
import { BootcampOrderableRow } from './BootcampOrderableRow';

/** `CompanyBootcampCurriculumRequest.subtitle` 의 `@maxLength`. */
const MAX_SUBTITLE_LENGTH = 255;

export interface BootcampCurriculumFieldProps {
  rows: BootcampCurriculumRow[];
  onChange: (rows: BootcampCurriculumRow[]) => void;
}

/**
 * 커리큘럼(v5 PRD 4 절). 주차 범위와 소제목 한 줄이 한 행이다.
 *
 * **주차별 상세 본문은 담지 못한다.** 요청의 항목이 `startWeek`·`endWeek`·`subtitle`(255 자
 * 한 줄) 셋뿐이다. 목업도 한 줄이라 모양은 맞는다 — 더 긴 설명은 `공고 상세 내용` 에 적는다.
 *
 * 공개 상세가 `displayOrder` 순으로 타임라인을 그린다
 * (`widgets/bootcamp-detail/ui/BootcampCurriculum.tsx`).
 */
export function BootcampCurriculumField({ rows, onChange }: BootcampCurriculumFieldProps) {
  const changeRow = (index: number, patch: Partial<BootcampCurriculumRow>) =>
    onChange(rows.map((item, target) => (target === index ? { ...item, ...patch } : item)));

  return (
    <Field label="커리큘럼" hint="적은 순서대로 공고 상세에 주차별로 보여요.">
      <div className="flex flex-col gap-2">
        {rows.map((row, index) => (
          <BootcampOrderableRow
            key={index}
            label={`커리큘럼 ${index + 1}`}
            index={index}
            count={rows.length}
            onMove={(from, to) => onChange(moveRow(rows, from, to))}
            onRemove={() => onChange(rows.filter((_, target) => target !== index))}
          >
            <div className="flex shrink-0 items-center gap-1">
              <Input
                type="number"
                min={1}
                aria-label={`커리큘럼 ${index + 1} 시작 주차`}
                className="w-16 px-2 text-center"
                value={row.startWeek}
                onChange={(event) => changeRow(index, { startWeek: event.target.value })}
              />
              <span className="text-sm text-gray-400">~</span>
              <Input
                type="number"
                min={1}
                aria-label={`커리큘럼 ${index + 1} 종료 주차`}
                className="w-16 px-2 text-center"
                value={row.endWeek}
                onChange={(event) => changeRow(index, { endWeek: event.target.value })}
              />
              <span className="pr-1 text-sm text-gray-500">주</span>
            </div>
            <Input
              aria-label={`커리큘럼 ${index + 1} 소제목`}
              maxLength={MAX_SUBTITLE_LENGTH}
              value={row.subtitle}
              onChange={(event) => changeRow(index, { subtitle: event.target.value })}
              placeholder="주차별 내용을 한 줄로 입력해 주세요."
            />
          </BootcampOrderableRow>
        ))}
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => onChange([...rows, EMPTY_CURRICULUM_ROW])}
        className="mt-2"
      >
        + 커리큘럼 추가
      </Button>
    </Field>
  );
}
