# 시안 배포용 이미지. 어드민을 목 모드로 정적 빌드하고 Vite preview 로 서빙한다.
# 빌드 컨텍스트는 모노레포 루트다: docker build -f apps/admin/Dockerfile .
#
# 목은 브라우저 MSW 다(`src/app/enableMocking.ts`). `VITE_OGONGGO_USE_MOCKS` 가 정확히 `false` 일 때만 꺼지므로
# 빈 값으로 빌드한다. 서비스 워커 `public/mockServiceWorker.js` 는 `vite build` 가 `dist` 에 그대로 옮긴다.
# 근거: `.claude/tasks/memos/결정-광고시스템-business-docker-2026-11-03.md`.
FROM node:20-bookworm-slim

WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY . .
RUN pnpm install --frozen-lockfile --filter admin...

ARG VITE_OGONGGO_USE_MOCKS=
ENV VITE_OGONGGO_USE_MOCKS=$VITE_OGONGGO_USE_MOCKS

RUN pnpm --filter admin build && test -f apps/admin/dist/mockServiceWorker.js

EXPOSE 4001
CMD ["pnpm", "--filter", "admin", "exec", "vite", "preview", "--host", "0.0.0.0", "--port", "4001", "--strictPort"]
