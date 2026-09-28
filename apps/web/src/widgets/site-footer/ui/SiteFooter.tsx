import Link from 'next/link';

/**
 * `home.png` 하단 푸터. 회사 정보와 링크 목록 전부 대상 화면이 없는 정적 콘텐츠라(PRD 10절)
 * 링크는 `<span>`으로 두고 진짜 라우팅을 걸지 않는다.
 *
 * 예외는 `공지사항`, `서비스 이용약관`, `개인정보처리방침` 셋이다. `/notices` 가 생겨(#105) 링크로
 * 바꿨고, 약관 두 개는 렛츠인턴 노션 문서로 새 탭을 연다. 나머지는 화면이 있는 것도 있지만 이 작업의
 * 범위가 아니라 `<span>` 으로 둔다.
 */
const TERMS_URL =
  'https://letsintern.notion.site/3e95e77cbee180f993a3c70e3bce5a21?source=copy_link';
const PRIVACY_POLICY_URL = 'https://letsintern.notion.site/3e95e77cbee18074a1c7dc485644d737?pvs=74';

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-extrabold text-blue-500">오늘의 공고</span>
            <span className="text-xs font-medium text-gray-400">BY LETS CAREER</span>
          </div>
          <p className="text-sm text-gray-500">
            오늘의 공고는 렛츠커리어가 만든 채용·교육·모집 정보 서비스에요
          </p>
          <div className="flex flex-col gap-1 text-xs text-gray-400">
            <p>아이엔지 사업자 정보</p>
            <p>대표자: 송다예 | 사업자 등록번호: 871-11-02629</p>
            <p>통신판매업신고번호 제 2026-서울성동-1456호</p>
            <p>직업정보제공사업 신고번호: J1202020260026</p>
            <p>주소: 서울특별시 성동구 왕십리로 137, 성동창업이룸센터 2층 206호</p>
            <p>이메일: official@letscareer.co.kr</p>
            <p>고객센터: 0507-0178-8541</p>
            <p>Copyright ©2024 아이엔지. All rights reserved.</p>
          </div>
          <div className="flex gap-4 text-xs text-gray-400">
            <a
              href={TERMS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-600"
            >
              서비스 이용약관
            </a>
            <a
              href={PRIVACY_POLICY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-600"
            >
              개인정보처리방침
            </a>
            <span>제휴 문의</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm text-gray-600">
          <span>채용 공고</span>
          <Link href="/notices" className="hover:text-gray-900">
            공지사항
          </Link>
          <span>교육/부트캠프</span>
          <span>자주 묻는 질문</span>
          <span>사이드/스터디</span>
          <span>고객센터</span>
          <span>공고 등록</span>
        </div>
      </div>
    </footer>
  );
}
