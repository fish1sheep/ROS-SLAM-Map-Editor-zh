/**
 * ROS SLAM Map Editor — 国际化 (i18n) 轻量翻译模块
 * 支持中文(zh) / 英文(en) 切换，通过 localStorage 记忆语言偏好。
 * 独立 IIFE 版本（供 index.html 落地页使用）。
 *
 * ⚠️ 注意：src/i18n.ts 是 TypeScript 版本（供 editor.html 使用），
 * 两者翻译字典必须保持同步！修改时请同时更新两个文件。
 */
(function(global){
  'use strict';

  var LANG_KEY = 'ros_map_editor_lang';
  var currentLang = 'zh'; // 默认中文

  // ======================== 翻译字典 ========================
  var dict = {

    // ---- 通用 ----
    zh: {
      // 落地页 (index.html)
      'pageTitle': 'ROS SLAM 地图编辑器',
      'pageDesc': '一款基于浏览器的 ROS/ROS2 SLAM 地图与禁区在线编辑器，可快速编辑和保存。',
      'heroTitle': 'ROS SLAM 地图编辑器',
      'heroSubtitle': '一款基于浏览器的 ROS/ROS2 SLAM 地图在线编辑器',
      'launchEditor': '启动编辑器',
      'screenshotAlt': 'ROS SLAM 地图编辑器截图',
      'overview': '概述',
      'overviewText1': 'ROS SLAM 地图编辑器是一款免费开源、即开即用的工具，让工程师和研究人员可以直接在浏览器中精细调整 ROS/ROS2 SLAM 地图——无需安装任何外部图像编辑软件。它专为快速精确地编辑由',
      'overviewText2': '等软件包生成的地图而设计。',
      'overviewText3': '轻松修改墙壁、障碍物、禁区和其它环境细节，以获得更准确的环境表示。',
      'demoVideo': '演示视频',
      'features': '功能特性',
      'feature1Title': '纯浏览器运行',
      'feature1Desc': '完全在浏览器中运行。无需安装。隐私优先设计。',
      'feature2Title': '直观编辑',
      'feature2Desc': '支持涂鸦、擦除、测量和绘制，适配桌面和平板的响应式工具。',
      'feature3Title': '轻松导出',
      'feature3Desc': '即时下载更新后的 PGM 和 YAML 文件，支持独立的禁区遮罩导出。',
      'quickStart': '快速上手',
      'step1': '将 <code>map.yaml</code> 和 <code>map.pgm</code> 拖放到编辑器中。',
      'step2': '选择编辑模式：绘制墙壁、擦除、禁区、未扫描、直线、矩形 或 测量。',
      'step3': '使用缩放、平移和笔刷大小控件进行编辑。',
      'step4': '完成后下载更新后的地图文件。',
      'tryItNow': '立即体验',
      'githubRepo': 'GitHub 仓库',
      'footerText': '由 Dominick Lee 为 GyroPalm VIMPAACT 创建 | © 2025 GyroPalm, LLC.',

      // 编辑器 (editor.html)
      'editorTitle': '在线 ROS2 SLAM 地图编辑器',
      'editorDesc': '一款基于浏览器的 ROS/ROS2 SLAM 地图与禁区在线编辑器，可快速编辑和保存。',
      'loadYaml': '加载 YAML',
      'noYaml': '未加载 YAML',
      'loadPgm': '加载 PGM',
      'noPgm': '未加载 PGM',
      'noKeepout': '无禁区',
      'zoomOut': '缩小 (−)',
      'zoomIn': '放大 (+)',
      'resetZoom': '重置缩放',
      'undo': '撤销 (Ctrl+Z)',
      'redo': '重做 (Ctrl+Y / Shift+Z)',
      'zoomAria': '缩放',
      'toolsAria': '工具',
      'shapeAria': '形状',
      'wall': '墙壁',
      'wallTitle': '绘制墙壁 (障碍物)',
      'erase': '擦除',
      'eraseTitle': '擦除地图 + 禁区',
      'unscan': '未扫描',
      'unscanTitle': '标记为未知 (未扫描区域)',
      'keepout': '禁区',
      'keepoutTitle': '绘制禁区遮罩',
      'freehand': '自由绘制',
      'line': '直线',
      'rect': '矩形',
      'measure': '测量距离',
      'brush': '笔刷',
      'showMask': '显示遮罩',
      'invert': '反色',
      'autoLevels': '自动色阶',
      'filled': '填充',
      'downloadMap': '下载地图',
      'downloadMask': '下载禁区遮罩',
      'tipText': '提示：选择目标 (墙壁/擦除/禁区)，然后选择形状 (自由/直线/矩形)。空格键+拖拽=平移。Shift+滚轮=缩放。',
      'dropText': '<strong>拖放</strong>你的 <code>.yaml</code> 和 <code>.pgm</code> 文件到此处',
      'dropHint': '…或使用上方按钮加载',
      'yamlPreview': 'YAML 预览',
      'debug': '调试信息',
      'legend': '图例',
      'legendWall': '墙壁：将地图像素设为 <code>0</code> (障碍物/黑色)',
      'legendErase': '擦除：地图→<code>maxval</code> (空闲)，遮罩→<code>255</code> (无禁区)',
      'legendUnscan': '未扫描：将地图像素设为浅灰色 (未知区域)',
      'legendKeepout': '禁区：在遮罩上绘制黑色 (禁止进入)',
      'poweredBy': '由 GyroPalm VIMPAACT 提供支持',
      'overlayMap': '地图',

      // JS 动态字符串
      'brushPx': '{size} px',
      'measurement': '{meters} m  ({feet} ft)',
      'noKeepoutStatus': '无禁区',
      'na': '(不适用)',

      // 错误 & 提示消息
	      'keepoutLoadError': '禁区图像加载错误：{msg}',
	      'yamlParseError': 'YAML 解析错误（{file}）：{msg}',
      'pgmParseError': 'PGM 解析错误（{file}）：{msg}',
      'basePgmLoadError': '基础 PGM 加载错误：{msg}',
      'keepoutSizeMismatch': '禁区遮罩尺寸 {kw}×{kh} 与基础地图 {pw}×{ph} 不匹配，已跳过。',
      'keepoutPgmLoadError': '禁区 PGM 加载错误：{msg}',
      'unsupportedPgmMagic': '不支持的 PGM 格式',
      'headerTokenTooLong': '头部标识过长',
      'malformedHeader': '头部格式错误',
      'invalidPgmDims': '无效的 PGM 尺寸/最大值',
      'p2DataTooShort': 'P2 数据长度不足',
      'p5DataTooShort': 'P5 数据长度不足',
      'loadYamlPgmFirst': '请先加载 YAML 和 PGM 文件。',

      // 调试信息模板
      'debugInfo': 'PGM: {w}×{h}, maxval={maxval}, magic={magic}; YAML negate={neg}; Keepout: {keep}',

      // 语言切换按钮
      'langSwitch': 'EN',
      'langLabel': '中'
    },

    // ---- English (original) ----
    en: {
      'pageTitle': 'ROS SLAM Map Editor',
      'pageDesc': 'A web-based map editor for quick editing and saving of ROS and ROS2 SLAM maps and keep-out zones.',
      'heroTitle': 'ROS SLAM Map Editor',
      'heroSubtitle': 'A web-based map editor for quick editing of ROS and ROS2 SLAM maps',
      'launchEditor': 'Launch Editor',
      'screenshotAlt': 'ROS SLAM Map Editor Screenshot',
      'overview': 'Overview',
      'overviewText1': 'The ROS SLAM Map Editor is a hassle-free, open-source tool that allows engineers and researchers to refine their ROS/ROS2 SLAM maps directly in the browser \u2014 no external image editors required. It\u2019s designed for quick, precise adjustments to maps created by packages like ',
      'overviewText2': '.',
      'overviewText3': 'Easily modify walls, obstacles, keep-out zones, and other environmental details for a more accurate representation of your environment.',
      'demoVideo': 'Demo Video',
      'features': 'Features',
      'feature1Title': 'Browser-based',
      'feature1Desc': 'Works entirely in your browser. No installation required. Privacy-first design.',
      'feature2Title': 'Intuitive Editing',
      'feature2Desc': 'Paint, erase, measure, and draw with responsive tools for desktops and tablets.',
      'feature3Title': 'Easy Export',
      'feature3Desc': 'Download updated PGM and YAML files instantly, with separate keep-out masks.',
      'quickStart': 'Quick Start',
      'step1': 'Drag & Drop your <code>map.yaml</code> and <code>map.pgm</code> into the editor.',
      'step2': 'Choose your edit mode: Wall, Erase, Keep-Out, Un-Scan, Line, Rectangle, or Measure.',
      'step3': 'Make your edits with zoom, pan, and brush size controls.',
      'step4': 'Download your updated map files when done.',
      'tryItNow': 'Try It Now',
      'githubRepo': 'GitHub Repo',
      'footerText': 'Created by Dominick Lee for GyroPalm VIMPAACT | \u00a9 2025 by GyroPalm, LLC.',

      'editorTitle': 'Online ROS2 SLAM Map Editor',
      'editorDesc': 'A web-based map editor for quick editing and saving of ROS and ROS2 SLAM maps and keep-out zones.',
      'loadYaml': 'Load YAML',
      'noYaml': 'No YAML',
      'loadPgm': 'Load PGM',
      'noPgm': 'No PGM',
      'noKeepout': 'No Keepout',
      'zoomOut': 'Zoom Out (\u2212)',
      'zoomIn': 'Zoom In (+)',
      'resetZoom': 'Reset Zoom',
      'undo': 'Undo (Ctrl+Z)',
      'redo': 'Redo (Ctrl+Y / Shift+Z)',
      'zoomAria': 'Zoom',
      'toolsAria': 'Tools',
      'shapeAria': 'Shape',
      'wall': 'Wall',
      'wallTitle': 'Paint Walls (occupied)',
      'erase': 'Erase',
      'eraseTitle': 'Erase Map + Keepout',
      'unscan': 'Un-Scan',
      'unscanTitle': 'Mark as unknown (un-scanned)',
      'keepout': 'Keep-Out',
      'keepoutTitle': 'Draw Keepout Mask',
      'freehand': 'Freehand',
      'line': 'Line',
      'rect': 'Rectangle',
      'measure': 'Measure Distance',
      'brush': 'Brush',
      'showMask': 'Show Mask',
      'invert': 'Invert',
      'autoLevels': 'Auto-levels',
      'filled': 'Filled',
      'downloadMap': 'Download Map',
      'downloadMask': 'Download Keepout Mask',
      'tipText': 'Tip: Choose a target (Paint/Erase/Keep-Out), then a shape (Freehand/Line/Rect). Spacebar+Drag to pan. Shift+Scroll to zoom.',
      'dropText': '<strong>Drag & drop</strong> your <code>.yaml</code> and <code>.pgm</code> here',
      'dropHint': '\u2026or use the buttons above',
      'yamlPreview': 'YAML preview',
      'debug': 'Debug',
      'legend': 'Legend',
      'legendWall': 'Wall: Sets map pixels to <code>0</code> (occupied/black)',
      'legendErase': 'Erase: map\u2192<code>maxval</code> (free), mask\u2192<code>255</code> (no-keepout)',
      'legendUnscan': 'Un-Scan: Sets map pixels to light gray (unknown)',
      'legendKeepout': 'Keep-Out: Draws black on mask (keepout)',
      'poweredBy': 'Powered by GyroPalm VIMPAACT',
      'overlayMap': 'Map',

      'brushPx': '{size} px',
      'measurement': '{meters} m  ({feet} ft)',
      'noKeepoutStatus': 'No Keepout',
      'na': '(n/a)',

	      'keepoutLoadError': 'Keepout image load error: {msg}',
	      'yamlParseError': 'YAML parse error in {file}: {msg}',
      'pgmParseError': 'PGM parse error in {file}: {msg}',
      'basePgmLoadError': 'Base PGM load error: {msg}',
      'keepoutSizeMismatch': 'Keepout mask size {kw}\u00d7{kh} does not match base map {pw}\u00d7{ph}. Skipping.',
      'keepoutPgmLoadError': 'Keepout PGM load error: {msg}',
      'unsupportedPgmMagic': 'Unsupported PGM magic',
      'headerTokenTooLong': 'Header token too long',
      'malformedHeader': 'Malformed header',
      'invalidPgmDims': 'Invalid pgm dims/maxval',
      'p2DataTooShort': 'P2 data too short',
      'p5DataTooShort': 'P5 data too short',
      'loadYamlPgmFirst': 'Load YAML and PGM first.',

      'debugInfo': 'PGM: {w}\u00d7{h}, maxval={maxval}, magic={magic}; YAML negate={neg}; Keepout: {keep}',

      'langSwitch': '中',
      'langLabel': 'EN'
    }
  };

  // ======================== 公开 API ========================
  function t(key, params) {
    var map = dict[currentLang] || dict['zh'];
    var str = map[key];
    if (str === undefined) {
      // 降级：尝试英文
      if (currentLang !== 'en' && dict['en'] && dict['en'][key] !== undefined) {
        str = dict['en'][key];
      } else {
        return key; // 未找到翻译，返回 key 本身
      }
    }
    if (params) {
      for (var k in params) {
        if (Object.prototype.hasOwnProperty.call(params, k)) {
          str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), params[k]);
        }
      }
    }
    return str;
  }

  function getLang() {
    return currentLang;
  }

  function setLang(lang, noSave) {
    if (lang !== 'zh' && lang !== 'en') lang = 'zh';
    if (lang === currentLang) return;
    currentLang = lang;
    if (!noSave) {
      try { localStorage.setItem(LANG_KEY, lang); } catch(e) {}
    }
    applyTranslations();
    // 触发自定义事件，让内联脚本也能响应
    if (typeof document !== 'undefined') {
      document.documentElement.lang = (lang === 'zh') ? 'zh-CN' : 'en';
	      var evt = new CustomEvent('langchange', { bubbles: true, cancelable: false });
      document.dispatchEvent(evt);
    }
  }

  function toggleLang() {
    setLang(currentLang === 'zh' ? 'en' : 'zh');
  }

  /**
   * 遍历 DOM，将所有带 data-i18n / data-i18n-title / data-i18n-placeholder
   * 属性的元素替换为当前语言的文本。
   */
  function applyTranslations() {
    // data-i18n: 替换元素内的 HTML（支持内嵌标签如 <code>）
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var key = el.getAttribute('data-i18n');
      var translated = t(key);
      // 如果翻译包含 HTML 标签（如 <code>），使用 innerHTML；否则用 textContent
      if (/<[a-zA-Z][\s\S]*?>/.test(translated)) {
        el.innerHTML = translated;
      } else {
        el.textContent = translated;
      }
    }

    // data-i18n-title: 替换 title 属性
    var titles = document.querySelectorAll('[data-i18n-title]');
    for (var j = 0; j < titles.length; j++) {
      titles[j].title = t(titles[j].getAttribute('data-i18n-title'));
    }

    // data-i18n-placeholder: 替换 placeholder 属性
    var placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    for (var k = 0; k < placeholders.length; k++) {
      placeholders[k].placeholder = t(placeholders[k].getAttribute('data-i18n-placeholder'));
    }

    // data-i18n-aria: 替换 aria-label
    var arias = document.querySelectorAll('[data-i18n-aria]');
    for (var m = 0; m < arias.length; m++) {
      arias[m].setAttribute('aria-label', t(arias[m].getAttribute('data-i18n-aria')));
    }

    // data-i18n-alt: 替换 alt 属性（图片等）
    var alts = document.querySelectorAll('[data-i18n-alt]');
    for (var p = 0; p < alts.length; p++) {
      alts[p].alt = t(alts[p].getAttribute('data-i18n-alt'));
    }

    // 更新语言切换按钮文字
    var btns = document.querySelectorAll('.lang-switch-btn');
    for (var n = 0; n < btns.length; n++) {
      btns[n].textContent = t('langSwitch');
      btns[n].title = t('langLabel');
    }

    // 更新 <title> 和 meta description（如果标签上有 data-i18n 属性）
    var titleEl = document.querySelector('title[data-i18n]');
    if (titleEl) { titleEl.textContent = t(titleEl.getAttribute('data-i18n')); }

    var descEl = document.querySelector('meta[name="description"][data-i18n]');
    if (descEl) { descEl.setAttribute('content', t(descEl.getAttribute('data-i18n'))); }
  }

  // ======================== 初始化 ========================
  function init() {
    // 从 localStorage 读取语言偏好
    try {
      var saved = localStorage.getItem(LANG_KEY);
      if (saved === 'en' || saved === 'zh') {
        currentLang = saved;
      }
    } catch(e) {}

    // 页面加载完成后应用翻译
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function(){
        document.documentElement.lang = (currentLang === 'zh') ? 'zh-CN' : 'en';
        applyTranslations();
      });
    } else {
      document.documentElement.lang = (currentLang === 'zh') ? 'zh-CN' : 'en';
      applyTranslations();
    }
  }

  // 暴露到全局
  global.__i18n = {
    t: t,
    getLang: getLang,
    setLang: setLang,
    toggleLang: toggleLang,
    applyTranslations: applyTranslations,
    init: init
  };

  // 自动初始化
  init();

})(typeof window !== 'undefined' ? window : this);
