const vscode = require('vscode');

const CONSTANTS = {
    ICON_DATA_TABLE: "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjBweCIgdmlld0JveD0iMCAtOTYwIDk2MCA5NjAiIHdpZHRoPSIyMHB4IiBmaWxsPSIjZmY4ODAwIj48cGF0aCBkPSJNMjE2LTE0NHEtMjkgMC01MC41LTIxLjVUMTQ0LTIxNnYtNTI4cTAtMjkuNyAyMS41LTUwLjg1UTE4Ny04MTYgMjE2LTgxNmg1MjhxMjkuNyAwIDUwLjg1IDIxLjE1UTgxNi03NzMuNyA4MTYtNzQ0djUyOHEwIDI5LTIxLjE1IDUwLjVUNzQ0LTE0NEgyMTZabTAtNDcyaDUyOHYtMTI4SDIxNnYxMjhabTAgMjAwaDUyOHYtMTI4SDIxNnYxMjhabTAgMjAwaDUyOHYtMTI4SDIxNnYxMjhabTQ4LTQyOHYtNzJoNzJ2NzJoLTcyWm0wIDIwMHYtNzJoNzJ2NzJoLTcyWm0wIDIwMHYtNzJoNzJ2NzJoLTcyWiIvPjwvc3ZnPg==",
    ICON_WEB: "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjBweCIgdmlld0JveD0iMCAtOTYwIDk2MCA5NjAiIHdpZHRoPSIyMHB4IiBmaWxsPSIjNjY2NmY2Ij48cGF0aCBkPSJNMjE2LTE0NHEtMjkgMC01MC41LTIxLjVUMTQ0LTIxNnYtNTI4cTAtMjkuNyAyMS41LTUwLjg1UTE4Ny04MTYgMjE2LTgxNmg1MjhxMjkuNyAwIDUwLjg1IDIxLjE1UTgxNi03NzMuNyA4MTYtNzQ0djUyOHEwIDI5LTIxLjE1IDUwLjVUNzQ0LTE0NEgyMTZabTAtNzJoNTI4di0yNjRIMjE2djI2NFptMC0zMzZoNTI4di0xOTJIMjE2djE5MlptMjQwLTcyaDI0MHYtNzJINDU2djcyWm0tMjQwIDYwdi0xODAgMTgwWiIvPjwvc3ZnPg==",
    RECORD_PILL_BG: 'rgba(255, 136, 0, 0.6)',
    SITE_PILL_BG: 'rgba(102, 102, 246, 0.7)',
    PILLBORDER_BG: '1px solid rgba(128, 128, 128, 0.2)',
    ICON_HEIGHT_WIDTH: '1.1em',
    DEBOUNCE_MS: 250,
    INDENT_STR: "  "
};

// --- Decoration Types ---

const recordPillDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: CONSTANTS.RECORD_PILL_BG,
    border: CONSTANTS.PILLBORDER_BG,
    before: {
        contentIconPath: vscode.Uri.parse(`data:image/svg+xml;base64,${CONSTANTS.ICON_DATA_TABLE}`),
    }
});

const sitePillDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: CONSTANTS.SITE_PILL_BG,
    border: CONSTANTS.PILLBORDER_BG,
    before: {
        contentIconPath: vscode.Uri.parse(`data:image/svg+xml;base64,${CONSTANTS.ICON_WEB}`),
    }
});

const faintDecorationType = vscode.window.createTextEditorDecorationType({
    opacity: '0.35',
    letterSpacing: '-2.5px'
});

const boldDecorationType = vscode.window.createTextEditorDecorationType({
    fontWeight: 'bold'
});

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
    let timeout = undefined;

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

        let match;
        while ((match = mainRegEx.exec(text))) {
            const doc = activeEditor.document;
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
                } else if (subMatch[2]) {
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
        })
    );
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
            state = "comment_block"; output += "/*"; i += 2; continue;
        }
        if (char === '/' && nextChar === '/') {
            state = "comment_line"; output += "//"; i += 2; continue;
        }

        // Structural Formatting
        if (char === '(' || char === '{') {
            output += char;
            indentLevel++;
            output += getIndent();
            while (code[i + 1] && /\s/.test(code[i + 1])) i++;
        }
        else if (char === ')' || char === '}') {
            indentLevel = Math.max(0, indentLevel - 1);
            output = trimTrailing(output);
            output += getIndent() + char;
        }
        else if (char === ',') {
            output += char;
            output += getIndent();
            while (code[i + 1] && /\s/.test(code[i + 1])) i++;
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