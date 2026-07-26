/**
 * 类型定义 — ROS SLAM Map Editor
 */

/** PGM 图像对象 */
export interface PGM {
  magic: string;  // 'P5' | 'P2'
  width: number;
  height: number;
  maxval: number;
  pixels: Uint8Array | Uint16Array;
}

/** YAML 配置对象（由 js-yaml 解析返回，结构不固定） */
export interface YAMLObj {
  image?: string;
  resolution?: number;
  origin?: [number, number, number];
  negate?: number;
  occupied_thresh?: number;
  free_thresh?: number;
  mode?: string;
  [key: string]: unknown;
}

/** 编辑工具 */
export type Tool = 'paint' | 'erase' | 'unscan' | 'mask';

/** 绘制形状 */
export type Shape = 'freehand' | 'line' | 'rect' | 'measure';

/** 图层名称 */
export type LayerName = 'pgm' | 'mask';

/** 单次像素变更记录（用于撤销/重做） */
export interface PixelChange {
  layer: LayerName;
  idx: number;
  prev: number;
  next: number;
}

/** 一次笔划 = 一组像素变更 */
export type Stroke = PixelChange[];

/** 编辑器全局状态 */
export interface EditorState {
  /** YAML 配置对象 */
  yamlObj: YAMLObj | null;
  /** YAML 原始文本 */
  yamlText: string;
  /** 地图文件名 */
  yamlName: string;
  /** PGM 图像对象 */
  pgm: PGM | null;
  /** PGM 文件名 */
  pgmName: string;
  /** 禁区遮罩 (0=keepout, 255=no keepout) */
  mask: Uint8Array | null;
  /** 遮罩文件名 */
  maskName: string | null;
  /** 当前工具 */
  tool: Tool;
  /** 当前形状 */
  shape: Shape;
  /** 是否正在绘制（自由模式） */
  drawing: boolean;
  /** 是否正在预览（直线/矩形/测量） */
  previewing: boolean;
  /** 笔刷大小 (px) */
  brush: number;
  /** 当前缩放倍率 */
  zoom: number;
  /** 是否按住空格键（平移模式） */
  isSpace: boolean;
  /** 是否正在平移 */
  panning: boolean;
  /** 平移起始鼠标 X */
  panStartX: number;
  /** 平移起始鼠标 Y */
  panStartY: number;
  /** 平移起始滚动左 */
  panStartScrollL: number;
  /** 平移起始滚动顶 */
  panStartScrollT: number;
  /** 撤销栈 */
  undoStack: Stroke[];
  /** 重做栈 */
  redoStack: Stroke[];
  /** 当前笔划（未完成的） */
  currentStroke: Stroke | null;
  /** 当前笔划已触及的像素索引（避免重复记录） */
  touchedIndices: Set<number> | null;
  /** 形状绘制起始点 X (canvas 坐标) */
  sx: number;
  /** 形状绘制起始点 Y (canvas 坐标) */
  sy: number;
  /** 是否使用填充矩形 */
  filledRect: boolean;
  /** 上次预览 X */
  lastPreviewX: number | null;
  /** 上次预览 Y */
  lastPreviewY: number | null;
  /** 测量预览超时 ID */
  measureTimeout: ReturnType<typeof setTimeout> | null;
}
