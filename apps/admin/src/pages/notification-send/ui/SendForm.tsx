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
  targetUserIds,
  toCreateRequest,
  validateSendForm,
  type SendFormValues,
  type SendTarget,
} from '../lib/sendForm';
import { MemberPickerModal } from './MemberPickerModal';

interface SendFormProps {
  values: SendFormValues;
  onChange: (values: SendFormValues) => void;
  /** 201 을 받은 뒤. 폼은 이 컴포넌트가 비운다. */
  onSent?: (created: AdminNotificationBatchCreatedResponse) => void;
}

/**
 * `전체 회원` 을 앞에 둔다(사용자 결정). 처음 고른 값은 `지정 회원` 그대로다 — 손이 먼저 가는 자리에 있다고 전체
 * 발송이 기본이 되면, 확인 창 하나만 남은 채 전 회원에게 갈 수 있다.
 */
const TARGETS: SendTarget[] = ['ALL', 'USER_IDS'];

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

  const [isPicking, setIsPicking] = useState(false);
  const errors = submitted ? validateSendForm(values) : {};
  const parsed = parseUserIds(values.userIds);
  const uniqueTargets = new Set(targetUserIds(values)).size;
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
    values.target === 'ALL' ? '전체 활성 회원' : `지정 회원 ${formatCount(uniqueTargets)}명`;

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
        <Field label="받는 회원" htmlFor="notification-user-ids" error={errors.userIds}>
          <div className="flex flex-col gap-2.5 rounded-md border border-gray-200 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-700">
                검색으로 고른 회원{' '}
                <span className="font-semibold text-gray-900">
                  {formatCount(values.selectedMembers.length)}명
                </span>
              </span>
              <div className="flex gap-2">
                {values.selectedMembers.length > 0 ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => set({ selectedMembers: [] })}
                  >
                    모두 빼기
                  </Button>
                ) : null}
                <Button size="sm" onClick={() => setIsPicking(true)}>
                  회원 검색
                </Button>
              </div>
            </div>
            {values.selectedMembers.length > 0 ? (
              <ul className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
                {values.selectedMembers.map((member) => (
                  <li
                    key={member.userId}
                    className="flex h-7 items-center gap-1 rounded-full bg-blue-50 pr-1 pl-3 text-xs text-blue-700"
                  >
                    <span className="font-medium">{member.label || '이름 없음'}</span>
                    <span className="text-blue-500">#{member.userId}</span>
                    <button
                      type="button"
                      aria-label={`${member.label || member.userId} 빼기`}
                      onClick={() =>
                        set({
                          selectedMembers: values.selectedMembers.filter(
                            (other) => other.userId !== member.userId,
                          ),
                        })
                      }
                      className="flex h-5 w-5 items-center justify-center rounded-full text-blue-500 hover:bg-blue-100"
                    >
                      <span aria-hidden="true" className="icon-[lucide--x] block h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <Textarea
            id="notification-user-ids"
            rows={2}
            value={values.userIds}
            onChange={(event) => set({ userIds: event.target.value })}
            placeholder="ID 직접 입력: 1024, 1031, 1188"
            className="mt-2"
          />
          <p className="flex justify-between gap-4 pt-1.5 text-xs text-gray-500">
            <span>ID 를 직접 넣을 때는 쉼표, 공백, 줄바꿈으로 구분해요.</span>
            <span className="whitespace-nowrap">
              검색 {formatCount(values.selectedMembers.length)}명 · 직접 입력{' '}
              {formatCount(parsed.count)}개 · 중복 제외 {formatCount(uniqueTargets)}명
            </span>
          </p>
        </Field>
      ) : null}

      {isPicking ? (
        <MemberPickerModal
          initial={values.selectedMembers}
          onCancel={() => setIsPicking(false)}
          onConfirm={(selectedMembers) => {
            set({ selectedMembers });
            setIsPicking(false);
          }}
        />
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
