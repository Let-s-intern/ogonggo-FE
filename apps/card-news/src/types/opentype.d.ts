/** satori 가 쓰는 opentype.js 포크. 글자 폭을 재는 데 쓰는 부분만 적는다. */
declare module '@shuding/opentype.js' {
  export interface Font {
    charToGlyphIndex(char: string): number;
    getAdvanceWidth(text: string, fontSize: number, options?: { kerning?: boolean }): number;
  }
  export function parse(buffer: ArrayBuffer): Font;
}
