#!/usr/bin/env node
/**
 * RTL Layout Test Script — ProFish
 *
 * Audits all JavaScript/JSX source files for RTL-readiness.
 * Checks for hard-coded left/right styles, absolute positions,
 * icon flip needs, and swipe-direction issues.
 *
 * Usage:
 *   node scripts/audit-rtl.js [--fix]
 *
 * Categories:
 * 1. Hard-coded left/right margins, paddings, positions
 * 2. Row layouts missing flexDirection: 'row' → should use I18nManager.isRTL
 * 3. Transform/rotation missing RTL flip
 * 4. Text alignment without RTL awareness
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.resolve(__dirname, '..', 'src');
const EXTS = ['.js', '.jsx', '.ts', '.tsx'];

// ── Patterns to flag ─────────────────────────────────────

const RULES = [
  {
    id: 'hard-left-right',
    desc: 'Hard-coded left/right in style (use Start/End instead)',
    // Match: marginLeft, paddingRight, left:, right:, borderLeftWidth etc.
    regex: /\b(margin|padding|border)(Left|Right)(Width|Color|Radius)?\s*[:=]/g,
    severity: 'warn',
    suggestion: 'Replace Left→Start, Right→End (e.g. marginStart, paddingEnd)',
  },
  {
    id: 'absolute-left-right',
    desc: 'Absolute position left:/right: (use start:/end: instead)',
    regex: /\b(left|right)\s*:/g,
    severity: 'warn',
    suggestion: 'Replace left→start, right→end in absolute positioning',
  },
  {
    id: 'text-align-lr',
    desc: 'textAlign: "left"/"right" (should flip in RTL)',
    regex: /textAlign\s*:\s*['"`](left|right)['"`]/g,
    severity: 'warn',
    suggestion: 'Use I18nManager.isRTL to conditionally flip text alignment',
  },
  {
    id: 'transform-no-rtl',
    desc: 'Transform with scaleX/translateX may need RTL flip',
    regex: /transform\s*:\s*\[.*?(scaleX|translateX)/g,
    severity: 'info',
    suggestion:
      'Verify transforms are flipped in RTL (multiply by -1 when isRTL)',
  },
  {
    id: 'icon-arrow',
    desc: 'Arrow icon may need RTL flip (chevron-left → chevron-right)',
    regex:
      /['"`](chevron-left|chevron-right|arrow-left|arrow-right|arrow-back|arrow-forward)['"`]/g,
    severity: 'info',
    suggestion: 'Swap directional icon names when I18nManager.isRTL',
  },
  {
    id: 'swipe-direction',
    desc: 'Swipeable/gesture with direction that may need RTL',
    regex: /swipeDirection|gestureDirection|slideFrom(Left|Right)/gi,
    severity: 'info',
    suggestion: 'Ensure swipe/gesture direction respects I18nManager.isRTL',
  },
];

// ── File walker ──────────────────────────────────────────

function walkDir(dir, list = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (
      entry.isDirectory() &&
      !entry.name.startsWith('.') &&
      entry.name !== 'node_modules'
    ) {
      walkDir(full, list);
    } else if (entry.isFile() && EXTS.includes(path.extname(entry.name))) {
      list.push(full);
    }
  }
  return list;
}

// ── Main ─────────────────────────────────────────────────

const files = walkDir(SRC_DIR);
let totalIssues = 0;
let totalFiles = 0;
const summary = {};

for (const rule of RULES) {
  summary[rule.id] = { count: 0, files: new Set() };
}

for (const filePath of files) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const relPath = path
    .relative(path.resolve(__dirname, '..'), filePath)
    .replace(/\\/g, '/');
  const fileIssues = [];

  for (const rule of RULES) {
    for (let i = 0; i < lines.length; i++) {
      const matches = lines[i].matchAll(rule.regex);
      for (const match of matches) {
        // Skip comments
        const trimmed = lines[i].trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;

        fileIssues.push({
          rule: rule.id,
          severity: rule.severity,
          line: i + 1,
          col: match.index + 1,
          text: trimmed.substring(0, 80),
          suggestion: rule.suggestion,
        });
        summary[rule.id].count++;
        summary[rule.id].files.add(relPath);
      }
    }
  }

  if (fileIssues.length > 0) {
    totalFiles++;
    totalIssues += fileIssues.length;
    console.log(`\n📄 ${relPath}`);
    for (const issue of fileIssues) {
      const icon = issue.severity === 'warn' ? '⚠' : 'ℹ';
      console.log(
        `  ${icon} L${issue.line}:${issue.col}  [${issue.rule}] ${issue.text}`,
      );
    }
  }
}

// ── Summary ──────────────────────────────────────────────

console.log(
  '\n╔══════════════════════════════════════════════════════════════╗',
);
console.log('║              ProFish — RTL Audit Summary                     ║');
console.log(
  '╚══════════════════════════════════════════════════════════════╝\n',
);

console.log(`  Total files scanned: ${files.length}`);
console.log(`  Files with issues:   ${totalFiles}`);
console.log(`  Total issues:        ${totalIssues}\n`);

console.log('  Rule Breakdown:');
for (const rule of RULES) {
  const s = summary[rule.id];
  const badge = s.count === 0 ? '✓' : s.count <= 5 ? '~' : '✗';
  console.log(
    `    ${badge} ${rule.id.padEnd(22)} ${String(s.count).padStart(
      4,
    )} issues across ${s.files.size} files`,
  );
  if (s.count > 0) {
    console.log(`      → ${rule.desc}`);
  }
}

console.log('\n  RTL Guidelines:');
console.log(
  '    • Use marginStart/marginEnd instead of marginLeft/marginRight',
);
console.log(
  '    • Use paddingStart/paddingEnd instead of paddingLeft/paddingRight',
);
console.log(
  '    • Use start/end instead of left/right for absolute positioning',
);
console.log('    • Use writingDirection: "auto" for text views');
console.log('    • Flip directional icons with I18nManager.isRTL');
console.log('    • Test with: I18nManager.forceRTL(true); then reload\n');

if (totalIssues === 0) {
  console.log('🎉 All clear! No RTL issues detected.\n');
} else {
  console.log(
    `Found ${totalIssues} potential RTL issues. Review and fix as needed.\n`,
  );
}

process.exit(totalIssues > 10 ? 1 : 0);
