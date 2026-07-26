/**
 * 主入口 — 初始化 UI 事件并绑定所有模块
 *
 * 外部依赖（CDN 加载）：
 *   - jQuery 3.x
 *   - Bootstrap 4.x JS
 *   - js-yaml 4.x
 */

// i18n（副作用导入，自动初始化）
import './i18n';

import state, { ZMIN, ZMAX, ZSTEP } from './state';
import type { Tool, Shape } from './types';

import { undo, redo, paintAt } from './drawing';
import {
  viewport,
  brushCursor,
  setZoom,
  zoomAtClient,
  updateBrushCursorSize,
  moveBrushCursor,
  startDrawing,
  endDrawing,
  drawPreview,
} from './tools';
import { mapCanvas, redrawMap, redrawMask, clearPreview, updateDebug } from './canvas';
import {
  handleFiles,
  downloadMap,
  downloadMask,
  updateStatusLabels,
  updateBrushLabel,
} from './file-io';

// ========== UI 处理函数 ==========

// 工具选择
$('.tool-btn').on('click', function (this: HTMLElement) {
  $('.tool-btn').removeClass('active');
  $(this).addClass('active');
  state.tool = $(this).data('tool') as Tool;
});
$('.tool-btn[data-tool="paint"]').addClass('active');

// 形状选择
$('.shape-btn').on('click', function (this: HTMLElement) {
  $('.shape-btn').removeClass('active');
  $(this).addClass('active');
  state.shape = $(this).data('shape') as Shape;
  clearPreview();
});
$('.shape-btn[data-shape="freehand"]').addClass('active');

// 笔刷大小
$('#brushSize').on('input change', function (this: HTMLInputElement) {
  state.brush = parseInt(this.value, 10);
  updateBrushLabel();
  updateBrushCursorSize();
});

// 显示/隐藏遮罩
$('#showMask').on('change', function (this: HTMLInputElement) {
  const mc = document.getElementById('maskCanvas') as HTMLCanvasElement;
  mc.style.display = this.checked ? 'block' : 'none';
  redrawMask();
});

// 反色 / 自动色阶
$('#invertDisplay, #autoLevels').on('change', () => {
  redrawMap();
});

// 填充矩形
$('#filledRect').on('change', function (this: HTMLInputElement) {
  state.filledRect = this.checked;
  clearPreview();
});
$('#filledRect').prop('checked', false);

// 文件加载按钮
$('#btnLoadYaml').on('click', () => $('#yamlInput').trigger('click'));
$('#btnLoadPgm').on('click', () => $('#pgmInput').trigger('click'));
$('#yamlInput').on('change', function (this: HTMLInputElement) {
  if (this.files) handleFiles(this.files);
});
$('#pgmInput').on('change', function (this: HTMLInputElement) {
  if (this.files) handleFiles(this.files);
});

// 缩放控件
$('#zoomIn').on('click', () => setZoom(Math.min(ZMAX, state.zoom * ZSTEP)));
$('#zoomOut').on('click', () => setZoom(Math.max(ZMIN, state.zoom / ZSTEP)));
$('#zoomReset').on('click', () => setZoom(1));

// 撤销/重做
$('#btnUndo').on('click', undo);
$('#btnRedo').on('click', redo);

// 下载按钮
$('#btnDownloadMap').on('click', downloadMap);
$('#btnDownloadMask').on('click', downloadMask);

// ========== 键盘快捷键 ==========

window.addEventListener('keydown', (e) => {
  if (e.target && /input|textarea|select/i.test((e.target as HTMLElement).tagName)) return;

  if (e.code === 'Space') {
    if (!state.isSpace) {
      e.preventDefault();
      state.isSpace = true;
      viewport.classList.add('panning');
    }
  } else if (e.key === '+' || e.key === '=') {
    setZoom(Math.min(ZMAX, state.zoom * ZSTEP));
  } else if (e.key === '-' || e.key === '_') {
    setZoom(Math.max(ZMIN, state.zoom / ZSTEP));
  } else if (e.key === '0') {
    setZoom(1);
    } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      redo(); // Ctrl+Shift+Z = 重做
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      undo();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      redo();
    }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'Space') {
    state.isSpace = false;
    viewport.classList.remove('panning');
    viewport.classList.remove('dragging');
  }
});

// ========== 语言切换事件 ==========

