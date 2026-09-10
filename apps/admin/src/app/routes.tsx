import { createBrowserRouter } from 'react-router';
import { AdminLayout } from '@/widgets/admin-layout';
import { DashboardPage } from '@/pages/dashboard';
import { NotFoundPage } from '@/pages/not-found';
import { PlaceholderPage } from '@/pages/placeholder';
import { NAV_SECTIONS } from '@/shared/config/navigation';

/**
 * 메뉴 트리가 그대로 경로가 된다(PRD `.claude/tasks/memos/prd-admin-console.md` "라우팅").
 *
 * 아직 만들지 않은 화면은 `PlaceholderPage` 로 잇는다. 라우트를 나중에 한꺼번에 다는 대신
 * 지금 다 달아 두는 이유는, 좌측 메뉴가 `NAV_SECTIONS` 하나에서 나오기 때문이다. 라우트가
 * 없는 항목을 메뉴에 걸면 눌렀을 때 404 가 나고, 메뉴에서 빼두면 어떤 화면이 남았는지 화면
 * 위에서 볼 수 없다.
 */
const placeholderRoutes = NAV_SECTIONS.flatMap((section) => section.items)
  .filter((item) => item.path !== '/')
  .map((item) => ({
    path: item.path.slice(1),
    element: <PlaceholderPage title={item.label} />,
  }));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      ...placeholderRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
