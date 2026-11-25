'use client';

import { useEffect, useState } from 'react';
import { letsCareerGuidebookPurchasesUrl } from '@/shared/api/letsCareerHandoff';

interface Frame {
  /** `#__sso` 가 붙은 렛츠커리어 구매 목록 주소. 토큰이 브라우저 저장소에만 있어 마운트 뒤에 만든다. */
  src: string;
  /** 바뀌면 iframe 이 새로 마운트돼 같은 주소여도 다시 불러온다. */
  version: number;
}

/**
 * 마이페이지 `내 리포트` 본문(PRD 3장). 안내 문구, 렛츠커리어 가이드북 구매 목록 전용 경로의 iframe, 새 창으로
 * 열기 링크 순서다.
 *
 * 목록은 렛츠커리어 화면 그대로다. 오공고는 걸러내지 않고, 구매가 없을 때의 빈 화면도 따로 만들지 않는다.
 * iframe 은 높이를 고정하고 안쪽에서만 스크롤해 페이지와 이중 스크롤이 되지 않게 한다. 오공고는 iframe 안을
 * 읽을 수 없어 로그인이 풀렸는지 알 수 없다(PRD 위험) — 그래서 새 창 링크를 늘 곁에 둔다.
 */
export function MyReports() {
  const [frame, setFrame] = useState<Frame | null>(null);

  useEffect(() => {
    setFrame({ src: letsCareerGuidebookPurchasesUrl(), version: 1 });
  }, []);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-gray-950">내 리포트</h2>
      <p className="text-sm break-keep text-gray-600">
        렛츠커리어에서 구매한 가이드북 목록이에요. 구매하신 리포트를 여기서 열어 볼 수 있어요.
      </p>
      <div className="h-[640px] overflow-hidden rounded-lg border border-gray-200 bg-white md:h-[760px]">
        {frame ? (
          <iframe
            key={frame.version}
            src={frame.src}
            title="렛츠커리어 구매 목록"
            className="h-full w-full border-0"
          />
        ) : null}
      </div>
      {frame ? (
        <p className="text-sm break-keep text-gray-600">
          목록이 보이지 않거나 로그인 화면이 나오면{' '}
          <a
            href={frame.src}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-500 underline"
          >
            새 창에서 열기
          </a>
          를 눌러 주세요.
        </p>
      ) : null}
    </section>
  );
}
