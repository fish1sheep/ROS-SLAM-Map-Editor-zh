/**
 * 工具栏 — 缩放、平移、笔刷光标、预览绘制
 */

import state, { ZMIN, ZMAX, ZSTEP } from './state';
import {
  mapCanvas, maskCanvas, previewCanvas,
  mapCtx, maskCtx, prevCtx,
  redrawMap, redrawMask, clearPreview, drawLabel,
} from './canvas';

import { canvasToMap, beginStroke, finishStroke, paintAt, drawThickLine, drawThickRect, drawFilledRect } from './drawing';
import { t } from './i18n';

// DOM 引用
export const brushCursor = document.getElementById('brushCursor') as HTMLElement;
export const viewport = document.getElementById('viewport') as HTMLElement;

// ===== 缩放 =====

export function setZoom(z: number): void {
  const pgm = state.pgm;
  if (!pgm) return;
  state.zoom = z;
  const w = Math.round(pgm.width * z);
  const h = Math.round(pgm.height * z);
  [mapCanvas, maskCanvas, previewCanvas].forEach(cv => {
    cv.width = w;
    cv.height = h;
  });
  redrawMap();
  redrawMask();
  clearPreview();
  updateBrushCursorSize();
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Shift+滚轮缩放：保持光标位置 */
export function zoomAtClient(clientX: number, clientY: number, factor: number): void {
  const pgm = state.pgm;
  if (!pgm) return;

  const vpRect = viewport.getBoundingClientRect();
  const vx = clientX - vpRect.left;
  const vy = clientY - vpRect.top;

  const cxBefore = viewport.scrollLeft + vx;
  const cyBefore = viewport.scrollTop + vy;
  const mx = cxBefore / state.zoom;
  const my = cyBefore / state.zoom;

  const newZoom = clamp(state.zoom * factor, ZMIN, ZMAX);
  if (newZoom === state.zoom) return;
  setZoom(newZoom);

  const cxAfter = mx * state.zoom;
  const cyAfter = my * state.zoom;
  viewport.scrollLeft = Math.round(cxAfter - vx);
  viewport.scrollTop = Math.round(cyAfter - vy);
}

// ===== 笔刷光标 =====

export function updateBrushCursorSize(): void {
  const d = Math.max(1, Math.round(state.brush * state.zoom));
  brushCursor.style.width = d + 'px';
  brushCursor.style.height = d + 'px';
}

export function moveBrushCursor(evt: MouseEvent | TouchEvent): void {
  const rect = mapCanvas.getBoundingClientRect();
  const client = (evt as TouchEvent).touches
    ? (evt as TouchEvent).touches[0]
    : (evt as MouseEvent);
  const x = client.clientX - rect.left;
  const y = client.clientY - rect.top;
  const d = Math.max(1, Math.round(state.brush * state.zoom));
  brushCursor.style.left = Math.round(x - d / 2) + 'px';
  brushCursor.style.top = Math.round(y - d / 2) + 'px';
}

// ===== 预览绘制 (直线/矩形/测量) =====

export function drawPreview(cx1: number, cy1: number, cx2: number, cy2: number): void {
  clearPreview();
  state.lastPreviewX = cx2;
  state.lastPreviewY = cy2;

  prevCtx.save();
  prevCtx.lineWidth = Math.max(1, Math.round(state.brush * state.zoom));
  prevCtx.lineCap = 'round';

  if (state.shape === 'line') {
    prevCtx.strokeStyle =
      (state.tool === 'mask') ? 'rgba(255,0,0,0.7)' :
      (state.tool === 'erase') ? 'rgba(255,255,255,0.85)' :
      (state.tool === 'unscan') ? 'rgba(205,205,205,0.9)' :
      'rgba(0,0,0,0.85)';
    prevCtx.beginPath();
    prevCtx.moveTo(cx1, cy1);
    prevCtx.lineTo(cx2, cy2);
    prevCtx.stroke();
  } else if (state.shape === 'rect') {
    prevCtx.strokeStyle =
      (state.tool === 'mask') ? 'rgba(255,0,0,0.7)' :
      (state.tool === 'erase') ? 'rgba(255,255,255,0.85)' :
      (state.tool === 'unscan') ? 'rgba(205,205,205,0.9)' :
      'rgba(0,0,0,0.85)';
    const x = Math.min(cx1, cx2), y = Math.min(cy1, cy2);
    const w = Math.abs(cx2 - cx1), h = Math.abs(cy2 - cy1);
    if (state.filledRect) {
      prevCtx.fillStyle =
        (state.tool === 'mask') ? 'rgba(255,0,0,0.25)' :
        (state.tool === 'erase') ? 'rgba(255,255,255,0.25)' :
        (state.tool === 'unscan') ? 'rgba(205,205,205,0.25)' :
        'rgba(0,0,0,0.25)';
      prevCtx.fillRect(x, y, w, h);
    }
    prevCtx.strokeRect(x, y, w, h);
  } else if (state.shape === 'measure') {
    const lw = Math.max(1, Math.round(2 * state.zoom));
    prevCtx.lineWidth = lw;
    prevCtx.strokeStyle = 'rgba(0,150,255,0.9)';
    prevCtx.beginPath();
    prevCtx.moveTo(cx1, cy1);
    prevCtx.lineTo(cx2, cy2);
    prevCtx.stroke();
    const [mx1, my1] = canvasToMap(cx1, cy1);
    const [mx2, my2] = canvasToMap(cx2, cy2);
    const dx = mx2 - mx1, dy = my2 - my1;
    const pixDist = Math.sqrt(dx * dx + dy * dy);
      const res = (state.yamlObj && typeof state.yamlObj.resolution === 'number')
        ? state.yamlObj.resolution : null;
      if (res !== null) {
        const meters = pixDist * res;
        const feet = meters * 3.28084;
        const txt = t('measurement', { meters: +meters.toFixed(3), feet: +feet.toFixed(2) });
        drawLabel(prevCtx, cx2, cy2, txt);
      } else {
        drawLabel(prevCtx, cx2, cy2, pixDist + ' px');
      }
  }

  prevCtx.restore();
}

// ===== 绘制生命周期 =====

export function startDrawing(cx: number, cy: number): void {
  if (!state.pgm) return;
  if (state.shape === 'freehand') {
    state.drawing = true;
    beginStroke();
    paintAt(cx, cy);
  } else if (state.shape === 'line' || state.shape === 'rect' || state.shape === 'measure') {
    state.previewing = true;
    state.sx = cx;
    state.sy = cy;
    clearPreview();
    drawPreview(state.sx, state.sy, cx, cy);
  }
}

export function endDrawing(e?: MouseEvent | TouchEvent): void {
  if (state.shape === 'freehand') {
    if (!state.drawing) return;
    state.drawing = false;
    finishStroke();
  } else if (state.previewing) {
    state.previewing = false;
    const rect = mapCanvas.getBoundingClientRect();
    let ex: number, ey: number;
    if (e && 'clientX' in e && typeof e.clientX === 'number') {
      ex = e.clientX - rect.left;
      ey = e.clientY - rect.top;
    } else {
      ex = state.lastPreviewX ?? state.sx;
      ey = state.lastPreviewY ?? state.sy;
    }

    if (state.shape === 'measure') {
      if (state.measureTimeout) clearTimeout(state.measureTimeout);
      state.measureTimeout = setTimeout(() => {
        clearPreview();
        state.measureTimeout = null;
      }, 5000);
      return; // 测量不修改像素
    }
    clearPreview();
    beginStroke();
    if (state.shape === 'line') {
      drawThickLine(state.sx, state.sy, ex, ey);
    } else if (state.shape === 'rect') {
      if (state.filledRect) {
        drawFilledRect(state.sx, state.sy, ex, ey);
      } else {
        drawThickRect(state.sx, state.sy, ex, ey);
      }
    }
    finishStroke();
  }
}
