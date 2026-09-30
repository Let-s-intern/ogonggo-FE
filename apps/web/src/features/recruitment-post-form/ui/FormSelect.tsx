import { cn, Select, type SelectProps } from '@ogonggo/ui';

/**
 * 작성 폼의 드롭다운. 고르기 전(값이 빈 문자열)에는 첫 줄 문구를 회색으로 둔다 — 고르기 전
 * 문구가 값처럼 읽혀 선택했는지 알 수 없다는 말이 있었다. 고른 뒤의 체크는 다른 칸과 같이
 * 라벨 옆에 붙는다(`Field` 의 `done`).
 */
export function FormSelect({ className, value, ...props }: SelectProps) {
  const done = value !== undefined && value !== '';
  return (
    <Select
      {...props}
      value={value}
      className={cn(
        'h-11 w-full px-4 text-base',
        done ? 'text-gray-900' : 'text-gray-400',
        className,
      )}
    />
  );
}
