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
exports.getAntoraDocumentContext = exports.getAttributes = exports.getAntoraConfig = exports.getAntoraConfigs = exports.antoraConfigFileExists = exports.findAntoraConfigFile = exports.AntoraSupportManager = exports.AntoraContext = exports.AntoraDocumentContext = exports.AntoraConfig = void 0;
const vscode_1 = __importStar(require("vscode"));
const fs_1 = __importDefault(require("fs"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const vinyl_1 = __importDefault(require("vinyl"));
const path = __importStar(require("path"));
const antoraCompletionProvider_1 = __importDefault(require("./antoraCompletionProvider"));
const dispose_1 = require("../../util/dispose");
const nls = __importStar(require("vscode-nls"));
const localize = nls.loadMessageBundle(__filename);
class AntoraConfig {
    constructor(fsPath, config) {
        this.fsPath = fsPath;
        this.config = config;
    }
}
exports.AntoraConfig = AntoraConfig;
class AntoraDocumentContext {
    constructor(antoraContext, resourceContext) {
        this.antoraContext = antoraContext;
        this.resourceContext = resourceContext;
        this.PERMITTED_FAMILIES = ['attachment', 'example', 'image', 'page', 'partial'];
    }
    resolveAntoraResourceIds(id, defaultFamily) {
        var _a;
        const resource = this.antoraContext.contentCatalog.resolveResource(id, this.resourceContext, defaultFamily, this.PERMITTED_FAMILIES);
        if (resource) {
            return (_a = resource.src) === null || _a === void 0 ? void 0 : _a.abspath;
        }
        return undefined;
    }
    getComponents() {
        return this.antoraContext.contentCatalog.getComponents();
    }
    getImages() {
        return this.antoraContext.contentCatalog.findBy({ family: 'image' });
    }
}
exports.AntoraDocumentContext = AntoraDocumentContext;
class AntoraContext {
    constructor(contentCatalog) {
        this.contentCatalog = contentCatalog;
    }
    getResource(textDocumentUri) {
        return __awaiter(this, void 0, void 0, function* () {
            const antoraConfig = yield getAntoraConfig(textDocumentUri);
            if (antoraConfig === undefined) {
                return undefined;
            }
            const contentSourceRootPath = path.dirname(antoraConfig.fsPath);
            const config = antoraConfig.config;
            if (config.name === undefined) {
                return undefined;
            }
            const page = this.contentCatalog.getByPath({
                component: config.name,
                version: config.version,
                path: path.relative(contentSourceRootPath, textDocumentUri.path),
            });
            if (page === undefined) {
                return undefined;
            }
            return page.src;
        });
    }
}
exports.AntoraContext = AntoraContext;
class AntoraSupportManager {
    constructor() {
        this._disposables = [];
    }
    static getInstance(workspaceState) {
        if (AntoraSupportManager.instance) {
            AntoraSupportManager.workspaceState = workspaceState;
            return AntoraSupportManager.instance;
        }
        AntoraSupportManager.instance = new AntoraSupportManager();
        AntoraSupportManager.workspaceState = workspaceState;
        const workspaceConfiguration = vscode_1.default.workspace.getConfiguration('asciidoc', null);
        // look for Antora support setting in workspace state
        const isEnableAntoraSupportSettingDefined = workspaceState.get('antoraSupportSetting');
        if (isEnableAntoraSupportSettingDefined === true) {
            const enableAntoraSupport = workspaceConfiguration.get('antora.enableAntoraSupport');
            if (enableAntoraSupport === true) {
                AntoraSupportManager.instance.registerFeatures();
            }
        }
        else if (isEnableAntoraSupportSettingDefined === undefined) {
            // choice has not been made
            const onDidOpenAsciiDocFileAskAntoraSupport = vscode_1.default.workspace.onDidOpenTextDocument((textDocument) => __awaiter(this, void 0, void 0, function* () {
                if (yield antoraConfigFileExists(textDocument.uri)) {
                    const yesAnswer = localize(0, null);
                    const noAnswer = localize(1, null);
                    const answer = yield vscode_1.default.window.showInformationMessage(localize(2, null), yesAnswer, noAnswer);
                    yield workspaceState.update('antoraSupportSetting', true);
                    const enableAntoraSupport = answer === yesAnswer ? true : (answer === noAnswer ? false : undefined);
                    yield workspaceConfiguration.update('antora.enableAntoraSupport', enableAntoraSupport);
                    if (enableAntoraSupport) {
                        AntoraSupportManager.instance.registerFeatures();
                    }
                    // do not ask again to avoid bothering users
                    onDidOpenAsciiDocFileAskAntoraSupport.dispose();
                }
            }));
            AntoraSupportManager.instance._disposables.push(onDidOpenAsciiDocFileAskAntoraSupport);
        }
    }
    static isEnabled(workspaceState) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield AntoraSupportManager.getInstance(workspaceState)).isEnabled();
        });
    }
    getAttributes(textDocumentUri) {
        return __awaiter(this, void 0, void 0, function* () {
            const antoraEnabled = this.isEnabled();
            if (antoraEnabled) {
                return getAttributes(textDocumentUri);
            }
            return {};
        });
    }
    isEnabled() {
        const workspaceConfiguration = vscode_1.default.workspace.getConfiguration('asciidoc', null);
        // look for Antora support setting in workspace state
        const isEnableAntoraSupportSettingDefined = AntoraSupportManager.workspaceState.get('antoraSupportSetting');
        if (isEnableAntoraSupportSettingDefined === true) {
            const enableAntoraSupport = workspaceConfiguration.get('antora.enableAntoraSupport');
            if (enableAntoraSupport === true) {
                return true;
            }
        }
        // choice has not been made or Antora is explicitly disabled
        return false;
    }
    getAntoraDocumentContext(textDocumentUri) {
        return __awaiter(this, void 0, void 0, function* () {
            const antoraEnabled = this.isEnabled();
            if (antoraEnabled) {
                return getAntoraDocumentContext(textDocumentUri, AntoraSupportManager.workspaceState);
            }
            return undefined;
        });
    }
    registerFeatures() {
        const attributesCompletionProvider = vscode_1.default.languages.registerCompletionItemProvider({
            language: 'asciidoc',
            scheme: 'file',
        }, new antoraCompletionProvider_1.default(), '{');
        this._disposables.push(attributesCompletionProvider);
    }
    dispose() {
        (0, dispose_1.disposeAll)(this._disposables);
    }
}
exports.AntoraSupportManager = AntoraSupportManager;
function findAntoraConfigFile(textDocumentUri) {
    return __awaiter(this, void 0, void 0, function* () {
        const pathToAsciidocFile = textDocumentUri.toString();
        const cancellationToken = new vscode_1.CancellationTokenSource();
        cancellationToken.token.onCancellationRequested((e) => {
            console.log('Cancellation requested, cause: ' + e);
        });
        const antoraConfigs = yield vscode_1.default.workspace.findFiles('**/antora.yml', '/node_modules/', 100, cancellationToken.token);
        // check for Antora configuration
        for (const antoraConfig of antoraConfigs) {
            const modulesUri = antoraConfig.with({ path: path.join(path.dirname(antoraConfig.path), 'modules') });
            if (pathToAsciidocFile.startsWith(modulesUri.toString()) && pathToAsciidocFile.slice(modulesUri.toString().length).match(/^\/[^/]+\/pages\/.*/)) {
                console.log(`Found an Antora configuration file at ${antoraConfig.toString()} for the AsciiDoc document ${pathToAsciidocFile}`);
                return antoraConfig;
            }
        }
        console.log(`Unable to find an applicable Antora configuration file in [${antoraConfigs.join(', ')}] for the AsciiDoc document ${pathToAsciidocFile}`);
        return undefined;
    });
}
exports.findAntoraConfigFile = findAntoraConfigFile;
function antoraConfigFileExists(textDocumentUri) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield findAntoraConfigFile(textDocumentUri)) !== undefined;
    });
}
exports.antoraConfigFileExists = antoraConfigFileExists;
function getAntoraConfigs() {
    return __awaiter(this, void 0, void 0, function* () {
        const cancellationToken = new vscode_1.CancellationTokenSource();
        cancellationToken.token.onCancellationRequested((e) => {
            console.log('Cancellation requested, cause: ' + e);
        });
        const antoraConfigUris = yield vscode_1.default.workspace.findFiles('**/antora.yml', '/node_modules/', 100, cancellationToken.token);
        // check for Antora configuration
        const antoraConfigs = yield Promise.all(antoraConfigUris.map((antoraConfigUri) => __awaiter(this, void 0, void 0, function* () {
            let config = {};
            const parentPath = antoraConfigUri.path.slice(0, antoraConfigUri.path.lastIndexOf('/'));
            const parentDirectoryStat = yield vscode_1.default.workspace.fs.stat(antoraConfigUri.with({ path: parentPath }));
            if (parentDirectoryStat.type === (vscode_1.FileType.Directory | vscode_1.FileType.SymbolicLink) || parentDirectoryStat.type === vscode_1.FileType.SymbolicLink) {
                // ignore!
                return undefined;
            }
            try {
                config = js_yaml_1.default.load(yield vscode_1.default.workspace.fs.readFile(antoraConfigUri)) || {};
            }
            catch (err) {
                console.log(`Unable to parse ${antoraConfigUri}, cause:` + err.toString());
            }
            return new AntoraConfig(antoraConfigUri.fsPath, config);
        })));
        return antoraConfigs.filter((c) => c); // filter undefined
    });
}
exports.getAntoraConfigs = getAntoraConfigs;
function getAntoraConfig(textDocumentUri) {
    return __awaiter(this, void 0, void 0, function* () {
        const antoraConfigUri = yield findAntoraConfigFile(textDocumentUri);
        if (antoraConfigUri === undefined) {
            return undefined;
        }
        const antoraConfigPath = antoraConfigUri.fsPath;
        let config = {};
        try {
            config = js_yaml_1.default.load(fs_1.default.readFileSync(antoraConfigPath, 'utf8')) || {};
        }
        catch (err) {
            console.log(`Unable to parse ${antoraConfigPath}, cause:` + err.toString());
        }
        return new AntoraConfig(antoraConfigPath, config);
    });
}
exports.getAntoraConfig = getAntoraConfig;
function getAttributes(textDocumentUri) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const antoraConfig = yield getAntoraConfig(textDocumentUri);
        if (antoraConfig === undefined) {
            return {};
        }
        return ((_a = antoraConfig.config.asciidoc) === null || _a === void 0 ? void 0 : _a.attributes) || {};
    });
}
exports.getAttributes = getAttributes;
function getAntoraDocumentContext(textDocumentUri, workspaceState) {
    return __awaiter(this, void 0, void 0, function* () {
        const antoraSupportManager = yield AntoraSupportManager.getInstance(workspaceState);
        if (!antoraSupportManager.isEnabled()) {
            return undefined;
        }
        try {
            const antoraConfigs = yield getAntoraConfigs();
            const contentAggregate = (yield Promise.all(antoraConfigs
                .filter((antoraConfig) => antoraConfig.config !== undefined && 'name' in antoraConfig.config && 'version' in antoraConfig.config)
                .map((antoraConfig) => __awaiter(this, void 0, void 0, function* () {
                const contentSourceRootPath = path.dirname(antoraConfig.fsPath);
                const workspaceFolder = vscode_1.default.workspace.getWorkspaceFolder(vscode_1.default.Uri.file(antoraConfig.fsPath));
                const workspaceRelative = path.relative(workspaceFolder.uri.fsPath, contentSourceRootPath);
                const files = yield Promise.all((yield vscode_1.default.workspace.findFiles(workspaceRelative + '/modules/**/*')).map((file) => __awaiter(this, void 0, void 0, function* () {
                    return new vinyl_1.default({
                        base: contentSourceRootPath,
                        path: path.relative(contentSourceRootPath, file.path),
                        contents: Buffer.from((yield vscode_1.default.workspace.fs.readFile(vscode_1.Uri.file(file.fsPath)))),
                        extname: path.extname(file.path),
                        stem: path.basename(file.path, path.extname(file.path)),
                        src: {
                            abspath: file.path,
                            basename: path.basename(file.path),
                            editUrl: '',
                            extname: path.extname(file.path),
                            fileUrl: file.fsPath,
                            path: file.path,
                            stem: path.basename(file.path, path.extname(file.path)),
                        },
                    });
                })));
                return Object.assign(Object.assign({ name: antoraConfig.config.name, version: antoraConfig.config.version }, antoraConfig.config), { files });
            }))));
            let classifyContent = yield Promise.resolve().then(() => __importStar(require('@antora/content-classifier')));
            if ('default' in classifyContent) {
                classifyContent = classifyContent.default; // default export
            }
            const contentCatalog = yield classifyContent({
                site: {},
            }, contentAggregate);
            const antoraContext = new AntoraContext(contentCatalog);
            const antoraResourceContext = yield antoraContext.getResource(textDocumentUri);
            if (antoraResourceContext === undefined) {
                return undefined;
            }
            return new AntoraDocumentContext(antoraContext, antoraResourceContext);
        }
        catch (err) {
            console.error(`Unable to get Antora context for ${textDocumentUri}`, err);
            return undefined;
        }
    });
}
exports.getAntoraDocumentContext = getAntoraDocumentContext;
//# sourceMappingURL=antoraSupport.js.map