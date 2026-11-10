import { Navigate, createBrowserRouter } from 'react-router';
import { AdminLayout } from '@/widgets/admin-layout';
import { AdContractDetailPage } from '@/pages/ad-contract-detail';
import { AdContractListPage } from '@/pages/ad-contract-list';
import { AdInquiryListPage } from '@/pages/ad-inquiry-list';
import { AdProductListPage } from '@/pages/ad-product-list';
import { BannerSettingsPage } from '@/pages/banner-settings';
import { BootcampDetailPage } from '@/pages/bootcamp-detail';
import { BootcampEditPage } from '@/pages/bootcamp-edit';
import { BootcampListPage } from '@/pages/bootcamp-list';
import { CompanyMemberDetailPage } from '@/pages/company-member-detail';
import { CompanyPriorityPage } from '@/pages/company-priority';
import { ConcernDetailPage } from '@/pages/concern-detail';
import { ConcernListPage } from '@/pages/concern-list';
import { CompanyMemberListPage } from '@/pages/company-member-list';
import { JobDetailPage } from '@/pages/job-detail';
import { JobListPage } from '@/pages/job-list';
import { LoginPage } from '@/pages/login';
import { NewJobReviewPage } from '@/pages/new-job-review';
import { NoticeListPage } from '@/pages/notice-list';
import { NotificationBatchDetailPage } from '@/pages/notification-batch-detail';
import { NotificationHistoryPage } from '@/pages/notification-history';
import { NotificationSendPage } from '@/pages/notification-send';
import { NotFoundPage } from '@/pages/not-found';
import { ProxyBootcampNewPage } from '@/pages/proxy-bootcamp-new';
import { ProxyJobNewPage } from '@/pages/proxy-job-new';
import { RecommendWeightsPage } from '@/pages/recommend-weights';
import { RejectionsPage } from '@/pages/rejections';
import { ReviewQueuePage } from '@/pages/review-queue';
import { ServiceFeedbackListPage } from '@/pages/service-feedback-list';
import { SideStudyDetailPage } from '@/pages/side-study-detail';
import { SideStudyListPage } from '@/pages/side-study-list';
import { StatsPage } from '@/pages/stats';
import { TodayJobsPage } from '@/pages/today-jobs';
import { UserMemberDetailPage } from '@/pages/user-member-detail';
import { UserMemberListPage } from '@/pages/user-member-list';
import { RequireAuth } from './RequireAuth';

/**
 * 메뉴 트리가 그대로 경로가 된다(PRD `.claude/tasks/memos/prd-admin-console.md` "라우팅").
 *
 * 좌측 메뉴는 `@/shared/config/navigation` 한 곳에서 나오고, 여기 목록 경로가 그것과 1:1 로
 * 맞아야 한다. 어긋나면 메뉴를 눌렀을 때 404 가 난다.
 */
export const router = createBrowserRouter([
  // 좌측 메뉴 틀 밖에 둔다. 로그인 전에는 메뉴가 부를 API 가 모두 401 이다.
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AdminLayout />
      </RequireAuth>
    ),
    children: [
      // 대시보드는 집계 API 가 없어 숨겼다. 로그인 뒤와 404 의 `/` 는 첫 메뉴로 보낸다.
      { index: true, element: <Navigate to="/content/jobs" replace /> },

      { path: 'content/jobs', element: <JobListPage /> },
      { path: 'content/jobs/:jobId', element: <JobDetailPage /> },
      { path: 'content/new-jobs', element: <NewJobReviewPage /> },
      { path: 'content/bootcamps', element: <BootcampListPage /> },
      { path: 'content/bootcamps/:bootcampId', element: <BootcampDetailPage /> },
      { path: 'content/bootcamps/:bootcampId/edit', element: <BootcampEditPage /> },
      { path: 'content/side-studies', element: <SideStudyListPage /> },
      { path: 'content/side-studies/:postId', element: <SideStudyDetailPage /> },
      { path: 'content/concerns', element: <ConcernListPage /> },
      { path: 'content/concerns/:concernId', element: <ConcernDetailPage /> },

      { path: 'ads/review', element: <ReviewQueuePage /> },
      { path: 'ads/rejections', element: <RejectionsPage /> },

      // 비즈니스 등록 채용공고·부트캠프만 보는 목록. 유저 구역의 같은 화면을 등록 경로만 묶어 쓴다.
      {
        path: 'business/jobs',
        element: <JobListPage key="business" fixedSource="COMPANY" title="비즈니스 채용공고" />,
      },
      {
        path: 'business/bootcamps',
        element: (
          <BootcampListPage
            key="business"
            fixedSource="COMPANY"
            title="비즈니스 부트캠프"
            detailBasePath="/business/bootcamps"
          />
        ),
      },
      { path: 'business/bootcamps/:bootcampId', element: <BootcampDetailPage /> },
      { path: 'business/bootcamps/:bootcampId/edit', element: <BootcampEditPage /> },
      {
        path: 'business/ad-inquiries',
        element: <AdInquiryListPage title="무료 홍보 신청" fixedInquiryType="FREE_PROMOTION" />,
      },
      {
        path: 'business/rejected-ad-inquiries',
        // 경로가 달라도 같은 컴포넌트라 key 가 없으면 메뉴를 옮겨도 상태가 남는다.
        element: (
          <AdInquiryListPage
            key="rejected"
            view="rejected"
            title="반려한 무료 홍보"
            fixedInquiryType="FREE_PROMOTION"
          />
        ),
      },
      {
        path: 'business/advertisement-applications',
        element: <AdContractListPage key="applications" view="applications" />,
      },
      {
        path: 'business/advertisement-contracts',
        element: <AdContractListPage key="contracts" view="contracts" />,
      },
      {
        path: 'business/advertisement-contracts/:contractId',
        element: <AdContractDetailPage />,
      },
      { path: 'business/advertisement-products', element: <AdProductListPage /> },
      { path: 'business/banners', element: <BannerSettingsPage /> },

      { path: 'placements/pick-jobs', element: <TodayJobsPage /> },
      { path: 'placements/recommend-weights', element: <RecommendWeightsPage /> },
      { path: 'placements/company-priority', element: <CompanyPriorityPage /> },

      { path: 'members/users', element: <UserMemberListPage /> },
      { path: 'members/users/:memberId', element: <UserMemberDetailPage /> },
      { path: 'members/companies', element: <CompanyMemberListPage /> },
      { path: 'members/companies/:memberId', element: <CompanyMemberDetailPage /> },
      // 비즈니스 회원 대신 공고를 올린다(FE #568). 메뉴에는 없고 회원 상세의 버튼으로 들어온다.
      { path: 'members/companies/:memberId/jobs/new', element: <ProxyJobNewPage /> },
      { path: 'members/companies/:memberId/bootcamps/new', element: <ProxyBootcampNewPage /> },

      { path: 'support/notices', element: <NoticeListPage /> },
      { path: 'support/feedbacks', element: <ServiceFeedbackListPage /> },

      { path: 'notifications/send', element: <NotificationSendPage /> },
      { path: 'notifications/history/:channel', element: <NotificationHistoryPage /> },
      { path: 'notifications/batches/:batchId', element: <NotificationBatchDetailPage /> },

      { path: 'stats', element: <StatsPage /> },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
