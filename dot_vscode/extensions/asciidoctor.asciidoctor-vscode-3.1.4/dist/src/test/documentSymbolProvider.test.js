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
const assert = __importStar(require("assert"));
require("mocha");
const vscode = __importStar(require("vscode"));
const documentSymbolProvider_1 = __importDefault(require("../features/documentSymbolProvider"));
const inMemoryDocument_1 = require("./inMemoryDocument");
const asciidocLoader_1 = require("../asciidocLoader");
const asciidoctorConfig_1 = require("../features/asciidoctorConfig");
const asciidoctorExtensions_1 = require("../features/asciidoctorExtensions");
const security_1 = require("../security");
const helper_1 = require("./helper");
const asciidoctorDiagnostic_1 = require("../features/asciidoctorDiagnostic");
const testFileName = vscode.Uri.file('test.adoc');
function getSymbolsForFile(fileContents) {
    const doc = new inMemoryDocument_1.InMemoryDocument(testFileName, fileContents);
    const provider = new documentSymbolProvider_1.default(null, new asciidocLoader_1.AsciidocLoader(new asciidoctorConfig_1.AsciidoctorConfig(), new asciidoctorExtensions_1.AsciidoctorExtensions(security_1.AsciidoctorExtensionsSecurityPolicyArbiter.activate(helper_1.extensionContext)), new asciidoctorDiagnostic_1.AsciidoctorDiagnostic('text')));
    return provider.provideDocumentSymbols(doc);
}
suite('asciidoc.DocumentSymbolProvider', () => {
    test('Should not return anything for empty document', () => __awaiter(void 0, void 0, void 0, function* () {
        const symbols = yield getSymbolsForFile('');
        assert.strictEqual(symbols.length, 0);
    }));
    test('Should not return anything for document with no headers', () => __awaiter(void 0, void 0, void 0, function* () {
        const symbols = yield getSymbolsForFile('a\na');
        assert.strictEqual(symbols.length, 0);
    }));
});
//# sourceMappingURL=documentSymbolProvider.test.js.map