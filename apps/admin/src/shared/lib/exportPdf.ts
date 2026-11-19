/**
 * 통계 화면을 A4 가로 PDF 로 내려받는다. 서버 없이 브라우저에서 화면을 그림으로 떠서 페이지로 나눈다.
 *
 * 그림으로 뜨는 이유: jsPDF 로 글자를 직접 쓰려면 한글 글꼴 파일을 PDF 에 넣어야 하고, 차트도 다시
 * 그려야 한다. 화면을 그대로 뜨면 보이는 그대로 나온다. 대신 PDF 안의 글자는 선택·검색되지 않는다.
 *
 * - `data-pdf-block` 이 붙은 요소(카드, 타일 줄)의 아래 끝에서만 페이지를 나눈다. 아무 데서나 자르면
 *   차트가 두 페이지에 걸쳐 반씩 나온다.
 * - `data-pdf-hide` 가 붙은 요소(차트·표 전환, 버튼)는 뜨지 않는다.
 * - 안에서 스크롤하는 긴 표는 화면에 보이는 행까지만 나온다.
 *
 * 두 라이브러리는 버튼을 누를 때 불러온다. 통계 화면을 여는 것만으로 번들이 커지지 않게 한다.
 */

const PAGE_MARGIN_PT = 24;
/** 화면 해상도의 몇 배로 뜰지. 1 이면 PDF 를 확대했을 때 글자가 뭉개진다. */
const PIXEL_RATIO = 2;
/** 나눌 자리가 이보다 위에 있으면 쓰지 않고 그냥 자른다. 한 페이지가 거의 빈 채로 넘어가는 것을 막는다. */
const MIN_PAGE_FILL = 0.4;

export async function exportStatsPdf(root: HTMLElement, fileName: string): Promise<void> {
  const [{ toCanvas }, { jsPDF }] = await Promise.all([import('html-to-image'), import('jspdf')]);

  const rootTop = root.getBoundingClientRect().top;
  const blockBottoms = [...root.querySelectorAll<HTMLElement>('[data-pdf-block]')].map(
    (element) => element.getBoundingClientRect().bottom - rootTop,
  );

  const canvas = await toCanvas(root, {
    pixelRatio: PIXEL_RATIO,
    backgroundColor: '#f9fafb',
    filter: (node) => !(node instanceof HTMLElement && node.dataset.pdfHide !== undefined),
  });
  // 화면 1px 이 그림에서 몇 px 인지. 나눌 자리를 그림 좌표로 옮길 때 쓴다.
  const scale = canvas.width / root.offsetWidth;
  // 나눌 자리 사이 여백(카드 사이 gap)의 중간에서 자르도록 조금 내린다.
  const breaks = blockBottoms.map((bottom) => (bottom + 8) * scale).sort((a, b) => a - b);

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const contentWidth = pdf.internal.pageSize.getWidth() - PAGE_MARGIN_PT * 2;
  const contentHeight = pdf.internal.pageSize.getHeight() - PAGE_MARGIN_PT * 2;
  const pagePx = (contentHeight / contentWidth) * canvas.width;

  let top = 0;
  while (top < canvas.height - 1) {
    let bottom = Math.min(top + pagePx, canvas.height);
    if (bottom < canvas.height) {
      const fit = breaks.filter((point) => point > top + pagePx * MIN_PAGE_FILL && point <= bottom);
      bottom = fit.at(-1) ?? bottom;
    }

    const slice = document.createElement('canvas');
    slice.width = canvas.width;
    slice.height = Math.ceil(bottom - top);
    slice.getContext('2d')?.drawImage(canvas, 0, -top);

    if (top > 0) {
      pdf.addPage();
    }
    pdf.addImage(
      slice.toDataURL('image/jpeg', 0.92),
      'JPEG',
      PAGE_MARGIN_PT,
      PAGE_MARGIN_PT,
      contentWidth,
      (slice.height / canvas.width) * contentWidth,
    );
    top = bottom;
  }

  pdf.save(fileName);
}
