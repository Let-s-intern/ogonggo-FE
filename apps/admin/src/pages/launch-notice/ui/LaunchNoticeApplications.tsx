import { Button, Card, CardTitle, Input } from '@ogonggo/ui';
import { useState } from 'react';
import {
  COLUMNS,
  fetchApplications,
  formatCreated,
  login,
  POCKETBASE_URL,
  toCsv,
  type Application,
} from '../lib/api';

/**
 * 출시알림 신청 목록. 표로 보고 CSV 로 내보낸다(2026-09-05 결정).
 *
 * 로그인을 여기서 받는 이유는 신청에 이름·이메일·연락처가 들어가기 때문이다. 포켓베이스
 * 컬렉션 규칙을 슈퍼유저 전용으로 잠가 두었고(비인증 조회는 403), 그래서 사람이 한 번
 * 로그인해야 목록이 보인다. 토큰은 메모리에만 둔다 — `localStorage` 에 두면 이 화면을 연 적
 * 있는 브라우저에 계속 남는다.
 *
 * **런칭(2026-09-23) 뒤 지운다.** 이 폴더와 `pages/home/ui/HomePage.tsx` 의 한 줄이
 * 어드민에서 출시알림과 이어진 자리 전부다.
 */
export function LaunchNoticeApplications() {
  const [token, setToken] = useState<string>();
  const [rows, setRows] = useState<Application[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  if (!POCKETBASE_URL) {
    return null;
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setBusy(true);
    const data = new FormData(event.currentTarget);
    try {
      const next = await login(String(data.get('email') ?? ''), String(data.get('password') ?? ''));
      setToken(next);
      setRows(await fetchApplications(next));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '로그인에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function refresh() {
    if (!token) return;
    setBusy(true);
    setError(undefined);
    try {
      setRows(await fetchApplications(token));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '불러오지 못했습니다.');
    } finally {
      setBusy(false);
    }
  }

  function downloadCsv() {
    // `URL.createObjectURL` 로 만든 주소는 브라우저 메모리에 남으므로 쓰고 나서 되돌린다.
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `출시알림-신청-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <CardTitle>출시알림 신청</CardTitle>
        <p className="mt-1 text-sm text-gray-500">
          신청자 개인정보가 들어 있어 로그인해야 볼 수 있습니다.
        </p>
        <form onSubmit={handleLogin} className="mt-4 flex flex-col gap-3">
          <Input name="email" type="email" placeholder="포켓베이스 관리자 이메일" required />
          <Input name="password" type="password" placeholder="비밀번호" required />
          <Button type="submit" disabled={busy}>
            {busy ? '확인 중…' : '로그인'}
          </Button>
        </form>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">출시알림 신청</h2>
          <p className="text-sm text-gray-500">{rows.length}건</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={refresh} disabled={busy}>
            {busy ? '불러오는 중…' : '새로고침'}
          </Button>
          <Button onClick={downloadCsv} disabled={rows.length === 0}>
            CSV 내보내기
          </Button>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">아직 신청이 없습니다.</p>
      ) : (
        // 열이 12개라 좁은 화면에서는 표만 가로로 스크롤된다. 페이지 전체가 밀리지 않는다.
        <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                {COLUMNS.map((column) => (
                  <th
                    key={column.key}
                    className="whitespace-nowrap px-3 py-2 font-medium text-gray-500"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-gray-100 align-top">
                  {COLUMNS.map((column) => (
                    <td key={column.key} className="px-3 py-2 text-gray-800">
                      {renderCell(row, column.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * 칸 하나를 그린다. 표에서 셋만 그대로 두지 않는다 — 시각은 짧게, 링크는 누를 수 있게,
 * 설문 답변은 길어서 폭을 제한한다. 나머지는 값 그대로다.
 */
function renderCell(row: Application, key: keyof Application) {
  if (key === 'created') {
    return <span className="whitespace-nowrap">{formatCreated(row.created)}</span>;
  }
  if (key === 'marketing') {
    return row.marketing ? 'Y' : 'N';
  }
  if (key === 'link' && row.link) {
    return (
      <a
        href={row.link}
        target="_blank"
        rel="noopener"
        className="text-blue-500 hover:underline"
        // 주소를 그대로 쓰면 표가 옆으로 늘어난다. 칸에는 `열기` 만 두고 주소는 툴팁으로
        // 보여 준다. 전체 주소는 CSV 에 그대로 들어간다.
        title={row.link}
      >
        열기
      </a>
    );
  }
  if (key === 'survey') {
    return <span className="block max-w-xs whitespace-pre-line">{row.survey}</span>;
  }
  return String(row[key] ?? '');
}
