# 시안 배포용 이미지. MSW 목이 켜진 채로 뜬다 — 백엔드 없이 화면이 돈다.
# 빌드 컨텍스트는 모노레포 루트다: docker build -f apps/web/Dockerfile .
#
# `next build` 를 하지 않고 목 dev 서버(`pnpm --filter web mock`)로 띄운다. `next build` 는 RSS·사이트맵 같은
# 정적 페이지를 미리 그리며 백엔드를 부르는데, 빌드 중에는 MSW(`src/instrumentation.ts`)가 켜지지 않아
# `127.0.0.1:8080` 연결 실패로 빌드가 멈춘다(2026-11-03 실측, `/rss/bootcamps.xml`). 백엔드 없는 시안이라 dev 서버로
# 충분하다. 근거: `.claude/tasks/memos/결정-광고시스템-business-docker-2026-11-03.md`.
#
# 목 여부는 `OGONGGO_USE_MOCKS` 다. 정확히 `false` 일 때만 꺼진다. 기본은 빈 값(켜짐)이다.
# 앱 사이 링크 주소(`NEXT_PUBLIC_*`)는 루트 docker-compose.yml 이 넘긴다.
FROM node:20-bookworm-slim

WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY . .
RUN pnpm install --frozen-lockfile --filter web...

ARG OGONGGO_USE_MOCKS=
ARG NEXT_PUBLIC_ADMIN_ORIGIN=
ARG NEXT_PUBLIC_BUSINESS_ORIGIN=
ENV OGONGGO_USE_MOCKS=$OGONGGO_USE_MOCKS \
    NEXT_PUBLIC_ADMIN_ORIGIN=$NEXT_PUBLIC_ADMIN_ORIGIN \
    NEXT_PUBLIC_BUSINESS_ORIGIN=$NEXT_PUBLIC_BUSINESS_ORIGIN \
    NEXT_TELEMETRY_DISABLED=1

EXPOSE 4000
CMD ["pnpm", "--filter", "web", "exec", "next", "dev", "--turbo", "--port", "4000", "--hostname", "0.0.0.0"]
