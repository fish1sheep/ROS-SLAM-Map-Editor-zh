/**
 * 绘制工具 — 笔刷、直线、矩形、填充 + 撤销/重做
 */

import state, { MAX_UNDO, getUnknownVal } from './state';
import { redrawMap, redrawMask } from './canvas';
import type { LayerName, Stroke } from './types';

/** Canvas 坐标 → 地图像素坐标 */
export function canvasToMap(cx: number, cy: number): [number, number] {
  return [Math.floor(cx / state.zoom), Math.floor(cy / state.zoom)];
}

// ===== 笔划管理 =====

export function beginStroke(): void {
  state.currentStroke = [];
  state.touchedIndices = new Set();
}

export function finishStroke(): void {
  if (state.currentStroke && state.currentStroke.length) {
    state.undoStack.push(state.currentStroke);
    if (state.undoStack.length > MAX_UNDO) state.undoStack.shift();
    // 新操作作废旧重做记录
    state.redoStack.length = 0;
  }
  state.currentStroke = null;
  state.touchedIndices = null;
}

// ===== 撤销/重做 =====

export function undo(): void {
  const changeSet = state.undoStack.pop();
  if (!changeSet) return;

  // 反向还原并准备重做记录
  const redoSet: Stroke = [];
  for (const ch of changeSet) {
    const buf = (ch.layer === 'pgm') ? state.pgm!.pixels : state.mask;
    if (!buf) continue; // 跳过未加载的遮罩
    buf[ch.idx] = ch.prev;
    redoSet.push({ layer: ch.layer, idx: ch.idx, prev: ch.prev, next: ch.next });
  }
  state.redoStack.push(redoSet);

  redrawMap();
  redrawMask();
}

export function redo(): void {
  const changeSet = state.redoStack.pop();
  if (!changeSet) return;

  // 重新应用并准备撤销记录
  const undoSet: Stroke = [];
  for (const ch of changeSet) {
    const buf = (ch.layer === 'pgm') ? state.pgm!.pixels : state.mask;
    if (!buf) continue;
    buf[ch.idx] = ch.next;
    undoSet.push({ layer: ch.layer, idx: ch.idx, prev: ch.prev, next: ch.next });
  }
  state.undoStack.push(undoSet);

  redrawMap();
  redrawMask();
}

// ===== 底层像素操作 =====

function paintBuffer(
  layerName: LayerName,
  buf: Uint8Array | Uint16Array,
  w: number,
  h: number,
  mx: number,
  my: number,
  rad: number,
  value: number
): void {
  for (let y = my - rad; y <= my + rad; y++) {
    if (y < 0 || y >= h) continue;
    for (let x = mx - rad; x <= mx + rad; x++) {
      if (x < 0 || x >= w) continue;
      const dx = x - mx, dy = y - my;
      if (dx * dx + dy * dy <= rad * rad) {
        const idx = y * w + x;
        if (state.touchedIndices && !state.touchedIndices.has(idx)) {
          state.currentStroke && state.currentStroke.push({
            layer: layerName, idx, prev: buf[idx], next: value,
          });
          state.touchedIndices && state.touchedIndices.add(idx);
        }
        buf[idx] = value;
      }
    }
  }
}

/** 在指定 canvas 坐标处绘制 */
export function paintAt(cx: number, cy: number): void {
  const pgm = state.pgm;
  if (!pgm) return;
  // 使用遮罩工具但未加载遮罩
  if ((state.tool === 'mask' || state.tool === 'erase') && !state.mask) return;

  const [mx, my] = canvasToMap(cx, cy);
  const rad = Math.max(1, Math.floor(state.brush / 2));
  const w = pgm.width, h = pgm.height, maxval = pgm.maxval;

  if (state.tool === 'mask') {
    paintBuffer('mask', state.mask!, w, h, mx, my, rad, 0);
    redrawMask();
  } else if (state.tool === 'paint') {
    paintBuffer('pgm', pgm.pixels, w, h, mx, my, rad, 0);
    redrawMap();
  } else if (state.tool === 'erase') {
    paintBuffer('pgm', pgm.pixels, w, h, mx, my, rad, maxval);
    paintBuffer('mask', state.mask!, w, h, mx, my, rad, 255);
    redrawMap();
    redrawMask();
  } else if (state.tool === 'unscan') {
    paintBuffer('pgm', pgm.pixels, w, h, mx, my, rad, getUnknownVal(maxval));
    redrawMap();
  }
}

