'use client';

import { useState } from 'react';
import {
  COLUMNS,
  fetchApplications,
  formatCreated,
  login,
  POCKETBASE_URL,
  toCsv,
  type Application,
} from '@/lib/admin-api';
import './admin.css';

/**
 * 신청 목록 화면(`/admin`). 표로 보고 CSV 로 내보낸다.
 *
 * 이 앱 안에 둔다(2026-09-05 결정). 서비스 공용 어드민(`apps/admin`)에 넣었다가 옮겼다 —
 * 런칭 뒤 이 폴더를 통째로 지우면 끝나야 하는데, 공용 어드민에 두면 지울 때 그쪽도 손봐야
 * 한다. 지금은 `apps/admin` 이 이 앱을 전혀 모른다.
 *
 * 로그인을 여기서 받는 이유는 신청에 이름·이메일·연락처가 들어가기 때문이다. 서버가 가진
 * 슈퍼유저 비밀번호를 그대로 쓰면 이 주소를 아는 누구나 신청자 전원을 보게 되므로, 사람이
 * 직접 로그인한다. 토큰은 메모리에만 둔다 — `localStorage` 에 두면 이 화면을 연 적 있는
 * 브라우저에 계속 남는다.
 *
 * 검색 엔진에는 노출되지 않는다. `app/layout.tsx` 가 사이트 전체에 `noindex` 를 걸어 둔다.
 */
export default function AdminPage() {
  const [token, setToken] = useState<string>();
  const [rows, setRows] = useState<Application[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

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

  if (!POCKETBASE_URL) {
    return (
      <div className="admincard">
        <h1>설정이 필요합니다</h1>
        <p>
          <code>NEXT_PUBLIC_POCKETBASE_URL</code> 이 없습니다. 배포 환경변수를 확인해주세요.
        </p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="admincard">
        <h1>출시알림 신청</h1>
        <p>신청자 개인정보가 들어 있어 로그인해야 볼 수 있습니다.</p>
        <form onSubmit={handleLogin}>
          <input name="email" type="email" placeholder="포켓베이스 관리자 이메일" required />
          <input name="password" type="password" placeholder="비밀번호" required />
          <button type="submit" className="adminbtn primary" disabled={busy}>
            {busy ? '확인 중…' : '로그인'}
          </button>
        </form>
        {error ? <p className="adminerr">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="adminwrap">
      <div className="adminhead">
        <div>
          <h1>출시알림 신청</h1>
          <p className="count">{rows.length}건</p>
        </div>
        <div className="adminactions">
          <button type="button" className="adminbtn" onClick={refresh} disabled={busy}>
            {busy ? '불러오는 중…' : '새로고침'}
          </button>
          <button
            type="button"
            className="adminbtn primary"
            onClick={downloadCsv}
            disabled={rows.length === 0}
          >
            CSV 내보내기
          </button>
        </div>
      </div>

      {error ? <p className="adminerr">{error}</p> : null}

      {rows.length === 0 ? (
        <p className="adminempty">아직 신청이 없습니다.</p>
      ) : (
        <div className="admintablewrap">
          <table className="admintable">
            <thead>
              <tr>
                {COLUMNS.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {COLUMNS.map((column) => (
                    <td key={column.key} className={column.key === 'survey' ? 'survey' : ''}>
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
 * 칸 하나를 그린다. 셋만 그대로 두지 않는다 — 시각은 짧게, 참/거짓은 Y/N, 링크는 주소 대신
 * `열기` 로. 주소를 그대로 쓰면 표가 옆으로 늘어나서 전체 주소는 툴팁과 CSV 에만 둔다.
 */
function renderCell(row: Application, key: keyof Application) {
  if (key === 'created') {
    return formatCreated(row.created);
  }
  if (key === 'marketing') {
    return row.marketing ? 'Y' : 'N';
  }
  if (key === 'link' && row.link) {
    return (
      <a href={row.link} target="_blank" rel="noopener" title={row.link}>
        열기
      </a>
    );
  }
  return String(row[key] ?? '');
}
