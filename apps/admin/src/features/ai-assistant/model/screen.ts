/**
 * AI 비서가 지금 보이는 화면을 읽고, 입력 칸을 채우고, 양식을 여는 버튼을 누르게 하는 도구. 화면마다 전용
 * 도구를 붙이지 않고 어느 화면이든 같은 방식으로 다룬다(공지 작성, 부트캠프 수정, 운영 값 등).
 *
 * 원칙: 확정은 사람이 한다. 운영자가 요청한 경계다 — "버튼만 사람이 누르고 나머지는 비서가 한다".
 * - 저장·등록·삭제·적용·승인처럼 서버에 반영하는 버튼은 누르지 않는다(`isHumanOnlyButton`). 비서는 칸을
 *   채우고 "저장을 눌러 주세요" 라고 넘긴다.
 * - 표(`table`) 안의 컨트롤은 건드리지 않는다. 목록의 노출 토글처럼 누르는 즉시 서버에 반영되는 것이
 *   표 안에 있다. 표 밖의 입력 칸은 화면 상태일 뿐이라 저장을 누르기 전에는 아무것도 바뀌지 않는다.
 * - 좌측 메뉴와 비서 패널(`data-pdf-hide`) 자신은 다루지 않는다. 화면 이동은 `navigate` 도구가 한다.
 *
 * 비서가 채운 칸에는 `data-ai-filled` 를 달아 파란 테두리로 보인다(`app/index.css`).
 */

/** 이 낱말이 든 버튼은 사람만 누른다. 서버에 반영하거나 되돌리기 어려운 동작의 낱말이다. */
const HUMAN_ONLY_WORDS =
  /저장|등록|삭제|적용|제출|확인|발행|게시|전송|승인|반려|노출|업로드|일괄|변경|완료|로그아웃|복구|해제/;

const REF_ATTR = 'data-ai-ref';
const MAX_TEXT = 4_000;
const MAX_OPTIONS = 40;

type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLElement;

/** 열린 모달이 있으면 그 안만, 아니면 본문(`main`)만 본다. */
function scope(): HTMLElement | null {
  const dialogs = [...document.querySelectorAll<HTMLDialogElement>('dialog[open]')];
  return dialogs.at(-1) ?? document.querySelector('main');
}

function isOffLimits(element: Element): boolean {
  return Boolean(element.closest('nav, table, [data-pdf-hide]'));
}

function isVisible(element: HTMLElement): boolean {
  return element.getClientRects().length > 0;
}

function labelOf(element: HTMLElement): string {
  const byFor = element.id
    ? document.querySelector(`label[for="${CSS.escape(element.id)}"]`)
    : null;
  const text =
    byFor?.textContent ??
    element.closest('label')?.textContent ??
    element.getAttribute('aria-label') ??
    element.getAttribute('placeholder') ??
    element.getAttribute('aria-placeholder') ??
    '';
  return text.replace(/\s+/g, ' ').replace(/\*$/, '').trim();
}

function controlType(element: Control): string {
  if (element instanceof HTMLSelectElement) return 'select';
  if (element instanceof HTMLTextAreaElement) return 'textarea';
  if (element instanceof HTMLInputElement) return element.type || 'text';
  return 'richtext';
}

function controlValue(element: Control): string | boolean {
  if (element instanceof HTMLInputElement && element.type === 'checkbox') return element.checked;
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  ) {
    return element.value.slice(0, 300);
  }
  return (element.textContent ?? '').slice(0, 300);
}

