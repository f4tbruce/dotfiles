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
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const commands_1 = require("../commands");
const links_1 = require("../util/links");
const similarArrayMatch_1 = require("../similarArrayMatch");
const linkSanitizer_1 = require("../linkSanitizer");
const nls = __importStar(require("vscode-nls"));
/**
 * Reference: https://gist.github.com/dperini/729294
 */
// eslint-disable-next-line max-len
const urlRx = /(?:(?:https?|ftp|irc):)?\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4])|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+[a-z\u00a1-\uffff]{2,}\.?)(?::\d{2,5})?(?:[/?#][^[]*)?/ig;
const inlineAnchorRx = /^\[\[(?<id>[^,]+)(?:,[^\]]+)*]]$/m;
const xrefRx = /xref:(?<target>[^#|^[]+)(?<fragment>#[^[]+)?\[[^\]]*]/ig;
const localize = nls.loadMessageBundle(__filename);
function normalizeLink(document, link, base) {
    const externalSchemeUri = (0, links_1.getUriForLinkWithKnownExternalScheme)(link);
    if (externalSchemeUri) {
        return externalSchemeUri;
    }
    // Assume it must be a relative or absolute file path
    // Use a fake scheme to avoid parse warnings
    const tempUri = vscode.Uri.parse(`vscode-resource:${link}`);
    let resourcePath;
    if (!tempUri.path) {
        resourcePath = document.uri.path;
    }
    else if (link[0] === '/') {
        resourcePath = tempUri.path;
    }
    else {
        resourcePath = path.join(base, tempUri.path);
    }
    const sanitizedResourcePath = (0, linkSanitizer_1.isSchemeBlacklisted)(link) ? '#' : resourcePath;
    return commands_1.OpenDocumentLinkCommand.createCommandUri(sanitizedResourcePath, tempUri.fragment);
}
class LinkProvider {
    constructor(asciidocIncludeItemsLoader) {
        this.asciidocIncludeItemsLoader = asciidocIncludeItemsLoader;
    }
    provideDocumentLinks(textDocument, _token) {
        return __awaiter(this, void 0, void 0, function* () {
            // includes from the reader are resolved correctly but the line numbers may be offset and not exactly match the document
            let baseDocumentProcessorIncludes = yield this.asciidocIncludeItemsLoader.getIncludeItems(textDocument);
            const includeDirective = /^(\\)?include::([^[]+)\[([^\n]+)?]$/;
            // get includes from document text. These may be inside ifeval or ifdef but the line numbers are correct.
            const baseDocumentRegexIncludes = new Map();
            const results = [];
            const anchors = {};
            const xrefProxies = [];
            const base = textDocument.uri.path.substring(0, textDocument.uri.path.lastIndexOf('/'));
            for (let lineNumber = 0; lineNumber < textDocument.lineCount; lineNumber++) {
                const line = textDocument.lineAt(lineNumber).text;
                const match = includeDirective.exec(line);
                if (match) {
                    const includeReference = match[2];
                    baseDocumentRegexIncludes.set(lineNumber, includeReference.length);
                }
                if (line.includes(':') && line.includes('://')) {
                    const urlsFound = line.matchAll(urlRx);
                    if (urlsFound) {
                        for (const urlFound of urlsFound) {
                            const index = urlFound.index;
                            const url = urlFound[0];
                            const documentLink = new vscode.DocumentLink(new vscode.Range(new vscode.Position(lineNumber, index), new vscode.Position(lineNumber, url.length + index)), vscode.Uri.parse(url));
                            documentLink.tooltip = localize(0, null); // translation provided by VS code
                            results.push(documentLink);
                        }
                    }
                }
                if (line.startsWith('[[') && line.endsWith(']]')) {
                    const inlineAnchorFound = line.match(inlineAnchorRx);
                    if (inlineAnchorFound) {
                        const inlineAnchorId = inlineAnchorFound.groups.id;
                        anchors[`${textDocument.uri.path}#${inlineAnchorId}`] = {
                            lineNumber: lineNumber + 1,
                        };
                    }
                }
                if (line.includes('xref:')) {
                    const xrefsFound = line.matchAll(xrefRx);
                    if (xrefsFound) {
                        for (const xrefFound of xrefsFound) {
                            const index = xrefFound.index;
                            const target = xrefFound.groups.target;
                            let fragment = xrefFound.groups.fragment || '';
                            const originalTarget = `${target}${fragment}`;
                            let targetUri;
                            if (path.isAbsolute(target)) {
                                targetUri = vscode.Uri.parse(target);
                            }
                            else {
                                targetUri = vscode.Uri.parse(base + '/' + target);
                            }
                            if (targetUri.path === textDocument.uri.path) {
                                xrefProxies.push((anchors) => {
                                    const anchorFound = anchors[`${targetUri.path}${fragment}`];
                                    if (anchorFound) {
                                        fragment = `#L${anchorFound.lineNumber}`;
                                    }
                                    const documentLink = new vscode.DocumentLink(new vscode.Range(
                                    // exclude xref: prefix
                                    new vscode.Position(lineNumber, index + 5), new vscode.Position(lineNumber, originalTarget.length + index + 5)), normalizeLink(textDocument, `${target}${fragment}`, base));
                                    documentLink.tooltip = localize(1, null, target);
                                    return documentLink;
                                });
                            }
                            else {
                                const documentLink = new vscode.DocumentLink(new vscode.Range(new vscode.Position(lineNumber, index + 5), new vscode.Position(lineNumber, originalTarget.length + index + 5)), normalizeLink(textDocument, `${target}${fragment}`, base));
                                documentLink.tooltip = localize(2, null, target);
                                results.push(documentLink);
                            }
                        }
                    }
                }
            }
            if (xrefProxies && xrefProxies.length > 0) {
                for (const xrefProxy of xrefProxies) {
                    results.push(xrefProxy(anchors));
                }
            }
            // find a corrected mapping for line numbers
            const betterIncludeMatching = (0, similarArrayMatch_1.similarArrayMatch)(Array.from(baseDocumentRegexIncludes.keys()), baseDocumentProcessorIncludes.map((entry) => {
                return entry.position;
            }));
            // update line items in reader results
            baseDocumentProcessorIncludes = baseDocumentProcessorIncludes.map((entry) => {
                return Object.assign(Object.assign({}, entry), { index: betterIncludeMatching[entry.index] });
            });
            // create include links
            if (baseDocumentProcessorIncludes) {
                baseDocumentProcessorIncludes.forEach((entry) => {
                    const lineNo = entry.position - 1;
                    const documentLink = new vscode.DocumentLink(new vscode.Range(
                    // don't link to the "include::" part or the square bracket contents
                    new vscode.Position(lineNo, 9), new vscode.Position(lineNo, entry.length + 9)), normalizeLink(textDocument, entry.name, base));
                    documentLink.tooltip = localize(3, null, entry.name);
                    results.push(documentLink);
                });
            }
            return results;
        });
    }
}
exports.default = LinkProvider;
//# sourceMappingURL=documentLinkProvider.js.map