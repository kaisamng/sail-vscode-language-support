# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A VSCode extension providing syntax highlighting, formatting, and visual decorations for Appian SAIL (Service-Oriented Application Integration Language) expressions. Distributed as a `.vsix` file (not on the marketplace).

## Development Commands

```bash
npm install                   # Install dependencies (mainly VSCode types)
npx @vscode/vsce package      # Package extension into .vsix for distribution
```

**Testing the extension locally:** Open the project in VSCode and press F5 (or use the "Run Extension" launch config in `.vscode/launch.json`). This opens an Extension Development Host window with the extension loaded. There are no automated tests.

**Releasing:** Push a tag matching `v*` (e.g., `git tag v0.2.0 && git push origin v0.2.0`) to trigger the GitHub Actions workflow that packages and publishes a GitHub Release.

## Architecture

The extension is a single JavaScript file (`extension.js`) with two main features:

### 1. Document Formatter
Registered as a `vscode.languages.registerDocumentFormattingEditProvider` for the `sail` language. Formats SAIL expressions with proper indentation.

### 2. Pillbox Decorations
Applies visual "pill" decorations to Appian object references in the editor:
- **Record pills** (orange + database icon): matches `'recordType!...'` patterns
- **Site pills** (purple + globe icon): matches `'site!...'` patterns
- Within each pill, UUIDs are fainted and readable names are bolded

The decoration logic uses a 250ms debounce timeout and fires on text change, editor change, and activation. The regex `/('(?:recordType|site)!)((?:(?!').)+)'/g` drives the matching.

### Static Contributions (via `package.json`)

- **TextMate grammar** (`syntaxes/sail.tmLanguage.json`): Defines syntax scopes for SAIL keywords, domains (`ri!`, `local!`, `fv!`, etc.), functions (`a!`, `rule!`, `type!`, `fn!`), constants (`cons!`), comments, and strings.
- **Language config** (`language-configuration.json`): Bracket pairs, auto-closing, and comment syntax.
- **Themes** (`themes/`): Light and dark themes with SAIL-specific token color overrides, applied via `configurationDefaults` in `package.json`.

### Activation

The extension activates only on files with language ID `sail`. Users must manually set the language to "SAIL" in VSCode since there is no file extension association yet.
