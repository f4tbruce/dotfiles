"use strict";
/*---------------------------------------------------------------------------------------------
  *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
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
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
require("mocha");
const tableOfContentsProvider_1 = require("../tableOfContentsProvider");
const inMemoryDocument_1 = require("./inMemoryDocument");
const workspaceHelper_1 = require("./workspaceHelper");
const asciidocLoader_1 = require("../asciidocLoader");
const asciidoctorConfig_1 = require("../features/asciidoctorConfig");
const asciidoctorExtensions_1 = require("../features/asciidoctorExtensions");
const helper_1 = require("./helper");
const security_1 = require("../security");
const asciidoctorDiagnostic_1 = require("../features/asciidoctorDiagnostic");
suite('asciidoc.TableOfContentsProvider', () => {
    let createdFiles = [];
    teardown(() => __awaiter(void 0, void 0, void 0, function* () {
        for (const createdFile of createdFiles) {
            yield vscode.workspace.fs.delete(createdFile);
        }
        createdFiles = [];
    }));
    test('Lookup should not return anything for empty document', () => __awaiter(void 0, void 0, void 0, function* () {
        const doc = new inMemoryDocument_1.InMemoryDocument(vscode.Uri.file('test.adoc'), '');
        const provider = new tableOfContentsProvider_1.TableOfContentsProvider(doc, new asciidocLoader_1.AsciidocLoader(new asciidoctorConfig_1.AsciidoctorConfig(), new asciidoctorExtensions_1.AsciidoctorExtensions(security_1.AsciidoctorExtensionsSecurityPolicyArbiter.activate(helper_1.extensionContext)), new asciidoctorDiagnostic_1.AsciidoctorDiagnostic('test')));
        assert.strictEqual(yield provider.lookup(''), undefined);
        assert.strictEqual(yield provider.lookup('foo'), undefined);
    }));
    test('Lookup should not return anything for document with no headers', () => __awaiter(void 0, void 0, void 0, function* () {
        const doc = new inMemoryDocument_1.InMemoryDocument(vscode.Uri.file('test.adoc'), 'a *b*\nc');
        const provider = new tableOfContentsProvider_1.TableOfContentsProvider(doc, new asciidocLoader_1.AsciidocLoader(new asciidoctorConfig_1.AsciidoctorConfig(), new asciidoctorExtensions_1.AsciidoctorExtensions(security_1.AsciidoctorExtensionsSecurityPolicyArbiter.activate(helper_1.extensionContext)), new asciidoctorDiagnostic_1.AsciidoctorDiagnostic('test')));
        assert.strictEqual(yield provider.lookup(''), undefined);
        assert.strictEqual(yield provider.lookup('foo'), undefined);
        assert.strictEqual(yield provider.lookup('a'), undefined);
        assert.strictEqual(yield provider.lookup('b'), undefined);
    }));
    test('Should include the document title in the TOC', () => __awaiter(void 0, void 0, void 0, function* () {
        const mainContent = `= test

content`;
        const mainFile = yield (0, workspaceHelper_1.createFile)(mainContent, 'tableofcontents-main-document.adoc');
        createdFiles.push(mainFile);
        const provider = new tableOfContentsProvider_1.TableOfContentsProvider(new inMemoryDocument_1.InMemoryDocument(mainFile, mainContent), new asciidocLoader_1.AsciidocLoader(new asciidoctorConfig_1.AsciidoctorConfig(), new asciidoctorExtensions_1.AsciidoctorExtensions(security_1.AsciidoctorExtensionsSecurityPolicyArbiter.activate(helper_1.extensionContext)), new asciidoctorDiagnostic_1.AsciidoctorDiagnostic('test')));
        const toc = yield provider.getToc();
        const documentTitleEntry = toc.find((entry) => entry.text === 'test' && entry.line === 0);
        assert.deepStrictEqual(documentTitleEntry !== undefined, true, 'should include the document title in the TOC');
    }));
    test('Should include the document title in the TOC (when using an include just below it)', () => __awaiter(void 0, void 0, void 0, function* () {
        createdFiles.push(yield (0, workspaceHelper_1.createFile)(`:attr: value
`, 'tableofcontents-attrs.adoc'));
        const mainContent = `= test
include::attrs.adoc[]

content`;
        const mainFile = yield (0, workspaceHelper_1.createFile)(mainContent, 'tableofcontents-main-document.adoc');
        createdFiles.push(mainFile);
        const provider = new tableOfContentsProvider_1.TableOfContentsProvider(new inMemoryDocument_1.InMemoryDocument(mainFile, mainContent), new asciidocLoader_1.AsciidocLoader(new asciidoctorConfig_1.AsciidoctorConfig(), new asciidoctorExtensions_1.AsciidoctorExtensions(security_1.AsciidoctorExtensionsSecurityPolicyArbiter.activate(helper_1.extensionContext)), new asciidoctorDiagnostic_1.AsciidoctorDiagnostic('test')));
        const toc = yield provider.getToc();
        const documentTitleEntry = toc.find((entry) => entry.text === 'test' && entry.line === 0);
        assert.deepStrictEqual(documentTitleEntry !== undefined, true, 'should include the document title in the TOC');
    }));
});
//# sourceMappingURL=tableOfContentsProvider.test.js.map