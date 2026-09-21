import { PLACEHOLDER_NOTICE } from '@/shared/lib/placeholderNotice';

/**
 * 카카오 채널 배너(목업 `개인정보/image.png` 의 노란 띠).
 *
 * **링크를 걸지 않았다.** task 는 외부 링크라고 적었지만 오공고 카카오 채널의 주소가 이
 * 저장소 어디에도 없다 — 목업에도 없고, 푸터·`.env.example`·코드 어느 쪽에도 없다. 그럴듯한
 * `http://pf.kakao.com/_...` 을 지어내면 누른 사람이 남의 채널이나 빈 화면으로 간다. 주소가
 * 정해지면 이 파일에서 `<a>` 로 감싸는 것 하나로 끝난다.
 *
 * 그래서 배너 전체가 누를 수 없는 그림이다. 비활성 버튼을 두지 않은 이유는 이 자리에
 * 원래부터 버튼이 없기 때문이다 — 목업의 `Ch+` 는 카카오 채널 마크이고, 누르는 곳은 배너
 * 전체였다.
 *
 * 노랑은 카카오 브랜드 색 `#FEE500` 을 그대로 쓴다. `tokens.css` 에 노랑 스케일이 없고,
 * 있더라도 이 색은 팔레트의 한 단계가 아니라 남의 브랜드 색이라 가까운 값으로 바꿀 수 없다.
 */
export function KakaoChannelBanner() {
  return (
    <div
      title={PLACEHOLDER_NOTICE}
      className="flex items-center justify-between gap-4 rounded-lg bg-[#FEE500] px-8 py-6"
    >
      <div>
        <p className="text-base font-bold text-gray-900">오늘의 공고 채널 추가</p>
        <p className="pt-1 text-sm text-gray-700">
          오늘의 공고 카카오톡 채널을 추가하고,
          <br />
          관심 공고의 마감 알림과 추천 공고를 빠르게 받아보세요.
        </p>
      </div>
      <span
        aria-hidden="true"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white"
      >
        Ch+
      </span>
    </div>
  );
}
