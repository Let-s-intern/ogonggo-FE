import Script from 'next/script';

/**
 * Google Tag Manager 컨테이너.
 *
 * **ID 는 `NEXT_PUBLIC_GTM_ID` 에서 온다.** 코드에 박아 두면 Vercel 프리뷰 배포마다 운영 GA 로
 * 이벤트가 섞여 들어간다 — 프리뷰에서 스무 번 눌러 본 것이 운영 지표가 된다. 변수는 Vercel 의
 * Production 환경에만 넣는다.
 *
 * 값이 없으면 아무것도 렌더하지 않는다. 로컬과 프리뷰에서는 `googletagmanager.com` 으로 요청이
 * 나가지 않는다.
 */
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

/**
 * `<head>` 에 들어가는 로더.
 *
 * GTM 안내문은 "`<head>` 최대한 위쪽" 이라고 하지만 App Router 에서는 raw script 를 그 자리에
 * 넣을 수 없다. `afterInteractive` 가 Next 문서가 GTM 에 권하는 값이고
 * (`node_modules/next/dist/docs/01-app/02-guides/third-party-libraries.md`), 하이드레이션 뒤에
 * 컨테이너를 받는다. 첫 화면 페인트를 막지 않으면서 GTM 이 기록하는 값은 같다.
 *
 * `beforeInteractive` 로 올리면 컨테이너를 받는 동안 화면이 비어 있다. 태그 매니저 하나 때문에
 * LCP 를 내주는 것은 맞바꿀 만한 거래가 아니다.
 *
 * `dataLayer` 초기화가 로더 안에 함께 있다. GTM 이 준 스니펫 그대로다 — 쪼개면 컨테이너를
 * 새로 발급받았을 때 다시 맞춰 넣어야 한다.
 */
export function GoogleTagManagerScript() {
  if (!GTM_ID) {
    return null;
  }

  return (
    <Script id="google-tag-manager" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
    </Script>
  );
}

/**
 * 여는 `<body>` 바로 뒤에 들어가는 대체 수단.
 *
 * 자바스크립트를 끈 브라우저에서 페이지뷰 하나를 남긴다. 그 상태로는 태그 대부분이 돌지 않지만
 * GTM 이 준 스니펫에 포함돼 있고, 넣지 않을 이유도 없다.
 */
export function GoogleTagManagerNoScript() {
  if (!GTM_ID) {
    return null;
  }

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
        // 이 iframe 은 보여주기 위한 것이 아니라 요청 하나를 보내기 위한 것이다.
        title="Google Tag Manager"
      />
    </noscript>
  );
}
