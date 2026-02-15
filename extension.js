const vscode = require('vscode');

const dataTable_Icon64 = "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjRweCIgdmlld0JveD0iMCAtOTYwIDk2MCA5NjAiIHdpZHRoPSIyNHB4IiBmaWxsPSIjRkZGRkZGIj48cGF0aCBkPSJNMjAwLTEyMHEtMzMgMC01Ni41LTIzLjVUMTIwLTIwMHYtNTYwcTAtMzMgMjMuNS01Ni41VDIwMC04NDBoNTYwcTMzIDAgNTYuNSAyMy41VDg0MC03NjB2NTYwcTAgMzMtMjMuNSA1Ni41VDc2MC0xMjBIMjAwWm0wLTUwN2g1NjB2LTEzM0gyMDB2MTMzWm0wIDIxNGg1NjB2LTEzNEgyMDB2MTM0Wm0wIDIxM2g1NjB2LTEzM0gyMDB2MTMzWm00MC00NTR2LTgwaDgwdjgwaC04MFptMCAyMTR2LTgwaDgwdjgwaC04MFptMCAyMTR2LTgwaDgwdjgwaC04MFoiLz48L3N2Zz4=";
// --- Decoration Types ---

// 1. The Container (The "Pill")
const pillDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 136, 0, 0.56)', // Subtle grey background
    border: '1px solid rgba(128, 128, 128, 0.2)',
    borderLeft: 'none',             // Remove left border (Icon covers this)
    borderRadius: '0px 4px 4px 0px', // Round only the right side
    isWholeLine: false,
    before: {
        // This parses the Base64 string into a usable icon URI
        contentIconPath: vscode.Uri.parse(`data:image/svg+xml;base64,${dataTable_Icon64}`),

        // Apply Background/Border to the ICON too, so it looks like part of the box
        backgroundColor: 'rgba(255, 136, 0, 0.56)',
        border: '1px solid rgba(128, 128, 128, 0.2)',
        color: 'rgb(255, 255, 255)',
        // borderRight: 'none',             // Remove right border (Text covers this)
        borderRadius: '4px 0px 0px 4px', // Round only the left side
        width: '1.5em',
        height: '1.5em',
        // margin: '0 4px -4px 4px', // Tweak margins to line up with text
        verticalAlign: 'middle'   // Fixes the vertical alignment issue
    }
});


// 2. The "Ghost" Text (Hiding the UUIDs)
const faintDecorationType = vscode.window.createTextEditorDecorationType({
    opacity: '0.25', // Make UUIDs very faint
    letterSpacing: '-2.5px' // Optional: squish them slightly
});

// 3. The Highlight (Making names readable)
const boldDecorationType = vscode.window.createTextEditorDecorationType({
    fontWeight: 'bold',
    color: '', // Leave empty to inherit syntax highlighting color, or set specific color
});


