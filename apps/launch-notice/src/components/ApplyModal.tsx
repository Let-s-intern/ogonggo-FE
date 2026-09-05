'use client';

import { useRef, useState } from 'react';
import { ApplyForm } from './ApplyForm';

/**
 * 화면 오른쪽 아래에 붙어 다니는 신청 버튼과, 그것이 여는 모달.
 *
 * **첫 화면부터 계속 보인다**(2026-09-05 결정). 처음에는 조금 내려가야 나타나게 두었는데 —
 * 상단 버튼과 겹치고 읽기도 전에 신청부터 들이미는 꼴이라고 봤다 — 3주짜리 캠페인이라
 * 신청 자리가 눈에서 사라지지 않는 편이 낫다. 상단 버튼은 `#apply` 로 내려가고 이쪽은
 * 모달을 열어, 어디에 있든 한 번에 폼에 닿는다.
 *
 * `<dialog>` 를 쓴다. `showModal()` 하나로 포커스 가두기·`Esc` 로 닫기·배경 비활성화·
 * `::backdrop` 이 전부 따라온다. 이걸 라이브러리로 가져오면 3주 뒤 지울 앱에 의존성이 하나
 * 느는데, 브라우저가 이미 해 주는 일이다.
 */
export function ApplyModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // 접수가 끝나면 머리글을 내린다. `1분이면 끝납니다` 가 완료 화면 위에 남으면 아직 할 일이
  // 있는 것처럼 읽힌다.
  const [done, setDone] = useState(false);

  return (
    <>
      <button type="button" className="floating" onClick={() => dialogRef.current?.showModal()}>
        <span className="floating-text">
          <span className="floating-main">무료 홍보 신청하기</span>
          {/* 왜 지금 눌러야 하는지 한 줄. 버튼 하나만 떠 있으면 배너처럼 읽고 지나친다. */}
          <span className="floating-sub">1분이면 끝나요</span>
        </span>
        {/* 화살표가 있어야 눌러서 어디론가 간다는 것이 읽힌다. 장식이라 스크린 리더는 건너뛴다. */}
        <svg className="floating-arrow" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M7 4l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        className="applydialog"
        // 배경(`::backdrop`)을 누르면 닫는다. `<dialog>` 는 배경 클릭을 스스로 처리하지
        // 않는데, 그 클릭의 `target` 은 항상 `dialog` 자신이라 이걸로 안팎을 가른다.
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            dialogRef.current?.close();
          }
        }}
      >
        <div className="applydialog-inner">
          <button
            type="button"
            className="applydialog-close"
            aria-label="닫기"
            onClick={() => dialogRef.current?.close()}
          >
            ×
          </button>
          {done ? null : (
            <>
              <h2 className="applydialog-title">출시 알림 신청</h2>
              <p className="applydialog-note">
                1분이면 끝납니다. 런칭 전에 담당자가 직접 연락드립니다.
              </p>
            </>
          )}
          <ApplyForm onDone={() => setDone(true)} />
        </div>
      </dialog>
    </>
  );
}
