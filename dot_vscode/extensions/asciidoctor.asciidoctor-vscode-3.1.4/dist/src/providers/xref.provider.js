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
exports.provideCompletionItems = exports.xrefProvider = void 0;
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const createContext_1 = require("./createContext");
exports.xrefProvider = {
    provideCompletionItems,
};
function provideCompletionItems(document, position) {
    return __awaiter(this, void 0, void 0, function* () {
        const context = (0, createContext_1.createContext)(document, position);
        if (shouldProvide(context, 'xref:')) {
            return provideCrossRef(context);
        }
        else if (shouldProvide(context, '<<')) {
            return provideInternalRef(context);
        }
        else {
            return Promise.resolve([]);
        }
    });
}
exports.provideCompletionItems = provideCompletionItems;
/**
 * Checks if we should provide any CompletionItems
 * @param context
 */
function shouldProvide(context, keyword) {
    const occurence = context.textFullLine.indexOf(keyword, context.position.character - keyword.length);
    return occurence === context.position.character - keyword.length;
}
function getIdsFromFile(file) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield vscode.workspace.fs.readFile(file);
        const content = Buffer.from(data).toString('utf8');
        const labelsFromLegacyBlock = yield getLabelsFromLegacyBlock(content);
        const labelsFromShorthandNotation = yield getLabelsFromShorthandNotation(content);
        const labelsFromLonghandNotation = yield getLabelsFromLonghandNotation(content);
        return labelsFromLegacyBlock.concat(labelsFromShorthandNotation, labelsFromLonghandNotation);
    });
}
function getLabelsFromLonghandNotation(content) {
    return __awaiter(this, void 0, void 0, function* () {
        const regex = /\[id=(\w+)\]/g;
        const matched = content.match(regex);
        if (matched) {
            return matched.map((result) => result.replace('[id=', '').replace(']', ''));
        }
        return [];
    });
}
function getLabelsFromShorthandNotation(content) {
    return __awaiter(this, void 0, void 0, function* () {
        const regex = /\[#(\w+)\]/g;
        const matched = content.match(regex);
        if (matched) {
            return matched.map((result) => result.replace('[#', '').replace(']', ''));
        }
        return [];
    });
}
function getLabelsFromLegacyBlock(content) {
    return __awaiter(this, void 0, void 0, function* () {
        const regex = /\[\[(\w+)\]\]/g;
        const matched = content.match(regex);
        if (matched) {
            return matched.map((result) => result.replace('[[', '').replace(']]', ''));
        }
        return [];
    });
}
/**
 * Provide Completion Items
 */
function provideCrossRef(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const { textFullLine, position } = context;
        const indexOfNextWhiteSpace = textFullLine.includes(' ', position.character)
            ? textFullLine.indexOf(' ', position.character)
            : textFullLine.length;
        //Find the text between citenp: and the next whitespace character
        const search = textFullLine.substring(textFullLine.lastIndexOf(':', position.character + 1) + 1, indexOfNextWhiteSpace);
        const completionItems = [];
        const workspacesAdocFiles = yield vscode.workspace.findFiles('**/*.adoc');
        for (const adocFile of workspacesAdocFiles) {
            const labels = yield getIdsFromFile(adocFile);
            for (const label of labels) {
                if (label.match(search)) {
                    if (adocFile.fsPath === context.document.uri.fsPath) {
                        completionItems.push(new vscode.CompletionItem(label + '[]', vscode.CompletionItemKind.Reference));
                    }
                    else {
                        completionItems.push(new vscode.CompletionItem(path.relative(path.dirname(context.document.uri.fsPath), adocFile.fsPath) + '#' + label + '[]', vscode.CompletionItemKind.Reference));
                    }
                }
            }
        }
        return completionItems;
    });
}
function provideInternalRef(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const { textFullLine, position, document } = context;
        const indexOfNextWhiteSpace = textFullLine.includes(' ', position.character)
            ? textFullLine.indexOf(' ', position.character)
            : textFullLine.length;
        const search = textFullLine.substring(textFullLine.lastIndexOf('<', position.character + 1) + 1, indexOfNextWhiteSpace);
        const internalRefLabels = yield getIdsFromFile(document.uri);
        return internalRefLabels
            .filter((label) => label.match(search))
            .map((label) => ({
            label: `${label}`,
            kind: vscode.CompletionItemKind.Reference,
            insertText: `${label}>>`,
        }));
    });
}
//# sourceMappingURL=xref.provider.js.map