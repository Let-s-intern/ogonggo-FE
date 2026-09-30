import { cn, Select, type SelectProps } from '@ogonggo/ui';

/**
 * 작성 폼의 드롭다운. 고르기 전(값이 빈 문자열)에는 첫 줄 문구를 회색으로, 고른 뒤에는 오른쪽에
 * 파란 체크를 띄운다. 고르기 전 문구가 값처럼 읽혀 선택했는지 알 수 없다는 말이 있었다.
 *
 * 체크는 브라우저가 그리는 꺾쇠 왼쪽에 겹쳐 놓는다. 그 자리만큼 오른쪽 여백을 더 준다.
 */
export function FormSelect({ className, value, ...props }: SelectProps) {
  const done = value !== undefined && value !== '';
  return (
    <div className="relative">
      <Select
        {...props}
        value={value}
        className={cn(
          'h-11 w-full px-4 pr-14 text-base',
          done ? 'text-gray-900' : 'text-gray-400',
          className,
        )}
      />
      {done ? (
        <span
          aria-hidden="true"
          className="icon-[lucide--circle-check] pointer-events-none absolute top-1/2 right-9 block h-5 w-5 -translate-y-1/2 text-blue-500"
        />
      ) : null}
    </div>
  );
}
