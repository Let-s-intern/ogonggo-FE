export type AuthorRole = 'USER' | 'COMPANY' | 'ADMIN' | 'MENTOR';

/**
 * 댓글 작성자의 현재 역할 배지. 관리자는 멘토보다 위 등급이라 `렛츠커리어 매니저` 하나만 보이고, 멘토는
 * `멘토`, 그 밖의 역할(일반·기업) 은 배지가 없다.
 *
 * 취준고민 답변과 사이드·스터디 댓글이 함께 쓴다. `features` 끼리는 서로 가져오지 않으므로 공용 자리에 둔다.
 */
export function AuthorRoleBadge({ role }: { role: AuthorRole }) {
  if (role === 'ADMIN') {
    return (
      <span className="shrink-0 rounded-sm bg-blue-500 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-white">
        렛츠커리어 매니저
      </span>
    );
  }
  if (role === 'MENTOR') {
    return (
      <span className="shrink-0 rounded-sm bg-emerald-50 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-emerald-700">
        멘토
      </span>
    );
  }
  return null;
}
