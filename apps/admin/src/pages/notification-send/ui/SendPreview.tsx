import { Card } from '@ogonggo/ui';
import type { SendFormValues } from '../lib/sendForm';

/** 푸시 본문 미리보기와 알림함 미리보기의 길이. 서버가 TOPIC 푸시와 알림함 `preview` 를 이 길이로 자른다. */
const PREVIEW_LENGTH = 100;

/** 서버처럼 코드 포인트로 자른다(`AdminNotificationBatchService.createBroadcast`). 이모지가 반으로 갈리지 않는다. */
const cut = (text: string) => {
  const chars = Array.from(text);
  return chars.length > PREVIEW_LENGTH ? `${chars.slice(0, PREVIEW_LENGTH).join('')}…` : text;
};

/**
 * 폼 옆 미리보기 둘. 푸시는 기기마다 모양이 달라 실제 모양이 아니라 들어갈 글만 보인다. 알림함은 웹 알림함의 관리자
 * 알림 한 줄(제목 굵게, 미리보기 두 줄)을 따른다.
 */
export function SendPreview({ values }: { values: SendFormValues }) {
  const title = values.title.trim();
  const body = cut(values.body.trim());

  return (
    <section aria-label="미리보기" className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-sm font-semibold text-gray-900">푸시 미리보기</h2>
        <div className="flex gap-3 rounded-lg bg-gray-100 p-3.5">
          <Mark className="h-9 w-9 rounded-md" />
          <span className="flex min-w-0 flex-col gap-0.5 text-sm">
            <Text value={title} placeholder="제목" className="font-semibold" />
            <Text value={body} placeholder="본문" className="text-gray-600" />
          </span>
        </div>
        <p className="text-xs text-gray-500">
          전체 회원 발송이 토픽으로 처리되면 푸시 본문은 앞 100자만 보여요. 알림함에는 미리보기
          100자가 저장돼요.
        </p>
      </Card>

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-sm font-semibold text-gray-900">알림함 미리보기</h2>
        <div className="flex gap-3 rounded-lg bg-blue-00 p-3.5">
          <Mark className="h-10 w-10 rounded-full" />
          <span className="flex min-w-0 flex-col gap-0.5">
            <Text value={title} placeholder="제목" className="text-sm font-semibold" />
            <Text value={body} placeholder="본문" className="line-clamp-2 text-sm text-gray-600" />
            <span className="text-xs text-gray-500">방금 전</span>
          </span>
        </div>
      </Card>
    </section>
  );
}

/** 오공고 표식. 어드민에는 로고 이미지가 없어 글자로 둔다. */
function Mark({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={`flex flex-none items-center justify-center bg-blue-500 text-sm font-bold text-white ${className}`}
    >
      오
    </span>
  );
}

/** 비었으면 칸 이름을 흐리게 둔다. 빈 줄이면 미리보기 모양이 무너진다. */
function Text({
  value,
  placeholder,
  className,
}: {
  value: string;
  placeholder: string;
  className: string;
}) {
  return (
    <span className={`break-words ${className} ${value ? '' : 'text-gray-400'}`}>
      {value || placeholder}
    </span>
  );
}
