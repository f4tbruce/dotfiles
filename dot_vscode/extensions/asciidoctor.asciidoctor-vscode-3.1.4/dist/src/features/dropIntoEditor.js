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
exports.DropImageIntoEditorProvider = void 0;
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const URI = __importStar(require("vscode-uri"));
const imageFileExtensions = new Set([
    '.bmp',
    '.gif',
    '.ico',
    '.jpe',
    '.jpeg',
    '.jpg',
    '.png',
    '.svg',
    '.tga',
    '.tif',
    '.tiff',
    '.webp',
]);
class DropImageIntoEditorProvider {
    constructor(asciidocLoader) {
        this.asciidocLoader = asciidocLoader;
    }
    provideDocumentDropEdits(textDocument, _position, dataTransfer, token) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if drop config is enabled
            const enabled = vscode.workspace.getConfiguration('asciidoc', textDocument).get('editor.drop.enabled', true);
            if (!enabled) {
                return undefined;
            }
            // Return the text or snippet to insert at the drop location.
            const snippet = yield tryGetUriListSnippet(textDocument, this.asciidocLoader, dataTransfer, token);
            return snippet ? new vscode.DocumentDropEdit(snippet) : undefined;
        });
    }
}
exports.DropImageIntoEditorProvider = DropImageIntoEditorProvider;
function tryGetUriListSnippet(textDocument, asciidocLoader, dataTransfer, token) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        // Get dropped files uris
        const urlList = yield ((_a = dataTransfer.get('text/uri-list')) === null || _a === void 0 ? void 0 : _a.asString());
        if (!urlList || token.isCancellationRequested) {
            return undefined;
        }
        const uris = [];
        for (const resource of urlList.split('\n')) {
            uris.push(vscode.Uri.parse(resource.replace('\r', '')));
        }
        if (!uris.length) {
            return;
        }
        const document = yield asciidocLoader.load(textDocument);
        const imagesDirectory = document.getAttribute('imagesdir');
        const snippet = new vscode.SnippetString();
        // Drop location uri
        const docUri = textDocument.uri;
        // Get uri for each uris list value
        uris.forEach((uri, index) => {
            let imagePath;
            if (docUri.scheme === uri.scheme && docUri.authority === uri.authority) {
                const imageRelativePath = path.relative(URI.Utils.dirname(docUri).fsPath, uri.fsPath).replace(/\\/g, '/');
                if (imagesDirectory && imageRelativePath.startsWith(imagesDirectory)) {
                    imagePath = encodeURI(imageRelativePath.substring(imagesDirectory.length));
                }
                else {
                    imagePath = encodeURI(imageRelativePath);
                }
            }
            else {
                imagePath = uri.toString(false);
            }
            // Check that the dropped file is an image
            const ext = URI.Utils.extname(uri).toLowerCase();
            snippet.appendText(imageFileExtensions.has(ext) ? `image::${imagePath}[]` : '');
            // Add a line break if multiple dropped documents
            if (index <= uris.length - 1 && uris.length > 1) {
                snippet.appendText('\n');
            }
        });
        return snippet;
    });
}
//# sourceMappingURL=dropIntoEditor.js.map