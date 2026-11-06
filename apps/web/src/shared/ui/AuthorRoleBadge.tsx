import { CrownIcon, GraduationCapIcon } from './icons';

export type AuthorRole = 'USER' | 'COMPANY' | 'ADMIN' | 'MENTOR';

/**
 * 댓글 작성자의 현재 역할 배지. 관리자와 멘토만 배지가 있다. 관리자는 왕관과 `운영진`, 멘토는 졸업모와
 * `멘토` 다. 그 밖의 역할(일반·기업) 은 배지가 없다.
 *
 * 문구를 enum 카탈로그(`UserRole`)에서 가져오지 않는 이유는 카탈로그의 `관리자 회원`·`멘토 회원` 이 어드민
 * 회원 목록용 이름이어서다. 사용자 화면의 댓글 옆에서는 누가 단 글인지가 읽혀야 한다.
 *
 * 취준고민 답변과 사이드·스터디 댓글이 함께 쓴다. `features` 끼리는 서로 가져오지 않으므로 공용 자리에 둔다.
 */
export function AuthorRoleBadge({ role }: { role: AuthorRole }) {
  if (role !== 'ADMIN' && role !== 'MENTOR') {
    return null;
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-sm bg-blue-500 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-white">
      {role === 'ADMIN' ? (
        <>
          <CrownIcon className="h-3 w-3" />
          운영진
        </>
      ) : (
        <>
          <GraduationCapIcon className="h-3 w-3" />
          멘토
        </>
      )}
    </span>
  );
}
