import type { CSSProperties, MouseEvent } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { Callout, cn } from '@ogonggo/ui';
import {
  ADMIN_TOKEN_UNVERIFIED_MESSAGE,
  isAdminTokenUnverified,
} from '@/shared/api/adminTokenUnverified';
import { WEB_HOME, webHandoffHref } from '@/shared/api/webHandoff';
import { NAV_SECTIONS } from '@/shared/config/navigation';
import { isMockEnabled } from '@/app/enableMocking';
import { useReviewQueue } from '@/entities/review/api/useReviewQueue';
import {
  todayAdInquiriesHref,
  useAdInquiryTodayCount,
} from '@/entities/advertisement-inquiry/api/useAdvertisementInquiries';
import {
  ASSISTANT_CLOSED_WIDTH,
  ASSISTANT_OPEN_WIDTH,
  AssistantPanel,
  useAssistantPanelOpen,
} from '@/features/ai-assistant';

/**
 * 콘솔의 바깥 틀. 좌측 고정 메뉴와 본문 자리다.
 *
 * 운영자 한 명이 넓은 화면에서 쓰는 도구라 메뉴를 접는 동작을 넣지 않는다(PRD "이 서비스가
 * 무엇인가" — 익명 트래픽을 위한 화면이 아니다). 좁은 화면 대응이 필요해지면 그때 넣는다.
 *
 * 메뉴 맨 아래 `오공고 웹으로` 는 로그인을 이어 웹으로 돌아간다(`shared/api/webHandoff.ts`). 주소는 누르는
 * 순간 만든다 — 토큰이 `sessionStorage` 에만 있어 미리 `href` 에 박으면 로그아웃 뒤에도 옛 토큰이 남는다.
 * 새 탭으로 열면(Cmd·Ctrl·가운데 버튼) `href` 대로 로그인 없이 열린다.
 *
 * 어드민 API 가 토큰을 판단하지 못한 상태의 안내도 여기서 그린다. 그때는 어느 메뉴를 눌러도
 * 비어 있으므로 한 화면에 두면 나머지 여덟 화면은 이유 없이 빈 채로 남는다.
 */
/** 그냥 누른 것만 가로채 토큰을 붙인다. */
function goToWeb(event: MouseEvent<HTMLAnchorElement>) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }
  event.preventDefault();
  window.location.assign(webHandoffHref());
}