document.addEventListener('langchange', () => {
  updateBrushLabel();
  updateStatusLabels();
  updateDebug();
});

// ========== Viewport 尺寸调整 ==========

function sizeViewport(): void {
  const toolbar = document.querySelector('.toolbar') as HTMLElement;
  const toolbarH = toolbar ? toolbar.offsetHeight : 0;
  viewport.style.height = Math.max(200, window.innerHeight - toolbarH - 16) + 'px';
}
window.addEventListener('resize', sizeViewport);
sizeViewport();

// ========== 拖放区域 ==========

const drop = document.getElementById('drop')!;
const stop = (e: Event) => { e.preventDefault(); e.stopPropagation(); };
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(n =>
  drop.addEventListener(n, stop, false)
);
drop.addEventListener('dragover', () => drop.classList.add('drag'));
drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
drop.addEventListener('drop', (e) => {
  drop.classList.remove('drag');
  handleFiles((e as DragEvent).dataTransfer!.files);
});

// ========== 画布鼠标事件（绘制 + 平移） ==========

mapCanvas.addEventListener('mousedown', (e: MouseEvent) => {
  if (state.isSpace) {
    state.panning = true;
    viewport.classList.add('dragging');
    state.panStartX = e.clientX;
    state.panStartY = e.clientY;
    state.panStartScrollL = viewport.scrollLeft;
    state.panStartScrollT = viewport.scrollTop;
  } else {
    startDrawing(e.offsetX, e.offsetY);
  }
});

mapCanvas.addEventListener('mousemove', (e: MouseEvent) => {
  moveBrushCursor(e);
  if (state.panning) {
    viewport.scrollLeft = state.panStartScrollL - (e.clientX - state.panStartX);
    viewport.scrollTop = state.panStartScrollT - (e.clientY - state.panStartY);
  } else if (state.drawing && state.shape === 'freehand') {
    paintAt(e.offsetX, e.offsetY);
  } else if (state.previewing && (state.shape === 'line' || state.shape === 'rect' || state.shape === 'measure')) {
    drawPreview(state.sx, state.sy, e.offsetX, e.offsetY);
  }
});

window.addEventListener('mouseup', (e) => {
  if (state.panning) {
    state.panning = false;
    viewport.classList.remove('dragging');
  }
  endDrawing(e);
});

// ========== 触屏事件 ==========

mapCanvas.addEventListener('touchstart', (e: TouchEvent) => {
  if (!state.pgm) return;
  e.preventDefault();
  const t = e.touches[0];
  const rect = mapCanvas.getBoundingClientRect();
  const x = t.clientX - rect.left;
  const y = t.clientY - rect.top;
  moveBrushCursor(e);
  startDrawing(x, y);
}, { passive: false });

mapCanvas.addEventListener('touchmove', (e: TouchEvent) => {
  if (!state.pgm) return;
  e.preventDefault();
  const t = e.touches[0];
  const rect = mapCanvas.getBoundingClientRect();
  const x = t.clientX - rect.left;
  const y = t.clientY - rect.top;
  moveBrushCursor(e);
  if (state.drawing && state.shape === 'freehand') {
    paintAt(x, y);
  } else if (state.previewing && (state.shape === 'line' || state.shape === 'rect' || state.shape === 'measure')) {
    drawPreview(state.sx, state.sy, x, y);
  }
}, { passive: false });

mapCanvas.addEventListener('touchend', (e: TouchEvent) => { e.preventDefault(); endDrawing(); }, { passive: false });
mapCanvas.addEventListener('touchcancel', (e: TouchEvent) => { e.preventDefault(); endDrawing(); }, { passive: false });

// ========== 画布光标进入/离开 ==========

mapCanvas.addEventListener('mouseenter', () => {
  brushCursor.style.display = 'block';
  updateBrushCursorSize();
});
mapCanvas.addEventListener('mouseleave', () => {
  brushCursor.style.display = 'none';
});

// ========== Shift+滚轮缩放 ==========

viewport.addEventListener('wheel', (e) => {
  if (!state.pgm) return;
  if (e.shiftKey) {
    e.preventDefault();
    const factor = (e.deltaY < 0) ? ZSTEP : (1 / ZSTEP);
    zoomAtClient(e.clientX, e.clientY, factor);
  }
}, { passive: false });

// ========== 初始化标签 ==========

updateBrushLabel();
updateStatusLabels();
