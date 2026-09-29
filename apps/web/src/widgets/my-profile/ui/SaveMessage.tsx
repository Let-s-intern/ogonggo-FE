export interface SaveStatus {
  tone: 'success' | 'error';
  message: string;
}

/**
 * 구역 아래 저장 결과 한 줄. 기업/기관 정보 화면(`widgets/company-profile/ui/CompanyProfileView.tsx`)
 * 의 같은 이름 함수와 모양이 같다. 그쪽은 파일 안에 숨은 함수라 가져다 쓸 수 없다.
 */
export function SaveMessage({ status }: { status: SaveStatus | null }) {
  if (!status) {
    return null;
  }
  return status.tone === 'error' ? (
    <p role="alert" className="text-sm text-error">
      {status.message}
    </p>
  ) : (
    <p role="status" className="text-sm text-gray-500">
      {status.message}
    </p>
  );
}
