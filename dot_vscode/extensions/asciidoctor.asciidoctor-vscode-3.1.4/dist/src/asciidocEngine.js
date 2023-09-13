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
exports.AsciidocEngine = void 0;
const vscode = __importStar(require("vscode"));
const asciidoctorWebViewConverter_1 = require("./asciidoctorWebViewConverter");
const security_1 = require("./security");
const previewConfig_1 = require("./features/previewConfig");
const antoraSupport_1 = require("./features/antora/antoraSupport");
const asciidocTextDocument_1 = require("./asciidocTextDocument");
const asciidoctorProcessor_1 = require("./asciidoctorProcessor");
const asciidoctorAttributesConfig_1 = require("./features/asciidoctorAttributesConfig");
const highlightjsAdapter = require('./highlightjs-adapter');
const previewConfigurationManager = new previewConfig_1.AsciidocPreviewConfigurationManager();
class AsciidocEngine {
    constructor(contributionProvider, asciidoctorConfigProvider, asciidoctorExtensionsProvider, asciidoctorDiagnosticProvider) {
        this.contributionProvider = contributionProvider;
        this.asciidoctorConfigProvider = asciidoctorConfigProvider;
        this.asciidoctorExtensionsProvider = asciidoctorExtensionsProvider;
        this.asciidoctorDiagnosticProvider = asciidoctorDiagnosticProvider;
        // Asciidoctor.js in the browser environment works with URIs however for desktop clients
        // the "stylesdir" attribute is expected to look like a file system path (especially on Windows)
        if ('browser' in process && process.browser === true) {
            this.stylesdir = vscode.Uri.joinPath(contributionProvider.extensionUri, 'media').toString();
        }
        else {
            this.stylesdir = vscode.Uri.joinPath(contributionProvider.extensionUri, 'media').fsPath;
        }
    }
    // Export
    export(textDocument, backend, asciidoctorAttributes = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            this.asciidoctorDiagnosticProvider.delete(textDocument.uri);
            const asciidoctorProcessor = asciidoctorProcessor_1.AsciidoctorProcessor.getInstance();
            const memoryLogger = asciidoctorProcessor.activateMemoryLogger();
            const processor = asciidoctorProcessor.processor;
            const registry = processor.Extensions.create();
            yield this.asciidoctorExtensionsProvider.activate(registry);
            const textDocumentUri = textDocument.uri;
            yield this.asciidoctorConfigProvider.activate(registry, textDocumentUri);
            asciidoctorProcessor.restoreBuiltInSyntaxHighlighter();
            const baseDir = asciidocTextDocument_1.AsciidocTextDocument.fromTextDocument(textDocument).getBaseDir();
            const options = Object.assign({ attributes: Object.assign({ 'env-vscode': '', env: 'vscode' }, asciidoctorAttributes), backend, extension_registry: registry, header_footer: true, safe: 'unsafe' }, (baseDir && { base_dir: baseDir }));
            const templateDirs = this.getTemplateDirs();
            if (templateDirs.length !== 0) {
                options.template_dirs = templateDirs;
            }
            const document = processor.load(textDocument.getText(), options);
            const output = document.convert(options);
            this.asciidoctorDiagnosticProvider.reportErrors(memoryLogger, textDocument);
            return {
                output,
                document,
            };
        });
    }
    // Convert (preview)
    convertFromUri(documentUri, context, editor, line) {
        return __awaiter(this, void 0, void 0, function* () {
            const textDocument = yield vscode.workspace.openTextDocument(documentUri);
            const { html, document } = yield this.convertFromTextDocument(textDocument, context, editor, line);
            return { html, document };
        });
    }
    convertFromTextDocument(textDocument, context, editor, line) {
        return __awaiter(this, void 0, void 0, function* () {
            this.asciidoctorDiagnosticProvider.delete(textDocument.uri);
            const asciidoctorProcessor = asciidoctorProcessor_1.AsciidoctorProcessor.getInstance();
            const memoryLogger = asciidoctorProcessor.activateMemoryLogger();
            const processor = asciidoctorProcessor.processor;
            // load the Asciidoc header only to get kroki-server-url attribute
            const text = textDocument.getText();
            const document = processor.load(text, { header_only: true });
            const krokiServerUrl = document.getAttribute('kroki-server-url') || 'https://kroki.io';
            // Antora Resource Identifiers resolution
            const antoraDocumentContext = yield (0, antoraSupport_1.getAntoraDocumentContext)(textDocument.uri, context.workspaceState);
            const cspArbiter = new security_1.ExtensionContentSecurityPolicyArbiter(context.globalState, context.workspaceState);
            const asciidoctorWebViewConverter = new asciidoctorWebViewConverter_1.AsciidoctorWebViewConverter(textDocument, editor, cspArbiter.getSecurityLevelForResource(textDocument.uri), cspArbiter.shouldDisableSecurityWarnings(), this.contributionProvider.contributions, previewConfigurationManager.loadAndCacheConfiguration(textDocument.uri), antoraDocumentContext, line, krokiServerUrl);
            processor.ConverterFactory.register(asciidoctorWebViewConverter, ['webview-html5']);
            const registry = processor.Extensions.create();
            yield this.asciidoctorExtensionsProvider.activate(registry);
            const textDocumentUri = textDocument.uri;
            yield this.asciidoctorConfigProvider.activate(registry, textDocumentUri);
            if (context && editor) {
                highlightjsAdapter.register(asciidoctorProcessor.highlightjsBuiltInSyntaxHighlighter, context, editor);
            }
            else {
                asciidoctorProcessor.restoreBuiltInSyntaxHighlighter();
            }
            const attributes = asciidoctorAttributesConfig_1.AsciidoctorAttributesConfig.getPreviewAttributes();
            const antoraSupport = yield antoraSupport_1.AntoraSupportManager.getInstance(context.workspaceState);
            const antoraAttributes = yield antoraSupport.getAttributes(textDocumentUri);
            const baseDir = asciidocTextDocument_1.AsciidocTextDocument.fromTextDocument(textDocument).getBaseDir();
            const templateDirs = this.getTemplateDirs();
            const options = Object.assign({ attributes: Object.assign(Object.assign(Object.assign({}, attributes), antoraAttributes), { '!data-uri': '' }), backend: 'webview-html5', extension_registry: registry, header_footer: true, safe: 'unsafe', sourcemap: true }, (baseDir && { base_dir: baseDir }));
            if (templateDirs.length !== 0) {
                options.template_dirs = templateDirs;
            }
            try {
                const document = processor.load(text, options);
                const blocksWithLineNumber = document.findBy(function (b) {
                    return typeof b.getLineNumber() !== 'undefined';
                });
                blocksWithLineNumber.forEach(function (block) {
                    block.addRole('data-line-' + block.getLineNumber());
                });
                const html = document.convert(options);
                this.asciidoctorDiagnosticProvider.reportErrors(memoryLogger, textDocument);
                return {
                    html,
                    document,
                };
            }
            catch (e) {
                vscode.window.showErrorMessage(e.toString());
                throw e;
            }
        });
    }
    /**
     * Get user defined template directories from configuration.
     * @private
     */
    getTemplateDirs() {
        return vscode.workspace.getConfiguration('asciidoc.preview', null).get('templates', []);
    }
}
exports.AsciidocEngine = AsciidocEngine;
//# sourceMappingURL=asciidocEngine.js.map