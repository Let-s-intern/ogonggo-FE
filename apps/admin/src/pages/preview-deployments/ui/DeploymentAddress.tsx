import { useEffect, useRef, useState } from 'react';
import { Button } from '@ogonggo/ui';

type CopyState = 'idle' | 'copied' | 'failed';

const FEEDBACK_MS = 1500;

function CopyButton({ value, label }: { value: string; label: string }) {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<number | undefined>(undefined);

  // 안내가 사라지기 전에 행이 목록에서 빠지면 타이머가 사라진 컴포넌트의 상태를 바꾸려 한다.
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const show = (next: CopyState) => {
    setState(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), FEEDBACK_MS);
  };

  return (
    <Button
      size="sm"
      variant="secondary"
      aria-label={`${label} 복사`}
      onClick={() => {
        // 클립보드 API 는 보안 컨텍스트가 아니거나 권한이 막히면 없거나 거절된다.
        navigator.clipboard.writeText(value).then(
          () => show('copied'),
          () => show('failed'),
        );
      }}
    >
      {state === 'copied' ? '복사됨' : state === 'failed' ? '복사 실패' : '복사'}
    </Button>
  );
}

export interface DeploymentAddressProps {
  /** 이 주소가 무엇인지. `브랜치 주소` 처럼 한 행에 주소가 둘일 때 구분한다. 하나뿐이면 생략한다. */
  label?: string;
  url: string;
}

/** 주소 한 줄과 `열기`·`복사`. 주소를 사람이 읽을 수 있게 `https://` 는 떼고 보인다. */
export function DeploymentAddress({ label, url }: DeploymentAddressProps) {
  const name = label ?? '배포 주소';
  return (
    <div className="flex items-center gap-2">
      {label ? <span className="w-16 shrink-0 text-xs text-gray-500">{label}</span> : null}
      <span className="min-w-0 break-all text-sm text-gray-700">
        {url.replace(/^https?:\/\//, '')}
      </span>
      <div className="flex shrink-0 gap-1">
        <Button asChild size="sm" variant="secondary">
          <a href={url} target="_blank" rel="noreferrer" aria-label={`${name} 열기`}>
            열기
          </a>
        </Button>
        <CopyButton value={url} label={name} />
      </div>
    </div>
  );
}
