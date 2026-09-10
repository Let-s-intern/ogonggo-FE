import { NavLink, Outlet } from 'react-router';
import { cn } from '@ogonggo/ui';
import { NAV_SECTIONS } from '@/shared/config/navigation';

/**
 * 콘솔의 바깥 틀. 좌측 고정 메뉴와 본문 자리다.
 *
 * 운영자 한 명이 넓은 화면에서 쓰는 도구라 메뉴를 접는 동작을 넣지 않는다(PRD "이 서비스가
 * 무엇인가" — 익명 트래픽을 위한 화면이 아니다). 좁은 화면 대응이 필요해지면 그때 넣는다.
 */
export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <nav className="w-56 shrink-0 border-r border-gray-200 bg-white px-3 py-6">
        <p className="px-3 pb-6 text-lg font-bold text-gray-900">오공고 관리자</p>
        {NAV_SECTIONS.map((section, index) => (
          <div key={section.title ?? index} className="pb-6">
            {section.title ? (
              <p className="px-3 pb-2 text-sm font-medium text-gray-400">{section.title}</p>
            ) : null}
            <ul>
              {section.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    // `/` 는 end 가 없으면 모든 경로에 활성으로 걸린다.
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      cn(
                        'block rounded-sm px-3 py-2 text-sm',
                        isActive
                          ? 'bg-blue-50 font-medium text-blue-600'
                          : 'text-gray-700 hover:bg-gray-100',
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <main className="min-w-0 flex-1 px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
