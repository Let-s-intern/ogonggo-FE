import { CONTACT_EMAIL, PRIVACY_POLICY_URL, TERMS_URL } from '@/shared/config/site';

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-100">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 py-8 text-sm text-gray-500 md:flex-row md:items-center md:justify-between md:px-6">
        <p>
          오늘의 공고 · 아이엔지 ·{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-blue-500">
            {CONTACT_EMAIL}
          </a>
        </p>
        <nav aria-label="약관" className="flex gap-5">
          <a href={TERMS_URL} target="_blank" rel="noreferrer" className="hover:text-blue-500">
            서비스 이용약관
          </a>
          <a
            href={PRIVACY_POLICY_URL}
            target="_blank"
            rel="noreferrer"
            className="font-semibold hover:text-blue-500"
          >
            개인정보처리방침
          </a>
        </nav>
      </div>
    </footer>
  );
}
