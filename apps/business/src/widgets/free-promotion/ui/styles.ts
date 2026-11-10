/** 광고 안내(`widgets/landing`)와 같은 폭·버튼·움직임. 출시 기념 무료 홍보가 다른 화면과 같아 보이게 맞춘다(2026-11-10 사용자). */
export const CONTAINER = 'page-container mx-auto w-full max-w-[1200px] px-4 md:px-6';
export const PRIMARY_BUTTON =
  'inline-flex items-center justify-center rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition-[background-color,translate,box-shadow] hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/25';
export const OUTLINE_BUTTON =
  'inline-flex items-center justify-center rounded-full border border-blue-500 bg-white px-6 py-3 text-sm font-semibold text-blue-500 transition-[background-color,translate] hover:-translate-y-0.5 hover:bg-blue-00';
/** 카드에 마우스를 올리면 살짝 뜬다. */
export const LIFT =
  'transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lg';
