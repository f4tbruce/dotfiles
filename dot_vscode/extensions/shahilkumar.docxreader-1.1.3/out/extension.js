"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
const mammoth = require("mammoth");
const odt2html = require('odt2html');
async function renderDocx(docxPath, panel) {
    // convert the docx to html
    // get font from docxreader.font setting
    const font = vscode.workspace.getConfiguration('docxreader').get('font') || "Arial";
    console.log(font);
    if (docxPath.endsWith(".odt")) {
        odt2html.toHTML({
            path: docxPath,
        })
            .then(function (html) {
            // adding font to html
            html += `<style>body {font-family: ${font};}</style>`;
            panel.webview.html = html;
        })
            .catch(function (err) {
            console.error(err);
        });
    }
    else {
        const result = await mammoth.convertToHtml({ path: docxPath });
        var html = result.value; // The generated HTML
        // adding font to html
        html += `<style>body {font-family: ${font};}</style>`;
        panel.webview.html = html;
    }
}
// create a custom editor panel for docx files and register the command docxreader.docxToHtml
class DocxEditorProvider {
    constructor() {
        this._onDidChangeCustomDocument = new vscode.EventEmitter();
        this.onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;
    }
    async resolveCustomEditor(document, webviewPanel, token) {
        // Render the initial content for the webview
        renderDocx(document.uri.fsPath, webviewPanel);
    }
    saveCustomDocument(document, cancellation) {
        throw new Error('Not Supported');
    }
    saveCustomDocumentAs(document, destination, cancellation) {
        throw new Error('Not Supported');
    }
    revertCustomDocument(document, cancellation) {
        throw new Error('Not Supported');
    }
    backupCustomDocument(document, context, cancellation) {
        throw new Error('Not Supported');
    }
    openCustomDocument(uri, openContext, token) {
        return {
            uri,
            dispose() { }
        };
    }
}
function activate(context) {
    // Register the custom editor provider
    context.subscriptions.push(vscode.window.registerCustomEditorProvider('docxreader.docxEditor', new DocxEditorProvider(), {
        webviewOptions: {
            retainContextWhenHidden: true,
        },
        supportsMultipleEditorsPerDocument: false
    }));
    // Add a command to open the user's configuration
    context.subscriptions.push(vscode.commands.registerCommand('docxreader.openConfig', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', '@ext:shahilkumar.docxreader');
    }));
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map