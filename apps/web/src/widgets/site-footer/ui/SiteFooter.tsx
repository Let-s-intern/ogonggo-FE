import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from '@/shared/ui/Logo';
import { FooterContactButton } from './FooterActions';

/**
 * 하단 푸터. 위 줄은 왼쪽 로고, 오른쪽 링크, 아래는 사업자 정보 줄이다.
 *
 * 링크는 모두 실제로 간다. `공지사항` 은 목록으로, 약관 두 개는 렛츠인턴 노션 문서로 새 탭을 연다.
 * `고객센터`·`제휴 문의` 는 이메일을 알리는 모달이다(`FooterContactButton`).
 *
 * 누를 수 있는 글자는 마우스를 올리면 파랗게 바뀐다(`LINK`). 회사 정보 같은 그냥 글자와 구분이 안
 * 돼서 눌러도 되는지 알 수 없었다.
 *
 * 사업자 정보는 한 줄 안에서 `Divider` 로 나눈다. 좁은 화면에서는 줄바꿈되므로 구분선을 숨긴다.
 */
const TERMS_URL =
  'https://letsintern.notion.site/3e95e77cbee180f993a3c70e3bce5a21?source=copy_link';
const PRIVACY_POLICY_URL = 'https://letsintern.notion.site/3e95e77cbee18074a1c7dc485644d737?pvs=74';

/** 누를 수 있는 글자의 마우스 올림 색. */
const LINK = 'transition-colors hover:text-blue-500';

function Divider() {
  return <span aria-hidden="true" className="hidden h-3 w-px bg-gray-300 md:inline-block" />;
}

function InfoLine({ children }: { children: ReactNode }) {
  return <p className="flex flex-col gap-1 md:flex-row md:items-center md:gap-3">{children}</p>;
}

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto flex max-w-page-padded flex-col gap-10 px-5 py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <Link href="/" aria-label="오늘의 공고 홈" className="text-blue-500">
            <Logo className="h-[25px] w-[52px]" />
          </Link>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-base text-gray-700">
            <Link href="/notices" className={LINK}>
              공지사항
            </Link>
            <FooterContactButton kind="support" className={LINK} />
            <span aria-hidden="true" className="h-3 w-px bg-gray-300" />
            <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className={LINK}>
              서비스 이용약관
            </a>
            <a href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer" className={LINK}>
              개인정보처리방침
            </a>
            <FooterContactButton kind="partnership" className={LINK} />
          </nav>
        </div>
        <div className="flex flex-col gap-2 text-sm text-gray-500">
          <p>아이엔지 사업자 정보</p>
          <InfoLine>
            <span>대표자: 송다예</span>
            <Divider />
            <span>이메일: official@letscareer.co.kr</span>
          </InfoLine>
          <InfoLine>
            <span>통신판매업신고번호 제 2026-서울성동-1456호</span>
            <Divider />
            <span>사업자등록번호: 871-11-02629</span>
            <Divider />
            <span>직업정보제공사업 신고번호: J1202020260026</span>
          </InfoLine>
          <InfoLine>
            <span>주소: 서울특별시 성동구 왕십리로 137, 성동창업이룸센터 2층 206호</span>
            <Divider />
            <span>고객센터: 0507-0178-8541</span>
            <Divider />
            <span>Copyright© 2024 아이엔지. All rights reserved</span>
          </InfoLine>
        </div>
      </div>
    </footer>
  );
}
