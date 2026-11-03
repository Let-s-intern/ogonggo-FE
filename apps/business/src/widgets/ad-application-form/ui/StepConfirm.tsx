import { enumLabel } from '@ogonggo/api';
import { Checkbox } from '@ogonggo/ui';
import {
  type AdPlacement,
  type AdPlacementKey,
  formatShortDate,
  formatWon,
} from '@/entities/advertisement';
import type { AdApplicationFormValues } from '../model/form';
import { type Amounts, itemEndDate } from '../model/items';

export interface StepConfirmProps {
  values: AdApplicationFormValues;
  patch: (next: Partial<AdApplicationFormValues>) => void;
  placements: Map<AdPlacementKey, AdPlacement>;
  amounts: Amounts;
  signedIn: boolean;
  couponOnly: boolean;
}

/** 5단계 확인(시안 B-04). 요약, 다음 단계, 두 필수 동의. */
export function StepConfirm({
  values,
  patch,
  placements,
  amounts,
  signedIn,
  couponOnly,
}: StepConfirmProps) {
  const postTitle =
    values.postMode === 'NEW' ? values.newJob.title || '제목 미입력' : values.post?.title;
  const notes = [
    !signedIn ? `기업회원 계정이 새로 만들어져요 (${values.signUp.email || '입력한 이메일'})` : '',
    values.postMode === 'NEW' ? `공고 "${postTitle}"이(가) 함께 등록돼요 (공고 검수 → 게시)` : '',
  ].filter(Boolean);

  return (
    <>
      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th scope="col" className="px-3 py-2 text-left font-semibold">
                공고
              </th>
              <th scope="col" className="px-3 py-2 text-left font-semibold">
                지면
              </th>
              <th scope="col" className="px-3 py-2 text-left font-semibold">
                직무
              </th>
              <th scope="col" className="px-3 py-2 text-left font-semibold">
                기간
              </th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">
                금액
              </th>
            </tr>
          </thead>
          <tbody>
            {values.items.map((item) => {
              const placement = placements.get(item.placementKey);
              return (
                <tr key={item.uid} className="border-t border-gray-100">
                  <td className="max-w-40 truncate px-3 py-2 text-gray-700">{postTitle}</td>
                  <td className="px-3 py-2 text-gray-900">{placement?.name}</td>
                  <td className="px-3 py-2 text-gray-700">
                    {item.jobField ? enumLabel('JobField', item.jobField) : '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-700">
                    {formatShortDate(item.startDate)} ~{' '}
                    {formatShortDate(itemEndDate(item, placement))}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-900">
                    {amounts.couponItemUid === item.uid ? '쿠폰 · ' : ''}
                    {formatWon((placement?.price ?? 0) * item.weeks)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200">
              <th scope="row" colSpan={4} className="px-3 py-2 text-left font-bold text-gray-900">
                합계 (VAT 별도)
              </th>
              <td className="px-3 py-2 text-right font-bold text-blue-500">
                {formatWon(amounts.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <dl className="grid grid-cols-[6rem_1fr] gap-y-2 text-sm">
        <dt className="text-gray-500">담당자 · 계정</dt>
        <dd className="text-gray-900">
          {[values.contact.name, values.contact.companyName, values.contact.email]
            .filter(Boolean)
            .join(' · ')}
          {notes.length > 0 ? (
            <span className="block pt-1 text-xs text-blue-600">{notes.join(' · ')}</span>
          ) : null}
        </dd>
        <dt className="text-gray-500">다음 단계</dt>
        <dd className="text-gray-900">
          {couponOnly
            ? '소재 검수 → 광고주 확인 → 확정 → 자동 게재'
            : '견적(영업일 2일) → 계약·입금 → 소재 검수·확인 → 게재'}
        </dd>
      </dl>

      <div className="flex flex-col gap-3 rounded-md bg-gray-50 px-4 py-4">
        <div>
          <Checkbox
            checked={values.privacyAgreed}
            onChange={(checked) => patch({ privacyAgreed: checked })}
            label="개인정보 수집·이용 동의 (필수)"
          />
          <p className="pt-1 pl-7 text-xs text-gray-500">
            수집 항목: 담당자 이름·직함·이메일·전화 · 보관 기간: 집행 종료 후 n개월 (법무 확인 후
            확정)
          </p>
        </div>
        <Checkbox
          checked={values.policyAgreed}
          onChange={(checked) => patch({ policyAgreed: checked })}
          label="광고 운영 정책 동의 (필수)"
        />
      </div>
    </>
  );
}
