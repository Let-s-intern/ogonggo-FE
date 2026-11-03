# 시안 배포용 이미지. MSW 목이 켜진 채로 뜬다 — 백엔드 없이 화면이 돈다.
# 빌드 컨텍스트는 모노레포 루트다: docker build -f apps/business/Dockerfile .
#
# 목 여부는 `OGONGGO_USE_MOCKS` 다. 정확히 `false` 일 때만 꺼지고(`src/instrumentation.ts`), 브라우저 쪽 값은
# 빌드 때 박힌다(`next.config.ts`). 그래서 빌드와 실행에 같은 값을 둔다. 기본은 빈 값(켜짐)이다.
# `NEXT_PUBLIC_*` 도 빌드 때 박히므로 앱 사이 링크 주소는 빌드 인자로 받는다(루트 docker-compose.yml).
FROM node:20-bookworm-slim

WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY . .
RUN pnpm install --frozen-lockfile --filter business...

ARG OGONGGO_USE_MOCKS=
ARG NEXT_PUBLIC_WEB_ORIGIN=
ENV OGONGGO_USE_MOCKS=$OGONGGO_USE_MOCKS \
    NEXT_PUBLIC_WEB_ORIGIN=$NEXT_PUBLIC_WEB_ORIGIN \
    NEXT_TELEMETRY_DISABLED=1

RUN pnpm --filter business build

EXPOSE 4002
CMD ["pnpm", "--filter", "business", "start"]
