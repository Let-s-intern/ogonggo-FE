'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RecruitmentPostForm } from '@/features/recruitment-post-form';
import { isSignedIn } from '@/shared/api/authTokens';
import { useMyAccount } from '@/shared/api/useMyAccount';
import { RouteModal } from '@/shared/ui/RouteModal';
import { myPageHomeFor } from '@/widgets/mypage-sidebar';

const WRITE_HREF = '/mypage/posts/new';

/**
 * 사이드·스터디 목록 위에 뜨는 모집글 작성 모달(`app/(site)/side-studies/@modal`).
 *
 * 폼은 마이페이지 작성 화면과 같은 `RecruitmentPostForm` 이다. 다른 것은 셋이다.
 *
 * - 로그인 가드. 마이페이지에서는 `MyPageLayout` 이 막지만 모달은 그 밖이라 여기서 같은 일을
 *   한다. 로그인하지 않았으면 로그인 화면으로 보내고, 로그인하면 마이페이지 작성 화면으로 온다.
 * - 기업 회원은 모집글을 쓰지 않는다. `MyPageLayout` 과 같이 기업 마이페이지로 보낸다.
 * - 저장한 뒤 작성한 모집글 목록으로 가지 않고 모달을 닫는다. 보던 목록에 남아야 모달로 연
 *   이유가 산다. 게시한 글이 목록에 보이도록 다시 받는다.
 *
 * **모바일은 모달로 열지 않는다.** 화면을 다 덮는 모달보다 마이페이지 작성 화면이 낫다. 주소는
 * 이미 `/mypage/posts/new` 라 페이지를 다시 불러오면 가로채기 없이 그 화면이 뜬다 — 목록의
 * `모집글 쓰기` 버튼과 하단 내비게이션의 같은 메뉴가 둘 다 여기로 들어오므로 한 곳에서 처리한다.
 * 뒤로 가면 보던 목록으로 돌아간다.
 */
export function SideStudyPostFormModal() {
  const router = useRouter();
  const account = useMyAccount();
  // 이 모달은 목록에서 누른 뒤(클라이언트 이동)에만 그려져 첫 렌더부터 `window` 가 있다. 서버에서
  // 그려질 일은 없지만 만일을 위해 막아 둔다.
  const [mobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767.98px)').matches,
  );

  useEffect(() => {
    if (mobile) {
      window.location.reload();
    }
  }, [mobile]);

  useEffect(() => {
    if (mobile) {
      return;
    }
    if (!isSignedIn()) {
      router.replace(`/login?redirect=${encodeURIComponent(WRITE_HREF)}`);
    }
  }, [router, mobile]);

  const isCompany = account.kind === 'ready' && account.account.role === 'COMPANY';
  useEffect(() => {
    if (isCompany) {
      router.replace(myPageHomeFor('COMPANY'));
    }
  }, [isCompany, router]);

  if (mobile) {
    return null;
  }

  return (
    <RouteModal label="모집글 작성">
      <div className="flex flex-col gap-6 px-1 pb-2 md:px-5">
        <header>
          <h1 className="text-xl font-bold text-gray-950 md:text-3xl">
            사이드 프로젝트 · 스터디 모집글 작성
          </h1>
          <p className="pt-2 text-sm text-gray-500">
            사이드 프로젝트 · 스터디를 함께할 메이트들을 모집할 수 있어요.
          </p>
        </header>
        {account.kind === 'ready' && !isCompany ? (
          <RecruitmentPostForm
            onSaved={() => {
              router.back();
              router.refresh();
            }}
          />
        ) : account.kind === 'error' ? (
          <p className="py-16 text-center text-sm text-gray-500">
            계정 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
          </p>
        ) : (
          <p className="py-16 text-center text-sm text-gray-500">불러오는 중입니다.</p>
        )}
      </div>
    </RouteModal>
  );
}
