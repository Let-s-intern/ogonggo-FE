import type { AnchorHTMLAttributes, ForwardedRef } from 'react';
import { forwardRef } from 'react';

/**
 * `next/link` 의 스토리북 대역. `.storybook/main.ts` 의 `resolve.alias` 가 이 파일을 대신
 * 물린다.
 *
 * 스토리북이 `@storybook/react-vite` 라 Next 런타임이 없다. 진짜 `next/link` 는 모듈을 읽는
 * 시점에 Next 의 라우터 컨텍스트를 요구해서, 카드 한 장을 그리려 해도 스토리가 통째로 죽는다.
 * 앱 라우터를 스토리북에 끌어오는 것보다 링크를 `<a>` 로 낮추는 쪽이 싸다 — 카드 세 장이
 * `Link` 를 쓰는 이유는 전부 "클릭하면 상세로 간다" 하나뿐이고, 그 동작은 스토리에서 볼 것이
 * 아니다.
 *
 * 스텁의 한계는 셋이다. 프리페치가 없고(`prefetch` 는 받아서 버린다), 클라이언트 라우팅이
 * 아니라 진짜 이동이라 스토리 iframe 이 통째로 넘어간다 — 그래서 `href` 를 `<a>` 에 그대로
 * 넘기되 기본 동작은 막는다. 그리고 `next/link` 가 실제로 붙이는 속성(`data-prefetch` 등)은
 * 흉내내지 않는다. 링크가 어디로 가는지 확인할 일이 있으면 `href` 속성을 본다.
 *
 * `next/image` 는 여기서 다루지 않는다. 스토리를 만든 컴포넌트 가운데 쓰는 것이 하나도 없다 —
 * `entities/bootcamp/ui/BootcampCard.tsx` 는 `shared/ui/Thumbnail.tsx` 를 거치는데 그쪽이
 * 외부 호스트 때문에 일부러 `<img>` 다. 쓰는 곳은 `widgets/home-hero/ui/HomeHero.tsx` 하나이고
 * 이번 범위 밖이다. 홈 히어로 스토리를 만들 날이 오면 그때 같은 자리에 스텁을 하나 더 둔다.
 */
type NextLinkStubProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  prefetch?: boolean | null;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  passHref?: boolean;
  legacyBehavior?: boolean;
};

function NextLinkStub(
  {
    href,
    prefetch: _prefetch,
    replace: _replace,
    scroll: _scroll,
    shallow: _shallow,
    passHref: _passHref,
    legacyBehavior: _legacyBehavior,
    onClick,
    ...rest
  }: NextLinkStubProps,
  ref: ForwardedRef<HTMLAnchorElement>,
) {
  return (
    <a
      {...rest}
      ref={ref}
      href={href}
      onClick={(event) => {
        // 스토리북 안에는 갈 곳이 없다. 막지 않으면 iframe 이 404 로 넘어가 스토리가 사라진다.
        event.preventDefault();
        onClick?.(event);
      }}
    />
  );
}

export default forwardRef(NextLinkStub);
