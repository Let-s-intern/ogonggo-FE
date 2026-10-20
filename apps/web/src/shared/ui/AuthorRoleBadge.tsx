import { enumLabel } from '@ogonggo/api';

export type AuthorRole = 'USER' | 'COMPANY' | 'ADMIN' | 'MENTOR';

/**
 * 댓글 작성자의 현재 역할 배지. 관리자와 멘토만 배지가 있고 문구는 enum 카탈로그의 `UserRole`
 * 이다(`관리자 회원`, `멘토 회원`). 그 밖의 역할(일반·기업) 은 배지가 없다.
 *
 * 취준고민 답변과 사이드·스터디 댓글이 함께 쓴다. `features` 끼리는 서로 가져오지 않으므로 공용 자리에 둔다.
 */
export function AuthorRoleBadge({ role }: { role: AuthorRole }) {
  if (role !== 'ADMIN' && role !== 'MENTOR') {
    return null;
  }
  return (
    <span className="shrink-0 rounded-sm bg-blue-500 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-white">
      {enumLabel('UserRole', role)}
    </span>
  );
}
