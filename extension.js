const vscode = require('vscode');

const CONSTANTS = {
    ICON_DATA_TABLE: "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMTRweCIgdmlld0JveD0iMCAtOTYwIDk2MCA5NjAiIHdpZHRoPSIxNHB4IiBmaWxsPSIjZmY4ODAwIj48cGF0aCBkPSJNMjE2LTE0NHEtMjkgMC01MC41LTIxLjVUMTQ0LTIxNnYtNTI4cTAtMjkuNyAyMS41LTUwLjg1UTE4Ny04MTYgMjE2LTgxNmg1MjhxMjkuNyAwIDUwLjg1IDIxLjE1UTgxNi03NzMuNyA4MTYtNzQ0djUyOHEwIDI5LTIxLjE1IDUwLjVUNzQ0LTE0NEgyMTZabTAtNDcyaDUyOHYtMTI4SDIxNnYxMjhabTAgMjAwaDUyOHYtMTI4SDIxNnYxMjhabTAgMjAwaDUyOHYtMTI4SDIxNnYxMjhabTQ4LTQyOHYtNzJoNzJ2NzJoLTcyWm0wIDIwMHYtNzJoNzJ2NzJoLTcyWm0wIDIwMHYtNzJoNzJ2NzJoLTcyWiIvPjwvc3ZnPg==",
    ICON_WEB: "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMTRweCIgdmlld0JveD0iMCAtOTYwIDk2MCA5NjAiIHdpZHRoPSIxNHB4IiBmaWxsPSIjNjY2NmY2Ij48cGF0aCBkPSJNMjE2LTE0NHEtMjkgMC01MC41LTIxLjVUMTQ0LTIxNnYtNTI4cTAtMjkuNyAyMS41LTUwLjg1UTE4Ny04MTYgMjE2LTgxNmg1MjhxMjkuNyAwIDUwLjg1IDIxLjE1UTgxNi03NzMuNyA4MTYtNzQ0djUyOHEwIDI5LTIxLjE1IDUwLjVUNzQ0LTE0NEgyMTZabTAtNzJoNTI4di0yNjRIMjE2djI2NFptMC0zMzZoNTI4di0xOTJIMjE2djE5MlptMjQwLTcyaDI0MHYtNzJINDU2djcyWm0tMjQwIDYwdi0xODAgMTgwWiIvPjwvc3ZnPg==",
    RECORD_PILL_BG: 'rgba(255, 136, 0, 0.6)',
    SITE_PILL_BG: 'rgba(102, 102, 246, 0.7)',
    PILLBORDER_BG: '1px solid rgba(128, 128, 128, 0.2)',
    PILL_BORDER_RADIUS: '3px',
    DEBOUNCE_MS: 250,
    INDENT_STR: "  "
};

// --- Decoration Types ---

const recordPillDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: CONSTANTS.RECORD_PILL_BG,
    border: CONSTANTS.PILLBORDER_BG,
    borderRadius: CONSTANTS.PILL_BORDER_RADIUS,
    before: {
        contentIconPath: vscode.Uri.parse(`data:image/svg+xml;base64,${CONSTANTS.ICON_DATA_TABLE}`),
        height: '12px',
        width: '12px',
    }
});

const sitePillDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: CONSTANTS.SITE_PILL_BG,
    border: CONSTANTS.PILLBORDER_BG,
    borderRadius: CONSTANTS.PILL_BORDER_RADIUS,
    before: {
        contentIconPath: vscode.Uri.parse(`data:image/svg+xml;base64,${CONSTANTS.ICON_WEB}`),
        height: '14px',
        width: '14px',
    }
});

const faintDecorationType = vscode.window.createTextEditorDecorationType({
    opacity: '0.35',
    letterSpacing: '-2.5px'
});

const boldDecorationType = vscode.window.createTextEditorDecorationType({
    fontWeight: 'bold'
});

// --- Auto Language Detection ---

