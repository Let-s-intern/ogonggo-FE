/**
 * 생성 함수의 선언 타입에서 성공 응답의 `data` 가 무엇인지 꺼낸다.
 *
 * orval 이 선언한 반환은 상태 코드별 합집합(`{ data: 봉투, status: 200, headers } | ...`) 이다.
 * 그중 성공(200·201) 쪽 봉투의 `data` 가 화면이 쓰는 값이다.
 */
type SuccessEnvelope<R> = Extract<R, { status: 200 | 201 }> extends { data: infer E } ? E : never;

export type UnwrappedData<R> =
  SuccessEnvelope<R> extends { data?: infer D } ? D | undefined : never;

/**
 * 생성 함수(`@ogonggo/api/src/admin`) 를 한 번 부르고 봉투의 `data` 만 꺼낸다.
 *
 * 선언과 실제가 다르다. 생성 함수는 `{ data: 봉투, status, headers }` 를 돌려준다고 선언하지만,
 * mutator 인 `httpClient`(packages/api/src/lib/http-client.ts) 는 본문인 봉투
 * `{ status, message, data }` 를 그대로 돌려준다. 실패 응답은 봉투가 오기 전에 `httpClient` 가
 * 던진다. 그 차이를 흡수하는 자리를 여기 한 곳에 둔다 — 화면마다 캐스팅하면 `httpClient` 가
 * 바뀔 때 고칠 곳을 다 찾을 수 없다.
 */
export async function unwrapData<R extends { status: number }>(
  request: Promise<R>,
): Promise<UnwrappedData<R>> {
  const envelope = (await request) as unknown as { data: UnwrappedData<R> };
  return envelope.data;
}
