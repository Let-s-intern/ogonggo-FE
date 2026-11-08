import type { Metadata } from 'next';
import { CompanyJobFormPage } from '@/widgets/company-job-form';

export const metadata: Metadata = { title: '채용 공고 등록' };

export default function Page() {
  return <CompanyJobFormPage />;
}
