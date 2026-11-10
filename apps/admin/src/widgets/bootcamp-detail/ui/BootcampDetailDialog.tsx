import { Link } from 'react-router';
import { Callout, Modal } from '@ogonggo/ui';
import { useBootcampDetail } from '@/entities/content/api/useContent';
import { BootcampDetailBody } from './BootcampDetailBody';

/**
 * 부트캠프 목록에서 연 상세 모달(2026-11-10 사용자: 상세를 페이지 이동 대신 모달로). 내용은 상세 화면과 같은
 * `BootcampDetailBody` 다. 열린 건은 목록 주소의 `?bootcamp=<id>` 에 있어 뒤로가기로 닫히고 새로고침해도 남는다.
 */
export function BootcampDetailDialog({
  bootcampId,
  listPath,
  onClose,
}: {
  bootcampId: number;
  listPath: string;
  onClose: () => void;
}) {
  const { data, isPending, isError } = useBootcampDetail(bootcampId);

  return (
    <Modal
      open
      title={data?.title ?? '부트캠프'}
      onClose={onClose}
      className="w-[min(64rem,calc(100vw-var(--assistant-width,0px)-2rem))] max-h-[calc(100vh-2rem)] overflow-y-auto"
    >
      {isPending ? (
        <p className="text-sm text-gray-500">불러오는 중입니다.</p>
      ) : isError || !data ? (
        <Callout tone="error">부트캠프를 찾을 수 없습니다.</Callout>
      ) : (
        <>
          <p className="mb-4 text-right text-sm">
            <Link
              to={`${listPath}/${data.id}`}
              className="text-gray-500 underline hover:text-gray-900"
            >
              상세 화면으로 열기
            </Link>
          </p>
          <BootcampDetailBody data={data} listPath={listPath} />
        </>
      )}
    </Modal>
  );
}
