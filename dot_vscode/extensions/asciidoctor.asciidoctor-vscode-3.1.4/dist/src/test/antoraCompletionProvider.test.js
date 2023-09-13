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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const vscode = __importStar(require("vscode"));
const assert_1 = __importDefault(require("assert"));
const antoraCompletionProvider_1 = __importDefault(require("../features/antora/antoraCompletionProvider"));
const vscode_1 = require("vscode");
let root;
suite('Antora CompletionsProvider', () => {
    setup(() => {
        root = vscode.workspace.workspaceFolders[0].uri.fsPath;
    });
    test('Should return completion items', () => __awaiter(void 0, void 0, void 0, function* () {
        const provider = new antoraCompletionProvider_1.default();
        const file = yield vscode.workspace.openTextDocument(vscode.Uri.file(`${root}/antora/multiComponents/api/modules/auth/pages/jwt/page2.adoc`));
        const completionsItems = yield provider.provideCompletionItems(file, new vscode_1.Position(3, 1));
        assert_1.default.deepStrictEqual(completionsItems[0].label, {
            description: 'asciidoc@',
            label: 'source-language',
        });
        assert_1.default.strictEqual(completionsItems[0].insertText, '{asciidoc@}');
        assert_1.default.deepStrictEqual(completionsItems[1].label, {
            description: 'short@',
            label: 'xrefstyle',
        });
        assert_1.default.strictEqual(completionsItems[1].insertText, '{short@}');
        assert_1.default.deepStrictEqual(completionsItems[2].label, {
            description: false,
            label: 'example-caption',
        });
        assert_1.default.strictEqual(completionsItems[2].insertText, '{false}');
    }));
});
//# sourceMappingURL=antoraCompletionProvider.test.js.map