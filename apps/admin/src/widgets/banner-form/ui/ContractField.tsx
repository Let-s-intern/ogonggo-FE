import { useState } from 'react';
import { Field, Input, Select } from '@ogonggo/ui';
import { enumLabel } from '@ogonggo/api/src/admin';
import { useContractSearch } from '@/entities/advertisement-contract/api/useAdvertisementContracts';

interface ContractFieldProps {
  id: string;
  value: number | null;
  /** 지금 이어 둔 계약의 회사명(노출 응답의 `advertiserCompanyName`). 검색 결과에 없어도 고른 값을 보이려고 쓴다. */
  currentCompanyName: string | null;
  onChange: (contractId: number | null) => void;
}

/**
 * 배너 노출의 연결 계약. 회사명으로 계약을 찾아 고른다. 비우면 오공고 자체 홍보다(PRD 3절).
 *
 * 계약은 광고 신청 한 건이다. 같은 회사의 계약이 여럿이면 공고명과 상태로 가른다.
 */
export function ContractField({ id, value, currentCompanyName, onChange }: ContractFieldProps) {
  const [keyword, setKeyword] = useState('');
  const { data = [], isFetching } = useContractSearch(keyword);
  const options = [
    { value: '', label: '연결 안 함(자체 홍보)' },
    ...(value !== null && !data.some((contract) => contract.id === value)
      ? [{ value: String(value), label: `#${value} ${currentCompanyName ?? ''}`.trim() }]
      : []),
    ...data.map((contract) => ({
      value: String(contract.id),
      label: `#${contract.id} ${contract.companyName} · ${contract.recruitmentTitle} (${enumLabel('AdvertisementContractStatus', contract.status)})`,
    })),
  ];

  return (
    <Field
      label="연결 계약"
      htmlFor={id}
      hint="돈을 받고 싣는 배너는 그 광고 계약을 고릅니다. 오공고 자체 홍보는 비워 둡니다."
    >
      <div className="flex flex-col gap-2">
        <Input
          aria-label="계약 회사명 검색"
          placeholder="회사명으로 찾기"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <Select
          id={id}
          options={options}
          value={value === null ? '' : String(value)}
          disabled={isFetching && data.length === 0}
          onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
        />
      </div>
    </Field>
  );
}
