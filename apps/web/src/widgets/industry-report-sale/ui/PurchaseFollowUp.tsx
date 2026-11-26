import Link from 'next/link';
import { Callout } from '@ogonggo/ui';

/**
 * 구매 창이 닫히거나 오공고 화면으로 돌아왔을 때의 안내. 오공고는 결제가 됐는지 알지 못한다 — 결제 없이 창을
 * 닫은 사람에게도 같은 안내가 보이므로 결제를 단정하는 문구를 쓰지 않는다(PRD 5장, 6장 6).
 * 안내 전체가 마이페이지 `내 리포트` 로 가는 링크 한 줄이다.
 *
 * 한 줄로 둔 이유는 모바일에서 이 안내가 화면 아래에 떠 있는 구매 바 안에 붙기 때문이다. 문구 아래에 버튼을 따로 쌓으면
 * 바가 화면을 크게 가린다.
 */
export function PurchaseFollowUp() {
  return (
    <Callout tone="info" className="p-0">
      <Link
        href="/mypage/reports"
        className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-semibold break-keep"
      >
        결제하셨다면 내 리포트에서 확인해 주세요
        <span aria-hidden="true" className="icon-[lucide--chevron-right] h-4 w-4 shrink-0" />
      </Link>
    </Callout>
  );
}
