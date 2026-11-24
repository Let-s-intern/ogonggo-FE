import Script from 'next/script';

/**
 * Google Tag Manager 컨테이너. 기준은 `apps/web/src/shared/analytics/GoogleTagManager.tsx` 이고 같은 컨테이너를
 * 쓴다(웹과 같은 GA4 속성으로 보낸다, 2026-11-24).
 *
 * **ID 는 `NEXT_PUBLIC_GTM_ID` 에서 온다.** 코드에 박아 두면 Vercel 프리뷰 배포마다 운영 GA 로 이벤트가 섞여
 * 들어간다. 변수는 Vercel 의 Production 환경에만 넣는다.
 *
 * 값이 없으면 아무것도 렌더하지 않는다. 로컬과 프리뷰에서는 `googletagmanager.com` 으로 요청이 나가지 않는다.
 * 값은 빌드 시점에 박힌다.
 */
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

/**
 * `<head>` 에 들어가는 로더. App Router 에서는 raw script 를 그 자리에 넣을 수 없어 `afterInteractive` 로 하이드레이션
 * 뒤에 컨테이너를 받는다(웹과 같다). `dataLayer` 초기화는 GTM 이 준 스니펫 그대로 로더 안에 있다.
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

/** 여는 `<body>` 바로 뒤에 들어가는 대체 수단. 자바스크립트를 끈 브라우저에서 페이지뷰 하나를 남긴다. */
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
