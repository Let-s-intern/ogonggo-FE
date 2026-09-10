import { createBrowserRouter } from 'react-router';
import { AdminLayout } from '@/widgets/admin-layout';
import { BootcampDetailPage } from '@/pages/bootcamp-detail';
import { BootcampListPage } from '@/pages/bootcamp-list';
import { CompanyMemberDetailPage } from '@/pages/company-member-detail';
import { CompanyMemberListPage } from '@/pages/company-member-list';
import { DashboardPage } from '@/pages/dashboard';
import { InquiryDetailPage } from '@/pages/inquiry-detail';
import { InquiryListPage } from '@/pages/inquiry-list';
import { JobDetailPage } from '@/pages/job-detail';
import { JobListPage } from '@/pages/job-list';
import { NoticeListPage } from '@/pages/notice-list';
import { NotFoundPage } from '@/pages/not-found';
import { RejectionsPage } from '@/pages/rejections';
import { ReviewQueuePage } from '@/pages/review-queue';
import { SideStudyDetailPage } from '@/pages/side-study-detail';
import { SideStudyListPage } from '@/pages/side-study-list';
import { UserMemberDetailPage } from '@/pages/user-member-detail';
import { UserMemberListPage } from '@/pages/user-member-list';

/**
 * 메뉴 트리가 그대로 경로가 된다(PRD `.claude/tasks/memos/prd-admin-console.md` "라우팅").
 *
 * 좌측 메뉴는 `@/shared/config/navigation` 한 곳에서 나오고, 여기 목록 경로가 그것과 1:1 로
 * 맞아야 한다. 어긋나면 메뉴를 눌렀을 때 404 가 난다.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: <DashboardPage /> },

      { path: 'content/jobs', element: <JobListPage /> },
      { path: 'content/jobs/:jobId', element: <JobDetailPage /> },
      { path: 'content/bootcamps', element: <BootcampListPage /> },
      { path: 'content/bootcamps/:bootcampId', element: <BootcampDetailPage /> },
      { path: 'content/side-studies', element: <SideStudyListPage /> },
      { path: 'content/side-studies/:postId', element: <SideStudyDetailPage /> },
      { path: 'content/review', element: <ReviewQueuePage /> },
      { path: 'content/rejections', element: <RejectionsPage /> },

      { path: 'members/users', element: <UserMemberListPage /> },
      { path: 'members/users/:memberId', element: <UserMemberDetailPage /> },
      { path: 'members/companies', element: <CompanyMemberListPage /> },
      { path: 'members/companies/:memberId', element: <CompanyMemberDetailPage /> },

      { path: 'support/inquiries', element: <InquiryListPage /> },
      { path: 'support/inquiries/:inquiryId', element: <InquiryDetailPage /> },
      { path: 'support/notices', element: <NoticeListPage /> },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
