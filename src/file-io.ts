/**
 * 文件 I/O — 加载（拖放/按钮）、下载
 */

import state, { isYaml, isPgm, isKeepoutName } from './state';
import { parsePGM, encodePGM } from './pgm';
import { mapCanvas, maskCanvas, previewCanvas, redrawMap, redrawMask, clearPreview, updateDebug } from './canvas';
import { updateBrushCursorSize } from './tools';
import { t } from './i18n';
import type { PGM } from './types';

// ===== 文件读取工具 =====

function readText(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result as string);
    fr.onerror = () => rej(new Error('Failed to read file: ' + file.name));
    fr.readAsText(file);
  });
}

function readBinary(file: File): Promise<ArrayBuffer> {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result as ArrayBuffer);
    fr.onerror = () => rej(new Error('Failed to read file: ' + file.name));
    fr.readAsArrayBuffer(file);
  });
}

// ===== 加载 PGM =====

export function loadBasePGM(filename: string, u8: Uint8Array): void {
  try {
    const parsed = parsePGM(u8);
    state.pgmName = filename;
    state.pgm = parsed;
    $('#pgmName').text(filename);

    // 清除撤销/重做历史
    state.undoStack.length = 0;
    state.redoStack.length = 0;

    // 如果遮罩未分配或尺寸不匹配，重置
    if (!state.mask || (state.mask.length !== parsed.width * parsed.height)) {
      state.mask = new Uint8Array(parsed.width * parsed.height);
      state.mask.fill(255);
      state.maskName = null;
      $('#maskName').text(t('noKeepout'));
    }

    setupCanvasFromPGM();
  } catch (e) {
    alert(t('basePgmLoadError', { msg: (e as Error).message }));
  }
}

export function loadKeepoutPGM(filename: string, u8: Uint8Array): void {
  try {
    const kpgm = parsePGM(u8);

    if (state.pgm && (kpgm.width !== state.pgm.width || kpgm.height !== state.pgm.height)) {
      alert(t('keepoutSizeMismatch', {
        kw: kpgm.width, kh: kpgm.height,
        pw: state.pgm.width, ph: state.pgm.height,
      }));
      return;
    }

    const total = kpgm.width * kpgm.height;
    const dst = new Uint8Array(total);
    const maxv = kpgm.maxval || 255;

    if (kpgm.pixels.BYTES_PER_ELEMENT === 1 && maxv === 255) {
      dst.set(kpgm.pixels as Uint8Array);
    } else {
      for (let i = 0; i < total; i++) {
        dst[i] = Math.round((kpgm.pixels[i] * 255) / maxv);
      }
    }

    state.mask = dst;
    state.maskName = filename;
    $('#maskName').text(filename);

    if (state.pgm) {
      maskCanvas.width = Math.round(state.pgm.width * state.zoom);
      maskCanvas.height = Math.round(state.pgm.height * state.zoom);
      redrawMask();
    }

    updateDebug();
  } catch (e) {
    alert(t('keepoutPgmLoadError', { msg: (e as Error).message }));
  }
}

// ===== 处理文件 =====