export function AdminLayout() {
  const [isAssistantOpen, setIsAssistantOpen] = useAssistantPanelOpen();
  // 검수 대기 화면과 같은 쿼리를 쓴다. 판정을 저장하면 그 화면이 무효화하므로 숫자도 함께 바뀐다.
  const { data: reviewQueue } = useReviewQueue();
  const navCounts: Record<string, number | undefined> = {
    '/ads/review': reviewQueue?.length,
  };
  /*
   * 파란 숫자 배지. 위의 회색 숫자(남은 일의 양)와 달리 "새로 들어온 것" 을 알린다. 누르면 그 숫자에 해당하는
   * 목록(`to`)으로 간다. `navigation.ts` 는 `shared/config` 라 entity 훅을 가져올 수 없어 메뉴 정의가 아니라
   * 여기서 경로로 붙인다 — 위 `navCounts` 와 같은 방식이다.
   */
  const { data: adInquiryToday } = useAdInquiryTodayCount();
  const navBadges: Record<string, { count: number | undefined; to: string; label: string }> = {
    '/business/ad-inquiries': {
      count: adInquiryToday?.count,
      to: todayAdInquiriesHref(),
      label: '오늘 들어온 문의',
    },
  };
  const navigate = useNavigate();
  const navBadgeFor = (path: string) => {
    const badge = navBadges[path];
    return badge?.count ? (
      <NavBadge count={badge.count} to={badge.to} label={badge.label} onOpen={navigate} />
    ) : null;
  };

  return (
    <div
      className="flex min-h-screen bg-gray-50"
      // 오른쪽 AI 비서 패널의 폭. 화면 오른쪽에 붙는 플로팅 요소(상세의 수정 버튼, 목록의 일괄 변경 바)가
      // 이 값만큼 비켜 서서 패널에 가리지 않는다.
      style={
        {
          '--assistant-width': isAssistantOpen ? ASSISTANT_OPEN_WIDTH : ASSISTANT_CLOSED_WIDTH,
        } as CSSProperties
      }
    >
      <nav className="w-56 shrink-0 border-r border-gray-200 bg-white px-3 py-6">
        <p className="px-3 pb-1 text-lg font-bold text-gray-900">오공고 관리자</p>
        {/*
          목이 켜져 있으면 화면에 적는다. 실수로 켜둔 채 실서비스가 되면 데이터만 가짜인
          화면이 멀쩡히 돌아가고, 그건 사람이 눈으로 잡는 수밖에 없다.
        */}
        {isMockEnabled ? (
          <p className="mx-3 mb-5 rounded-sm bg-orange-50 px-2 py-1 text-xs font-medium text-orange-600">
            목데이터로 동작 중
          </p>
        ) : (
          <div className="pb-5" />
        )}
        {NAV_SECTIONS.map((section, index) => (
          <div key={section.title ?? index} className="pb-6">
            {section.title ? (
              <p className="px-3 pb-2 text-sm font-medium text-gray-400">{section.title}</p>
            ) : null}
            <ul>
              {section.items.map((item) => (
                <li key={item.path}>
                  {item.disabled ? (
                    // 라우트가 없는 항목. 링크로 두면 눌렀을 때 404 가 난다.
                    <span
                      aria-disabled="true"
                      title="아직 만들지 않은 화면입니다"
                      className="block cursor-not-allowed rounded-sm px-3 py-2 text-sm text-gray-300"
                    >
                      {item.label}
                    </span>
                  ) : (
                    <NavLink
                      to={item.path}
                      // `/` 는 end 가 없으면 모든 경로에 활성으로 걸린다.
                      end={item.path === '/'}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center justify-between rounded-sm px-3 py-2 text-sm',
                          isActive
                            ? 'bg-blue-50 font-medium text-blue-600'
                            : 'text-gray-700 hover:bg-gray-100',
                        )
                      }
                    >
                      {item.label}
                      {navBadgeFor(item.path)}
                      {navCounts[item.path] ? (
                        <span className="text-xs font-normal text-gray-400">
                          {navCounts[item.path]}
                        </span>
                      ) : null}
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <a
          href={WEB_HOME}
          onClick={goToWeb}
          className="mx-3 flex items-center justify-between rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          오공고 웹으로
          <span aria-hidden="true" className="icon-[lucide--arrow-up-right] block h-4 w-4" />
        </a>
      </nav>
      {/* 아래 여백은 목록에서 고르면 뜨는 하단 바(`widgets/bulk-visibility`)가 표 끝을 가리지 않게 둔다. */}
      <main className="min-w-0 flex-1 px-8 pt-6 pb-24">
        {isAdminTokenUnverified() ? (
          <Callout tone="warning" className="mb-6">
            {ADMIN_TOKEN_UNVERIFIED_MESSAGE}
          </Callout>
        ) : null}
        <Outlet />
      </main>
      {/* 화면을 옮겨도 대화가 남도록 본문(`Outlet`) 밖, 레이아웃에 둔다. */}
      <AssistantPanel open={isAssistantOpen} onOpenChange={setIsAssistantOpen} />
    </div>
  );
}

/**
 * 메뉴 글자 오른쪽 숫자 배지. 0 이면 그리지 않고(부르는 쪽), 100 이상이면 `99+` 다.
 *
 * 메뉴 링크 안에 있어 링크를 겹쳐 둘 수 없다. 누르면 메뉴 이동을 막고 배지의 목록으로 보낸다. 키보드로는
 * 메뉴로 들어간 뒤 목록의 `오늘` 버튼이 같은 일을 한다.
 */
function NavBadge({
  count,
  to,
  label,
  onOpen,
}: {
  count: number;
  to: string;
  label: string;
  onOpen: (to: string) => void;
}) {
  return (
    <span
      role="link"
      aria-label={`${label} ${count}건`}
      title={`${label} 보기`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onOpen(to);
      }}
      className="min-w-5 cursor-pointer rounded-full bg-blue-500 px-1.5 text-center text-xs leading-5 font-semibold text-white hover:bg-blue-600"
    >
      {count >= 100 ? '99+' : count}
    </span>
  );
}