const SAIL_DOMAINS = ['a', 'ri', 'local', 'fv', 'cons', 'rule', 'type', 'fn', 'recordType', 'site'];
const SAIL_TOKEN_REGEX = new RegExp(`(?:^|[^a-zA-Z0-9_])(${SAIL_DOMAINS.join('|')})!`, 'g');
const AUTO_DETECT_DEBOUNCE_MS = 300;

function looksLikeSail(text) {
    if (!text || text.length < 4) return false;
    const found = new Set();
    let total = 0;
    SAIL_TOKEN_REGEX.lastIndex = 0;
    let match;
    while ((match = SAIL_TOKEN_REGEX.exec(text))) {
        found.add(match[1]);
        total++;
        // Confident if two distinct domain prefixes OR three+ total occurrences
        if (found.size >= 2 || total >= 3) return true;
    }
    return false;
}

function isAutoDetectEnabled() {
    return vscode.workspace.getConfiguration('sail').get('autoDetect', true);
}

function tryAutoDetectSail(document) {
    if (!document || document.languageId !== 'plaintext') return;
    if (!isAutoDetectEnabled()) return;
    if (!looksLikeSail(document.getText())) return;
    vscode.languages.setTextDocumentLanguage(document, 'sail');
}

const detectTimers = new WeakMap();
function scheduleAutoDetect(document) {
    if (!document || document.languageId !== 'plaintext') return;
    const existing = detectTimers.get(document);
    if (existing) clearTimeout(existing);
    detectTimers.set(document, setTimeout(() => {
        detectTimers.delete(document);
        tryAutoDetectSail(document);
    }, AUTO_DETECT_DEBOUNCE_MS));
}

/**
 * Main Extension Logic
 */
function activate(context) {
    console.log('SAIL Formatter & Visualizer Active');

    // 1. Formatter Registration
    const formatter = vscode.languages.registerDocumentFormattingEditProvider('sail', {
        provideDocumentFormattingEdits(document) {
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(document.getText().length)
            );
            return [vscode.TextEdit.replace(fullRange, formatSAIL(document.getText()))];
        }
    });

    // 2. Visualizer Logic
    let activeEditor = vscode.window.activeTextEditor;
    let timeout;

    function triggerUpdateDecorations() {
        if (timeout) {
            clearTimeout(timeout);
            timeout = undefined;
        }
        timeout = setTimeout(updateDecorations, CONSTANTS.DEBOUNCE_MS);
    }

    function updateDecorations() {
        if (!activeEditor || activeEditor.document.languageId !== 'sail') return;

        const text = activeEditor.document.getText();

        // Distinct arrays for different pill types
        const recordRanges = [];
        const siteRanges = [];

        const faints = [];
        const bolds = [];

        /**
 * Generic Regex for RecordTypes and Sites
 * Group 1: Matches 'recordType! or 'site!
 * Group 2: Matches the entire content inside the quotes
 */
        const mainRegEx = /('(?:recordType|site)!)((?:(?!').)+)'/g;

        const doc = activeEditor.document;
        let match;
        while ((match = mainRegEx.exec(text))) {
            const fullMatchStart = match.index;
            const fullMatchEnd = fullMatchStart + match[0].length;

            const domainPrefix = match[1]; // e.g., 'recordType! or 'site!
            const contentStart = fullMatchStart + match[1].length;
            const contentStr = match[2];

            const range = new vscode.Range(doc.positionAt(fullMatchStart), doc.positionAt(fullMatchEnd));

            // 1. Determine which pill decoration to apply
            if (domainPrefix === "'recordType!") {
                recordRanges.push({ range });
            } else if (domainPrefix === "'site!") {
                siteRanges.push({ range });
            }

            // 2. Bold the prefix segment (e.g. 'recordType! or 'site!)
            const prefixRange = new vscode.Range(doc.positionAt(fullMatchStart), doc.positionAt(contentStart));
            bolds.push({ range: prefixRange });

            /**
             * Internal Scanner
             * Scans contentStr for UUIDs {uuid} and treats everything else as boldable text.
             */
            const internalRegex = /(\{[0-9a-fA-F-]+\})|([^{]+)/g;
            let subMatch;
            while ((subMatch = internalRegex.exec(contentStr))) {
                const subStart = contentStart + subMatch.index;
                const subEnd = subStart + subMatch[0].length;
                const subRange = new vscode.Range(doc.positionAt(subStart), doc.positionAt(subEnd));

                if (subMatch[1]) {
                    // It's a UUID: Make it faint
                    faints.push({ range: subRange });
                } else {
                    // It's readable text (domain, name, .fields., etc): Bold it
                    bolds.push({ range: subRange });
                }
            }
        }

        // Apply decorations
        activeEditor.setDecorations(recordPillDecorationType, recordRanges);
        activeEditor.setDecorations(sitePillDecorationType, siteRanges);
        activeEditor.setDecorations(faintDecorationType, faints);
        activeEditor.setDecorations(boldDecorationType, bolds);
    }

    // --- Event Listeners ---
    if (activeEditor) triggerUpdateDecorations();

    context.subscriptions.push(
        formatter,
        vscode.window.onDidChangeActiveTextEditor(editor => {
            activeEditor = editor;
            if (editor) triggerUpdateDecorations();
        }),
        vscode.workspace.onDidChangeTextDocument(event => {
            if (activeEditor && event.document === activeEditor.document) {
                triggerUpdateDecorations();
            }
            scheduleAutoDetect(event.document);
        }),
        vscode.workspace.onDidOpenTextDocument(scheduleAutoDetect)
    );

    // Check already-open documents on activation (e.g. an untitled buffer the user pasted into before the extension loaded)
    vscode.workspace.textDocuments.forEach(tryAutoDetectSail);
}

