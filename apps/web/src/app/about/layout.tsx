import type { ReactNode } from 'react';
import './about.css';

/**
 * 소개 페이지에만 나눔스퀘어 네오를 걸기 위한 레이아웃.
 *
 * 네이버가 주는 스타일시트를 그대로 링크한다. Next가 이 `<link>`를 head로 올려주고, 이
 * 레이아웃 아래 경로에서만 로드되므로 채용공고 화면들은 이 폰트를 내려받지 않는다.
 *
 * `preconnect`를 함께 둔다. 스타일시트와 폰트 파일이 같은 호스트에서 오는데, 연결을 미리
 * 열어두면 글자가 늦게 바뀌는 시간이 줄어든다.
 *
 * 이 스타일시트에는 woff2가 없고(woff/ttf/eot만 있다) `font-display`도 안 적혀 있어서, 폰트가
 * 도착하기 전까지 글자가 잠깐 안 보일 수 있다. 히어로 문구는 어차피 GSAP이 늦게 띄우므로
 * 눈에 크게 띄지 않는다. 거슬리면 같은 woff 파일을 가리키는 `@font-face`를 직접 적고
 * `font-display: swap`을 붙이면 된다.
 */
export default function AboutLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://hangeul.pstatic.net" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://hangeul.pstatic.net/hangeul_static/css/nanum-square-neo.css"
      />
      {children}
    </>
  );
}
