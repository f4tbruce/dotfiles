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
exports.TableOfContentsProvider = void 0;
const vscode = __importStar(require("vscode"));
const slugify_1 = require("./slugify");
class TableOfContentsProvider {
    constructor(document, asciidocLoader) {
        this.document = document;
        this.asciidocLoader = asciidocLoader;
        this.document = document;
    }
    getToc() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.toc) {
                try {
                    this.toc = yield this.buildToc(this.document);
                }
                catch (e) {
                    console.log(`Unable to build the Table Of Content for: ${this.document.fileName}`, e);
                    this.toc = [];
                }
            }
            return this.toc;
        });
    }
    lookup(fragment) {
        return __awaiter(this, void 0, void 0, function* () {
            const toc = yield this.getToc();
            const slug = slugify_1.githubSlugifier.fromHeading(fragment);
            return toc.find((entry) => entry.slug.equals(slug));
        });
    }
    buildToc(textDocument) {
        return __awaiter(this, void 0, void 0, function* () {
            const asciidocDocument = yield this.asciidocLoader.load(textDocument);
            const toc = asciidocDocument
                .findBy({ context: 'section' })
                .map((section) => {
                let lineNumber = section.getLineNumber(); // Asciidoctor is 1-based but can return 0 (probably a bug/limitation)
                if (lineNumber > 0) {
                    lineNumber = lineNumber - 1;
                }
                return {
                    slug: new slugify_1.Slug(section.getId()),
                    text: section.getTitle(),
                    level: section.getLevel(),
                    line: lineNumber,
                    location: new vscode.Location(textDocument.uri, new vscode.Position(lineNumber, 1)),
                };
            });
            // Get full range of section
            return toc.map((entry, startIndex) => {
                let end;
                for (let i = startIndex + 1; i < toc.length; ++i) {
                    if (toc[i].level <= entry.level) {
                        end = toc[i].line - 1;
                        break;
                    }
                }
                let endLine = typeof end === 'number' ? end : textDocument.lineCount - 1;
                if (endLine > textDocument.lineCount - 1) {
                    endLine = textDocument.lineCount - 1;
                }
                return Object.assign(Object.assign({}, entry), { location: new vscode.Location(textDocument.uri, new vscode.Range(entry.location.range.start, new vscode.Position(endLine, textDocument.lineAt(endLine).range.end.character))) });
            });
        });
    }
}
exports.TableOfContentsProvider = TableOfContentsProvider;
//# sourceMappingURL=tableOfContentsProvider.js.map