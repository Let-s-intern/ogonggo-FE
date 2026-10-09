import { ANONYMOUS_NICKNAME } from './labels';

/**
 * 작성자 표시 이름. 닉네임이 없으면 `익명` 이다(PRD 결정 5).
 *
 * 백엔드는 렛츠커리어 프로필이 없는 작성자의 `nickname` 을 `null` 로 보낸다(`ConcernAuthorResponse`).
 * 생성 타입은 `?: string` 이라 `null` 이 타입에 없지만 실제 응답에는 오므로 둘 다 받는다. 공백뿐인
 * 값도 이름으로 보지 않는다.
 */
export function getAuthorName(author: { nickname?: string | null }): string {
  return author.nickname?.trim() || ANONYMOUS_NICKNAME;
}
