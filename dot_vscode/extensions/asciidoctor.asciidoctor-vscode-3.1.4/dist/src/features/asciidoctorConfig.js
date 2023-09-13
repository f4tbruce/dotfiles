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
exports.getAsciidoctorConfigContent = exports.AsciidoctorConfig = void 0;
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const asciidoctorProcessor_1 = require("../asciidoctorProcessor");
const MAX_DEPTH_SEARCH_ASCIIDOCCONFIG = 100;
/**
 * .asciidoctorconfig support.
 */
class AsciidoctorConfig {
    constructor() {
        const asciidoctorProcessor = asciidoctorProcessor_1.AsciidoctorProcessor.getInstance();
        this.prependExtension = asciidoctorProcessor.processor.Extensions.createPreprocessor('PrependConfigPreprocessorExtension', {
            postConstruct: function () {
                this.asciidoctorConfigContent = '';
            },
            process: function (doc, reader) {
                if (this.asciidoctorConfigContent.length > 0) {
                    // otherwise an empty line at the beginning breaks level 0 detection
                    reader.pushInclude(this.asciidoctorConfigContent, undefined, undefined, 1, {});
                }
            },
        }).$new();
    }
    activate(registry, documentUri) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.configureAsciidoctorConfigPrependExtension(documentUri);
            registry.preprocessor(this.prependExtension);
        });
    }
    configureAsciidoctorConfigPrependExtension(documentUri) {
        return __awaiter(this, void 0, void 0, function* () {
            const asciidoctorConfigContent = yield getAsciidoctorConfigContent(documentUri);
            if (asciidoctorConfigContent !== undefined) {
                this.prependExtension.asciidoctorConfigContent = asciidoctorConfigContent;
            }
            else {
                this.prependExtension.asciidoctorConfigContent = '';
            }
        });
    }
}
exports.AsciidoctorConfig = AsciidoctorConfig;
function exists(uri) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield vscode.workspace.fs.stat(uri);
            return true;
        }
        catch (err) {
            if (err && err.code === 'FileNotFound') {
                return false;
            }
            throw err;
        }
    });
}
function getAsciidoctorConfigContent(documentUri) {
    return __awaiter(this, void 0, void 0, function* () {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(documentUri);
        if (workspaceFolder === undefined) {
            return undefined;
        }
        const configContents = [];
        let currentFile = documentUri.fsPath;
        let increment = 0;
        while (currentFile !== undefined && currentFile !== workspaceFolder.uri.fsPath && increment < MAX_DEPTH_SEARCH_ASCIIDOCCONFIG) {
            increment++;
            currentFile = path.dirname(currentFile);
            configContents.push(yield getConfigContent(currentFile, '.asciidoctorconfig.adoc'));
            configContents.push(yield getConfigContent(currentFile, '.asciidoctorconfig'));
        }
        const configContentsOrderedAndFiltered = configContents
            .filter((config) => config !== undefined)
            .reverse();
        if (configContentsOrderedAndFiltered.length > 0) {
            return configContentsOrderedAndFiltered.join('\n\n');
        }
        return undefined;
    });
}
exports.getAsciidoctorConfigContent = getAsciidoctorConfigContent;
function getConfigContent(folderPath, configFilename) {
    return __awaiter(this, void 0, void 0, function* () {
        const asciidoctorConfigUri = vscode.Uri.joinPath(vscode.Uri.file(folderPath), configFilename);
        if (yield exists(asciidoctorConfigUri)) {
            const asciidoctorConfigContent = new TextDecoder().decode(yield vscode.workspace.fs.readFile(asciidoctorConfigUri));
            return `:asciidoctorconfigdir: ${folderPath}\n\n${asciidoctorConfigContent.trim()}\n\n`;
        }
        return undefined;
    });
}
//# sourceMappingURL=asciidoctorConfig.js.map