function activate(context) {
    console.log('SAIL Formatter & Visualizer Active');

    // 1. Register Formatter
    vscode.languages.registerDocumentFormattingEditProvider('sail', {
        provideDocumentFormattingEdits(document) {
            const text = document.getText();
            const formatted = formatSAIL(text);
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(text.length)
            );
            return [vscode.TextEdit.replace(fullRange, formatted)];
        }
    });

    // 2. Register Visualizer (Decorations)
    let activeEditor = vscode.window.activeTextEditor;

    function updateDecorations() {
        if (!activeEditor) return;
        const text = activeEditor.document.getText();

        const pills = [];
        const faints = [];
        const bolds = [];

        // Regex to find: 'domain!{uuid}Name.fields.{uuid}FieldName'
        // Group 1: 'domain! (includes leading quote for correct offset calculation)
        // Group 2: {uuid}
        // Group 3: Name (matches until it hits .fields. or ')
        // Group 4: Field UUID (optional)
        // Group 5: Field Name (optional)
        const regEx = /('\w+!)(\{[0-9a-fA-F-]+\})((?:(?!\.fields\.|').)+)(?:\.fields\.(\{[0-9a-fA-F-]+\})([^']+))?'/g;

        let match;
        while ((match = regEx.exec(text))) {
            const matchStart = match.index;
            const matchEnd = matchStart + match[0].length;

            // 1. Create the Pill Container
            pills.push({ range: new vscode.Range(activeEditor.document.positionAt(matchStart), activeEditor.document.positionAt(matchEnd)) });

            // 2. Hide the Main UUID (Group 2)
            const uuidStart = matchStart + match[1].length;
            const uuidEnd = uuidStart + match[2].length;
            faints.push({ range: new vscode.Range(activeEditor.document.positionAt(uuidStart), activeEditor.document.positionAt(uuidEnd)) });

            // 3. Bold the Main Name (Group 3)
            const nameStart = uuidEnd;
            const nameEnd = nameStart + match[3].length;
            bolds.push({ range: new vscode.Range(activeEditor.document.positionAt(nameStart), activeEditor.document.positionAt(nameEnd)) });

            // 4. Handle Optional Field Reference
            if (match[4]) {
                // The literal string ".fields." is 8 chars long.
                // It sits between Main Name and Field UUID.

                // Start of Field UUID (Group 4)
                // Calculation: matchStart + G1 + G2 + G3 + ".fields."
                const fieldUuidOffset = nameEnd + 8;
                const fieldUuidEnd = fieldUuidOffset + match[4].length;
                faints.push({ range: new vscode.Range(activeEditor.document.positionAt(fieldUuidOffset), activeEditor.document.positionAt(fieldUuidEnd)) });

                // Start of Field Name (Group 5)
                const fieldNameStart = fieldUuidEnd;
                const fieldNameEnd = fieldNameStart + match[5].length;
                bolds.push({ range: new vscode.Range(activeEditor.document.positionAt(fieldNameStart), activeEditor.document.positionAt(fieldNameEnd)) });
            }
        }

        activeEditor.setDecorations(pillDecorationType, pills);
        activeEditor.setDecorations(faintDecorationType, faints);
        activeEditor.setDecorations(boldDecorationType, bolds);
    }

    // Trigger updates
    if (activeEditor) updateDecorations();

    // Update when switching tabs
    vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (editor) updateDecorations();
    }, null, context.subscriptions);

    // Update when typing
    vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            updateDecorations();
        }
    }, null, context.subscriptions);
}

// --- Formatter Logic ---
function formatSAIL(code) {
    let output = "";
    let indentLevel = 0;
    const indentStr = "  ";
    let i = 0;
    const len = code.length;
    let state = "normal";
    let quoteChar = ""; // NEW: Tracks if we are inside ' or ", since single quotes are used for literal object refs

    const addIndent = () => "\n" + indentStr.repeat(indentLevel);
    const trimLastNewline = (str) => str.replace(/\s+$/, "");

    while (i < len) {
        let char = code[i];
        let nextChar = code[i + 1] || "";

        // 1. Handle Strings (Single OR Double quoted)
        if (state === "string") {
            output += char;
            // Only exit string state if we hit the SAME quote char that started it
            if (char === quoteChar && code[i - 1] !== '\\') {
                state = "normal";
                quoteChar = "";
            }
            i++; continue;
        }

        if (state === "comment_block") {
            output += char;
            if (char === '*' && nextChar === '/') {
                output += '/';
                state = "normal";
                i++;
                output += addIndent();
            }
            i++; continue;
        }

        if (state === "comment_line") {
            output += char;
            if (char === '\n') {
                state = "normal";
                output += indentStr.repeat(indentLevel);
            }
            i++; continue;
        }

        // 2. Detect Start of String (Single OR Double)
        if (char === '"' || char === "'") {
            state = "string";
            quoteChar = char; // Remember which quote we used
            output += char;
            i++; continue;
        }

        if (char === '/' && nextChar === '*') {
            state = "comment_block"; output += "/*"; i += 2; continue;
        }
        if (char === '/' && nextChar === '/') {
            state = "comment_line"; output += "//"; i += 2; continue;
        }

        if (char === '(' || char === '{') {
            output += char;
            indentLevel++;
            output += addIndent();
            while (code[i + 1] && /\s/.test(code[i + 1])) i++;
        }
        else if (char === ')' || char === '}') {
            indentLevel = Math.max(0, indentLevel - 1);
            output = trimLastNewline(output);
            output += addIndent() + char;
        }
        else if (char === ',') {
            output += char;
            output += addIndent();
            while (code[i + 1] && /\s/.test(code[i + 1])) i++;
        }
        else if (char === ':') {
            output += char + " ";
            if (code[i + 1] === ' ') i++;
        }
        else if (/\s/.test(char)) {
            if (output.slice(-1) !== ' ' && output.slice(-1) !== '\n') {
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