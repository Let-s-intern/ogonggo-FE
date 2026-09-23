/**
 * 이 배포본이 자기 자신을 부르는 절대 주소.
 *
 * 메타데이터의 `metadataBase`(`app/layout.tsx`)와 `robots`(`app/robots.ts`)가 이 값을 읽는다.
 * 상대 주소로 적은 canonical·og:image 를 Next 가 절대 주소로 펴는 기준이 이것이다.
 *
 * **비면 운영이 아닌 것으로 본다.** 운영 주소를 기본값으로 박으면 프리뷰 배포가 운영과 같은
 * 주소를 주장하게 되고, 같은 페이지가 둘로 수집된다. 값이 없을 때는 로컬 dev 주소로 떨어지고
 * `robots` 가 전부 막는다 — 색인이 안 되는 쪽이 중복 수집보다 되돌리기 쉽다.
 *
 * 값을 어디에 넣는지와 함정은 `apps/web/.env.example` 에 있다.
 */
const CONFIGURED_ORIGIN = process.env.OGONGGO_SITE_ORIGIN?.trim();

/** `apps/web/package.json` 의 `dev` 스크립트가 쓰는 포트와 같다. */
const LOCAL_ORIGIN = 'http://localhost:4000';

export const SITE_ORIGIN = CONFIGURED_ORIGIN || LOCAL_ORIGIN;

/**
 * 이 배포본을 검색 엔진에 내줄지. `robots`(`app/robots.ts`)가 이걸로 갈린다.
 *
 * 값을 준 배포본만 색인 대상이다 — 운영에만 값을 넣으라는 것이 `.env.example` 의 지시이고,
 * 프리뷰와 로컬은 값이 없어 전부 막힌다. 프리뷰 주소가 수집되면 운영과 같은 내용이 두 벌
 * 쌓이고, 지우는 것은 색인에서 빼 달라고 기다리는 일이라 막는 쪽으로 기울여 둔다.
 */
export const IS_INDEXABLE_DEPLOYMENT = CONFIGURED_ORIGIN !== undefined && CONFIGURED_ORIGIN !== '';
