/**
 * PGM 解析/编码 — 纯函数模块
 */

import type { PGM } from './types';
import { t } from './i18n';

/** 解析 PGM 二进制数据 (支持 P2 ASCII 和 P5 二进制) */
export function parsePGM(uint8: Uint8Array): PGM {
  const textHead = new TextDecoder().decode(uint8.slice(0, 1024));
  const magic = textHead.slice(0, 2);
  if (magic !== 'P5' && magic !== 'P2') throw new Error(t('unsupportedPgmMagic'));

  function* tokens(bytes: Uint8Array): Generator<string> {
    let s = '';
    for (let i = 0; i < bytes.length; i++) {
      const c = String.fromCharCode(bytes[i]);
      if (c === '#') {
        while (i < bytes.length && String.fromCharCode(bytes[i]) !== '\n') i++;
        continue;
      }
      if (/\s/.test(c)) {
        if (s.length) { yield s; s = ''; }
      } else {
        s += c;
      }
      if (s.length > 256) throw new Error(t('headerTokenTooLong'));
    }
    if (s.length) yield s;
  }

  const it = tokens(uint8);
  const mg = it.next().value;
  if (mg !== magic) throw new Error(t('malformedHeader'));
  const w = parseInt(it.next().value, 10);
  const h = parseInt(it.next().value, 10);
  const maxv = parseInt(it.next().value, 10);
  if (!(w > 0 && h > 0 && maxv > 0)) throw new Error(t('invalidPgmDims'));

  if (magic === 'P2') {
    // ASCII PGM
    const restTxt = new TextDecoder().decode(uint8);
    const headerRe = new RegExp(`^\\s*${magic}[\\s\\S]*?\\b${maxv}\\b`);
    const headerMatch = restTxt.match(headerRe);
    const start = headerMatch ? headerMatch[0].length : 0;
    const nums = restTxt.slice(start).match(/\d+/g) || [];
    if (nums.length < w * h) throw new Error(t('p2DataTooShort'));
    const pixels = new Uint16Array(w * h);
    for (let i = 0; i < w * h; i++) pixels[i] = Math.min(maxv, parseInt(nums[i], 10));
    return { magic, width: w, height: h, maxval: maxv, pixels };
  } else {
    // Binary PGM (P5)
    let nums = 0, i = 2;
    let inTok = false;
    while (i < uint8.length && nums < 3) {
      const c = uint8[i];
      if (c === 35) { while (i < uint8.length && uint8[i] !== 10) i++; }
      else if (c > 32) { if (!inTok) { inTok = true; nums++; } }
      else { if (inTok) { inTok = false; } }
      i++;
    }
    while (i < uint8.length && uint8[i] <= 32) i++;
    const dataStart = i;

    const bytesPer = (maxv > 255) ? 2 : 1;
    const needed = w * h * bytesPer;
    if (dataStart + needed > uint8.length) throw new Error(t('p5DataTooShort'));

    if (bytesPer === 1) {
      const pixels = new Uint8Array(w * h);
      pixels.set(uint8.slice(dataStart, dataStart + needed));
      return { magic, width: w, height: h, maxval: maxv, pixels };
    } else {
      const pixels = new Uint16Array(w * h);
      let p = 0;
      for (let k = 0; k < needed; k += 2) {
        pixels[p++] = (uint8[dataStart + k] << 8) | uint8[dataStart + k + 1];
      }
      return { magic, width: w, height: h, maxval: maxv, pixels };
    }
  }
}

/** 将 PGM 对象编码为二进制 P5 格式 */
export function encodePGM(pgm: PGM): Uint8Array {
  const { width: w, height: h, maxval, pixels } = pgm;
  const header = `P5\n${w} ${h}\n${maxval}\n`;
  const enc = new TextEncoder();
  const hbytes = enc.encode(header);
  const bytesPer = (maxval > 255) ? 2 : 1;
  const body = new Uint8Array(w * h * bytesPer);
  if (bytesPer === 1) {
    for (let i = 0; i < w * h; i++) body[i] = Math.min(255, pixels[i]);
  } else {
    let j = 0;
    for (let i = 0; i < w * h; i++) {
      const v = pixels[i];
      body[j++] = (v >> 8) & 0xFF;
      body[j++] = v & 0xFF;
    }
  }
  const out = new Uint8Array(hbytes.length + body.length);
  out.set(hbytes, 0);
  out.set(body, hbytes.length);
  return out;
}
