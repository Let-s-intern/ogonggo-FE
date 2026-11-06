import {
  type ClipboardEvent,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Button, Callout, Textarea, cn } from '@ogonggo/ui';
import {
  consumeAssistantQuestion,
  setAssistantBusy,
  useAssistantQuestion,
} from '../model/askRequest';
import { FAVORITES } from '../model/favorites';
import { ACCEPTED_IMAGE_TYPES, imageToDataUrls, MAX_IMAGES_PER_MESSAGE } from '../model/images';
import { useAssistantChat } from '../model/useAssistantChat';

const OPEN_STORAGE_KEY = 'ogonggo.admin.assistantOpen';

/** 패널 폭. 레이아웃이 `--assistant-width` 로 내려 오른쪽에 붙는 플로팅 요소가 패널을 피하게 한다. */
export const ASSISTANT_OPEN_WIDTH = '400px';
export const ASSISTANT_CLOSED_WIDTH = '48px';

/**
 * 패널을 열어 둘지. 운영자마다 화면을 쓰는 방식이 달라 마지막 상태를 이 브라우저에 기억한다. 저장소를
 * 못 쓰는 환경(사생활 보호 창 등)에서는 기억하지 않을 뿐 패널은 그대로 쓴다.
 */
export function useAssistantPanelOpen(): [boolean, (open: boolean) => void] {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(OPEN_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const update = (next: boolean) => {
    setOpen(next);
    try {
      localStorage.setItem(OPEN_STORAGE_KEY, String(next));
    } catch {
      // 기억하지 못해도 이번 화면에서는 열리고 닫힌다.
    }
  };
  return [open, update];
}

interface AssistantPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 어드민 오른쪽에 붙는 AI 비서 패널. 레이아웃(`widgets/admin-layout`)이 본문 오른쪽에 그린다.
 *
 * 본문을 덮지 않고 옆에 붙는다 — 공고 목록이나 수정 창을 보면서 묻는 일이 많아, 덮으면 보던 것을 가린다.
 * 닫으면 얇은 띠만 남아 다시 열 수 있다.
 *
 * 비서는 공고를 찾고, 공고·통계를 요약하고, 화면을 옮기고, 공고 수정 창의 텍스트 칸을 채운다. 저장은 하지
 * 않는다 — 채운 칸은 사람이 확인하고 수정 창의 저장 버튼을 눌러야 반영된다.
 *
 * 닫아도 대화는 남는다. 화면을 옮기며 이어 물을 수 있게 레이아웃이 살아 있는 동안 둔다.
 *
 * 이미지를 함께 보낼 수 있다 — `이미지 첨부`, 입력 칸에 붙여넣기, 패널에 끌어다 놓기. 올린 그림은 보내기 전에
 * 브라우저에서 줄인다(`../model/images.ts`). 한 번에 `MAX_IMAGES_PER_MESSAGE` 장이다.
 */
export function AssistantPanel({ open, onOpenChange }: AssistantPanelProps) {
  const [draft, setDraft] = useState('');
  const { lines, error, isBusy, send, stop, reset } = useAssistantChat();
  const listRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** 보낼 이미지(줄인 data URI). 긴 포스터는 여러 장이 된다. */
  const [attachments, setAttachments] = useState<string[]>([]);
  const [attachError, setAttachError] = useState('');
  const [isPreparing, setIsPreparing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const question = useAssistantQuestion();

  // 다른 화면이 넣은 질문(`../model/askRequest.ts`). 답하는 중이면 끝난 뒤에 보낸다.
  useEffect(() => {
    if (question && !isBusy) {
      consumeAssistantQuestion(question.nonce);
      void send(question.text);
    }
  }, [question, isBusy, send]);

  useEffect(() => setAssistantBusy(isBusy), [isBusy]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [lines, isBusy, open]);

  const submit = (text: string) => {
    if ((!text.trim() && attachments.length === 0) || isBusy || isPreparing) {
      return;
    }
    setDraft('');
    setAttachments([]);
    setAttachError('');
    void send(text, attachments);
  };

  /** 그림 파일을 줄여 보낼 이미지에 더한다. 그림이 아닌 파일과 상한을 넘는 것은 빼고 알린다. */
  const addImages = async (files: File[]) => {
    const images = files.filter((file) => ACCEPTED_IMAGE_TYPES.includes(file.type));
    if (images.length === 0) {
      if (files.length > 0) {
        setAttachError('JPEG·PNG·GIF·WebP 이미지만 올릴 수 있습니다.');
      }
      return;
    }
    setIsPreparing(true);
    setAttachError(images.length < files.length ? '이미지가 아닌 파일은 뺐습니다.' : '');
    let next = attachments;
    try {
      for (const file of images) {
        const room = MAX_IMAGES_PER_MESSAGE - next.length;
        if (room <= 0) {
          setAttachError(
            `이미지는 한 번에 ${MAX_IMAGES_PER_MESSAGE}장까지 보냅니다. 긴 포스터는 여러 장으로 나뉩니다.`,
          );
          break;
        }
        next = [...next, ...(await imageToDataUrls(file, room))];
        setAttachments(next);
      }
    } catch (caught) {
      setAttachError(caught instanceof Error ? caught.message : '이미지를 읽지 못했습니다.');
    } finally {
      setIsPreparing(false);
    }
  };

  const onPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = [...event.clipboardData.files];
    if (files.some((file) => file.type.startsWith('image/'))) {
      event.preventDefault();
      void addImages(files);
    }
  };

  const onDragOver = (event: DragEvent) => {
    if (event.dataTransfer.types.includes('Files')) {
      event.preventDefault();
      setIsDragging(true);
    }
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    void addImages([...event.dataTransfer.files]);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit(draft);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // 한글 조합 중의 Enter 는 글자를 확정하는 키다. 그때 보내면 마지막 글자가 두 번 들어간다.
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit(draft);
    }
  };

  if (!open) {
    return (
      <aside
        data-pdf-hide
        style={{ width: ASSISTANT_CLOSED_WIDTH }}
        className="sticky top-0 h-screen shrink-0 border-l border-gray-200 bg-white"
      >
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          aria-label="AI 비서 열기"
          aria-expanded={false}
          className="flex h-full w-full flex-col items-center gap-3 pt-6 text-gray-500 transition-colors hover:bg-gray-50 hover:text-blue-600"
        >
          <span aria-hidden="true" className="icon-[lucide--sparkles] block h-5 w-5" />
          <span className="text-sm font-medium [text-orientation:upright] [writing-mode:vertical-rl]">
            AI 비서
          </span>
          {isBusy ? (
            <span className="h-2 w-2 rounded-full bg-blue-500" title="답을 만드는 중" />
          ) : null}
        </button>
      </aside>
    );
  }

  return (
    <aside
      data-pdf-hide
      aria-label="AI 비서"
      style={{ width: ASSISTANT_OPEN_WIDTH }}
      className={cn(
        'sticky top-0 flex h-screen shrink-0 flex-col border-l border-gray-200 bg-white',
        isDragging && 'bg-blue-50',
      )}
      onDragOver={onDragOver}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsDragging(false);
        }
      }}
      onDrop={onDrop}
    >
      <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-gray-900">AI 비서</h2>
          <p className="pt-0.5 text-xs text-gray-500">
            찾기, 요약, 화면 이동, 공고 문장 다듬기, 공고 검수, 공고 분석 채우기를 합니다. 이미지를
            붙여 넣거나 끌어다 놓을 수 있습니다. 검수 완료 표시 말고는 직접 눌러야 반영됩니다.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1 whitespace-nowrap">
          {lines.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={reset}>
              새 대화
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            aria-label="AI 비서 닫기"
            aria-expanded
            onClick={() => onOpenChange(false)}
          >
            닫기
          </Button>
        </div>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {/* 즐겨찾기. 패널을 처음 열어 아무것도 묻지 않았을 때만 보이고, 입력을 시작하면 숨는다. */}
        {lines.length === 0 && !draft.trim() && attachments.length === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">자주 하는 일은 눌러서 바로 실행할 수 있습니다.</p>
            {FAVORITES.map((favorite) => (
              <button
                key={favorite.label}
                type="button"
                title={favorite.prompt}
                onClick={() => submit(favorite.prompt)}
                className="block w-full rounded-md border border-gray-200 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-00"
              >
                {favorite.label}
              </button>
            ))}
          </div>
        ) : null}

        {lines.map((line, index) => (
          <div
            key={index}
            className={cn(
              'whitespace-pre-wrap',
              line.kind === 'user' &&
                'ml-10 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-900',
              line.kind === 'activity' && 'text-xs text-gray-400',
              line.kind === 'assistant' && 'text-sm leading-relaxed text-gray-900',
            )}
          >
            {line.kind !== 'assistant' && line.images?.length ? (
              <Thumbnails images={line.images} className={line.text ? 'pb-2' : undefined} />
            ) : null}
            {line.text ? <p>{line.text}</p> : null}
          </div>
        ))}

        {isBusy ? <p className="text-sm text-gray-400">생각하는 중입니다.</p> : null}
        {error ? <Callout tone="error">{error}</Callout> : null}
      </div>

      <form onSubmit={onSubmit} className="border-t border-gray-200 p-4">
        {attachments.length > 0 ? (
          <Thumbnails
            images={attachments}
            className="pb-2"
            onRemove={(at) => setAttachments((current) => current.filter((_, i) => i !== at))}
          />
        ) : null}
        {attachError ? <p className="pb-2 text-xs text-error">{attachError}</p> : null}
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          placeholder="무엇을 도와드릴까요? Shift+Enter 로 줄을 바꿉니다. 이미지는 붙여 넣거나 끌어다 놓습니다."
          rows={2}
          maxLength={1000}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          multiple
          hidden
          onChange={(event) => {
            void addImages([...(event.target.files ?? [])]);
            event.target.value = '';
          }}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mr-auto"
            disabled={isPreparing || attachments.length >= MAX_IMAGES_PER_MESSAGE}
            onClick={() => fileInputRef.current?.click()}
          >
            {isPreparing ? '이미지 줄이는 중' : '이미지 첨부'}
          </Button>
          {isBusy ? (
            <Button type="button" variant="secondary" size="sm" onClick={stop}>
              멈추기
            </Button>
          ) : null}
          <Button
            type="submit"
            size="sm"
            disabled={isBusy || isPreparing || (!draft.trim() && attachments.length === 0)}
          >
            보내기
          </Button>
        </div>
      </form>
    </aside>
  );
}

/** 이미지 작은 그림 줄. `onRemove` 를 주면 그림마다 `빼기` 를 단다(보내기 전). */
function Thumbnails({
  images,
  className,
  onRemove,
}: {
  images: string[];
  className?: string;
  onRemove?: (index: number) => void;
}) {
  return (
    <ul className={cn('flex flex-wrap gap-2', className)}>
      {images.map((url, index) => (
        <li key={index} className="relative">
          <img
            src={url}
            alt={`이미지 ${index + 1}`}
            className="h-16 w-16 rounded-md border border-gray-200 bg-white object-cover object-top"
          />
          {onRemove ? (
            <button
              type="button"
              aria-label={`이미지 ${index + 1} 빼기`}
              onClick={() => onRemove(index)}
              className="absolute -right-1 -top-1 rounded-full border border-gray-300 bg-white px-1.5 text-xs leading-5 text-gray-600 hover:text-error"
            >
              빼기
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
