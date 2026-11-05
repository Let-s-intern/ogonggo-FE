import { Button, Checkbox } from '@ogonggo/ui';
import { useNotificationJobRoleOptions } from '@/entities/notification-batch/api/useNotificationBatches';
import { formatCount } from '@/shared/lib/format';
import { JOB_ROLES_MAX } from '../lib/sendForm';

interface JobRolePickerProps {
  value: string[];
  onChange: (jobRoles: string[]) => void;
}

/**
 * 희망 직무 발송의 직군·직무 고르기. 선택지는 서버(`job-role-options`)가 준 그대로 보낸다.
 *
 * 직군 전체(`allRolesOption`)를 고르면 그 직군의 개별 직무는 고른 값에서 빼고 눌린 채 잠근다. 서버가 직군 전체를
 * 그 직군의 모든 직무로 펼쳐 비교하므로 함께 보내도 대상은 같고, 100개 한도만 먼저 찬다.
 */
export function JobRolePicker({ value, onChange }: JobRolePickerProps) {
  const { data, isPending, isError } = useNotificationJobRoleOptions();

  if (isPending) {
    return <p className="text-sm text-gray-500">희망 직무 선택지를 불러오는 중입니다.</p>;
  }
  if (isError || !data) {
    return <p className="text-sm text-error">희망 직무 선택지를 불러오지 못했어요.</p>;
  }

  const selected = new Set(value);
  const toggle = (option: string, next: boolean) =>
    onChange(next ? [...value, option] : value.filter((other) => other !== option));

  return (
    <div className="flex flex-col gap-3 rounded-md border border-gray-200 p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-gray-700">
          고른 선택지{' '}
          <span className="font-semibold text-gray-900">
            {formatCount(value.length)}/{formatCount(JOB_ROLES_MAX)}
          </span>
        </span>
        {value.length > 0 ? (
          <Button size="sm" variant="secondary" onClick={() => onChange([])}>
            모두 빼기
          </Button>
        ) : null}
      </div>
      {data.map((field) => {
        const allSelected = selected.has(field.allRolesOption);
        return (
          <div key={field.jobField} className="flex flex-col gap-2 border-t border-gray-100 pt-3">
            <Checkbox
              checked={allSelected}
              onChange={(next) =>
                onChange(
                  next
                    ? [
                        ...value.filter((other) => !field.jobRoles.includes(other)),
                        field.allRolesOption,
                      ]
                    : value.filter((other) => other !== field.allRolesOption),
                )
              }
              label={field.allRolesOption}
              labelClassName="font-semibold"
            />
            <div className="flex flex-wrap gap-x-4 gap-y-2 pl-7">
              {field.jobRoles.map((role) => (
                <Checkbox
                  key={role}
                  checked={allSelected || selected.has(role)}
                  disabled={allSelected}
                  onChange={(next) => toggle(role, next)}
                  label={role}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
