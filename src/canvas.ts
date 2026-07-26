/**
 * Canvas 渲染 — 地图、遮罩、预览层
 */

import state from './state';
import { t } from './i18n';

// ===== DOM 引用 =====
export const mapCanvas = document.getElementById('mapCanvas') as HTMLCanvasElement;
export const maskCanvas = document.getElementById('maskCanvas') as HTMLCanvasElement;
export const previewCanvas = document.getElementById('previewCanvas') as HTMLCanvasElement;
export const mapCtx = mapCanvas.getContext('2d')!;
export const maskCtx = maskCanvas.getContext('2d')!;
export const prevCtx = previewCanvas.getContext('2d')!;

// ===== 渲染 =====

export function redrawMap(): void {
  const pgm = state.pgm;
  if (!pgm) return;
  const { width: w, height: h, pixels, maxval } = pgm;
  if (!w || !h || !maxval) return;

  let pmin = 65535, pmax = 0;
  if ($('#autoLevels').prop('checked')) {
    for (let i = 0; i < w * h; i++) {
      const v = pixels[i];
      if (v < pmin) pmin = v;
      if (v > pmax) pmax = v;
    }
    if (pmax === pmin) { pmin = 0; pmax = maxval; }
  } else {
    pmin = 0;
    pmax = maxval;
  }

  const inv = $('#invertDisplay').prop('checked') || (state.yamlObj && Number(state.yamlObj.negate) === 1);
  const img = mapCtx.createImageData(w, h);
  const sc = (pmax > pmin) ? (255 / (pmax - pmin)) : 1;

  for (let i = 0; i < w * h; i++) {
    let g = Math.round((pixels[i] - pmin) * sc);
    if (g < 0) g = 0;
    else if (g > 255) g = 255;
    if (inv) g = 255 - g;
    img.data[4 * i + 0] = g;
    img.data[4 * i + 1] = g;
    img.data[4 * i + 2] = g;
    img.data[4 * i + 3] = 255;
  }
  const tmp = document.createElement('canvas');
  tmp.width = w;
  tmp.height = h;
  tmp.getContext('2d')!.putImageData(img, 0, 0);
  mapCtx.imageSmoothingEnabled = false;
  mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
  mapCtx.drawImage(tmp, 0, 0, mapCanvas.width, mapCanvas.height);
}

export function redrawMask(): void {
  const pgm = state.pgm;
  const mask = state.mask;
  if (!pgm || !mask) return;
  const { width: w, height: h } = pgm;
  const img = maskCtx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    const m = mask[i];      // 0..255
    const isKO = (m <= 20);
    img.data[4 * i + 0] = isKO ? 255 : 0;
    img.data[4 * i + 1] = 0;
    img.data[4 * i + 2] = 0;
    img.data[4 * i + 3] = isKO ? 120 : 0;
  }
  const tmp = document.createElement('canvas');
  tmp.width = w;
  tmp.height = h;
  tmp.getContext('2d')!.putImageData(img, 0, 0);
  maskCtx.imageSmoothingEnabled = false;
  maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
  maskCtx.drawImage(tmp, 0, 0, maskCanvas.width, maskCanvas.height);
}

export function clearPreview(): void {
  prevCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  state.lastPreviewX = null;
  state.lastPreviewY = null;
}

/** 在预览画布上绘制测量标签 */
export function drawLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string
): void {
  ctx.save();
  ctx.font = Math.max(12, Math.round(12 * state.zoom)) + 'px Arial';
  ctx.textBaseline = 'bottom';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.fillStyle = 'white';
  ctx.strokeText(text, x + 6, y - 6);
  ctx.fillText(text, x + 6, y - 6);
  ctx.restore();
}

/** 更新调试信息面板 */
export function updateDebug(): void {
  const pgm = state.pgm;
  if (!pgm) {
    $('#dbgInfo').text('\u2014');
    return;
  }
  const keep = state.maskName || t('noKeepoutStatus');
  const neg = (state.yamlObj && state.yamlObj.negate != null) ? state.yamlObj.negate : t('na');
  $('#dbgInfo').text(
    t('debugInfo', { w: pgm.width, h: pgm.height, maxval: pgm.maxval, magic: pgm.magic, neg: String(neg), keep })
  );
}
