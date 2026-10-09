import { formatRelativeTime } from '../model/relativeTime';

export interface RelativeTimeProps {
  /** 백엔드 `createdAt`. 시간대 없는 `LocalDateTime` 이다. */
  value: string;
  className?: string;
}

/**
 * `3일 전` 같은 상대 시간. 서버와 브라우저가 각자 `지금` 을 읽어 분 경계에서 한 글자가 다를 수 있어
 * `suppressHydrationWarning` 을 둔다 — 서버가 그린 문구를 그대로 두면 되고, 다음 방문에 바로잡힌다.
 */
export function RelativeTime({ value, className }: RelativeTimeProps) {
  return (
    <time dateTime={value} className={className} suppressHydrationWarning>
      {formatRelativeTime(value)}
    </time>
  );
}
