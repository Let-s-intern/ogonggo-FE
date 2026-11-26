import { html, raw } from 'hono/html';
import type { HtmlEscapedString } from 'hono/utils/html';

/**
 * `/authorize` 의 로그인 화면. 관리자 콘솔과 같은 렛츠커리어 이메일·비밀번호를 받는다(PRD 5-2).
 *
 * 숨은 칸 `request` 는 `/authorize` 가 검증한 인가 요청을 서명한 값이다. 폼이 다시 들어올 때 이것만 믿는다.
 */

export interface LoginPageProps {
  request: string;
  /** 로그인 후 돌아갈 서비스의 호스트. 사용자가 어디에 권한을 주는지 보여준다. */
  clientHost: string;
  clientName?: string;
  email?: string;
  error?: string;
}

const styles = `
:root { color-scheme: light dark; --bg: #f6f7f9; --card: #fff; --fg: #111827; --muted: #6b7280; --line: #d1d5db; --accent: #2563eb; --danger: #b91c1c; }
@media (prefers-color-scheme: dark) { :root { --bg: #0b0f17; --card: #141a24; --fg: #e5e7eb; --muted: #9ca3af; --line: #374151; --accent: #60a5fa; --danger: #f87171; } }
* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 16px; background: var(--bg); color: var(--fg); font-family: system-ui, -apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; }
main { width: 100%; max-width: 380px; background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 28px 24px; }
h1 { font-size: 20px; margin: 0 0 6px; }
p { margin: 0 0 20px; color: var(--muted); font-size: 14px; line-height: 1.5; }
label { display: block; font-size: 13px; margin: 14px 0 6px; }
input { width: 100%; padding: 10px 12px; border: 1px solid var(--line); border-radius: 8px; background: transparent; color: inherit; font-size: 15px; }
button { width: 100%; margin-top: 22px; padding: 11px; border: 0; border-radius: 8px; background: var(--accent); color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; }
.error { color: var(--danger); font-size: 13px; margin: 14px 0 0; }
.host { font-weight: 600; color: var(--fg); }
`;

type Html = HtmlEscapedString | Promise<HtmlEscapedString>;

/** 공통 껍데기. `html` 태그는 넣는 값을 모두 이스케이프한다. 코드에 고정된 CSS 만 `raw` 로 넣는다. */
function layout(title: string, content: Html): Html {
  return html`<!doctype html>
    <html lang="ko">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <title>${title}</title>
        <style>
          ${raw(styles)}
        </style>
      </head>
      <body>
        <main>${content}</main>
      </body>
    </html>`;
}

export function loginPage({ request, clientHost, clientName, email, error }: LoginPageProps): Html {
  const client = clientName ? `${clientName} (${clientHost})` : clientHost;
  return layout(
    '오공고 어드민 MCP 로그인',
    html`<h1>오공고 어드민 MCP</h1>
      <p>
        관리자 콘솔과 같은 렛츠커리어 계정으로 로그인하세요. 로그인하면
        <span class="host">${client}</span> 에서 관리자 데이터를 조회할 수 있습니다.
      </p>
      <form method="post" action="/authorize">
        <input type="hidden" name="request" value="${request}" />
        <label for="email">이메일</label>
        <input
          id="email"
          name="email"
          type="email"
          autocomplete="username"
          required
          value="${email ?? ''}"
        />
        <label for="password">비밀번호</label>
        <input
          id="password"
          name="password"
          type="password"
          autocomplete="current-password"
          required
        />
        ${error ? html`<p class="error" role="alert">${error}</p>` : ''}
        <button type="submit">로그인</button>
      </form>`,
  );
}

export function errorPage(message: string): Html {
  return layout(
    '오공고 어드민 MCP',
    html`<h1>연결할 수 없습니다</h1>
      <p>${message}</p>`,
  );
}
