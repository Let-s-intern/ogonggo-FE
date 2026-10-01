/**
 * 올린 이미지를 긴 변 `maxEdge` 로 줄여 data URL 로. 렌더 요청 본문에 그대로 실리므로 원본을
 * 보내면 요청이 무거워진다(Vercel 함수 본문 한도 4.5MB). 투명도가 있을 수 있어 PNG 로 둔다.
 */
export async function fileToDataUrl(file: File, maxEdge = 1080): Promise<string> {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  if (file.type === 'image/svg+xml') {
    return source;
  }
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = reject;
    element.src = source;
  });
  const ratio = Math.min(1, maxEdge / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * ratio);
  canvas.height = Math.round(image.height * ratio);
  canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}
