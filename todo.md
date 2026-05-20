# TODO / Known Issues

## Bugs

### [HIGH] Decoration types never disposed (resource leak)
`recordPillDecorationType`, `sitePillDecorationType`, `faintDecorationType`, and `boldDecorationType` are created at module scope in `extension.js` (lines 16–45), outside of `activate`. They are never pushed into `context.subscriptions` and never disposed when the extension deactivates. The empty `deactivate()` at line 265 reflects this.

**Fix:** Move decoration type creation inside `activate` and register them:
```js
context.subscriptions.push(recordPillDecorationType, sitePillDecorationType, faintDecorationType, boldDecorationType);
```

---

### [MEDIUM] Formatter escape-sequence detection broken for double-backslash
`extension.js` line 187:
```js
if (char === quoteChar && code[i - 1] !== '\\') {
```
This incorrectly treats `"\\"` as an escaped quote — the backslash is itself escaped, so the quote actually closes the string. Need to count consecutive backslashes and check parity.

---

### [MEDIUM] Dark theme operator color is near-invisible
`themes/sail-theme-dark.json` line 47: `keyword.operator` foreground is `#3f3f3f` (near-black) on a dark background (`#1e1e1e`). This is copy-pasted from the light theme without adjustment. Operators are essentially invisible in dark mode.

---

### [LOW] Pending debounce timeout not cleared on deactivation
`extension.js` line 66: `let timeout;` is never cleared when the extension deactivates. If a keystroke fires and deactivation happens within the 250ms window, `updateDecorations` runs against a stale `activeEditor`.

---

## Completeness

### [MEDIUM] Single-quoted strings not tokenized in grammar
`syntaxes/sail.tmLanguage.json` lines 44–53 only defines double-quoted strings (`"..."`). SAIL uses single-quoted strings extensively (e.g., `'recordType!...'`, `'site!...'`). Without a single-quote string rule, their content is not highlighted as strings and other rules (parameters, operators) can incorrectly match inside them.

---

### [LOW] No auto-closing pair for single quotes
`language-configuration.json` `autoClosingPairs` includes `"` but not `'`. Given SAIL's heavy use of single-quoted strings, this is a usability gap.

---

## Orphaned / Dead Code

### [LOW] Three theme scopes have no grammar counterpart
These scopes are defined in both theme files and `package.json` `configurationDefaults`, but no pattern in `sail.tmLanguage.json` ever emits them:

| Scope | Files |
|---|---|
| `keyword.other.special-method` | both themes, package.json |
| `meta.class` | both themes, package.json |
| `invalid.deprecated` | both themes, package.json |

These rules are dead and should either be removed or backed by grammar patterns.

---

## Configuration

### [LOW] `[*Dark*]` nesting in `configurationDefaults` has no effect
`package.json` lines 144–156 nest a `[*Dark*]` theme filter inside the `[sail]` language context inside `editor.tokenColorCustomizations`. VSCode does not support this nesting — the dark-mode override for `entity.name.function.appian` and `entity.name.function.generic` is silently ignored.

---

## Performance

### [LOW] Repeated `positionAt()` calls are O(n) each
`extension.js` lines 105, 115, 127: `doc.positionAt()` scans from document start to find the line/character for a given offset. It is called 3–5 times per regex match. For files with many pill matches, consider precomputing line-start offsets once and doing a binary search instead.
