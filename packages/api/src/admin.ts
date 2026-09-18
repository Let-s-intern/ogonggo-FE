// admin 스펙(ogonggo-api-admin) 의 생성물 진입점. user 생성물을 내보내는 `./index.ts` 와 합치지
// 않는다. ErrorResponse, PageInfo 처럼 두 스펙에 같은 이름으로 있는 모델이 충돌하기 때문이다.
// 어드민 앱은 `@ogonggo/api/src/admin` 으로 가져온다.
export * from './generated/admin/endpoints';
export * from './generated/admin/models';
