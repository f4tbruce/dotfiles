"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocxEditorProvider = void 0;
const vscode = require("vscode");
const renderDocx = require('./renderDocx');
// create a customeditor provider
class DocxEditorProvider {
    static register(context) {
        const provider = new DocxEditorProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(DocxEditorProvider.viewType, provider);
        return providerRegistration;
    }
    constructor(context) {
        this.context = context;
    }
    async resolveCustomTextEditor(document, webviewPanel, token) {
        // render the docx file
        renderDocx(document.uri.fsPath, webviewPanel);
    }
}
exports.DocxEditorProvider = DocxEditorProvider;
DocxEditorProvider.viewType = 'docxreader.openDocx';
//# sourceMappingURL=Editor.js.map