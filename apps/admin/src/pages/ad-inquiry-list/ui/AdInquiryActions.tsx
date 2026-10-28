import { useState } from 'react';
import { Button, Select, Textarea } from '@ogonggo/ui';
import {
  enumOptions,
  type AdminAdvertisementInquiryResponse,
  type ChangeAdvertisementInquiryStatusRequestStatus,
} from '@ogonggo/api/src/admin';
import {
  useChangeAdInquiryStatus,
  useSaveAdInquiryMemo,
} from '@/entities/advertisement-inquiry/api/useAdvertisementInquiries';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';

const STATUS_OPTIONS = enumOptions('AdvertisementInquiryStatus');
const MEMO_MAX = 2000;

/**
 * 카드의 처리 구역. 처리 상태(`접수`·`연락함`·`집행 완료`·`반려`)를 고르면 바로 저장하고, 메모는 `메모 저장` 으로
 * 저장한다. 둘 다 서버가 성공을 돌려준 뒤에 목록을 다시 읽어 바뀐 값을 보인다(낙관적 갱신 없음).
 */
export function AdInquiryActions({ inquiry }: { inquiry: AdminAdvertisementInquiryResponse }) {
  const changeStatus = useChangeAdInquiryStatus();
  const saveMemo = useSaveAdInquiryMemo();
  const savedMemo = inquiry.memo ?? '';
  const [draft, setDraft] = useState(savedMemo);
  const dirty = draft.trim() !== savedMemo.trim();

  const error = changeStatus.error ?? saveMemo.error;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Select
          aria-label="처리 상태"
          options={STATUS_OPTIONS}
          value={inquiry.status}
          disabled={changeStatus.isPending}
          onChange={(event) =>
            changeStatus.mutate({
              inquiryId: inquiry.id,
              status: event.target.value as ChangeAdvertisementInquiryStatusRequestStatus,
            })
          }
        />
        {changeStatus.isPending ? <span className="text-xs text-gray-400">바꾸는 중</span> : null}
      </div>
      <Textarea
        aria-label="메모"
        rows={2}
        maxLength={MEMO_MAX}
        value={draft}
        placeholder="영업 담당자 메모"
        onChange={(event) => setDraft(event.target.value)}
      />
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={!dirty || saveMemo.isPending}
          onClick={() => saveMemo.mutate({ inquiryId: inquiry.id, memo: draft })}
        >
          {saveMemo.isPending ? '저장하는 중' : '메모 저장'}
        </Button>
        {saveMemo.isSuccess && !dirty ? (
          <span className="text-xs text-gray-500">저장했습니다</span>
        ) : null}
        {error ? (
          <span role="alert" className="text-xs text-error">
            {serverErrorMessage(error) ?? '저장하지 못했습니다. 다시 시도해 주세요.'}
          </span>
        ) : null}
      </div>
    </div>
  );
}
