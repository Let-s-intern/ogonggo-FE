import type { Metadata } from 'next';
import { CompanyDashboard } from '@/widgets/company-dashboard/CompanyDashboard';

export const metadata: Metadata = { title: '대시보드' };

/**
 * 기업 회원 대시보드. 로그인하면 여기로 온다(2026-11-10 사용자). 전에는 메뉴 화면 없이 공고 목록으로
 * 보냈다(PRD 6절).
 */
export default function Page() {
  return <CompanyDashboard />;
}
