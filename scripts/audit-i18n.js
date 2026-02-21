#!/usr/bin/env node
/**
 * i18n Translation Key Audit — ProFish
 *
 * Compares all locale files against the reference locale (en.json)
 * and reports missing, extra, and untranslated keys.
 *
 * Usage:
 *   node scripts/audit-i18n.js
 *   node scripts/audit-i18n.js --fix  (adds missing keys with "TODO" placeholders)
 *
 * Exit code: 0 if all locales are complete, 1 if issues found.
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.resolve(__dirname, '../src/locales');
const REFERENCE = 'en.json';
const FIX_MODE = process.argv.includes('--fix');

// ── Helpers ─────────────────────────────────────────

/** Flatten nested JSON into dot-notation keys */
function flattenKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

/** Set a deep key in a nested object */
function setDeep(obj, dotKey, value) {
  const parts = dotKey.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

/** Get a deep value from nested object */
function getDeep(obj, dotKey) {
  const parts = dotKey.split('.');
  let current = obj;
  for (const part of parts) {
    if (!current || typeof current !== 'object') return undefined;
    current = current[part];
  }
  return current;
}

// ── Main ────────────────────────────────────────────

function main() {
  // Load reference locale
  const refPath = path.join(LOCALES_DIR, REFERENCE);
  if (!fs.existsSync(refPath)) {
    console.error(`❌ Reference file not found: ${refPath}`);
    process.exit(1);
  }

  const refData = JSON.parse(fs.readFileSync(refPath, 'utf-8'));
  const refKeys = flattenKeys(refData);
  const refKeySet = new Set(refKeys);

  console.log(`\n📋 ProFish i18n Audit`);
  console.log(`${'─'.repeat(50)}`);
  console.log(`Reference: ${REFERENCE} (${refKeys.length} keys)\n`);

  // Load all locale files
  const files = fs
    .readdirSync(LOCALES_DIR)
    .filter(f => f.endsWith('.json') && f !== REFERENCE);
  files.sort();

  let totalIssues = 0;
  const summary = [];

  for (const file of files) {
    const filePath = path.join(LOCALES_DIR, file);
    let data;
    try {
      data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      console.error(`  ❌ ${file}: Parse error — ${e.message}`);
      totalIssues++;
      continue;
    }

    const localeKeys = flattenKeys(data);
    const localeKeySet = new Set(localeKeys);

    const missing = refKeys.filter(k => !localeKeySet.has(k));
    const extra = localeKeys.filter(k => !refKeySet.has(k));

    // Check for untranslated (same as English)
    const untranslated = localeKeys.filter(k => {
      const refVal = getDeep(refData, k);
      const locVal = getDeep(data, k);
      return (
        typeof refVal === 'string' &&
        typeof locVal === 'string' &&
        refVal === locVal &&
        refVal.length > 3 // Skip short strings like "OK"
      );
    });

    const coverage = ((localeKeys.length / refKeys.length) * 100).toFixed(1);
    const issues = missing.length + extra.length;
    totalIssues += issues;

    const status =
      missing.length === 0 && extra.length === 0
        ? '✅'
        : missing.length > 10
        ? '🔴'
        : '🟡';

    summary.push({
      file,
      keys: localeKeys.length,
      missing: missing.length,
      extra: extra.length,
      untranslated: untranslated.length,
      coverage,
      status,
    });

    // Detailed output for files with issues
    if (missing.length > 0 || extra.length > 0) {
      console.log(`${status} ${file} — ${coverage}% coverage`);
      if (missing.length > 0) {
        console.log(`   Missing (${missing.length}):`);
        missing.slice(0, 10).forEach(k => console.log(`     - ${k}`));
        if (missing.length > 10)
          console.log(`     ... and ${missing.length - 10} more`);
      }
      if (extra.length > 0) {
        console.log(`   Extra (${extra.length}):`);
        extra.slice(0, 5).forEach(k => console.log(`     + ${k}`));
        if (extra.length > 5)
          console.log(`     ... and ${extra.length - 5} more`);
      }
      if (untranslated.length > 5) {
        console.log(`   ⚠️  ${untranslated.length} possibly untranslated keys`);
      }
      console.log('');
    }

    // Fix mode: add missing keys with TODO placeholders
    if (FIX_MODE && missing.length > 0) {
      for (const key of missing) {
        const refVal = getDeep(refData, key);
        setDeep(data, key, `[TODO] ${refVal}`);
      }
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
      console.log(
        `   🔧 Fixed: added ${missing.length} TODO placeholders to ${file}`,
      );
    }
  }

  // Summary table
  console.log(`\n${'─'.repeat(50)}`);
  console.log('Summary:');
  console.log(`${'─'.repeat(50)}`);
  console.log(
    `${'Locale'.padEnd(14)} ${'Keys'.padStart(5)} ${'Miss'.padStart(
      5,
    )} ${'Extra'.padStart(5)} ${'Untrans'.padStart(8)} ${'Cover'.padStart(7)}`,
  );
  console.log(`${'─'.repeat(50)}`);

  for (const s of summary) {
    console.log(
      `${s.status} ${s.file.replace('.json', '').padEnd(11)} ${String(
        s.keys,
      ).padStart(5)} ${String(s.missing).padStart(5)} ${String(
        s.extra,
      ).padStart(5)} ${String(s.untranslated).padStart(8)} ${(
        s.coverage + '%'
      ).padStart(7)}`,
    );
  }

  const complete = summary.filter(s => s.missing === 0 && s.extra === 0).length;
  console.log(
    `\n${complete}/${files.length} locales fully synced with ${REFERENCE}`,
  );
  console.log(`${totalIssues} total issues found.`);

  if (FIX_MODE && totalIssues > 0) {
    console.log(
      '\n🔧 Fix mode: TODO placeholders added. Search for "[TODO]" in locale files.',
    );
  }

  process.exit(totalIssues > 0 ? 1 : 0);
}

main();
