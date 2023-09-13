"use strict";
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
const vscode_1 = __importDefault(require("vscode"));
const asciidoctorWebViewConverter_1 = require("../asciidoctorWebViewConverter");
const previewConfig_1 = require("../features/previewConfig");
const assert_1 = __importDefault(require("assert"));
const sinon_1 = __importDefault(require("sinon"));
const antoraSupport_1 = require("../features/antora/antoraSupport");
const asciidoctor = require('@asciidoctor/core');
const processor = asciidoctor();
class TestWebviewResourceProvider {
    constructor() {
        this.cspSource = 'aaaa';
    }
    asWebviewUri(resource) {
        return vscode_1.default.Uri.file(resource.path);
    }
    asMediaWebViewSrc(...pathSegments) {
        return pathSegments.toString();
    }
}
class TestAsciidocContributions {
    constructor() {
        this.previewResourceRoots = [];
        this.previewScripts = [];
        this.previewStyles = [];
    }
}
function createAntoraDocumentContextStub(resourceUri) {
    const antoraDocumentContextStub = sinon_1.default.createStubInstance(antoraSupport_1.AntoraDocumentContext);
    antoraDocumentContextStub.resolveAntoraResourceIds.returns(resourceUri);
    return antoraDocumentContextStub;
}
function testAsciidoctorWebViewConverter(input, antoraDocumentContext, expected, root, filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const file = yield vscode_1.default.workspace.openTextDocument(vscode_1.default.Uri.file(`${root}/${filePath}`));
        const asciidoctorWebViewConverter = new asciidoctorWebViewConverter_1.AsciidoctorWebViewConverter(file, new TestWebviewResourceProvider(), 2, false, new TestAsciidocContributions(), new previewConfig_1.AsciidocPreviewConfigurationManager().loadAndCacheConfiguration(file.uri), antoraDocumentContext, undefined);
        const html = processor.convert(input, { converter: asciidoctorWebViewConverter });
        assert_1.default.strictEqual(html, expected);
    });
}
suite('AsciidoctorWebViewConverter', () => __awaiter(void 0, void 0, void 0, function* () {
    const root = vscode_1.default.workspace.workspaceFolders[0].uri.fsPath;
    // WIP need to find more interesting test cases
    const testCases = [
        // images
        {
            title: 'Unresolved image resource id from Antora (fallback to base converter)',
            filePath: 'asciidoctorWebViewConverterTest.adoc',
            input: 'image::1.0@wyoming:sierra-madre:panorama.png[]',
            antoraDocumentContext: createAntoraDocumentContextStub(undefined),
            expected: `<div class="imageblock">
<div class="content">
<img src="1.0@wyoming:sierra-madre:panorama.png" alt="1.0@wyoming:sierra madre:panorama">
</div>
</div>`,
        },
        {
            title: 'Should resolve image src with Antora id\'s input and Antora support activated',
            filePath: 'antora/multiComponents/cli/modules/commands/pages/page1.adoc',
            input: 'image::2.0@cli:commands:seaswell.png[]',
            antoraDocumentContext: createAntoraDocumentContextStub(`${root}/antora/multiComponents/cli/modules/commands/images/seaswell.png`),
            expected: `<div class="imageblock">
<div class="content">
<img src="${root}/antora/multiComponents/cli/modules/commands/images/seaswell.png" alt="seaswell">
</div>
</div>`,
        },
        // links
        {
            title: 'Should resolve macro link',
            filePath: 'asciidoctorWebViewConverterTest.adoc',
            input: 'link:full.adoc[]',
            antoraDocumentContext: undefined,
            expected: `<div class="paragraph">
<p><a href="full.adoc" class="bare" data-href="full.adoc">full.adoc</a></p>
</div>`,
        },
        {
            title: 'Should resolve macro link with roles',
            filePath: 'asciidoctorWebViewConverterTest.adoc',
            input: 'link:full.adoc[role="action button"]',
            antoraDocumentContext: undefined,
            expected: `<div class="paragraph">
<p><a href="full.adoc" class="bare action button" data-href="full.adoc">full.adoc</a></p>
</div>`,
        },
    ];
    for (const testCase of testCases) {
        test(testCase.title, () => __awaiter(void 0, void 0, void 0, function* () { return testAsciidoctorWebViewConverter(testCase.input, testCase.antoraDocumentContext, testCase.expected, root, testCase.filePath); }));
    }
}));
//# sourceMappingURL=asciidoctorWebViewConverter.test.js.map