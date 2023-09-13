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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsciidocIncludeItemsLoader = exports.AsciidocLoader = void 0;
const asciidocTextDocument_1 = require("./asciidocTextDocument");
const asciidoctorProcessor_1 = require("./asciidoctorProcessor");
const asciidoctorAttributesConfig_1 = require("./features/asciidoctorAttributesConfig");
class AsciidocLoader {
    constructor(asciidoctorConfigProvider, asciidoctorExtensionsProvider, asciidoctorDiagnosticProvider) {
        this.asciidoctorConfigProvider = asciidoctorConfigProvider;
        this.asciidoctorExtensionsProvider = asciidoctorExtensionsProvider;
        this.asciidoctorDiagnosticProvider = asciidoctorDiagnosticProvider;
        this.processor = asciidoctorProcessor_1.AsciidoctorProcessor.getInstance().processor;
    }
    load(textDocument) {
        return __awaiter(this, void 0, void 0, function* () {
            const { memoryLogger, registry, } = yield this.prepare(textDocument);
            const baseDir = asciidocTextDocument_1.AsciidocTextDocument.fromTextDocument(textDocument).getBaseDir();
            const attributes = asciidoctorAttributesConfig_1.AsciidoctorAttributesConfig.getPreviewAttributes();
            const doc = this.processor.load(textDocument.getText(), this.getOptions(attributes, registry, baseDir));
            this.asciidoctorDiagnosticProvider.reportErrors(memoryLogger, textDocument);
            return doc;
        });
    }
    getOptions(attributes, registry, baseDir) {
        return Object.assign({ attributes, extension_registry: registry, sourcemap: true, safe: 'unsafe', parse: true }, (baseDir && { base_dir: baseDir }));
    }
    prepare(textDocument) {
        return __awaiter(this, void 0, void 0, function* () {
            const processor = this.processor;
            const memoryLogger = processor.MemoryLogger.create();
            processor.LoggerManager.setLogger(memoryLogger);
            const registry = processor.Extensions.create();
            yield this.asciidoctorExtensionsProvider.activate(registry);
            const textDocumentUri = textDocument.uri;
            yield this.asciidoctorConfigProvider.activate(registry, textDocumentUri);
            this.asciidoctorDiagnosticProvider.delete(textDocumentUri);
            return {
                memoryLogger,
                registry,
            };
        });
    }
}
exports.AsciidocLoader = AsciidocLoader;
class AsciidocIncludeItemsLoader extends AsciidocLoader {
    constructor(asciidoctorIncludeItemsProvider, asciidoctorConfigProvider, asciidoctorExtensionsProvider, asciidoctorDiagnosticProvider) {
        super(asciidoctorConfigProvider, asciidoctorExtensionsProvider, asciidoctorDiagnosticProvider);
        this.asciidoctorIncludeItemsProvider = asciidoctorIncludeItemsProvider;
        this.asciidoctorConfigProvider = asciidoctorConfigProvider;
        this.asciidoctorExtensionsProvider = asciidoctorExtensionsProvider;
        this.asciidoctorDiagnosticProvider = asciidoctorDiagnosticProvider;
    }
    getIncludeItems(textDocument) {
        return __awaiter(this, void 0, void 0, function* () {
            const { memoryLogger, registry, } = yield this.prepare(textDocument);
            this.asciidoctorIncludeItemsProvider.activate(registry);
            const baseDir = asciidocTextDocument_1.AsciidocTextDocument.fromTextDocument(textDocument).getBaseDir();
            const attributes = asciidoctorAttributesConfig_1.AsciidoctorAttributesConfig.getPreviewAttributes();
            this.asciidoctorIncludeItemsProvider.reset();
            this.processor.load(textDocument.getText(), this.getOptions(attributes, registry, baseDir));
            this.asciidoctorDiagnosticProvider.reportErrors(memoryLogger, textDocument);
            return this.asciidoctorIncludeItemsProvider.get();
        });
    }
}
exports.AsciidocIncludeItemsLoader = AsciidocIncludeItemsLoader;
//# sourceMappingURL=asciidocLoader.js.map