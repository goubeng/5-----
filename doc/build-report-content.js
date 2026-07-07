const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const OUTPUT = path.join(DATA_DIR, 'report-content.js');

const SOURCES = {
  'module1.html': '模块1_办公用品及耗材管理_文案提取.md',
  'module2.html': '模块2_办公用房及公产房管理_文案提取.md',
  'module3.html': '模块3_物业管理_文案提取.md',
  'module4.html': '模块4_公用会场预定管理_文案提取.md'
};

const PAGE_SECTIONS = /^## 页面\s+([0-9]-[0-9]+)｜(.+)$/gm;

function readSource(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function cleanCell(value) {
  return value.trim().replace(/<br\s*\/?>/gi, '\n');
}

function parseTableRows(section) {
  return section
    .split(/\r?\n/)
    .filter(line => line.trim().startsWith('|') && !/^\|\s*-+\s*\|/.test(line))
    .map(line => line.trim().slice(1, -1).split('|').map(cleanCell))
    .filter(cols => cols.length >= 2 && cols[0] !== '文案类型' && cols[0] !== '流程步骤' && cols[0] !== '指标' && cols[0] !== '结构项');
}

function parseKeyValue(section) {
  const data = {};
  for (const cols of parseTableRows(section)) {
    if (cols.length === 2) data[cols[0]] = cols[1];
  }
  return data;
}

function parseWideRows(section, headers) {
  const rows = [];
  for (const cols of parseTableRows(section)) {
    if (cols.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = cols[index];
      });
      rows.push(row);
    }
  }
  return rows;
}

function parsePages(markdown) {
  const matches = [...markdown.matchAll(PAGE_SECTIONS)];
  const pages = {};
  matches.forEach((match, index) => {
    const pageNo = match[1];
    const start = match.index + match[0].length;
    const end = matches[index + 1] ? matches[index + 1].index : markdown.indexOf('\n## 模块', start);
    const section = markdown.slice(start, end > -1 ? end : markdown.length);
    pages[pageNo] = {
      title: match[2].trim(),
      fields: parseKeyValue(section),
      effects: parseWideRows(section, ['指标', '原有方式', '系统建设后', '预期变化']),
      steps: parseWideRows(section, ['流程步骤', '步骤名称', '文案内容'])
    };
  });
  return pages;
}