// ===== 直线绘制 (Bresenham + 圆形笔刷) =====

export function drawThickLine(cx1: number, cy1: number, cx2: number, cy2: number): void {
  let [x0, y0] = canvasToMap(cx1, cy1);
  let [x1, y1] = canvasToMap(cx2, cy2);
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  const pgm = state.pgm!;
  const w = pgm.width, h = pgm.height, maxval = pgm.maxval;
  const rad = Math.max(1, Math.floor(state.brush / 2));
  const unknown = getUnknownVal(maxval);
  const mask = state.mask;

  const drawPoint = (mx: number, my: number): void => {
    if (state.tool === 'paint') {
      paintBuffer('pgm', pgm.pixels, w, h, mx, my, rad, 0);
    } else if (state.tool === 'mask') {
      if (mask) paintBuffer('mask', mask, w, h, mx, my, rad, 0);
    } else if (state.tool === 'erase') {
      paintBuffer('pgm', pgm.pixels, w, h, mx, my, rad, maxval);
      if (mask) paintBuffer('mask', mask, w, h, mx, my, rad, 255);
    } else if (state.tool === 'unscan') {
      paintBuffer('pgm', pgm.pixels, w, h, mx, my, rad, unknown);
    }
  };

  while (true) {
    drawPoint(x0, y0);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
  redrawMap();
  redrawMask();
}

// ===== 矩形绘制 =====

/** 空心矩形 */
export function drawThickRect(cx1: number, cy1: number, cx2: number, cy2: number): void {
  const x1 = Math.min(cx1, cx2), y1 = Math.min(cy1, cy2);
  const x2 = Math.max(cx1, cx2), y2 = Math.max(cy1, cy2);
  drawThickLine(x1, y1, x2, y1); // top
  drawThickLine(x2, y1, x2, y2); // right
  drawThickLine(x2, y2, x1, y2); // bottom
  drawThickLine(x1, y2, x1, y1); // left
}

/** 单个像素设置（带撤销记录） */
function setPixelWithUndo(layerName: LayerName, buf: Uint8Array | Uint16Array, idx: number, value: number): void {
  if (state.touchedIndices && !state.touchedIndices.has(idx)) {
    state.currentStroke && state.currentStroke.push({ layer: layerName, idx, prev: buf[idx], next: value });
    state.touchedIndices.add(idx);
  }
  buf[idx] = value;
}

/** 填充矩形 */
export function drawFilledRect(cx1: number, cy1: number, cx2: number, cy2: number): void {
  const x1 = Math.min(cx1, cx2), y1 = Math.min(cy1, cy2);
  const x2 = Math.max(cx1, cx2), y2 = Math.max(cy1, cy2);

  // 先画边框
  drawThickRect(x1, y1, x2, y2);

  // 内部填充
  const [mx1, my1] = canvasToMap(x1, y1);
  const [mx2, my2] = canvasToMap(x2, y2);
  const xMin = Math.max(0, Math.min(mx1, mx2));
  const yMin = Math.max(0, Math.min(my1, my2));
  const pgm = state.pgm!;
  const xMax = Math.min(pgm.width - 1, Math.max(mx1, mx2));
  const yMax = Math.min(pgm.height - 1, Math.max(my1, my2));

  const w = pgm.width, maxval = pgm.maxval;
  const unknown = getUnknownVal(maxval);

  const mapVal = (state.tool === 'paint') ? 0
    : (state.tool === 'erase' ? maxval
      : (state.tool === 'unscan' ? unknown : null));
  const maskVal = (state.tool === 'mask') ? 0
    : (state.tool === 'erase' ? 255 : null);

  for (let y = yMin; y <= yMax; y++) {
    const rowBase = y * w;
    for (let x = xMin; x <= xMax; x++) {
      const idx = rowBase + x;
      if (mapVal !== null) setPixelWithUndo('pgm', pgm.pixels, idx, mapVal);
      if (maskVal !== null && state.mask) setPixelWithUndo('mask', state.mask, idx, maskVal);
    }
  }

  redrawMap();
  redrawMask();
}