export async function handleFiles(fileList: FileList): Promise<void> {
  const files = Array.from(fileList);
  if (files.length === 0) return;

  const yamlFiles = files.filter(f => isYaml(f.name));
  const pgmFiles = files.filter(f => isPgm(f.name));
  const byName = new Map(files.map(f => [f.name, f]));

  // 追踪已被 keepout YAML 引用的 PGM 文件，避免重复加载
  const consumedPgms = new Set<string>();

  // 第一步：处理 YAML（串行，确保 keepout 引用先解析）
  for (const file of yamlFiles) {
    try {
      const txt = await readText(file);
      const yobj = jsyaml.load(txt) as Record<string, unknown>;
      const isKO = isKeepoutName(file.name);
      if (isKO) {
        const imgField = (yobj && yobj.image) ? String(yobj.image) : '';
        const baseName = imgField.split('/').pop();
        if (baseName && byName.has(baseName)) {
          consumedPgms.add(baseName);
          try {
            const buf = await readBinary(byName.get(baseName)!);
            loadKeepoutPGM(baseName, new Uint8Array(buf));
          } catch (err) {
            alert(t('keepoutLoadError', { msg: (err as Error).message }));
          }
        }
      } else {
        state.yamlText = txt;
        state.yamlObj = yobj as typeof state.yamlObj;
        state.yamlName = file.name;
        $('#yamlPreview').text(txt);
        $('#yamlName').text(file.name);
        updateDebug();
      }
    } catch (e) {
      alert(t('yamlParseError', { file: file.name, msg: (e as Error).message }));
    }
  }

  // 第二步：处理 PGM（跳过已被 keepout YAML 引用的文件）
  for (const file of pgmFiles) {
    if (consumedPgms.has(file.name)) continue;
    try {
      const buf = await readBinary(file);
      const u8 = new Uint8Array(buf);
      if (isKeepoutName(file.name)) {
        loadKeepoutPGM(file.name, u8);
      } else {
        loadBasePGM(file.name, u8);
      }
    } catch (e) {
      alert(t('pgmParseError', { file: file.name, msg: (e as Error).message }));
    }
  }
}

// ===== Canvas 尺寸设置 =====

function setupCanvasFromPGM(): void {
  const pgm = state.pgm;
  if (!pgm) return;
  [mapCanvas, maskCanvas, previewCanvas].forEach(cv => {
    cv.width = Math.round(pgm.width * state.zoom);
    cv.height = Math.round(pgm.height * state.zoom);
  });
  redrawMap();
  redrawMask();
  clearPreview();
  updateBrushCursorSize();
  updateDebug();
}

// ===== 下载 =====

export function dlBytes(bytes: Uint8Array, filename: string, mime = 'application/octet-stream'): void {
  const blob = new Blob([bytes as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function dlText(txt: string, filename: string, mime = 'text/yaml'): void {
  const blob = new Blob([txt], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildUpdatedYaml(imageName: string): string {
  if (!state.yamlObj) return '';
  const y = Object.assign({}, state.yamlObj, { image: imageName });
  return jsyaml.dump(y);
}

export function downloadMap(): void {
  if (!state.pgm || !state.yamlObj) { alert(t('loadYamlPgmFirst')); return; }
  const pgmBytes = encodePGM(state.pgm);
  const outPgm = state.pgmName.replace(/\.pgm$/i, '_edited.pgm');
  const outYaml = (state.yamlName || 'map.yaml').replace(/\.ya?ml$/i, '_edited.yaml');
  dlBytes(pgmBytes, outPgm, 'image/x-portable-graymap');
  dlText(buildUpdatedYaml(outPgm), outYaml, 'text/yaml');
}

export function downloadMask(): void {
  if (!state.pgm || !state.yamlObj || !state.mask) { alert(t('loadYamlPgmFirst')); return; }
  const m: PGM = { magic: 'P5', width: state.pgm.width, height: state.pgm.height, maxval: 255, pixels: state.mask };
  const maskBytes = encodePGM(m);
  const base = (state.pgmName || 'map.pgm').replace(/\.pgm$/i, '');
  const outMaskPgm = base + '_keepout.pgm';
  const outMaskYaml = base + '_keepout.yaml';
  const y = Object.assign({}, state.yamlObj, { image: outMaskPgm });
  dlBytes(maskBytes, outMaskPgm, 'image/x-portable-graymap');
  dlText(jsyaml.dump(y), outMaskYaml, 'text/yaml');
}

// ===== 状态标签 =====

export function updateStatusLabels(): void {
  if (state.yamlObj) {
    $('#yamlName').text(state.yamlName);
  } else {
    $('#yamlName').text(t('noYaml'));
  }
  if (state.pgm) {
    $('#pgmName').text(state.pgmName);
  } else {
    $('#pgmName').text(t('noPgm'));
  }
  $('#maskName').text(state.maskName || t('noKeepout'));
}

export function updateBrushLabel(): void {
  $('#brushLabel').text(t('brushPx', { size: state.brush }));
}
