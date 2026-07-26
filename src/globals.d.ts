/**
 * 全局类型声明 — CDN 加载的库
 */

/** js-yaml (CDN) */
declare var jsyaml: {
  load(txt: string): unknown;
  dump(obj: unknown): string;
};

/** jQuery (CDN) — 通过 @types/jquery 提供完整类型 */
