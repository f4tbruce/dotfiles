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
const vscode_1 = __importStar(require("vscode"));
const chai_1 = __importDefault(require("chai"));
const asciidoc_provider_1 = require("../providers/asciidoc.provider");
const asciidocLoader_1 = require("../asciidocLoader");
const asciidoctorDiagnostic_1 = require("../features/asciidoctorDiagnostic");
const workspaceHelper_1 = require("./workspaceHelper");
const expect = chai_1.default.expect;
const asciidocLoader = new asciidocLoader_1.AsciidocLoader(new class {
    activate(_, __) {
        return Promise.resolve();
    }
}(), new class {
    activate(_) {
        return Promise.resolve();
    }
}(), new asciidoctorDiagnostic_1.AsciidoctorDiagnostic('test'));
suite('Target path completion provider', () => {
    test('Should return completion items relative to imagesdir', () => __awaiter(void 0, void 0, void 0, function* () {
        const testDirectory = yield (0, workspaceHelper_1.createDirectory)('target-path-completion');
        try {
            const provider = new asciidoc_provider_1.TargetPathCompletionProvider(asciidocLoader);
            yield (0, workspaceHelper_1.createDirectories)('target-path-completion', 'src', 'asciidoc');
            yield (0, workspaceHelper_1.createDirectories)('target-path-completion', 'src', 'images');
            const asciidocFile = yield (0, workspaceHelper_1.createFile)(`= Lanzarote
:imagesdir: ../images/

image::`, 'target-path-completion', 'src', 'asciidoc', 'index.adoc');
            yield (0, workspaceHelper_1.createFile)('', 'target-path-completion', 'src', 'images', 'wilderness-map.jpg');
            yield (0, workspaceHelper_1.createFile)('', 'target-path-completion', 'src', 'images', 'skyline.jpg');
            const file = yield vscode_1.default.workspace.openTextDocument(asciidocFile);
            const completionsItems = yield provider.provideCompletionItems(file, new vscode_1.Position(3, 7));
            expect(completionsItems).to.deep.include({
                label: 'wilderness-map.jpg',
                kind: 16,
                sortText: '10_wilderness-map.jpg',
                insertText: 'wilderness-map.jpg[]',
            });
            expect(completionsItems).to.deep.include({
                label: 'skyline.jpg',
                kind: 16,
                sortText: '10_skyline.jpg',
                insertText: 'skyline.jpg[]',
            });
        }
        finally {
            yield (0, workspaceHelper_1.removeFiles)([testDirectory]);
        }
    }));
});
//# sourceMappingURL=targetPathCompletionProvider.test.js.map