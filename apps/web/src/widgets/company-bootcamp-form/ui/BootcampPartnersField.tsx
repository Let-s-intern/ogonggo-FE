'use client';

import { Button, Field, Input } from '@ogonggo/ui';
import { EMPTY_PARTNER_ROW, moveRow, type BootcampPartnerRow } from '../model/rows';
import { BootcampOrderableRow } from './BootcampOrderableRow';

/** `CompanyBootcampPartnerRequest.partnerName` 의 `@maxLength`. */
const MAX_PARTNER_NAME_LENGTH = 150;

export interface BootcampPartnersFieldProps {
  rows: BootcampPartnerRow[];
  onChange: (rows: BootcampPartnerRow[]) => void;
}

/**
 * 수료 후 파트너사(v5 PRD 4 절).
 *
 * **목업은 드롭다운 한 칸인데 여기는 반복 행이다.** 요청이 받는 것은 이름과 `displayOrder` 를
 * 가진 배열이고(최대 100 개), 고를 파트너사 목록을 주는 API 가 없다. 드롭다운으로 그리면
 * 고를 것이 없는 빈 목록이 된다.
 *
 * 공개 상세는 이 이름들을 `displayOrder` 순으로 이어 붙여 한 줄로 보여 준다
 * (`widgets/bootcamp-detail/ui/BootcampInfoGrid.tsx` 의 `formatPartners`). 그래서 순서가
 * 눈에 보이는 값이다.
 */
export function BootcampPartnersField({ rows, onChange }: BootcampPartnersFieldProps) {
  return (
    <Field label="수료 후 파트너사" hint="적은 순서대로 공고 상세에 이어서 보여요.">
      <div className="flex flex-col gap-2">
        {rows.map((row, index) => (
          // 행에는 지울 때 말고 바뀌지 않는 식별자가 없다. 값은 모두 부모가 들고 있어
          // 자리만 옮겨 그리면 된다(채용공고 폼의 채용 절차 행과 같은 판단이다).
          <BootcampOrderableRow
            key={index}
            label={`파트너사 ${index + 1}`}
            index={index}
            count={rows.length}
            onMove={(from, to) => onChange(moveRow(rows, from, to))}
            onRemove={() => onChange(rows.filter((_, target) => target !== index))}
          >
            <Input
              aria-label={`파트너사 ${index + 1} 이름`}
              maxLength={MAX_PARTNER_NAME_LENGTH}
              value={row.partnerName}
              onChange={(event) =>
                onChange(
                  rows.map((item, target) =>
                    target === index ? { ...item, partnerName: event.target.value } : item,
                  ),
                )
              }
              placeholder="수료 후 파트너사를 입력해 주세요."
            />
          </BootcampOrderableRow>
        ))}
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => onChange([...rows, EMPTY_PARTNER_ROW])}
        className="mt-2"
      >
        + 파트너사 추가
      </Button>
    </Field>
  );
}
