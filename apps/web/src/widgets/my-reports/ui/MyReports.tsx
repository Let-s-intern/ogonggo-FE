'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@ogonggo/ui';
import { letsCareerGuidebookPurchasesUrl } from '@/shared/api/letsCareerHandoff';

interface Frame {
  /** `#__sso` 가 붙은 렛츠커리어 구매 목록 주소. 토큰이 브라우저 저장소에만 있어 마운트 뒤에 만든다. */
  src: string;
  /** 바뀌면 iframe 이 새로 마운트돼 같은 주소여도 다시 불러온다. */
  version: number;
}

/** 이 시간이 지나야 `내 리포트` 탭으로 돌아왔을 때 목록을 다시 불러온다. 그 안에는 미리 불러 둔 것을 그대로 보인다. */
const STALE_AFTER_MS = 60_000;

export interface MyReportsProps {
  /** 지금 `/mypage/reports` 를 보고 있는지. 아니면 화면에서만 숨기고 불러오기는 계속한다(미리 불러 두기). */
  active: boolean;
}

/**
 * 마이페이지 `내 리포트` 본문(PRD 3장). 안내 문구, 렛츠커리어 가이드북 구매 목록 전용 경로의 iframe, 새 창으로
 * 열기 링크 순서다.
 *
 * 목록은 렛츠커리어 화면 그대로다. 오공고는 걸러내지 않고, 구매가 없을 때의 빈 화면도 따로 만들지 않는다.
 * iframe 은 높이를 고정하고 안쪽에서만 스크롤해 페이지와 이중 스크롤이 되지 않게 한다. 오공고는 iframe 안을
 * 읽을 수 없어 로그인이 풀렸는지 알 수 없다(PRD 위험) — 그래서 새 창 링크를 늘 곁에 둔다.
 *
 * **미리 불러 둔다.** 렛츠커리어 화면은 앱 하나를 통째로 불러와 탭을 누른 뒤 한참 흰 상자로 보였다. 그래서 이 컴포넌트는
 * `/mypage/reports` 페이지가 아니라 마이페이지 껍데기(`MyPageLayout`)에 걸려, 플래그가 켜진 일반 회원이 마이페이지 어느 탭에
 * 들어오든 마운트되어 숨은 채로(`active` 가 아님) 불러온다. 탭을 누르면 이미 불러온 iframe 이 보이기만 한다. 껍데기는 탭을
 * 옮겨도 유지되므로 iframe 도 다시 불러오지 않는다. 불러오는 동안은 대기 화면을 보이고(`onLoad` 때 걷는다), 렛츠커리어가
 * 끝내 응답하지 않아도 새 창 링크가 곁에 있다.
 *
 * 다시 불러오는 때는 둘이다. 처음 마운트될 때, 그리고 구매를 다른 탭이나 창에서 마쳤을 수 있는 때다 — 이 화면을 보는 중에 다른
 * 탭에 갔다 돌아올 때(`visibilitychange`)와, 숨겨 둔 지 `STALE_AFTER_MS` 가 넘은 뒤 이 탭으로 올 때다.
 */
export function MyReports({ active }: MyReportsProps) {
  const [frame, setFrame] = useState<Frame | null>(null);
  /** 현재 iframe 의 불러오기가 끝났는지. 끝나기 전에는 대기 화면이 덮는다. */
  const [loaded, setLoaded] = useState(false);
  const loadedAtRef = useRef(0);
  const activeRef = useRef(active);

  const load = () => {
    loadedAtRef.current = Date.now();
    setLoaded(false);
    setFrame((current) => ({
      src: letsCareerGuidebookPurchasesUrl(),
      version: (current?.version ?? 0) + 1,
    }));
  };

  useEffect(() => {
    activeRef.current = active;
    // 숨겨 둔 사이 오래 지났다면 구매가 늘었을 수 있어 새로 불러온다. 막 마운트됐을 때는 아래 effect 가 이미 불러온다.
    if (active && loadedAtRef.current > 0 && Date.now() - loadedAtRef.current > STALE_AFTER_MS) {
      load();
    }
    // `load` 는 렌더마다 새로 만들어지지만 상태 갱신 함수만 쓰므로 `active` 가 바뀔 때만 보면 된다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    load();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && activeRef.current) {
        load();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className={cn('flex flex-col gap-4', !active && 'hidden')}>
      <h2 className="text-xl font-bold text-gray-950">내 리포트</h2>
      <p className="text-sm break-keep text-gray-600">
        렛츠커리어에서 구매한 가이드북 목록이에요. 구매하신 리포트를 여기서 열어 볼 수 있어요.
      </p>
      <div className="relative h-[640px] overflow-hidden rounded-lg border border-gray-200 bg-white md:h-[760px]">
        {frame ? (
          <iframe
            key={frame.version}
            src={frame.src}
            title="렛츠커리어 구매 목록"
            onLoad={() => setLoaded(true)}
            className="h-full w-full border-0"
          />
        ) : null}
        {loaded ? null : (
          <div role="status" className="absolute inset-0 flex flex-col gap-4 bg-white p-6">
            <p className="text-sm font-medium text-gray-600">구매한 리포트를 불러오고 있어요</p>
            <div className="flex animate-pulse flex-col gap-3">
              <div className="h-24 rounded-lg bg-gray-100" />
              <div className="h-24 rounded-lg bg-gray-100" />
              <div className="h-24 rounded-lg bg-gray-100" />
            </div>
          </div>
        )}
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
