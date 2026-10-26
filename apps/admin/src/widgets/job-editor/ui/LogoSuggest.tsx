import { useState } from 'react';
import { Button, cn } from '@ogonggo/ui';
import {
  fetchLogoCandidates,
  LogoCandidatesError,
  type LogoCandidate,
} from '@/shared/api/logoCandidates';

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'done'; candidates: LogoCandidate[] };

function sizeLabel(candidate: LogoCandidate) {
  const format = candidate.format.toUpperCase();
  return candidate.width && candidate.height
    ? `${candidate.width}×${candidate.height} · ${format}`
    : `벡터 · ${format}`;
}

/** 후보 하나. 그림을 불러오지 못하면(핫링크 차단 등) 로고로도 보이지 않을 테니 숨긴다. */
function CandidateButton({
  candidate,
  selected,
  onPick,
}: {
  candidate: LogoCandidate;
  selected: boolean;
  onPick: () => void;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return null;
  }
  return (
    <button
      type="button"
      onClick={onPick}
      title={candidate.url}
      className={cn(
        'flex w-28 flex-col items-center gap-1 rounded border p-2 text-xs text-gray-600 hover:bg-gray-50',
        selected ? 'border-blue-500' : 'border-gray-200',
      )}
    >
      <img
        src={candidate.url}
        alt=""
        className="h-12 w-12 object-contain"
        onError={() => setFailed(true)}
      />
      <span>{sizeLabel(candidate)}</span>
    </button>
  );
}

/**
 * 원문 주소 사이트의 아이콘을 큰 순서로 보여주고, 고르면 로고 주소 칸에 넣는다. 저장은 편집 화면이 한다.
 * 원문 주소가 바뀌면 부모가 `key` 로 다시 그려 지난 결과를 지운다.
 */
export function LogoSuggest({
  sourceUrl,
  logoUrl,
  onPick,
}: {
  /** 형식이 맞는 원문 주소. 없으면 버튼을 막는다. */
  sourceUrl: string | null;
  logoUrl: string;
  onPick: (url: string) => void;
}) {
  const [state, setState] = useState<State>({ kind: 'idle' });

  const suggest = async () => {
    if (!sourceUrl) {
      return;
    }
    setState({ kind: 'loading' });
    try {
      setState({ kind: 'done', candidates: await fetchLogoCandidates(sourceUrl) });
    } catch (error) {
      setState({
        kind: 'error',
        message:
          error instanceof LogoCandidatesError ? error.message : '로고 후보를 가져오지 못했습니다.',
      });
    }
  };

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!sourceUrl || state.kind === 'loading'}
          onClick={suggest}
        >
          {state.kind === 'loading' ? '찾는 중' : '로고 추천'}
        </Button>
        <span className="text-xs text-gray-500">
          {sourceUrl
            ? '원문 주소 사이트의 아이콘을 큰 순서로 보여줘요.'
            : '원문 주소를 넣으면 그 사이트의 아이콘을 추천해요.'}
        </span>
      </div>
      {state.kind === 'error' ? <p className="mt-2 text-xs text-error">{state.message}</p> : null}
      {state.kind === 'done' && state.candidates.length === 0 ? (
        <p className="mt-2 text-xs text-gray-500">이 사이트에서 48px 이상인 아이콘을 찾지 못했어요.</p>
      ) : null}
      {state.kind === 'done' && state.candidates.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {state.candidates.map((candidate) => (
            <CandidateButton
              key={candidate.url}
              candidate={candidate}
              selected={candidate.url === logoUrl.trim()}
              onPick={() => onPick(candidate.url)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
