/** 设计稿 px 转 vw（基于 viewportWidth: 750）。
 * 用于 JS 动画等 PostCSS 无法处理的场景。
 * CSS 中的 px 由 postcss-mobile-forever 自动转换，无需此函数。 */
export function vw(px: number): string {
  return `${(px / 750) * 100}vw`;
}
