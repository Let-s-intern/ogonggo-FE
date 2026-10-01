import type { NextConfig } from 'next';

/**
 * 카드 이미지는 서버(`src/app/api/render`)가 `assets/` 의 폰트·이모지·로고를 읽어 만든다. 서버리스
 * 번들에 그 파일이 따라가도록 `outputFileTracingIncludes` 로 묶는다.
 */
const nextConfig: NextConfig = {
  transpilePackages: ['@ogonggo/ui', '@ogonggo/api'],
  // 둘 다 번들하지 않고 node_modules 에서 그대로 읽게 한다. resvg 는 네이티브 바이너리이고,
  // satori 는 글자 모양 계산용 wasm(harfbuzzjs)을 자기 경로 기준으로 읽어서 번들하면 못 찾는다.
  serverExternalPackages: ['@resvg/resvg-js', 'satori'],
  outputFileTracingIncludes: {
    '/api/render': ['./assets/**/*'],
  },
};

export default nextConfig;
