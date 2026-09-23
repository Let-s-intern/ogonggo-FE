import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { getPublicRecruitmentPost, HttpError } from '@ogonggo/api';
import type { SuccessResponseRecruitmentPostDetailResponse } from '@ogonggo/api';
import type { SideStudyDetail } from '@/entities/side-study/model/types';
import { hasLexicalText } from '@/shared/lib/lexicalHtml';
import { ApplyCta } from '@/shared/ui/ApplyCta';
import { LexicalContent } from '@/shared/ui/LexicalContent';
import { SideStudyDetailBreadcrumb } from './SideStudyDetailBreadcrumb';
import { SideStudyDetailHeaderCard } from './SideStudyDetailHeaderCard';
import { SideStudyInfoGrid } from './SideStudyInfoGrid';
import { SimilarSideStudies } from './SimilarSideStudies';

export interface SideStudyDetailViewProps {
  postId: number;
}

/**
 * `신청하러 가기` 의 이동 주소. 사이트 안 지원 API 는 붙이지 않고 출시 알림 신청 페이지로
 * 보낸다(PRD Push 5 "사용자 결정", 2026-09-18).
 */
const APPLY_URL = 'https://biz.ogonggo.co.kr/';

/**
 * 공개 상세 `getPublicRecruitmentPost`(`GET /api/v1/recruitment-posts/{postId}`).
 *
 * 백엔드는 1 미만 id 에 400 을 준다. 경로의 id 가 양의 정수가 아니면 부르지 않고 바로
 * `notFound()` 로 보낸다 — 없는 글과 같은 화면이 맞고, 400 이 오류 화면으로 새지 않는다.
 * 404 는 `HttpError.status` 로 가려 `notFound()` 로 바꾸고, 그 외 오류는 다시 던진다.
 * 응답 언랩은 채용공고·부트캠프 상세와 같다.
 */
export async function fetchSideStudyDetail(postId: number): Promise<SideStudyDetail> {
  if (!Number.isInteger(postId) || postId < 1) {
    notFound();
  }

  let response: SuccessResponseRecruitmentPostDetailResponse;
  try {
    response = (await getPublicRecruitmentPost(
      postId,
    )) as unknown as SuccessResponseRecruitmentPostDetailResponse;
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  if (!response.data) {
    notFound();
  }

  return response.data;
}

/**
 * `사이드스터디 상세페이지.png`가 쓰는 본문 세 섹션 그대로다. 값이 없으면 아래에서 제목째
 * 걸러지므로 `지원 자격 및 전형`은 `eligibilityAndSelectionProcess`가 없는 글에서 통째로
 * 사라진다 — 채용공고 상세의 `buildSections`와 같은 규칙이다.
 *
 * `content`는 Lexical EditorState JSON 이라 `LexicalContent` 가 서식(제목·목록·링크 등) 을
 * 살려 그린다. 보일 글자가 없으면 다른 섹션처럼 뺀다.
 */
function buildSections(sideStudy: SideStudyDetail): { label: string; body?: ReactNode }[] {
  const plain = (value?: string) =>
    value ? <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{value}</p> : undefined;

  return [
    { label: '한 줄 소개', body: plain(sideStudy.summary) },
    {
      label: '모집 상세 내용',
      body: hasLexicalText(sideStudy.content) ? (
        <LexicalContent content={sideStudy.content} className="mt-2" />
      ) : undefined,
    },
    { label: '지원 자격 및 전형', body: plain(sideStudy.eligibilityAndSelectionProcess) },
  ];
}

/**
 * 사이드·스터디 상세 — `docs/asset/사이드스터디 상세페이지.png` 순서(브레드크럼 → 헤더 카드 →
 * 정보 그리드·본문 / 사이드바)로 조합한다. 2단 비율·여백(`lg:grid-cols-[739fr_323fr]`, `px-8`,
 * `lg:gap-15`)은 채용공고·부트캠프 상세와 같은 값이다 — 세 상세 화면의 글자 시작 x가 한 줄로
 * 맞아야 한다(PRD 7절).
 *
 * 컬럼 폭에 `minmax(0, ...)`를 쓴다. 그냥 `739fr_323fr`로 두면 그리드 아이템의
 * `min-width: auto` 때문에 사이드바의 긴 제목이 줄지 못하고 컬럼을 밀어내 비율이 깨진다 —
 * 본문이 좁아지고 사이드바가 넓어지는 증상이었다.
 */
export async function SideStudyDetailView({ postId }: SideStudyDetailViewProps) {
  const sideStudy = await fetchSideStudyDetail(postId);

  return (
    <div className="flex w-full max-w-6xl flex-col gap-4">
      <SideStudyDetailBreadcrumb />
      <SideStudyDetailHeaderCard sideStudy={sideStudy} />
      <div className="grid grid-cols-1 gap-6 px-8 lg:grid-cols-[minmax(0,739fr)_minmax(0,323fr)] lg:gap-15">
        <div className="flex flex-col gap-10">
          <SideStudyInfoGrid sideStudy={sideStudy} />
          {buildSections(sideStudy)
            .filter((section) => section.body !== undefined)
            .map((section) => (
              <section key={section.label}>
                <h2 className="text-lg font-bold text-gray-900">{section.label}</h2>
                {section.body}
              </section>
            ))}
        </div>
        <aside className="flex flex-col gap-6">
          <ApplyCta
            label="신청하러 가기"
            href={APPLY_URL}
            kind="side-studies"
            id={sideStudy.id}
            bookmarked={sideStudy.bookmarked}
            bookmarkCount={sideStudy.bookmarkCount}
          />
          {/* 목업의 이 자리에 있는 댓글·대댓글 스레드는 그리지 않는다
              (PRD 8절, 2026-09-01 결정). 대신 들어가는 것이 아래 `비슷한 사이드·스터디`다. */}
          <SimilarSideStudies excludePostId={sideStudy.id} kind={sideStudy.recruitmentType} />
        </aside>
      </div>
    </div>
  );
}
