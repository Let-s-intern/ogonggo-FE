import { useRef, useState } from 'react';
import { Button, Callout, Card, DescriptionList, Field, Input, Modal, Textarea } from '@ogonggo/ui';
import { HttpError } from '@ogonggo/api';
import type { AdminNotificationBatchCreatedResponse } from '@ogonggo/api/src/admin';
import { useCreateNotificationBatch } from '@/entities/notification-batch/api/useNotificationBatches';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';
import { notificationTargetTypeLabel } from '@/shared/config/labels';
import { formatCount } from '@/shared/lib/format';
import {
  BODY_MAX,
  EMPTY_SEND_FORM,
  TITLE_MAX,
  parseUserIds,
  toCreateRequest,
  validateSendForm,
  type SendFormValues,
  type SendTarget,
} from '../lib/sendForm';

interface SendFormProps {
  values: SendFormValues;
  onChange: (values: SendFormValues) => void;
  /** 201 을 받은 뒤. 폼은 이 컴포넌트가 비운다. */
  onSent?: (created: AdminNotificationBatchCreatedResponse) => void;
}

const TARGETS: SendTarget[] = ['USER_IDS', 'ALL'];

/**
 * 발송 폼과 확인 창.
 *
 * 칸별 오류는 처음 `발송` 을 누른 뒤부터 보인다. 입력하는 도중에 빨간 문구가 따라다니면 다 쓰기도 전에 틀렸다는
 * 말을 듣는다. 한 번 누른 뒤에는 고치는 즉시 사라진다.
 *
 * 요청 중에는 `보내기` 를 막는다. 서버에 멱등 처리가 없어 두 번 가면 회원에게 두 번 간다. 버튼의 `disabled` 는
 * 다시 그려진 뒤에야 걸리므로, 그 사이에 들어온 클릭은 `sendingRef` 가 막는다.
 */