/**
 * SAIL Formatter Implementation
 */
function formatSAIL(code) {
    let output = "";
    let indentLevel = 0;
    let i = 0;
    let state = "normal";
    let quoteChar = "";

    const getIndent = () => "\n" + CONSTANTS.INDENT_STR.repeat(indentLevel);
    const trimTrailing = (str) => str.replace(/\s+$/, "");
    const skipWhitespace = (pos) => {
        while (code[pos + 1] && /\s/.test(code[pos + 1])) pos++;
        return pos;
    };

    while (i < code.length) {
        const char = code[i];
        const nextChar = code[i + 1] || "";

        // String State
        if (state === "string") {
            output += char;
            if (char === quoteChar && code[i - 1] !== '\\') {
                state = "normal";
                quoteChar = "";
            }
            i++; continue;
        }

        // Comment States
        if (state === "comment_block") {
            output += char;
            if (char === '*' && nextChar === '/') {
                output += '/';
                state = "normal";
                i++;
                output += getIndent();
            }
            i++; continue;
        }

        if (state === "comment_line") {
            output += char;
            if (char === '\n') {
                state = "normal";
                output += getIndent();
            }
            i++; continue;
        }

        // Entering States
        if (char === '"' || char === "'") {
            state = "string";
            quoteChar = char;
            output += char;
            i++; continue;
        }

        if (char === '/' && nextChar === '*') {
            if (output.endsWith(' ')) output = trimTrailing(output) + getIndent();
            state = "comment_block"; output += "/*"; i += 2; continue;
        }
        if (char === '/' && nextChar === '/') {
            if (output.endsWith(' ')) output = trimTrailing(output) + getIndent();
            state = "comment_line"; output += "//"; i += 2; continue;
        }

        // Structural Formatting
        if (char === '(' || char === '{') {
            output += char;
            indentLevel++;
            output += getIndent();
            i = skipWhitespace(i);
        }
        else if (char === ')' || char === '}') {
            indentLevel = Math.max(0, indentLevel - 1);
            output = trimTrailing(output);
            output += getIndent() + char;
        }
        else if (char === ',') {
            output += char;
            output += getIndent();
            i = skipWhitespace(i);
        }
        else if (char === ':') {
            output += char + " ";
            if (code[i + 1] === ' ') i++;
        }
        else if (/\s/.test(char)) {
            if (!/[\s\n]/.test(output.slice(-1))) {
                output += " ";
            }
        }
        else {
            output += char;
        }
        i++;
    }

    return output.trim();
}

function deactivate() { }

module.exports = { activate, deactivate };