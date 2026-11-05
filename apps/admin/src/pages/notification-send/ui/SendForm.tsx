import { useRef, useState } from 'react';
import {
  Button,
  Callout,
  Card,
  Checkbox,
  DescriptionList,
  Field,
  Input,
  Modal,
  Textarea,
} from '@ogonggo/ui';
import { HttpError } from '@ogonggo/api';
import type { AdminNotificationBatchCreatedResponse } from '@ogonggo/api/src/admin';
import { useCreateNotificationBatch } from '@/entities/notification-batch/api/useNotificationBatches';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';
import { notificationTargetTypeLabel } from '@/shared/config/labels';
import { formatCount } from '@/shared/lib/format';
import {
  AD_TITLE_PREFIX,
  BODY_MAX,
  EMPTY_SEND_FORM,
  TITLE_MAX,
  canAdvertise,
  isAdQuietHours,
  parseUserIds,
  sendTitle,
  targetUserIds,
  titlePrefix,
  toCreateRequest,
  validateSendForm,
  type SendFormValues,
  type SendTarget,
} from '../lib/sendForm';
import { JobRolePicker } from './JobRolePicker';
import { MemberPickerModal } from './MemberPickerModal';

interface SendFormProps {
  values: SendFormValues;
  onChange: (values: SendFormValues) => void;
  /** 201 을 받은 뒤. 폼은 이 컴포넌트가 비운다. */
  onSent?: (created: AdminNotificationBatchCreatedResponse) => void;
}

/**
 * `전체 회원` 을 앞에 둔다(사용자 결정). 처음 고른 값은 `지정 회원` 그대로다 — 손이 먼저 가는 자리에 있다고 전체
 * 발송이 기본이 되면, 확인 창 하나만 남은 채 전 회원에게 갈 수 있다. 회원 종류·희망 직무는 전체와 지정 사이에
 * 둔다. 넓은 대상에서 좁은 대상 순서다.
 */
const TARGETS: SendTarget[] = [
  'ALL',
  'GENERAL_MEMBERS',
  'COMPANY_MEMBERS',
  'JOB_ROLES',
  'USER_IDS',
];

/** 확인 창의 대상 문구. 회원 수는 서버가 요청 시점에 세므로 지정 회원만 숫자를 적는다. */
const AUDIENCE: Record<Exclude<SendTarget, 'USER_IDS' | 'JOB_ROLES'>, string> = {
  ALL: '전체 활성 회원',
  GENERAL_MEMBERS: '활성 일반 회원',
  COMPANY_MEMBERS: '활성 기업 회원',
};

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
  /** 확인 창을 연 때가 광고성 야간 시간이었는지. 창을 연 동안에는 바꾸지 않는다. */
  const [isQuietHours, setIsQuietHours] = useState(false);
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
      setIsQuietHours(values.advertisement && isAdQuietHours());
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
    values.target === 'USER_IDS'
      ? `지정 회원 ${formatCount(uniqueTargets)}명`
      : values.target === 'JOB_ROLES'
        ? `희망 직무 ${formatCount(values.jobRoles.length)}개 중 하나라도 맞는 활성 일반 회원`
        : AUDIENCE[values.target];

  return (
    <Card className="p-6">
      <fieldset className="pb-4">
        <legend className="pb-1.5 text-sm font-medium text-gray-700">대상</legend>
        <div className="flex flex-wrap gap-2">
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
                onChange={() =>
                  set(canAdvertise(target) ? { target } : { target, advertisement: false })
                }
                className="accent-blue-500"
              />
              {notificationTargetTypeLabel(target)}
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="광고성" error={errors.advertisement}>
        <Checkbox
          checked={values.advertisement}
          disabled={!canAdvertise(values.target)}
          onChange={(advertisement) => set({ advertisement })}
          label="광고성 알림으로 보내기"
        />
        <p className="pt-1.5 text-xs text-gray-500">
          {canAdvertise(values.target)
            ? `광고성 알림은 렛츠커리어 마케팅 수신에 동의한 회원에게만 가고, 제목 앞에 ${AD_TITLE_PREFIX.trim()} 가 붙어요.`
            : '기업 회원에게는 광고성 알림을 보낼 수 없어요.'}
        </p>
      </Field>

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

      {values.target === 'JOB_ROLES' ? (
        <Field label="희망 직무" error={errors.jobRoles}>
          <JobRolePicker value={values.jobRoles} onChange={(jobRoles) => set({ jobRoles })} />
          <p className="pt-1.5 text-xs text-gray-500">
            고른 직무 중 하나라도 희망 직무에 넣은 활성 일반 회원에게 가요. 직무 무관을 고른 회원은
            받지 않아요.
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
        <div className="flex justify-between gap-4">
          <p className="pt-1.5 text-xs text-gray-500">
            {titlePrefix(values) ? `보낼 제목: ${sendTitle(values) || AD_TITLE_PREFIX}` : null}
          </p>
          <Counter length={titlePrefix(values).length + values.title.length} max={TITLE_MAX} />
        </div>
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
            {
              label: '광고성',
              value: values.advertisement ? '광고성 · 마케팅 수신 동의자에게만' : '아님',
            },
            { label: '제목', value: sendTitle(values) },
            { label: '이동', value: <span className="break-all">{values.url.trim()}</span> },
          ]}
        />
        {isQuietHours ? (
          <Callout tone="error" className="mt-4">
            지금은 밤 9시부터 아침 8시 사이예요. 이 시간의 광고성 알림은 야간 수신에 따로 동의한
            회원에게만 보낼 수 있어요. 지금 보내도 되는지 한 번 더 확인해 주세요.
          </Callout>
        ) : null}
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
            {createMutation.isPending ? '보내는 중' : isQuietHours ? '그래도 보내기' : '보내기'}
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
