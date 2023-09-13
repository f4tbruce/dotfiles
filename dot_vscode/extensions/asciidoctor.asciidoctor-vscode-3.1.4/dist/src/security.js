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
exports.AsciidoctorExtensionsTrustModeSelector = exports.AsciidoctorExtensionsSecurityPolicyArbiter = exports.PreviewSecuritySelector = exports.ExtensionContentSecurityPolicyArbiter = void 0;
const vscode = __importStar(require("vscode"));
const nls = __importStar(require("vscode-nls"));
const localize = nls.loadMessageBundle(__filename);
class ExtensionContentSecurityPolicyArbiter {
    constructor(globalState, workspaceState) {
        this.globalState = globalState;
        this.workspaceState = workspaceState;
        this.oldTrustedWorkspaceKey = 'trusted_preview_workspace:';
        this.securityLevelKey = 'preview_security_level:';
        this.shouldDisableSecurityWarningKey = 'preview_should_show_security_warning:';
        this.globalState = globalState;
        this.workspaceState = workspaceState;
    }
    getSecurityLevelForResource(resource) {
        // Use new security level setting first
        const level = this.globalState.get(this.securityLevelKey + this.getRoot(resource), undefined);
        if (typeof level !== 'undefined') {
            return level;
        }
        // Fallback to old trusted workspace setting
        if (this.globalState.get(this.oldTrustedWorkspaceKey + this.getRoot(resource), false)) {
            return 2 /* AllowScriptsAndAllContent */;
        }
        return 0 /* Strict */;
    }
    setSecurityLevelForResource(resource, level) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.globalState.update(this.securityLevelKey + this.getRoot(resource), level);
        });
    }
    shouldAllowSvgsForResource(resource) {
        const securityLevel = this.getSecurityLevelForResource(resource);
        return securityLevel === 1 /* AllowInsecureContent */ || securityLevel === 2 /* AllowScriptsAndAllContent */;
    }
    shouldDisableSecurityWarnings() {
        return this.workspaceState.get(this.shouldDisableSecurityWarningKey, false);
    }
    setShouldDisableSecurityWarning(disabled) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.workspaceState.update(this.shouldDisableSecurityWarningKey, disabled);
        });
    }
    getRoot(resource) {
        if (vscode.workspace.workspaceFolders) {
            const folderForResource = vscode.workspace.getWorkspaceFolder(resource);
            if (folderForResource) {
                return folderForResource.uri;
            }
            if (vscode.workspace.workspaceFolders.length) {
                return vscode.workspace.workspaceFolders[0].uri;
            }
        }
        return resource;
    }
}
exports.ExtensionContentSecurityPolicyArbiter = ExtensionContentSecurityPolicyArbiter;
class PreviewSecuritySelector {
    constructor(cspArbiter, webviewManager) {
        this.cspArbiter = cspArbiter;
        this.webviewManager = webviewManager;
        this.cspArbiter = cspArbiter;
        this.webviewManager = webviewManager;
    }
    showSecuritySelectorForResource(resource) {
        return __awaiter(this, void 0, void 0, function* () {
            function markActiveWhen(when) {
                return when ? '• ' : '';
            }
            const currentSecurityLevel = this.cspArbiter.getSecurityLevelForResource(resource);
            const selection = yield vscode.window.showQuickPick([
                {
                    type: 0 /* Strict */,
                    label: markActiveWhen(currentSecurityLevel === 0 /* Strict */) + localize(0, null),
                    description: localize(1, null),
                }, {
                    type: 3 /* AllowInsecureLocalContent */,
                    label: markActiveWhen(currentSecurityLevel === 3 /* AllowInsecureLocalContent */) + localize(2, null),
                    description: localize(3, null),
                }, {
                    type: 1 /* AllowInsecureContent */,
                    label: markActiveWhen(currentSecurityLevel === 1 /* AllowInsecureContent */) + localize(4, null),
                    description: localize(5, null),
                }, {
                    type: 2 /* AllowScriptsAndAllContent */,
                    label: markActiveWhen(currentSecurityLevel === 2 /* AllowScriptsAndAllContent */) + localize(6, null),
                    description: localize(7, null),
                }, {
                    type: 'toggle',
                    label: this.cspArbiter.shouldDisableSecurityWarnings()
                        ? localize(8, null)
                        : localize(9, null),
                    description: localize(10, null),
                },
            ], {
                placeHolder: localize(11, null),
            });
            if (!selection) {
                return;
            }
            if (selection.type === 'moreinfo') {
                vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('https://go.microsoft.com/fwlink/?linkid=854414'));
                return;
            }
            if (selection.type === 'toggle') {
                yield this.cspArbiter.setShouldDisableSecurityWarning(!this.cspArbiter.shouldDisableSecurityWarnings());
                return;
            }
            yield this.cspArbiter.setSecurityLevelForResource(resource, selection.type);
            this.webviewManager.refresh();
        });
    }
}
exports.PreviewSecuritySelector = PreviewSecuritySelector;
class AsciidoctorExtensionsSecurityPolicyArbiter {
    constructor(context) {
        this.context = context;
        this.allowAsciidoctorExtensionsKey = 'asciidoc.allow_asciidoctor_extensions';
        this.trustAsciidoctorExtensionsAuthorsKey = 'asciidoc.trust_asciidoctor_extensions_authors';
        this.context = context;
    }
    static activate(context) {
        AsciidoctorExtensionsSecurityPolicyArbiter.instance = new AsciidoctorExtensionsSecurityPolicyArbiter(context);
        return AsciidoctorExtensionsSecurityPolicyArbiter.instance;
    }
    static getInstance() {
        if (!AsciidoctorExtensionsSecurityPolicyArbiter.instance) {
            throw new Error('AsciidoctorExtensionsSecurityPolicyArbiter must be activated by calling #activate()');
        }
        return AsciidoctorExtensionsSecurityPolicyArbiter.instance;
    }
    asciidoctorExtensionsAllowed() {
        return this.context.workspaceState.get(this.allowAsciidoctorExtensionsKey, false);
    }
    enableAsciidoctorExtensions() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.setAllowAsciidoctorExtensions(true);
        });
    }
    disableAsciidoctorExtensions() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.setAllowAsciidoctorExtensions(false);
        });
    }
    asciidoctorExtensionsAuthorsTrusted() {
        return this.context.workspaceState.get(this.trustAsciidoctorExtensionsAuthorsKey, undefined);
    }
    denyAsciidoctorExtensionsAuthors() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.setTrustAsciidoctorExtensionsAuthors(false);
        });
    }
    trustAsciidoctorExtensionsAuthors() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.setTrustAsciidoctorExtensionsAuthors(true);
        });
    }
    confirmAsciidoctorExtensionsTrustMode(extensionsCount) {
        return __awaiter(this, void 0, void 0, function* () {
            const extensionsTrusted = this.asciidoctorExtensionsAuthorsTrusted();
            if (extensionsTrusted !== undefined) {
                // Asciidoctor.js extensions authors are already trusted or not, do not ask again.
                return extensionsTrusted;
            }
            return this.showTrustAsciidoctorExtensionsDialog(extensionsCount);
        });
    }
    showTrustAsciidoctorExtensionsDialog(extensionsCount) {
        return __awaiter(this, void 0, void 0, function* () {
            const userChoice = yield vscode.window.showWarningMessage(`This feature will execute ${extensionsCount} JavaScript ${extensionsCount > 1 ? 'files' : 'file'} from .asciidoctor/lib/**/*.js.
      Do you trust the authors of ${extensionsCount > 1 ? 'these files' : 'this file'}?`, 
            // "modal" is disabled. Because, I couldn't control the button's order in Linux when "modal" is enabled.
            { title: 'Yes, I trust the authors', value: true }, { title: 'No, I don\'t trust the authors', value: false });
            // if userChoice is undefined, no choice was selected, consider that we don't trust authors.
            const trustGranted = (userChoice === null || userChoice === void 0 ? void 0 : userChoice.value) || false;
            yield this.setTrustAsciidoctorExtensionsAuthors(trustGranted);
            return trustGranted;
        });
    }
    setAllowAsciidoctorExtensions(value) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.context.workspaceState.update(this.allowAsciidoctorExtensionsKey, value);
        });
    }
    setTrustAsciidoctorExtensionsAuthors(value) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.context.workspaceState.update(this.trustAsciidoctorExtensionsAuthorsKey, value);
        });
    }
}
exports.AsciidoctorExtensionsSecurityPolicyArbiter = AsciidoctorExtensionsSecurityPolicyArbiter;
class AsciidoctorExtensionsTrustModeSelector {
    showSelector() {
        return __awaiter(this, void 0, void 0, function* () {
            const aespArbiter = AsciidoctorExtensionsSecurityPolicyArbiter.getInstance();
            const asciidoctorExtensionsAuthorsTrusted = aespArbiter.asciidoctorExtensionsAuthorsTrusted();
            function markActiveWhen(when) {
                return when ? '• ' : '';
            }
            const userChoice = yield vscode.window.showQuickPick([
                {
                    type: 'deny_asciidoctor_extensions_authors',
                    label: markActiveWhen(asciidoctorExtensionsAuthorsTrusted === false) + localize(12, null),
                    description: localize(13, null),
                }, {
                    type: 'trust_asciidoctor_extensions_authors',
                    label: markActiveWhen(asciidoctorExtensionsAuthorsTrusted === true) + localize(14, null),
                    description: localize(15, null),
                },
            ], {
                placeHolder: localize(16, null),
            });
            if (!userChoice) {
                return;
            }
            if (userChoice.type === 'deny_asciidoctor_extensions_authors') {
                yield aespArbiter.denyAsciidoctorExtensionsAuthors();
            }
            if (userChoice.type === 'trust_asciidoctor_extensions_authors') {
                yield aespArbiter.enableAsciidoctorExtensions(); // make sure that Asciidoctor.js extensions are enabled
                yield aespArbiter.trustAsciidoctorExtensionsAuthors();
            }
        });
    }
}
exports.AsciidoctorExtensionsTrustModeSelector = AsciidoctorExtensionsTrustModeSelector;
//# sourceMappingURL=security.js.map