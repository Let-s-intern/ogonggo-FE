import type { ReactNode } from 'react';

/**
 * 상세 화면(채용공고·부트캠프·사이드스터디) 사이드바의 묶음 하나를 감싼다.
 *
 * 좁은 화면에서는 2단이 풀려 사이드바가 본문 아래로 내려오고, 본문·비슷한 공고·함께 보면 좋아요·
 * 댓글이 한 흐름으로 이어져 어디서 끝나고 시작하는지 구분되지 않았다. 2단이 풀리는 폭(`max-lg`)
 * 에서만 묶음 위에 화면 끝까지 닿는 회색 띠를 둔다. 데스크톱 2단에서는 아무것도 바뀌지 않는다.
 *
 * 띠가 상세 `<main>` 의 좌우 여백(`px-4 md:px-6`) 밖까지 닿도록 같은 값만큼 밖으로 빼고 안쪽을
 * 다시 채운다. 안의 위젯이 목록이 비어 아무것도 그리지 않으면 `empty:hidden` 으로 띠도 숨긴다.
 */
export function DetailSidebarSection({ children }: { children: ReactNode }) {
  return (
    <div className="empty:hidden max-lg:-mx-4 max-lg:border-t-8 max-lg:border-gray-100 max-lg:px-4 max-lg:pt-8 md:max-lg:-mx-6 md:max-lg:px-6">
      {children}
    </div>
  );
}