export function SendForm({ values, onChange, onSent }: SendFormProps) {
  const createMutation = useCreateNotificationBatch();
  const [submitted, setSubmitted] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const sendingRef = useRef(false);

  const errors = submitted ? validateSendForm(values) : {};
  const parsed = parseUserIds(values.userIds);
  const set = (patch: Partial<SendFormValues>) => onChange({ ...values, ...patch });

  const openConfirm = () => {
    setSubmitted(true);
    createMutation.reset();
    if (Object.keys(validateSendForm(values)).length === 0) {
      setIsConfirming(true);
    }
  };

  const send = () => {
    if (sendingRef.current) {
      return;
    }
    sendingRef.current = true;
    createMutation.mutate(toCreateRequest(values), {
      onSuccess: (created) => {
        onChange(EMPTY_SEND_FORM);
        setSubmitted(false);
        if (created) {
          onSent?.(created);
        }
      },
      onSettled: () => {
        sendingRef.current = false;
        setIsConfirming(false);
      },
    });
  };

  const audience =
    values.target === 'ALL' ? '전체 활성 회원' : `지정 회원 ${formatCount(parsed.uniqueCount)}명`;

  return (
    <Card className="p-6">
      <fieldset className="pb-4">
        <legend className="pb-1.5 text-sm font-medium text-gray-700">대상</legend>
        <div className="flex gap-2">
          {TARGETS.map((target) => (
            <label
              key={target}
              className={
                values.target === target
                  ? 'flex h-10 items-center gap-2 rounded-md border border-blue-500 bg-blue-00 px-3.5 text-sm font-semibold text-blue-700'
                  : 'flex h-10 items-center gap-2 rounded-md border border-gray-200 px-3.5 text-sm text-gray-700'
              }
            >
              <input
                type="radio"
                name="notification-target"
                value={target}
                checked={values.target === target}
                onChange={() => set({ target })}
                className="accent-blue-500"
              />
              {notificationTargetTypeLabel(target)}
            </label>
          ))}
        </div>
      </fieldset>

      {values.target === 'USER_IDS' ? (
        <Field label="회원 ID" htmlFor="notification-user-ids" error={errors.userIds}>
          <Textarea
            id="notification-user-ids"
            rows={3}
            value={values.userIds}
            onChange={(event) => set({ userIds: event.target.value })}
            placeholder="1024, 1031, 1188"
          />
          <p className="flex justify-between gap-4 pt-1.5 text-xs text-gray-500">
            <span>
              쉼표, 공백, 줄바꿈으로 구분해요. 회원 ID는 일반 회원 목록에서 확인할 수 있어요.
            </span>
            <span className="whitespace-nowrap">
              입력 {formatCount(parsed.count)}개 · 중복 제외 {formatCount(parsed.uniqueCount)}명
            </span>
          </p>
        </Field>
      ) : null}

      <Field label="제목" htmlFor="notification-title" error={errors.title}>
        <Input
          id="notification-title"
          value={values.title}
          onChange={(event) => set({ title: event.target.value })}
        />
        <Counter length={values.title.length} max={TITLE_MAX} />
      </Field>

      <Field label="본문" htmlFor="notification-body" error={errors.body}>
        <Textarea
          id="notification-body"
          rows={5}
          value={values.body}
          onChange={(event) => set({ body: event.target.value })}
        />
        <Counter length={values.body.length} max={BODY_MAX} />
      </Field>

      <Field
        label="이동 URL"
        htmlFor="notification-url"
        hint="http 또는 https로 시작하는 전체 주소. 오공고 밖 주소는 새 탭으로 열려요."
        error={errors.url}
      >
        <Input
          id="notification-url"
          value={values.url}
          onChange={(event) => set({ url: event.target.value })}
          placeholder="https://www.ogonggo.co.kr/notices"
        />
      </Field>

      {createMutation.isError ? (
        <Callout tone="error" className="mb-4">
          {sendErrorMessage(createMutation.error)}
        </Callout>
      ) : null}

      <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
        <Button
          variant="secondary"
          onClick={() => {
            onChange(EMPTY_SEND_FORM);
            setSubmitted(false);
            createMutation.reset();
          }}
        >
          비우기
        </Button>
        <Button onClick={openConfirm}>발송</Button>
      </div>

      <Modal
        open={isConfirming}
        title="알림을 보낼까요?"
        onClose={() => {
          // 요청 중에는 닫지 않는다. 닫아도 요청은 가고, 결과를 볼 자리만 사라진다.
          if (!sendingRef.current) {
            setIsConfirming(false);
          }
        }}
      >
        <DescriptionList
          columns={1}
          items={[
            { label: '대상', value: <span className="font-semibold">{audience}</span> },
            { label: '제목', value: values.title.trim() },
            { label: '이동', value: <span className="break-all">{values.url.trim()}</span> },
          ]}
        />
        <Callout tone="warning" className="mt-4">
          보내면 취소할 수 없어요. 같은 내용을 다시 보내면 회원에게 한 번 더 갑니다.
        </Callout>
        <div className="flex justify-end gap-2 pt-6">
          <Button
            variant="secondary"
            disabled={createMutation.isPending}
            onClick={() => setIsConfirming(false)}
          >
            취소
          </Button>
          <Button disabled={createMutation.isPending} onClick={send}>
            {createMutation.isPending ? '보내는 중' : '보내기'}
          </Button>
        </div>
      </Modal>
    </Card>
  );
}

/** `n/100`. 넘으면 빨갛다. */
function Counter({ length, max }: { length: number; max: number }) {
  return (
    <p
      className={
        length > max
          ? 'pt-1.5 text-right text-xs text-error'
          : 'pt-1.5 text-right text-xs text-gray-500'
      }
    >
      {formatCount(length)}/{formatCount(max)}
    </p>
  );
}

/**
 * 없는 회원이 하나라도 있으면 서버가 요청 전체를 거절한다(404 `USER_NOT_FOUND`). 아무에게도 가지 않았다는 것을
 * 먼저 말하고 서버 메시지를 붙인다. 그 밖의 오류(400 등)는 서버 메시지를 그대로 보인다.
 */
function sendErrorMessage(error: unknown): string {
  const message = serverErrorMessage(error);
  if (error instanceof HttpError && error.status === 404) {
    return `없는 회원 ID가 있어 발송하지 않았어요. ${message ?? ''}`.trim();
  }
  return message ?? '발송하지 못했어요. 잠시 뒤 다시 시도해 주세요.';
}
