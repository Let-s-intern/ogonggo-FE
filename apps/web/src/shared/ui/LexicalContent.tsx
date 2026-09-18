import { cn } from '@ogonggo/ui';
import { renderLexicalContent } from '@/shared/lib/lexicalHtml';

export interface LexicalContentProps {
  /** Lexical EditorState JSON. 객체든 문자열이든 받는다. */
  content: unknown;
  className?: string;
}

/**
 * Lexical 본문을 읽기 전용으로 그리는 서버 컴포넌트. 변환은 `shared/lib/lexicalHtml.ts` 가
 * 서버에서 끝내고 여기서는 결과 HTML 을 넣기만 한다 — 편집기도 클라이언트 JS 도 없다.
 *
 * `dangerouslySetInnerHTML` 에 들어가는 HTML 은 Lexical 이 DOM API 로 만든 것이라 글자는
 * 이스케이프되고, 링크 주소는 `LinkNode` 가 허용 스킴(http, https, mailto, sms, tel) 밖이면
 * 바꿔 둔다. 인라인 CSS 는 변환 전에 비운다.
 *
 * 변환이 실패하면 글자만 모은 문단으로 그린다(`kind: 'text'`).
 */
export function LexicalContent({ content, className }: LexicalContentProps) {
  const result = renderLexicalContent(content);

  if (result.kind === 'html') {
    return (
      <div
        className={cn('text-sm text-gray-700', className)}
        dangerouslySetInnerHTML={{ __html: result.html }}
      />
    );
  }

  return (
    <div className={cn('text-sm text-gray-700', className)}>
      {result.paragraphs.map((paragraph, index) => (
        <p key={index} className="my-2 whitespace-pre-line">
          {paragraph}
        </p>
      ))}
    </div>
  );
}
