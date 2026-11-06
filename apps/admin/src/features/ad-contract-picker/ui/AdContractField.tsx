import { useQueryClient } from '@tanstack/react-query';
import { Callout, Field, Select } from '@ogonggo/ui';
import type { AdContractProduct } from '@ogonggo/api/src/ad-contracts';
import {
  adContractsQuery,
  useAdContracts,
  type AdContract,
} from '@/entities/ad-contract/api/useAdContracts';
import {
  AD_CONTRACT_STATUS_BADGES,
  adContractName,
  adContractStatus,
  defaultAdContract,
  isOutsideContract,
} from '@/entities/ad-contract/lib/adContract';
import { instagramProductLabel } from '@/entities/instagram/lib/instagram';
import { adContractProductLabel, formatContractPeriod } from '../lib/adContractProduct';

interface AdContractFieldProps {
  id: string;
  /** 고른 광고주. 없으면 칸을 막는다. */
  advertiserId: number | null;
  value: number | null;
  /** 계약을 고르면 그 계약을, `계약 없음` 이면 `null` 을 준다. 기간 채우기는 모달이 한다. */
  onChange: (contract: AdContract | null) => void;
  /** 지금 폼의 노출 기간(서버 값, KST). 계약 기간 밖이면 경고한다. */
  period: { startAt: string | null; endAt: string | null };
  /** 이 배너·광고 공고의 자리. 계약 상품에 없으면 경고한다. 인스타 광고는 `product` 대신 `instagramFormat` 을 준다. */
  product?: AdContractProduct;
  /** 인스타 광고의 게재 유형. 계약의 인스타 상품에 없으면 경고한다. 고르기 전이면 `null`. */
  instagramFormat?: { id: number; name: string } | null;
  /** 칸 아래 안내. 기본은 노출 기간을 채운다는 안내다. */
  hint?: string;
}

/**
 * 광고 계약 고르기(이슈 #573). 배너 모달과 광고 공고 모달이 같이 쓴다. 고른 광고주의 계약만 보인다.
 *
 * 경고는 막지 않는다. 계약 기간보다 하루 늦게 걸거나 서비스로 더 실어 주는 일이 있어 운영자가 정한다.
 */
export function AdContractField({
  id,
  advertiserId,
  value,
  onChange,
  period,
  product,
  instagramFormat,
  hint = '계약을 고르면 노출 기간을 계약 기간으로 채웁니다. 채운 뒤에도 고칠 수 있습니다.',
}: AdContractFieldProps) {
  const { data: contracts = [], isError } = useAdContracts(advertiserId);
  const selected = contracts.find((contract) => contract.id === value) ?? null;
  const options = [
    { value: '', label: advertiserId === null ? '광고주를 먼저 골라 주세요' : '계약 없음' },
    ...contracts.map((contract) => ({
      value: String(contract.id),
      label: `${adContractName(contract)} · ${formatContractPeriod(contract)} · ${
        AD_CONTRACT_STATUS_BADGES[adContractStatus(contract)].label
      }`,
    })),
  ];
  const warnings = selected
    ? [
        isOutsideContract(period, selected)
          ? `노출 기간이 계약 기간(${formatContractPeriod(selected)}) 밖입니다. 저장은 할 수 있습니다.`
          : null,
        missingProduct(selected, product, instagramFormat),
      ].filter((warning): warning is string => warning !== null)
    : [];

  return (
    <Field label="계약" htmlFor={id} hint={isError ? '계약 목록을 불러오지 못했습니다.' : hint}>
      <div className="flex flex-col gap-2">
        <Select
          id={id}
          options={options}
          value={value === null ? '' : String(value)}
          disabled={advertiserId === null}
          onChange={(event) =>
            onChange(
              contracts.find((contract) => String(contract.id) === event.target.value) ?? null,
            )
          }
        />
        {warnings.map((warning) => (
          <Callout key={warning} tone="warning">
            {warning}
          </Callout>
        ))}
      </div>
    </Field>
  );
}

/**
 * 광고주를 고른 순간 그 광고주의 기본 계약(진행 중, 없으면 가장 가까운 예정)을 구한다. 모달이 광고주 칸의 `onChange` 에서
 * 부른다 — 계약 목록이 오기를 기다렸다가 바로 기간을 채우려고 effect 대신 이렇게 한다.
 */
export function useDefaultAdContract() {
  const queryClient = useQueryClient();
  return async (advertiserId: number): Promise<AdContract | null> => {
    try {
      const contracts = await queryClient.fetchQuery(adContractsQuery(advertiserId));
      return defaultAdContract(contracts ?? []);
    } catch {
      return null;
    }
  };
}

/** 계약에 상품이 정해져 있는데 이 광고의 자리·인스타 유형이 없으면 그 경고. 상품을 정하지 않은 계약은 경고하지 않는다. */
function missingProduct(
  contract: AdContract,
  product: AdContractProduct | undefined,
  instagramFormat: { id: number; name: string } | null | undefined,
): string | null {
  if (contract.products.length === 0 && contract.instagramFormatIds.length === 0) {
    return null;
  }
  if (product && !contract.products.includes(product)) {
    return `이 계약의 상품에 ${adContractProductLabel(product)} 자리가 없습니다.`;
  }
  if (instagramFormat && !contract.instagramFormatIds.includes(instagramFormat.id)) {
    return `이 계약의 상품에 ${instagramProductLabel(instagramFormat.name, instagramFormat.id)} 이(가) 없습니다.`;
  }
  return null;
}
