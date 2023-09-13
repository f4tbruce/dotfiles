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
const vscode_1 = require("vscode");
const assert_1 = __importDefault(require("assert"));
const attributeReferenceProvider_1 = require("../features/attributeReferenceProvider");
const workspaceHelper_1 = require("./workspaceHelper");
const asciidocLoader_1 = require("../asciidocLoader");
const asciidoctorConfig_1 = require("../features/asciidoctorConfig");
const asciidoctorExtensions_1 = require("../features/asciidoctorExtensions");
const asciidoctorDiagnostic_1 = require("../features/asciidoctorDiagnostic");
const helper_1 = require("./helper");
const security_1 = require("../security");
function filterByLabel(label) {
    return (item) => {
        if (item.label) {
            return item.label.label === label;
        }
        return false;
    };
}
function findCompletionItems(uri, position, filter) {
    return __awaiter(this, void 0, void 0, function* () {
        const textDocument = yield vscode.workspace.openTextDocument(uri);
        const asciidocLoader = new asciidocLoader_1.AsciidocLoader(new asciidoctorConfig_1.AsciidoctorConfig(), new asciidoctorExtensions_1.AsciidoctorExtensions(security_1.AsciidoctorExtensionsSecurityPolicyArbiter.activate(helper_1.extensionContext)), new asciidoctorDiagnostic_1.AsciidoctorDiagnostic('test'));
        const completionsItems = yield new attributeReferenceProvider_1.AttributeReferenceProvider(asciidocLoader).provideCompletionItems(textDocument, position);
        if (filter) {
            return completionsItems.filter(filter);
        }
        return completionsItems;
    });
}
suite('Attribute ref CompletionsProvider', () => {
    let createdFiles = [];
    teardown(() => __awaiter(void 0, void 0, void 0, function* () {
        for (const createdFile of createdFiles) {
            yield vscode.workspace.fs.delete(createdFile);
        }
        createdFiles = [];
    }));
    test('Should return attribute key defined in same file', () => __awaiter(void 0, void 0, void 0, function* () {
        const fileToAutoComplete = yield (0, workspaceHelper_1.createFile)(`:my-attribute-to-find-in-completion: dummy value
`, 'fileToAutoComplete-attributeRef-samefile.adoc');
        createdFiles.push(fileToAutoComplete);
        const items = yield findCompletionItems(fileToAutoComplete, new vscode_1.Position(1, 0), filterByLabel('my-attribute-to-find-in-completion'));
        const completionItem = items[0];
        assert_1.default.deepStrictEqual(completionItem.label.description, 'dummy value');
        assert_1.default.deepStrictEqual(completionItem.insertText, '{my-attribute-to-find-in-completion}');
    }));
    test('Should return attribute key defined in same file corresponding to its value', () => __awaiter(void 0, void 0, void 0, function* () {
        const fileToAutoComplete = yield (0, workspaceHelper_1.createFile)(`:my-attribute-to-find-in-completion: dummy value
dumm`, 'fileToAutoComplete-attributeRef.adoc');
        createdFiles.push(fileToAutoComplete);
        const items = yield findCompletionItems(fileToAutoComplete, new vscode_1.Position(1, 3), filterByLabel('my-attribute-to-find-in-completion'));
        const completionItem = items[0];
        assert_1.default.deepStrictEqual(completionItem.label.description, 'dummy value');
        assert_1.default.deepStrictEqual(completionItem.insertText, '{my-attribute-to-find-in-completion}');
    }));
    test('Should return no completion when nothing corresponds', () => __awaiter(void 0, void 0, void 0, function* () {
        const fileToAutoComplete = yield (0, workspaceHelper_1.createFile)(`:my-attribute-to-find-in-completion: dummy value
somethingVeryDifferent`, 'fileToAutoComplete-attributeRef-samefile-basedOnValue.adoc');
        createdFiles.push(fileToAutoComplete);
        const items = yield findCompletionItems(fileToAutoComplete, new vscode_1.Position(1, 22));
        assert_1.default.notStrictEqual(items.length, 0, 'There are completion provided although none are expected.');
    }));
    test('Should return an attribute defined in another file', () => __awaiter(void 0, void 0, void 0, function* () {
        const fileToAutoComplete = yield (0, workspaceHelper_1.createFile)(`= test
include::file-referenced-with-an-attribute.adoc[]


    `, 'fileToAutoComplete-attributeRef-differentFile.adoc');
        createdFiles.push(fileToAutoComplete);
        const fileReferencedWithAnAttribute = yield (0, workspaceHelper_1.createFile)(':my-attribute-to-find-in-completion: dummy value', 'file-referenced-with-an-attribute.adoc');
        createdFiles.push(fileReferencedWithAnAttribute);
        const items = yield findCompletionItems(fileToAutoComplete, new vscode_1.Position(3, 0), filterByLabel('my-attribute-to-find-in-completion'));
        const completionItem = items[0];
        assert_1.default.deepStrictEqual(completionItem.label.description, 'dummy value');
        assert_1.default.deepStrictEqual(completionItem.insertText, '{my-attribute-to-find-in-completion}');
    }));
    test('Should disable auto-completion on literal paragraph', () => __awaiter(void 0, void 0, void 0, function* () {
        const fileToAutoComplete = yield (0, workspaceHelper_1.createFile)(`= test
:fn-type: pure

 function foo() {

The above function is {
    `, 'disable-autocompletion-literal-paragraph.adoc');
        createdFiles.push(fileToAutoComplete);
        let items = yield findCompletionItems(fileToAutoComplete, new vscode_1.Position(3, 17));
        assert_1.default.deepStrictEqual(items.length, 0, 'should not provide attributes completion on literal paragraphs.');
        items = yield findCompletionItems(fileToAutoComplete, new vscode_1.Position(5, 1));
        assert_1.default.deepStrictEqual(items.length > 0, true, 'should provide attribute completion on paragraphs.');
    }));
    test('Should disable auto-completion on verbatim blocks', () => __awaiter(void 0, void 0, void 0, function* () {
        const fileToAutoComplete = yield (0, workspaceHelper_1.createFile)(`= test
:app-version: 1.2.3

----
function foo() {
----

[listing]
function foo() {

....
function foo() {
  function bar() {
}
....

[literal]
function foo() {

[source,xml,subs=+attributes]
----
<dependency>
  <groupId>org.asciidoctor</groupId>
  <artifactId>asciidoctor-vscode</artifactId>
  <version>{</version>
</dependency>
----

Install version {
    `, 'disable-autocompletion-verbatim-blocks.adoc');
        createdFiles.push(fileToAutoComplete);
        let completionsItems = yield findCompletionItems(fileToAutoComplete, new vscode_1.Position(4, 16));
        assert_1.default.deepStrictEqual(completionsItems.length, 0, 'should not provide attributes completion on source blocks.');
        completionsItems = yield findCompletionItems(fileToAutoComplete, new vscode_1.Position(8, 16));
        assert_1.default.deepStrictEqual(completionsItems.length, 0, 'should not provide attributes completion on listing blocks.');
        completionsItems = yield findCompletionItems(fileToAutoComplete, new vscode_1.Position(12, 18));
        assert_1.default.deepStrictEqual(completionsItems.length, 0, 'should not provide attributes completion on listing blocks (indented).');
        completionsItems = yield findCompletionItems(fileToAutoComplete, new vscode_1.Position(17, 16));
        assert_1.default.deepStrictEqual(completionsItems.length, 0, 'should not provide attributes completion on literal blocks.');
        completionsItems = yield findCompletionItems(fileToAutoComplete, new vscode_1.Position(24, 12));
        assert_1.default.deepStrictEqual(completionsItems.length > 0, true, 'should provide attribute completion verbatim blocks with attributes subs.');
        completionsItems = yield findCompletionItems(fileToAutoComplete, new vscode_1.Position(28, 17));
        assert_1.default.deepStrictEqual(completionsItems.length > 0, true, 'should provide attribute completion on paragraphs.');
    }));
    test('Should return an attribute defined in .asciidoctorconfig', () => __awaiter(void 0, void 0, void 0, function* () {
        const fileToAutoComplete = yield (0, workspaceHelper_1.createFile)(`= test

{
    `, 'autocompletion-from-asciidoctorconfig.adoc');
        createdFiles.push(fileToAutoComplete);
        const asciidoctorConfigFile = yield (0, workspaceHelper_1.createFile)(':attribute-defined-in-asciidoctorconfig: dummy value', '.asciidoctorconfig');
        createdFiles.push(asciidoctorConfigFile);
        const completionsItems = yield findCompletionItems(fileToAutoComplete, new vscode_1.Position(3, 2), filterByLabel('attribute-defined-in-asciidoctorconfig'));
        const completionItem = completionsItems[0];
        assert_1.default.deepStrictEqual(completionItem.label.description, 'dummy value');
        assert_1.default.deepStrictEqual(completionItem.insertText, '{attribute-defined-in-asciidoctorconfig}');
    }));
    test('Should return an attribute defined in the plugin configuration', () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const asciidocPreviewConfig = vscode.workspace.getConfiguration('asciidoc.preview', null);
            yield asciidocPreviewConfig.update('asciidoctorAttributes', {
                'attribute-defined-in-config': 'dummy value',
            });
            const fileToAutoComplete = yield (0, workspaceHelper_1.createFile)(`= test

{
    `, 'autocompletion-from-plugin-configuration.adoc');
            createdFiles.push(fileToAutoComplete);
            const completionsItems = yield findCompletionItems(fileToAutoComplete, new vscode_1.Position(3, 2), filterByLabel('attribute-defined-in-config'));
            const completionItem = completionsItems[0];
            assert_1.default.deepStrictEqual(completionItem.label.description, 'dummy value');
            assert_1.default.deepStrictEqual(completionItem.insertText, '{attribute-defined-in-config}');
        }
        finally {
            yield vscode.workspace.getConfiguration('asciidoc.preview', null).update('asciidoctorAttributes', undefined);
        }
    }));
    test('Should return an attribute defined in another file (target contains an attribute reference)', () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const asciidocPreviewConfig = vscode.workspace.getConfiguration('asciidoc.preview', null);
            yield asciidocPreviewConfig.update('asciidoctorAttributes', {
                'include-target': 'attributes',
            });
            const fileToAutoComplete = yield (0, workspaceHelper_1.createFile)(`= test
include::autocompletion-{include-target}.adoc[]

{
    `, 'autocompletion-from-include-file-target-attrs.adoc');
            createdFiles.push(fileToAutoComplete);
            const fileReferencedWithAnAttribute = yield (0, workspaceHelper_1.createFile)(':foo: bar', 'autocompletion-attributes.adoc');
            createdFiles.push(fileReferencedWithAnAttribute);
            const completionsItems = yield findCompletionItems(fileToAutoComplete, new vscode_1.Position(4, 2), filterByLabel('foo'));
            const completionItem = completionsItems[0];
            assert_1.default.deepStrictEqual(completionItem.label.description, 'bar');
            assert_1.default.deepStrictEqual(completionItem.insertText, '{foo}');
        }
        finally {
            yield vscode.workspace.getConfiguration('asciidoc.preview', null).update('asciidoctorAttributes', undefined);
        }
    }));
});
//# sourceMappingURL=attributeRefCompletionProvider.test.js.map