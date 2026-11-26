import Link from 'next/link';
import { Button, Callout } from '@ogonggo/ui';

/**
 * 구매 창이 닫히거나 오공고 화면으로 돌아왔을 때의 안내. 오공고는 결제가 됐는지 알지 못한다 — 결제 없이 창을
 * 닫은 사람에게도 같은 안내가 보이므로 결제를 단정하는 문구를 쓰지 않는다(PRD 5장, 6장 6).
 * `내 리포트 보기` 는 마이페이지 `내 리포트` 로 가는 링크다.
 */
export function PurchaseFollowUp() {
  return (
    <Callout tone="info" className="flex flex-col gap-2 px-3 py-2">
      <p className="font-semibold break-keep">결제하셨다면 내 리포트에서 확인해 주세요</p>
      <Button asChild variant="secondary" size="sm" className="w-full bg-white">
        <Link href="/mypage/reports">내 리포트 보기</Link>
      </Button>
    </Callout>
  );
}
