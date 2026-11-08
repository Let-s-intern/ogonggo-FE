export interface SaveStatus {
  tone: 'success' | 'error';
  message: string;
}

/** 구역 아래 저장 결과 한 줄. */
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
