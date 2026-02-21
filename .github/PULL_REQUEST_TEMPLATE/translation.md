---
name: '🌍 Translation Fix / Addition'
about: Suggest a translation correction or add missing translations
title: '[i18n] <language>: <brief description>'
labels: ['translation', 'i18n']
assignees: []
---

## Language

<!-- Which language file are you updating? e.g. de.json (German) -->

**Locale code**:
**Language name**:

## Type of Change

- [ ] Fix incorrect translation(s)
- [ ] Add missing translation(s) (marked `[TODO]`)
- [ ] Add new plural forms
- [ ] Fix formatting / variable placeholders
- [ ] Other (describe below)

## Changes Made

<!-- List the keys you changed and why -->

| Key           | Old Value  | New Value      | Reason                |
| ------------- | ---------- | -------------- | --------------------- |
| `example.key` | Wrong word | Corrected word | More natural phrasing |

## Verification

- [ ] I am a native speaker (or fluent) in this language
- [ ] I ran `node scripts/audit-i18n.js` and my locale passes
- [ ] All `{{variable}}` placeholders are preserved
- [ ] String lengths are reasonable (not 3× longer than English)
- [ ] I tested the strings in the app (optional but appreciated)

## Context

<!-- Any additional context about your translation choices -->

## Screenshots (optional)

<!-- If you tested in the app, screenshots showing the translated text are helpful -->
