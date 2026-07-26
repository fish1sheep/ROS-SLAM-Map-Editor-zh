/**
 * 编辑器全局状态 — 单例模块
 */

import type { EditorState, Tool, Shape, YAMLObj, PGM } from './types';

/** 缩放常量 */
export const ZMIN = 0.25;
export const ZMAX = 8;
export const ZSTEP = 1.25;

/** 最大撤销深度 */
export const MAX_UNDO = 100;

/** 工具名称列表 */
export const TOOLS: Tool[] = ['paint', 'erase', 'unscan', 'mask'];
export const SHAPES: Shape[] = ['freehand', 'line', 'rect', 'measure'];

/** 获取未知区域像素值 (#CDCDCD ≈ 0.8039 * maxval) */
export function getUnknownVal(maxval: number): number {
  return Math.round(0.8039215686 * maxval);
}

/** 文件名模式匹配 */
export function isYaml(name: string): boolean {
  return /\.ya?ml$/i.test(name);
}
export function isPgm(name: string): boolean {
  return /\.pgm$/i.test(name);
}
export function isKeepoutName(name: string): boolean {
  return /_keepout\.(pgm|ya?ml)$/i.test(name) || /keepout/i.test(name);
}

/** 编辑器全局状态 */
const state: EditorState = {
  yamlObj: null,
  yamlText: '',
  yamlName: 'map.yaml',
  pgm: null,
  pgmName: 'map.pgm',
  mask: null,
  maskName: null,
  tool: 'paint',
  shape: 'freehand',
  drawing: false,
  previewing: false,
  brush: 8,
  zoom: 1,
  isSpace: false,
  panning: false,
  panStartX: 0,
  panStartY: 0,
  panStartScrollL: 0,
  panStartScrollT: 0,
  undoStack: [],
  redoStack: [],
  currentStroke: null,
  touchedIndices: null,
  sx: 0,
  sy: 0,
  filledRect: false,
  lastPreviewX: null,
  lastPreviewY: null,
  measureTimeout: null,
};

export default state;
