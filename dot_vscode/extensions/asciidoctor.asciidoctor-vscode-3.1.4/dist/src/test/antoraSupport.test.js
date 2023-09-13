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
const antoraSupport_1 = require("../features/antora/antoraSupport");
const workspaceHelper_1 = require("./workspaceHelper");
const helper_1 = require("./helper");
function testGetAntoraConfig(asciidocPath, antoraConfigExpectedFsPath, root) {
    return __awaiter(this, void 0, void 0, function* () {
        const antoraConfigUri = yield (0, antoraSupport_1.findAntoraConfigFile)(vscode.Uri.file(`${root}/${asciidocPath}`));
        if (antoraConfigExpectedFsPath === undefined) {
            assert.strictEqual(antoraConfigUri, undefined);
        }
        else {
            assert.strictEqual(antoraConfigUri.fsPath, antoraConfigExpectedFsPath);
        }
    });
}
suite('Antora Support', () => {
    const root = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const testCases = [
        {
            title: 'Should return Antora config for document inside "pages" directory which is inside another directory',
            asciidocPath: 'antora/multiComponents/cli/modules/commands/pages/page1.adoc',
            antoraConfigExpectedFsPath: `${root}/antora/multiComponents/cli/antora.yml`,
        },
        {
            title: 'Should return Antora config for document inside "pages" directory',
            asciidocPath: 'antora/multiComponents/api/modules/auth/pages/page3.adoc',
            antoraConfigExpectedFsPath: `${root}/antora/multiComponents/api/antora.yml`,
        },
        {
            title: 'Should return Antora config for document inside a subdirectory',
            asciidocPath: 'antora/multiComponents/api/modules/auth/pages/jwt/page2.adoc',
            antoraConfigExpectedFsPath: `${root}/antora/multiComponents/api/antora.yml`,
        },
        {
            title: 'Should return Antora config for document inside a "modules" subdirectory',
            asciidocPath: 'antora/multiComponents/api/modules/auth/pages/modules/page4.adoc',
            antoraConfigExpectedFsPath: `${root}/antora/multiComponents/api/antora.yml`,
        },
        {
            title: 'Should return Antora config for document inside a "modules" directory which is inside an Antora modules in a composant named "modules"',
            asciidocPath: 'antora/multiComponents/modules/api/docs/modules/asciidoc/pages/modules/page5.adoc',
            antoraConfigExpectedFsPath: `${root}/antora/multiComponents/modules/api/docs/antora.yml`,
        },
        {
            title: 'Should return Antora config for document inside a directory which has the same name as the workspace',
            asciidocPath: 'antora/multiComponents/api/modules/auth/pages/modules/multiComponents/page6.adoc',
            antoraConfigExpectedFsPath: `${root}/antora/multiComponents/api/antora.yml`,
        },
        {
            title: 'Should not return Antora config for document outside "modules" Antora folder',
            asciidocPath: 'antora/multiComponents/api/modules/writer-guide.adoc',
            antoraConfigExpectedFsPath: undefined,
        },
        {
            title: 'Should not return Antora config for document outside of workspace',
            asciidocPath: 'antora/contributing.adoc',
            antoraConfigExpectedFsPath: undefined,
        },
    ];
    for (const testCase of testCases) {
        test(testCase.title, () => __awaiter(void 0, void 0, void 0, function* () { return testGetAntoraConfig(testCase.asciidocPath, testCase.antoraConfigExpectedFsPath, root); }));
    }
    test('Should handle symlink', () => __awaiter(void 0, void 0, void 0, function* () {
        const createdFiles = [];
        try {
            createdFiles.push(yield (0, workspaceHelper_1.createDirectory)('antora-test'));
            yield (0, workspaceHelper_1.createDirectories)('antora-test', 'docs', 'modules', 'ROOT', 'pages');
            const asciidocFile = yield (0, workspaceHelper_1.createFile)('= Hello World', 'antora-test', 'docs', 'modules', 'ROOT', 'pages', 'index.adoc');
            yield (0, workspaceHelper_1.createLink)(['antora-test', 'docs'], ['antora-test', 'docs-symlink']); // create a symlink!
            yield (0, workspaceHelper_1.createFile)(`name: silver-leaf
version: '7.1'
`, 'antora-test', 'docs', 'antora.yml');
            // enable Antora support
            const workspaceConfiguration = vscode.workspace.getConfiguration('asciidoc', null);
            yield workspaceConfiguration.update('antora.enableAntoraSupport', true);
            const workspaceState = helper_1.extensionContext.workspaceState;
            yield workspaceState.update('antoraSupportSetting', true);
            // GO!
            const result = yield (0, antoraSupport_1.getAntoraDocumentContext)(asciidocFile, workspaceState);
            const components = result.getComponents();
            assert.strictEqual(components.length > 0, true, 'Must contains at least one component');
            const component = components.find((c) => c.versions.find((v) => v.name === 'silver-leaf' && v.version === '7.1') !== undefined);
            assert.strictEqual(component !== undefined, true, 'Component silver-leaf:7.1 must exists');
        }
        finally {
            yield (0, workspaceHelper_1.removeFiles)(createdFiles);
            yield helper_1.extensionContext.workspaceState.update('antoraSupportSetting', undefined);
            yield vscode.workspace.getConfiguration('asciidoc', null).update('antora.enableAntoraSupport', undefined);
        }
    }));
});
//# sourceMappingURL=antoraSupport.test.js.map