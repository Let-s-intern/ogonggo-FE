/**
 * 목록 필터에서 빈 문자열을 뺀다.
 *
 * 화면의 "전체" 는 빈 문자열인데, 생성 함수의 URL 빌더는 `undefined` 만 건너뛰고 빈 문자열은
 * `?visibility=` 처럼 싣는다. 빈 값을 어떻게 읽을지는 받는 쪽마다 다를 수 있어 아예 보내지 않는다.
 */
export function omitEmpty<T extends Record<string, string | number>>(
  params: T,
): Partial<Record<keyof T, string | number>> {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '')) as Partial<
    Record<keyof T, string | number>
  >;
}
