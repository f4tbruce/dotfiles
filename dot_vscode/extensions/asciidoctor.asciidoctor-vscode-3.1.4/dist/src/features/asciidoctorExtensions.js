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
exports.AsciidoctorExtensions = void 0;
const vscode_1 = __importDefault(require("vscode"));
class AsciidoctorExtensions {
    constructor(asciidoctorExtensionsSecurityPolicy) {
        this.asciidoctorExtensionsSecurityPolicy = asciidoctorExtensionsSecurityPolicy;
    }
    activate(registry) {
        return __awaiter(this, void 0, void 0, function* () {
            const enableKroki = vscode_1.default.workspace.getConfiguration('asciidoc.extensions', null).get('enableKroki');
            if (enableKroki) {
                const kroki = require('asciidoctor-kroki');
                kroki.register(registry);
            }
            yield this.registerExtensionsInWorkspace(registry);
        });
    }
    confirmAsciidoctorExtensionsTrusted() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isAsciidoctorExtensionsRegistrationEnabled()) {
                return false;
            }
            const extensionFiles = yield this.getExtensionFilesInWorkspace();
            const extensionsCount = extensionFiles.length;
            if (extensionsCount === 0) {
                return false;
            }
            return this.asciidoctorExtensionsSecurityPolicy.confirmAsciidoctorExtensionsTrustMode(extensionsCount);
        });
    }
    getExtensionFilesInWorkspace() {
        return __awaiter(this, void 0, void 0, function* () {
            return vscode_1.default.workspace.findFiles('.asciidoctor/lib/**/*.js');
        });
    }
    isAsciidoctorExtensionsRegistrationEnabled() {
        return vscode_1.default.workspace.getConfiguration('asciidoc.extensions', null).get('registerWorkspaceExtensions');
    }
    registerExtensionsInWorkspace(registry) {
        return __awaiter(this, void 0, void 0, function* () {
            const extensionsTrusted = yield this.confirmAsciidoctorExtensionsTrusted();
            if (!extensionsTrusted) {
                return;
            }
            const extfiles = yield this.getExtensionFilesInWorkspace();
            for (const extfile of extfiles) {
                const extPath = extfile.fsPath;
                try {
                    delete require.cache[extPath];
                    const extjs = require(extPath);
                    extjs.register(registry);
                }
                catch (e) {
                    vscode_1.default.window.showErrorMessage(extPath + ': ' + e.toString());
                }
            }
        });
    }
}
exports.AsciidoctorExtensions = AsciidoctorExtensions;
//# sourceMappingURL=asciidoctorExtensions.js.map