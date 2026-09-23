/**
 * 어드민 공지사항 픽스처.
 *
 * 모양은 배포된 어드민 스펙(`AdminNoticeDetailResponse`) 을 따른다. 게시 기간(`publicationStartAt`
 * ·`publicationEndAt`) 과 `active` 를 들고 있던 예전 픽스처는 백엔드가 생기기 전에 화면에서
 * 지어낸 것이고, 실제 백엔드는 노출 여부 하나(`visibility`) 만 둔다.
 *
 * 본문은 Lexical EditorState JSON 문자열이다. 백엔드가 JSON 이 아닌 본문을 400 으로 막으므로
 * 픽스처도 같은 모양이어야 목 모드에서 본 것이 실서버에서도 통한다.
 *
 * 아래 값은 **전부 지어낸 것이다.**
 */

export type NoticeVisibility = 'VISIBLE' | 'HIDDEN';

export interface AdminNotice {
  id: number;
  title: string;
  /** Lexical EditorState JSON 문자열. */
  content: string;
  pinned: boolean;
  visibility: NoticeVisibility;
  registeredAt: string;
  updatedAt: string;
  /** 소프트 삭제. 값이 있으면 목록에도 상세에도 나오지 않는다. */
  deletedAt?: string;
}

/**
 * 평문을 최소 EditorState JSON 으로 만든다. 한 줄이 문단 하나다.
 *
 * 화면 쪽 같은 이름 함수(`apps/admin/src/entities/notice/lib/content.ts`) 와 규칙이 같다.
 * 목이 화면 코드를 가져다 쓸 수는 없어서 여기 한 벌 더 있다.
 */
export function lexical(text: string): string {
  return JSON.stringify({
    root: {
      type: 'root',
      version: 1,
      direction: null,
      format: '',
      indent: 0,
      children: text.split('\n').map((line) => ({
        type: 'paragraph',
        version: 1,
        direction: null,
        format: '',
        indent: 0,
        textFormat: 0,
        textStyle: '',
        children: line
          ? [
              {
                type: 'text',
                version: 1,
                text: line,
                format: 0,
                detail: 0,
                mode: 'normal',
                style: '',
              },
            ]
          : [],
      })),
    },
  });
}

const daysFromNow = (days: number): string =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

export const NOTICE_FIXTURES: AdminNotice[] = [
  {
    id: 1,
    title: '개인정보 처리방침 개정 안내',
    content: lexical(
      '2026년 10월 1일부터 개인정보 처리방침이 개정됩니다.\n\n주요 변경 사항은 보관 기간 명시와 위탁 업체 목록 갱신입니다. 자세한 내용은 하단 링크에서 확인해 주세요.',
    ),
    pinned: true,
    visibility: 'VISIBLE',
    registeredAt: daysFromNow(-3),
    updatedAt: daysFromNow(-2),
  },
  {
    id: 2,
    title: '추석 연휴 고객센터 운영 안내',
    content: lexical('9월 27일부터 10월 1일까지 문의 답변이 지연될 수 있습니다.'),
    pinned: false,
    visibility: 'VISIBLE',
    registeredAt: daysFromNow(-6),
    updatedAt: daysFromNow(-6),
  },
  {
    id: 3,
    title: '공고 달력 기능이 추가됐습니다',
    content: lexical(
      '마감일 기준으로 채용공고를 달력에서 볼 수 있습니다. 상단 메뉴의 공고 달력에서 확인해 주세요.',
    ),
    pinned: false,
    visibility: 'VISIBLE',
    registeredAt: daysFromNow(-14),
    updatedAt: daysFromNow(-14),
  },
  {
    id: 4,
    title: '서비스 점검 안내 (완료)',
    content: lexical('8월 30일 새벽 2시부터 4시까지 진행한 점검이 완료됐습니다.'),
    pinned: false,
    visibility: 'HIDDEN',
    registeredAt: daysFromNow(-41),
    updatedAt: daysFromNow(-38),
  },
];
