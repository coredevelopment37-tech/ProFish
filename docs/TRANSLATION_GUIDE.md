# Community Translation Contribution Guide

Thank you for helping translate ProFish into more languages! 🌍🐟

## How to Contribute

### 1. Find Your Locale File

Locale files are in `src/locales/`. Each language has a JSON file:

```
src/locales/
├── en.json      # English (source of truth)
├── sv.json      # Swedish
├── no.json      # Norwegian
├── da.json      # Danish
├── fi.json      # Finnish
├── de.json      # German
├── fr.json      # French
├── es.json      # Spanish
├── it.json      # Italian
├── pt-BR.json   # Portuguese (Brazil)
├── nl.json      # Dutch
├── pl.json      # Polish
├── cs.json      # Czech
├── ru.json      # Russian
├── tr.json      # Turkish
├── ar.json      # Arabic
├── hi.json      # Hindi
├── ja.json      # Japanese
├── ko.json      # Korean
├── th.json      # Thai
├── vi.json      # Vietnamese
├── zh-CN.json   # Chinese (Simplified)
├── zh-TW.json   # Chinese (Traditional)
└── ms.json      # Malay
```

### 2. Fork & Branch

```bash
git fork https://github.com/coredevelopment37-tech/ProFish
git checkout -b locale/fix-<language-code>
# Example: locale/fix-de
```

### 3. Edit Your Locale File

- Open `src/locales/<your-language>.json`
- Find keys marked with `[TODO]` — these need translation
- Compare with `en.json` for the source English text
- Translate naturally — don't translate literally if it doesn't sound right

### 4. Run the Audit Script

```bash
node scripts/audit-i18n.js
```

This will tell you:

- **Missing keys**: present in `en.json` but missing in your locale
- **Extra keys**: in your locale but not in `en.json` (could be typos)
- **Untranslated**: still contain `[TODO]` placeholder text

### 5. Open a Pull Request

Use the PR template below (auto-loaded when you open a PR).

---

## Translation Guidelines

| Do                                      | Don't                                   |
| --------------------------------------- | --------------------------------------- |
| Use natural phrasing for your language  | Translate word-for-word from English    |
| Keep `{{variable}}` placeholders intact | Modify or remove `{{variable}}` markers |
| Use formal/polite form where standard   | Use slang or overly casual language     |
| Keep fishing terminology accurate       | Invent fish names — research them       |
| Match string length when possible       | Make strings 3× longer than English     |
| Test RTL layout for Arabic/Hebrew       | Assume LTR layout works for all         |

### Variable Placeholders

Strings may contain `{{variableName}}` placeholders. **Keep them exactly as-is**:

```json
{
  "catches.count": "{{count}} catches logged",
  "fishcast.score": "FishCast Score: {{score}}"
}
```

For Arabic: `"{{count}} صيد مسجلة"` ✓

### Plural Forms

Some keys have `.one` / `.other` suffixes for pluralization:

```json
{
  "catches.count.one": "{{count}} catch",
  "catches.count.other": "{{count}} catches"
}
```

Add pluralization rules for your language if needed (e.g., Russian has `.one`, `.few`, `.many`).

---

## Questions?

- Open an issue with the `translation` label
- Tag `@coredevelopment37-tech` for review
- Join our Discord #translations channel
