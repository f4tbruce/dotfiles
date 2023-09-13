"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsciidocTextDocument = void 0;
const vscode_1 = __importDefault(require("vscode"));
const path_1 = __importDefault(require("path"));
class AsciidocTextDocument {
    constructor() {
    }
    static fromTextDocument(textDocument) {
        const asciidocTextDocument = new AsciidocTextDocument();
        asciidocTextDocument.uri = textDocument.uri;
        return asciidocTextDocument;
    }
    /**
     * Get the base directory.
     * @private
     */
    getBaseDir() {
        const useWorkspaceAsBaseDir = vscode_1.default.workspace.getConfiguration('asciidoc', null).get('useWorkspaceRootAsBaseDirectory');
        if (useWorkspaceAsBaseDir) {
            const workspaceFolder = vscode_1.default.workspace.getWorkspaceFolder(this.uri);
            if (workspaceFolder) {
                return workspaceFolder.uri.fsPath;
            }
        }
        return 'browser' in process && process.browser === true
            ? undefined
            : path_1.default.dirname(path_1.default.resolve(this.uri.fsPath));
    }
}
exports.AsciidocTextDocument = AsciidocTextDocument;
//# sourceMappingURL=asciidocTextDocument.js.map