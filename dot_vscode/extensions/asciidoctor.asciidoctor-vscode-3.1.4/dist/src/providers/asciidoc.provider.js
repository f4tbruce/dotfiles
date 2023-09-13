"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TargetPathCompletionProvider = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const createContext_1 = require("./createContext");
const file_1 = require("../util/file");
const macroWithTargetPathRx = /(include::|image::|image:)\S*/gi;
class TargetPathCompletionProvider {
    constructor(asciidocLoader) {
        this.asciidocLoader = asciidocLoader;
    }
    provideCompletionItems(textDocument, position) {
        return __awaiter(this, void 0, void 0, function* () {
            const context = (0, createContext_1.createContext)(textDocument, position);
            if (macroWithTargetPathRx.test(context.textFullLine)) {
                const documentText = context.document.getText();
                const pathExtractedFromMacroString = context.textFullLine.replace('include::', '').replace('image::', '').replace('image:', '');
                let entryDir = pathExtractedFromMacroString.slice(0, pathExtractedFromMacroString.lastIndexOf('/'));
                // use path defined in a variable used
                if (entryDir.startsWith('{')) {
                    const variableName = entryDir.replace('{', '').replace('}', '');
                    const match = documentText.match(new RegExp(`:${variableName}:.*`, 'g'));
                    if (match && match[0]) {
                        entryDir = match[0].replace(`:${variableName}: `, '');
                    }
                }
                const documentPath = context.document.uri.fsPath;
                let documentParentPath = documentPath.slice(0, documentPath.lastIndexOf('/'));
                if (context.textFullLine.includes('image:')) {
                    const imagesDirValue = (yield this.asciidocLoader.load(textDocument)).getAttribute('imagesdir', '');
                    if (imagesDirValue) {
                        documentParentPath = path.join(documentParentPath, imagesDirValue);
                    }
                }
                const searchPath = (0, file_1.getPathOfFolderToLookupFiles)(context.document.uri.fsPath, path.join(documentParentPath, entryDir));
                const childrenOfPath = yield (0, file_1.getChildrenOfPath)(searchPath);
                const items = (0, file_1.sortFilesAndDirectories)(childrenOfPath);
                const levelUpCompletionItem = {
                    label: '..',
                    kind: vscode.CompletionItemKind.Folder,
                    sortText: '10_..',
                };
                // TODO: we should use `document.getAttributes()` (and remove built-in / unnecessary / unrelated attributes)
                const globalVariableDefinitions = documentText.match(/:\S+:.*/g);
                let variablePathSubstitutions = [];
                // TODO: prevent editor.autoClosingBrackets at this point until finished inserting
                const editorConfig = vscode.workspace.getConfiguration('editor');
                const doAutoCloseBrackets = editorConfig.get('autoClosingBrackets') === 'always';
                if (globalVariableDefinitions) {
                    variablePathSubstitutions = globalVariableDefinitions.map((variableDef) => {
                        const label = variableDef.match(/:\S+:/g)[0].replace(/:/g, '');
                        if (label !== 'imagesdir') {
                            return {
                                label: `{${label}}`,
                                kind: vscode.CompletionItemKind.Variable,
                                sortText: `10_${label}`,
                                insertText: `{${label}${doAutoCloseBrackets ? '' : '}'}`, // } curly bracket will be closed automatically by default
                            };
                        }
                        return undefined;
                    }).filter((e) => e); // remove undefined
                }
                return [
                    levelUpCompletionItem,
                    ...variablePathSubstitutions,
                    ...items.map((child) => {
                        const result = createPathCompletionItem(child);
                        result.insertText = result.kind === vscode.CompletionItemKind.File ? child.file + '[]' : child.file;
                        if (result.kind === vscode.CompletionItemKind.Folder) {
                            result.command = {
                                command: 'default:type',
                                title: 'triggerSuggest',
                                arguments: [{ text: '/' }],
                            };
                        }
                        return result;
                    }),
                ];
            }
            return [];
        });
    }
}
exports.TargetPathCompletionProvider = TargetPathCompletionProvider;
function createPathCompletionItem(fileInfo) {
    return {
        label: fileInfo.file,
        kind: fileInfo.isFile ? vscode.CompletionItemKind.File : vscode.CompletionItemKind.Folder,
        sortText: `10_${fileInfo.file}`,
    };
}
//# sourceMappingURL=asciidoc.provider.js.map