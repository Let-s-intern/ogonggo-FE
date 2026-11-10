import { useSearchParams } from 'react-router';
import { Tabs } from '@ogonggo/ui';
import type { AdInquiryView } from '@/entities/advertisement-inquiry/api/useAdvertisementInquiries';
import { AdInquiryListPage } from '@/pages/ad-inquiry-list';

type InquiryTab = 'all' | 'FREE_PROMOTION' | 'LAUNCH_ALERT' | 'rejected';

/** 탭마다 볼 상태와 문의 유형. 반려 탭만 반려 상태이고, 유형 탭은 반려를 뺀다. */
const TABS: { value: InquiryTab; label: string; view: AdInquiryView; inquiryType?: string }[] = [
  { value: 'all', label: '전체', view: 'all' },
  { value: 'FREE_PROMOTION', label: '무료 홍보', view: 'active', inquiryType: 'FREE_PROMOTION' },
  { value: 'LAUNCH_ALERT', label: '출시 알림', view: 'active', inquiryType: 'LAUNCH_ALERT' },
  { value: 'rejected', label: '반려', view: 'rejected' },
];

const isTab = (value: string | null): value is InquiryTab =>
  TABS.some((tab) => tab.value === value);

/**
 * 비즈니스 문의. 광고 문의 테이블(무료 홍보·출시 알림)의 문의 전체를 탭으로 나눠 본다(2026-11-10 사용자). 목록·필터·
 * 처리는 무료 홍보 메뉴와 같은 화면(`AdInquiryListPage`)이다. 일반 문의가 생기면 탭을 더한다.
 *
 * 탭은 주소(`?tab=`)에 담아 새로고침·북마크에도 남는다. 탭을 바꾸면 다른 필터와 페이지는 비운다 — 탭마다 맞는
 * 조건이 달라(반려 탭에는 처리 상태가 없다) 옮겨 가면 엉뚱한 조건이 남는다.
 */
export function InquiryManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get('tab');
  const current = TABS.find((tab) => tab.value === (isTab(raw) ? raw : 'all')) ?? TABS[0]!;

  return (
    <AdInquiryListPage
      // 탭마다 목록 상태를 새로 시작한다.
      key={current.value}
      title="비즈니스 문의"
      view={current.view}
      fixedInquiryType={current.inquiryType}
      tabs={
        <Tabs
          items={TABS}
          value={current.value}
          onValueChange={(next) => setSearchParams(next === 'all' ? {} : { tab: next })}
          aria-label="문의 구분"
          className="mb-4"
        />
      }
    />
  );
}
