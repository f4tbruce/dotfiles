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
const assert = __importStar(require("assert"));
require("mocha");
const vscode = __importStar(require("vscode"));
const helper_1 = require("./helper");
const asciidocEngine_1 = require("../asciidocEngine");
const asciidoctorConfig_1 = require("../features/asciidoctorConfig");
const asciidoctorExtensions_1 = require("../features/asciidoctorExtensions");
const asciidoctorDiagnostic_1 = require("../features/asciidoctorDiagnostic");
const security_1 = require("../security");
const inMemoryDocument_1 = require("./inMemoryDocument");
class TestWebviewResourceProvider {
    constructor() {
        this.cspSource = 'cspSource';
    }
    asWebviewUri(resource) {
        return vscode.Uri.file(resource.path);
    }
    asMediaWebViewSrc(...pathSegments) {
        return pathSegments.toString();
    }
}
class EmptyAsciidocContributions {
    constructor() {
        this.previewScripts = [];
        this.previewStyles = [];
        this.previewResourceRoots = [];
    }
}
class AsciidocContributionProviderTest {
    constructor(extensionUri) {
        this.contributions = new EmptyAsciidocContributions();
        this.extensionUri = extensionUri;
    }
    dispose() {
        // noop
    }
}
suite('AsciiDoc parser with Antora support enabled', function () {
    this.timeout(60000);
    const root = vscode.workspace.workspaceFolders[0].uri.fsPath;
    test('convert Antora page', () => __awaiter(this, void 0, void 0, function* () {
        yield helper_1.extensionContext.workspaceState.update('antoraSupportSetting', true);
        yield vscode.workspace.getConfiguration('asciidoc', null).update('antora.enableAntoraSupport', true);
        const asciidocParser = new asciidocEngine_1.AsciidocEngine(new AsciidocContributionProviderTest(helper_1.extensionContext.extensionUri), new asciidoctorConfig_1.AsciidoctorConfig(), new asciidoctorExtensions_1.AsciidoctorExtensions(security_1.AsciidoctorExtensionsSecurityPolicyArbiter.activate(helper_1.extensionContext)), new asciidoctorDiagnostic_1.AsciidoctorDiagnostic('test'));
        const result = yield asciidocParser.convertFromTextDocument(new inMemoryDocument_1.InMemoryDocument(vscode.Uri.file(`${root}/antora/multiComponents/api/modules/auth/pages/page.adoc`), 'Download from the {url-vscode-marketplace}[Visual Studio Code Marketplace].'), helper_1.extensionContext, new TestWebviewResourceProvider());
        assert.strictEqual(result.html.includes('<p>Download from the <a href="https://marketplace.visualstudio.com/vscode" data-href="https://marketplace.visualstudio.com/vscode">Visual Studio Code Marketplace</a>.</p>'), true);
    }));
});
//# sourceMappingURL=asciidocParser.test.js.map