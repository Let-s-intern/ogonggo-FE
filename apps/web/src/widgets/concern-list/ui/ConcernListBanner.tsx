import Link from 'next/link';
import { Button } from '@ogonggo/ui';
import { ConcernWriteButton } from './ConcernWriteButton';

/**
 * 목록 맨 아래 `고민 올리기 / 다른 고민 둘러보기` 배너. 틀은 `ForBusinessBanner` 와 같다 — 연한 파랑
 * 상자에 왼쪽 문구, 오른쪽 버튼 둘.
 *
 * `다른 고민 둘러보기` 는 필터와 쪽을 걷어 낸 처음 목록(`/concerns`)으로 보낸다. 이 배너가 목록 끝에
 * 있어서 둘러볼 곳은 목록의 처음이다.
 */
export function ConcernListBanner() {
  return (
    <section className="w-full rounded-lg bg-blue-50 px-5 py-6 md:px-8 md:py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            취업 준비하다 막히는 순간, 여기서 물어보세요
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            어떤 공고에 지원할지, 내 경험을 어떻게 담을지, 다른 취준생들과 함께 이야기해요.
          </p>
        </div>
        {/*
          한 줄 유지(`whitespace-nowrap`)는 버튼에만 건다. 감싸는 div 에 걸면 `고민 올리기` 가 이 div 안에 그리는
          작성 모달(`<dialog>`)이 글 줄바꿈 금지를 물려받아, 모달 안의 실패 토스트가 줄바꿈되지 않고 잘린다.
        */}
        <div className="flex flex-wrap gap-2">
          <ConcernWriteButton className="whitespace-nowrap">고민 올리기</ConcernWriteButton>
          <Button variant="secondary" className="bg-white whitespace-nowrap" asChild>
            <Link href="/concerns">다른 고민 둘러보기</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
