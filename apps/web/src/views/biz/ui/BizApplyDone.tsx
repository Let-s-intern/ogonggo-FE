/**
 * 접수 완료 화면(시안 `biz-mock/done.html`). 폼 자리를 대신한다.
 */
export function BizApplyDone({ email }: { email: string }) {
  return (
    <div
      role="status"
      className="rounded-3xl bg-white px-6 py-10 text-center shadow-[0_1px_0_rgba(17,24,39,0.04),0_0_0_1px_var(--color-gray-150)] md:px-12 md:py-12"
    >
      <h3 className="text-2xl leading-[1.35] font-extrabold tracking-[-0.03em] text-gray-900 md:text-[28px]">
        무료 홍보 신청이 접수되었습니다
      </h3>
      <p className="mt-3 text-base leading-relaxed text-gray-500">
        2일 안에 담당자가 일정을 안내드립니다.
        <br />
        접수 확인 메일을 {email} 으로 보냈어요.
      </p>
    </div>
  );
}
