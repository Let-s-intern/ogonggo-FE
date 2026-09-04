'use client';

import { useEffect, useRef, useState } from 'react';
import { ApplyForm } from './ApplyForm';

/**
 * 화면 오른쪽 아래에 붙어 다니는 신청 버튼과, 그것이 여는 모달.
 *
 * 페이지 아래쪽 `#apply` 섹션까지 내려가지 않은 사람을 위한 자리다. 그래서 **첫 화면에서는
 * 뜨지 않는다** — 히어로에 이미 상단 `출시 알림 신청` 버튼이 있어서 겹치고, 아직 아무것도 읽지
 * 않은 사람에게 신청부터 들이미는 꼴이 된다. 조금 내려가면 나타난다.
 *
 * `<dialog>` 를 쓴다. `showModal()` 하나로 포커스 가두기·`Esc` 로 닫기·배경 비활성화·
 * `::backdrop` 이 전부 따라온다. 이걸 라이브러리로 가져오면 3주 뒤 지울 앱에 의존성이 하나
 * 느는데, 브라우저가 이미 해 주는 일이다.
 */
export function ApplyModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 한 화면 높이만큼 내려가면 버튼을 띄운다.
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <button
        type="button"
        className="floating"
        data-visible={visible}
        // 버튼이 숨어 있을 때는 탭 순서에서도 빠져야 한다. 보이지 않는 버튼에 포커스가
        // 가면 키보드 사용자는 아무 데도 없는 곳에 도착한다.
        tabIndex={visible ? 0 : -1}
        aria-hidden={!visible}
        onClick={() => dialogRef.current?.showModal()}
      >
        출시 알림 신청
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
          <h2 className="applydialog-title">출시 알림 신청</h2>
          <p className="applydialog-note">
            1분이면 끝납니다. 런칭 전에 담당자가 직접 연락드립니다.
          </p>
          <ApplyForm />
        </div>
      </dialog>
    </>
  );
}