function buttonText(button: HTMLButtonElement): string {
  return (button.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * 사람만 누를 버튼인지. `type` 을 적지 않은 버튼은 브라우저가 `submit` 으로 보지만(공용 `Button` 이 그렇다),
 * 실제로 양식(`form`)을 제출하는 것은 `form` 안에 있을 때뿐이라 그때만 제출 버튼으로 본다.
 */
export function isHumanOnlyButton(button: HTMLButtonElement): boolean {
  return (
    (button.type === 'submit' && button.form !== null) || HUMAN_ONLY_WORDS.test(buttonText(button))
  );
}

/** 클릭·이동 뒤 화면이 다시 그려지고 목록을 불러올 때까지 잠깐 기다린다. */
async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  for (let waited = 0; waited < 4_000; waited += 250) {
    if (!scope()?.innerText.includes('불러오는 중')) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

/**
 * 화면을 읽어 모델에게 줄 글로 만든다. 칸과 버튼에 번호(`ref`)를 붙여 다음 도구가 가리키게 한다.
 * 사람만 누를 버튼에는 `humanOnly` 를 붙여, 모델이 사용자에게 누르라고 안내하게 한다.
 */
export async function readScreen(): Promise<string> {
  await settle();
  const root = scope();
  if (!root) {
    return '읽을 화면이 없습니다.';
  }
  document
    .querySelectorAll(`[${REF_ATTR}]`)
    .forEach((element) => element.removeAttribute(REF_ATTR));

  const fields = [
    ...root.querySelectorAll<Control>(
      'input:not([type=hidden]):not([type=file]), textarea, select, [contenteditable="true"]',
    ),
  ]
    .filter((element) => isVisible(element) && !isOffLimits(element))
    .map((element, index) => {
      const ref = `f${index + 1}`;
      element.setAttribute(REF_ATTR, ref);
      return {
        ref,
        label: labelOf(element),
        type: controlType(element),
        value: controlValue(element),
        ...(element instanceof HTMLSelectElement
          ? {
              options: [...element.options]
                .slice(0, MAX_OPTIONS)
                .map((option) => ({ value: option.value, label: option.label })),
            }
          : {}),
      };
    });

  const buttons = [...root.querySelectorAll<HTMLButtonElement>('button')]
    .filter((button) => isVisible(button) && !isOffLimits(button) && buttonText(button) !== '')
    .map((button, index) => {
      const ref = `b${index + 1}`;
      button.setAttribute(REF_ATTR, ref);
      return {
        ref,
        text: buttonText(button),
        ...(isHumanOnlyButton(button) ? { humanOnly: true } : {}),
        ...(button.disabled ? { disabled: true } : {}),
      };
    });

  return JSON.stringify({
    path: location.pathname + location.search,
    modal: root.tagName === 'DIALOG',
    fields,
    buttons,
    text: (root.innerText ?? '').replace(/\n{3,}/g, '\n\n').slice(0, MAX_TEXT),
  });
}

function findRef(ref: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[${REF_ATTR}="${CSS.escape(ref)}"]`);
}

/** React 가 관리하는 입력에 값을 넣는다. `value` 를 바로 바꾸면 React 가 모르고 되돌린다. */
function setNativeValue(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  value: string,
) {
  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : element instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, 'value')?.set?.call(element, value);
  element.dispatchEvent(
    new Event(element instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }),
  );
}

/**
 * 리치 텍스트 편집기(Lexical)에 글을 넣는다. 편집기는 붙여넣기를 받아 문단으로 나눠 넣으므로, 전체를
 * 고른 뒤 붙여넣기 이벤트를 보낸다 — 편집기 내부 API 를 부르지 않아 편집기가 바뀌어도 그대로 동작한다.
 */
function setRichText(element: HTMLElement, value: string) {
  element.focus();
  const range = document.createRange();
  range.selectNodeContents(element);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  const data = new DataTransfer();
  data.setData('text/plain', value);
  element.dispatchEvent(
    new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
  );
}

export interface FieldValue {
  ref: string;
  value: string | boolean;
}

/** 칸을 채운다. 저장하지 않는다 — 채운 값은 화면의 입력 상태일 뿐이다. */
export async function fillFields(values: FieldValue[]): Promise<string> {
  const results: string[] = [];
  for (const { ref, value } of values) {
    const element = findRef(ref);
    if (!element || isOffLimits(element)) {
      results.push(`${ref}: 찾지 못했습니다. read_screen 을 다시 부르세요.`);
      continue;
    }
    if (element instanceof HTMLInputElement && element.type === 'checkbox') {
      if (element.checked !== Boolean(value)) {
        element.click();
      }
    } else if (element instanceof HTMLSelectElement) {
      const option = [...element.options].find(
        (item) => item.value === String(value) || item.label === String(value),
      );
      if (!option) {
        results.push(`${ref}: "${String(value)}" 선택지가 없습니다.`);
        continue;
      }
      setNativeValue(element, option.value);
    } else if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      setNativeValue(element, String(value));
    } else if (element.isContentEditable) {
      setRichText(element, String(value));
    } else {
      results.push(`${ref}: 채울 수 없는 칸입니다.`);
      continue;
    }
    element.setAttribute('data-ai-filled', '');
    results.push(`${ref}(${labelOf(element)}): 채웠습니다.`);
  }
  await settle();
  return `${results.join('\n')}\n저장·등록은 하지 않았습니다. 사용자가 확인하고 눌러야 반영됩니다.`;
}

/** 양식을 여는 버튼(새 공지, 내용 수정 등)만 누른다. 사람만 누를 버튼은 누르지 않고 그렇다고 답한다. */
export async function pressButton(ref: string): Promise<string> {
  const element = findRef(ref);
  if (!(element instanceof HTMLButtonElement) || isOffLimits(element)) {
    return `${ref}: 버튼을 찾지 못했습니다. read_screen 을 다시 부르세요.`;
  }
  if (isHumanOnlyButton(element)) {
    return `"${buttonText(element)}" 는 사람이 누르는 버튼입니다. 누르지 않았습니다. 사용자에게 눌러 달라고 안내하세요.`;
  }
  if (element.disabled) {
    return `"${buttonText(element)}" 는 지금 누를 수 없습니다.`;
  }
  element.click();
  await settle();
  return `"${buttonText(element)}" 를 눌렀습니다. 바뀐 화면은 read_screen 으로 확인하세요.`;
}
