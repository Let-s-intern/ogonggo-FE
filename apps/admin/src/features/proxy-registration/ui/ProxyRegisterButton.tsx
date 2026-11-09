import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, Callout, Modal, SearchInput } from '@ogonggo/ui';
import { useCompanyMemberList } from '@/entities/member/api/useMembers';

const LABEL = { jobs: '채용공고 대리 등록', bootcamps: '부트캠프 대리 등록' } as const;

export interface ProxyRegisterButtonProps {
  /** 등록할 것. 고른 회원의 `members/companies/:memberId/{kind}/new` 로 간다. */
  kind: 'jobs' | 'bootcamps';
}

/**
 * 비즈니스 채용공고·부트캠프 목록 위에서 대리 등록을 시작하는 버튼(#594). 누르면 기업회원을 기관명·이메일로 찾아 고르고, 고른
 * 회원의 대리 등록 화면으로 간다. 기업회원 상세의 같은 버튼과 도착하는 화면이 같다.
 *
 * 활동 중(`ACTIVE`) 회원만 찾는다. 정지·탈퇴 회원에게는 BE 가 대리 등록을 거절한다(409 `COMPANY_MEMBER_NOT_ACTIVE`).
 */
export function ProxyRegisterButton({ kind }: ProxyRegisterButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {LABEL[kind]}
      </Button>
      {open ? <MemberPickerModal kind={kind} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function MemberPickerModal({
  kind,
  onClose,
}: {
  kind: ProxyRegisterButtonProps['kind'];
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState('');
  const [keyword, setKeyword] = useState('');
  const { data, isPending, isError } = useCompanyMemberList({
    page: 1,
    keyword,
    status: 'ACTIVE',
    joinedWithinDays: '',
  });
  const members = data?.items ?? [];

  return (
    <Modal
      open
      title={LABEL[kind]}
      description="어느 기업회원 이름으로 올릴지 고르세요. 활동 중인 회원만 보입니다."
      onClose={onClose}
    >
      <form
        className="mb-3"
        onSubmit={(event) => {
          event.preventDefault();
          setKeyword(draft.trim());
        }}
      >
        <SearchInput
          aria-label="기업회원 검색"
          placeholder="기관명·이메일로 찾기"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onClear={() => {
            setDraft('');
            setKeyword('');
          }}
        />
      </form>
      {isError ? <Callout tone="error">기업회원을 불러오지 못했습니다.</Callout> : null}
      <ul className="max-h-80 overflow-y-auto rounded-md border border-gray-200">
        {isPending ? (
          <li className="px-4 py-6 text-center text-sm text-gray-400">불러오는 중</li>
        ) : members.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-gray-500">맞는 기업회원이 없습니다.</li>
        ) : (
          members.map((member) => (
            <li key={member.userId} className="border-b border-gray-100 last:border-b-0">
              <button
                type="button"
                onClick={() => navigate(`/members/companies/${member.userId}/${kind}/new`)}
                className="flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left hover:bg-gray-50"
              >
                <span className="text-sm font-medium text-gray-900">
                  {member.organizationName ?? '기관명 없음'}
                </span>
                <span className="text-xs text-gray-500">
                  {[member.managerName, member.email].filter(Boolean).join(' · ')}
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
      {(data?.pageInfo.totalElements ?? 0) > members.length ? (
        <p className="mt-2 text-xs text-gray-500">
          {data?.pageInfo.totalElements}명 중 {members.length}명만 보입니다. 검색어를 더 넣어
          주세요.
        </p>
      ) : null}
    </Modal>
  );
}