function parseSpeech(markdown) {
  const speechStart = markdown.indexOf('\n## 演讲稿');
  if (speechStart === -1) return [];
  const block = markdown.slice(speechStart);
  const headings = [...block.matchAll(/^###\s+(.+)$/gm)];
  return headings.map((match, index) => {
    const start = match.index + match[0].length;
    const end = headings[index + 1] ? headings[index + 1].index : block.length;
    const paragraphs = block
      .slice(start, end)
      .split(/\r?\n\s*\r?\n/)
      .map(item => item.trim())
      .filter(Boolean);
    return { label: match[1].trim(), paragraphs };
  });
}

function text(selector, value) {
  return value ? { selector, text: value } : null;
}

function html(selector, value) {
  return value ? { selector, html: value } : null;
}

function row(selector, cells) {
  return { selector, cells };
}

function sceneLine(selector, step) {
  if (!step) return null;
  const match = selector.match(/^(.*):nth-of-type\((\d+)\)$/);
  const op = html(match ? match[1] : selector, `<b>${escapeHtml(`${step['流程步骤'].replace('步骤 ', '')}. ${step['步骤名称']}：`)}</b> ${escapeHtml(step['文案内容'])}`);
  if (match) op.index = Number(match[2]) - 1;
  return op;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildModule1(pages, speech) {
  const ops = [
    text('[data-slide="0"] h1', pages['2-0']?.fields['页面标题']),
    text('[data-slide="0"] .subtitle', pages['2-0']?.fields['页面副标题']),
    text('[data-slide="1"] h1', pages['2-1']?.fields['页面标题']),
    text('[data-slide="1"] .subtitle', pages['2-1']?.fields['页面副标题']),
    text('[data-slide="1"] .pain5-card:nth-child(1) h3', pages['2-1']?.fields['痛点 1 标题']),
    text('[data-slide="1"] .pain5-card:nth-child(1) p', pages['2-1']?.fields['痛点 1 内容']),
    text('[data-slide="1"] .pain5-card:nth-child(2) h3', pages['2-1']?.fields['痛点 2 标题']),
    text('[data-slide="1"] .pain5-card:nth-child(2) p', pages['2-1']?.fields['痛点 2 内容']),
    text('[data-slide="1"] .pain5-card:nth-child(3) h3', pages['2-1']?.fields['痛点 3 标题']),
    text('[data-slide="1"] .pain5-card:nth-child(3) p', pages['2-1']?.fields['痛点 3 内容']),
    text('[data-slide="1"] .pain5-card:nth-child(4) h3', pages['2-1']?.fields['痛点 4 标题']),
    text('[data-slide="1"] .pain5-card:nth-child(4) p', pages['2-1']?.fields['痛点 4 内容']),
    text('[data-slide="1"] .summary-box', pages['2-1']?.fields['页面总结']),
    text('[data-slide="2"] h1', pages['2-2']?.fields['页面标题']),
    text('[data-slide="2"] .solution-card:nth-child(1) h3', pages['2-2']?.fields['板块 1 标题']),
    text('[data-slide="2"] .solution-card:nth-child(1) .flow-text', pages['2-2']?.fields['板块 1 流程']),
    text('[data-slide="2"] .solution-card:nth-child(1) p', pages['2-2']?.fields['板块 1 说明']),
    text('[data-slide="2"] .solution-card:nth-child(2) h3', pages['2-2']?.fields['板块 2 标题']),
    text('[data-slide="2"] .solution-card:nth-child(2) .flow-text', pages['2-2']?.fields['板块 2 流程']),
    text('[data-slide="2"] .summary-box', pages['2-2']?.fields['页面总结']),
    text('[data-slide="3"] h1', pages['2-3']?.fields['页面标题']),
    text('[data-slide="3"] .subtitle', pages['2-3']?.fields['页面副标题']),
    text('[data-slide="3"] .summary-box', pages['2-3']?.fields['页面总结']),
    text('[data-slide="4"] h1', pages['2-4']?.fields['页面标题']),
    text('[data-slide="4"] .scene-intro p', pages['2-4']?.fields['页面副标题']),
    text('[data-slide="4"] .red-callout', pages['2-4']?.fields['场景说明']),
    text('[data-slide="5"] h1', pages['2-5']?.fields['页面标题']),
    text('[data-slide="5"] .subtitle', pages['2-5']?.fields['主文案']),
    text('[data-slide="5"] .value-chip:nth-child(1)', pages['2-5']?.fields['价值标签 1']),
    text('[data-slide="5"] .value-chip:nth-child(2)', pages['2-5']?.fields['价值标签 2']),
    text('[data-slide="5"] .value-chip:nth-child(3)', pages['2-5']?.fields['价值标签 3']),
    text('[data-slide="5"] .value-chip:nth-child(4)', pages['2-5']?.fields['价值标签 4'])
  ];
  pages['2-3']?.effects.forEach((effect, index) => {
    ops.push(row(`[data-slide="3"] .effect-table tbody tr:nth-child(${index + 1})`, [effect['指标'], effect['原有方式'], effect['系统建设后'], effect['预期变化']]));
  });
  pages['2-4']?.steps.forEach((step, index) => {
    ops.push(sceneLine(`[data-slide="4"] .scene-line:nth-of-type(${index + 1})`, step));
  });
  return attachSpeech(ops, speech);
}

function buildModule2(pages, speech) {
  const ops = [
    text('[data-slide="0"] h1', pages['3-0']?.fields['页面标题']),
    text('[data-slide="0"] .subtitle', pages['3-0']?.fields['页面副标题']),
    text('[data-slide="1"] h1', pages['3-1']?.fields['页面标题']),
    text('[data-slide="1"] .subtitle', pages['3-1']?.fields['页面副标题']),
    text('[data-slide="1"] .summary-box', pages['3-1']?.fields['页面总结']),
    text('[data-slide="2"] h1', pages['3-2']?.fields['页面标题']),
    text('[data-slide="2"] .subtitle', pages['3-2']?.fields['页面副标题']),
    text('[data-slide="2"] .summary-box', pages['3-2']?.fields['页面总结']),
    text('[data-slide="3"] h1', pages['3-3']?.fields['页面标题']),
    text('[data-slide="3"] .subtitle', pages['3-3']?.fields['页面副标题']),
    text('[data-slide="3"] .summary-box', pages['3-3']?.fields['页面总结']),
    text('[data-slide="4"] h1', pages['3-4']?.fields['页面标题']),
    text('[data-slide="4"] .summary-box', pages['3-4']?.fields['页面总结']),
    text('[data-slide="5"] h1', pages['3-5']?.fields['页面标题']),
    text('[data-slide="5"] .subtitle', pages['3-5']?.fields['页面副标题']),
    text('[data-slide="5"] .summary-box', pages['3-5']?.fields['页面总结']),
    text('[data-slide="6"] h1', pages['3-6']?.fields['页面标题']),
    text('[data-slide="6"] .subtitle', pages['3-6']?.fields['页面副标题']),
    text('[data-slide="6"] .summary-box', pages['3-6']?.fields['页面总结']),
    text('[data-slide="7"] h1', pages['3-7']?.fields['页面标题']),
    text('[data-slide="7"] .subtitle', pages['3-7']?.fields['页面副标题']),
    text('[data-slide="7"] .summary-box', pages['3-7']?.fields['页面总结']),
    text('[data-slide="8"] h1', pages['3-8']?.fields['页面标题']),
    text('[data-slide="9"] h1', pages['3-9']?.fields['页面标题']),
    text('[data-slide="9"] .subtitle', pages['3-9']?.fields['主文案']),
    text('[data-slide="9"] .summary-box', pages['3-9']?.fields['页面总结'])
  ];
  ['3-1', '3-5'].forEach((pageNo) => {
    const slide = pageNo === '3-1' ? 1 : 5;
    [1, 2, 3, 4].forEach((item) => {
      ops.push(text(`[data-slide="${slide}"] .pain5-card:nth-child(${item}) h3, [data-slide="${slide}"] .pain-card:nth-child(${item}) h3`, pages[pageNo]?.fields[`痛点 ${item} 标题`]));
      ops.push(text(`[data-slide="${slide}"] .pain5-card:nth-child(${item}) p, [data-slide="${slide}"] .pain-card:nth-child(${item}) p`, pages[pageNo]?.fields[`痛点 ${item} 内容`]));
    });
  });
  [1, 2, 3, 4].forEach((item) => {
    ops.push(text(`[data-slide="2"] .solution-card:nth-child(${item}) h3`, pages['3-2']?.fields[`建设内容 ${item} 标题`]));
    ops.push(text(`[data-slide="2"] .solution-card:nth-child(${item}) p`, pages['3-2']?.fields[`建设内容 ${item} 内容`]));
    ops.push(text(`[data-slide="6"] .solution-card:nth-child(${item}) h3`, pages['3-6']?.fields[`建设内容 ${item} 标题`]));
    ops.push(text(`[data-slide="6"] .solution-card:nth-child(${item}) p`, pages['3-6']?.fields[`建设内容 ${item} 内容`]));
    ops.push(text(`[data-slide="9"] .value-chip:nth-child(${item})`, pages['3-9']?.fields[`价值标签 ${item}`]));
  });
  pages['3-4']?.steps.forEach((step, index) => ops.push(sceneLine(`[data-slide="4"] .scene-line:nth-of-type(${index + 1})`, step)));
  pages['3-7']?.effects.forEach((effect, index) => {
    ops.push(row(`[data-slide="7"] .effect-table tbody tr:nth-child(${index + 1})`, [effect['指标'], effect['原有方式'], effect['系统建设后'], effect['预期变化']]));
  });
  pages['3-8']?.steps.forEach((step, index) => ops.push(sceneLine(`[data-slide="8"] .scene-line:nth-of-type(${index + 1})`, step)));
  return attachSpeech(ops, speech);
}

function buildModule3(pages, speech) {
  return buildStandardModule(pages, speech, {
    cover: '4-0',
    pain: '4-1',
    solution: '4-2',
    effects: '4-3',
    scenes: [{ page: '4-4', slide: 4 }, { page: '4-5', slide: 5 }],
    value: '4-6',
    painClass: 'pain5-card'
  });
}

function buildModule4(pages, speech) {
  return buildStandardModule(pages, speech, {
    cover: '5-0',
    pain: '5-1',
    solution: '5-2',
    effects: '5-3',
    scenes: [{ page: '5-4', slide: 4 }],
    value: '5-5',
    painClass: 'pain-card'
  });
}

function buildStandardModule(pages, speech, config) {
  const ops = [
    text('[data-slide="0"] h1', pages[config.cover]?.fields['页面标题']),
    text('[data-slide="0"] .subtitle', pages[config.cover]?.fields['页面副标题']),
    text('[data-slide="1"] h1', pages[config.pain]?.fields['页面标题']),
    text('[data-slide="1"] .subtitle', pages[config.pain]?.fields['页面副标题']),
    text('[data-slide="1"] .summary-box', pages[config.pain]?.fields['页面总结']),
    text('[data-slide="2"] h1', pages[config.solution]?.fields['页面标题']),
    text('[data-slide="2"] .summary-box', pages[config.solution]?.fields['页面总结']),
    text('[data-slide="3"] h1', pages[config.effects]?.fields['页面标题']),
    text('[data-slide="3"] .subtitle', pages[config.effects]?.fields['页面副标题']),
    text('[data-slide="' + (config.scenes[0]?.slide || 4) + '"] h1', pages[config.scenes[0]?.page]?.fields['页面标题']),
    text('[data-slide="' + (config.scenes[0]?.slide || 4) + '"] .scene-intro p', pages[config.scenes[0]?.page]?.fields['场景说明']),
    text('[data-slide="' + (config.scenes[0]?.slide || 4) + '"] .red-callout', pages[config.scenes[0]?.page]?.fields['场景问题']),
    text(`[data-slide="${config.scenes[1]?.slide || 5}"] h1`, pages[config.scenes[1]?.page]?.fields['页面标题']),
    text(`[data-slide="${config.scenes[1]?.slide || 5}"] .scene-intro p`, pages[config.scenes[1]?.page]?.fields['场景说明']),
    text(`[data-slide="${config.scenes[1]?.slide || 5}"] .red-callout`, pages[config.scenes[1]?.page]?.fields['场景问题']),
    text(`[data-slide="${config.value === '4-6' ? 6 : 5}"] h1`, pages[config.value]?.fields['页面标题']),
    text(`[data-slide="${config.value === '4-6' ? 6 : 5}"] .subtitle`, pages[config.value]?.fields['页面副标题']),
    text(`[data-slide="${config.value === '4-6' ? 6 : 5}"] .summary-box`, pages[config.value]?.fields['页面总结'])
  ];
  [1, 2, 3, 4].forEach((item) => {
    ops.push(text(`[data-slide="1"] .${config.painClass}:nth-child(${item}) h3`, pages[config.pain]?.fields[`痛点 ${item} 标题`]));
    ops.push(text(`[data-slide="1"] .${config.painClass}:nth-child(${item}) p`, pages[config.pain]?.fields[`痛点 ${item} 内容`]));
    ops.push(text(`[data-slide="2"] .solution-card:nth-child(${item}) h3`, pages[config.solution]?.fields[`建设内容 ${item} 标题`]));
    ops.push(text(`[data-slide="2"] .solution-card:nth-child(${item}) .flow-text`, pages[config.solution]?.fields[`建设内容 ${item} 流程`]));
    ops.push(text(`[data-slide="2"] .solution-card:nth-child(${item}) p`, pages[config.solution]?.fields[`建设内容 ${item} 内容`]));
    ops.push(text(`[data-slide="${config.value === '4-6' ? 6 : 5}"] .value-chip:nth-child(${item})`, pages[config.value]?.fields[`价值标签 ${item}`]));
  });
  pages[config.effects]?.effects.forEach((effect, index) => {
    ops.push(row(`[data-slide="3"] .effect-table tbody tr:nth-child(${index + 1})`, [effect['指标'], effect['原有方式'], effect['系统建设后'], effect['预期变化']]));
  });
  config.scenes.forEach(({ page, slide }) => {
    pages[page]?.steps.forEach((step, index) => {
      ops.push(sceneLine(`[data-slide="${slide}"] .scene-line:nth-of-type(${index + 1})`, step));
    });
  });
  return attachSpeech(ops, speech);
}

function attachSpeech(ops, speech) {
  speech.forEach((section, sectionIndex) => {
    ops.push(text(`.notes-content[data-notes="${sectionIndex}"] .notes-label`, section.label));
    section.paragraphs.forEach((paragraph, paragraphIndex) => {
      ops.push(text(`.notes-content[data-notes="${sectionIndex}"] .notes-para:nth-of-type(${paragraphIndex + 1})`, paragraph));
    });
  });
  return ops.filter(Boolean);
}

function buildContent() {
  const builders = {
    'module1.html': buildModule1,
    'module2.html': buildModule2,
    'module3.html': buildModule3,
    'module4.html': buildModule4
  };
  const pages = {};
  for (const [htmlFile, mdFile] of Object.entries(SOURCES)) {
    const markdown = readSource(mdFile);
    pages[htmlFile] = builders[htmlFile](parsePages(markdown), parseSpeech(markdown));
  }
  return pages;
}

function renderRuntime(content) {
  return `// Generated by doc/build-report-content.js. Edit the markdown source files, then rerun the build script.\n(function () {\n  'use strict';\n\n  const content = ${JSON.stringify(content, null, 2)};\n\n  function applyText(element, value) {\n    if (typeof value === 'string') element.textContent = value;\n  }\n\n  function applyHtml(element, value) {\n    if (typeof value === 'string') element.innerHTML = value;\n  }\n\n  function applyRow(element, cells) {\n    const targets = Array.from(element.children);\n    cells.forEach((value, index) => {\n      if (targets[index]) targets[index].textContent = value;\n    });\n  }\n\n  function applyOp(element, op) {\n    if (op.text !== undefined) applyText(element, op.text);\n    if (op.html !== undefined) applyHtml(element, op.html);\n    if (Array.isArray(op.cells)) applyRow(element, op.cells);\n  }\n\n  window.applyReportContent = function applyReportContent(pageName) {\n    const ops = content[pageName] || [];\n    ops.forEach((op) => {\n      const elements = Array.from(document.querySelectorAll(op.selector));\n      if (typeof op.index === 'number') {\n        if (elements[op.index]) applyOp(elements[op.index], op);\n        return;\n      }\n      elements.forEach((element) => applyOp(element, op));\n    });\n  };\n})();\n`;
}

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.writeFileSync(OUTPUT, renderRuntime(buildContent()), 'utf8');
console.log(`Generated ${path.relative(ROOT, OUTPUT)}`);
