'use client';

import { ListboxSelect, type ListboxSelectProps } from '@/shared/ui/ListboxSelect';
import { SIGN_UP_INPUT_CLASS, SignUpField } from './SignUpField';

export type SignUpSelectProps = Omit<ListboxSelectProps, 'className' | 'disabled'>;

/** 가입 화면의 드롭다운. 가입 칸 모양(`SignUpField`, 높이·모서리)을 입힌 `ListboxSelect` 다. 모두 필수 칸이다. */
export function SignUpSelect(props: SignUpSelectProps) {
  return (
    <SignUpField label={props.label} htmlFor={props.id} required>
      <ListboxSelect {...props} className={SIGN_UP_INPUT_CLASS} />
    </SignUpField>
  );
}
