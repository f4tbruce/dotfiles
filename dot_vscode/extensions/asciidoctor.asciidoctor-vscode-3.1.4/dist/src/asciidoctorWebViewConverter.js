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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsciidoctorWebViewConverter = void 0;
const vscode_1 = __importDefault(require("vscode"));
const uri = __importStar(require("vscode-uri"));
const nls = __importStar(require("vscode-nls"));
const localize = nls.loadMessageBundle(__filename);
const { Opal } = require('asciidoctor-opal-runtime');
const processor = require('@asciidoctor/core')();
const BAD_PROTO_RE = /^(vbscript|javascript|data):/i;
const GOOD_DATA_RE = /^data:image\/(gif|png|jpeg|webp);/i;
/**
 * Disallow blacklisted URL types following MarkdownIt and the VS Code Markdown extension
 * @param   {String}  href   The link address
 * @returns {boolean}        Whether the link is valid
 */
function isSchemeBlacklisted(href) {
    const hrefCheck = href.trim();
    if (BAD_PROTO_RE.test(hrefCheck)) {
        // we still allow specific safe "data:image/" URIs
        return !GOOD_DATA_RE.test(hrefCheck);
    }
    return false;
}
/**
 * Strings used inside the asciidoc preview.
 *
 * Stored here and then injected in the preview so that they
 * can be localized using our normal localization process.
 */
const previewStrings = {
    cspAlertMessageText: localize(0, null),
    cspAlertMessageTitle: localize(1, null),
    cspAlertMessageLabel: localize(2, null),
};
/**
 * @param securityLevel
 * @param nonce
 */
function getCspForResource(webviewResourceProvider, securityLevel, nonce) {
    const rule = webviewResourceProvider.cspSource;
    const highlightjsInlineScriptHash = 'sha256-ZrDBcrmObbqhVV/Mag2fT/y08UJGejdW7UWyEsi4DXw=';
    // add font-src about: as a workaround: https://github.com/mathjax/MathJax/issues/256#issuecomment-37990603
    switch (securityLevel) {
        case 1 /* AllowInsecureContent */:
            return `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' ${rule} http: https: data:; media-src 'self' ${rule} http: https: data:; script-src 'nonce-${nonce}' '${highlightjsInlineScriptHash}' https://*.vscode-cdn.net/; style-src 'self' ${rule} 'unsafe-inline' http: https: data:; font-src 'self' ${rule} http: https: data: about:;">`;
        case 3 /* AllowInsecureLocalContent */:
            return `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' ${rule} https: data: http://localhost:* http://127.0.0.1:*; media-src 'self' ${rule} https: data: http://localhost:* http://127.0.0.1:*; script-src 'nonce-${nonce}' '${highlightjsInlineScriptHash}' https://*.vscode-cdn.net/; style-src 'self' ${rule} 'unsafe-inline' https: data: http://localhost:* http://127.0.0.1:*; font-src 'self' ${rule} https: data: http://localhost:* http://127.0.0.1:* about:;">`;
        case 2 /* AllowScriptsAndAllContent */:
            return '<meta http-equiv="Content-Security-Policy" content="">';
        case 0 /* Strict */:
        default:
            return `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' ${rule} https: data:; media-src 'self' ${rule} https: data:; script-src 'nonce-${nonce}' '${highlightjsInlineScriptHash}' https://*.vscode-cdn.net/; style-src 'self' ${rule} 'unsafe-inline' https: data:; font-src 'self' ${rule} https: data: about:;">`;
    }
}
function escapeAttribute(value) {
    return value.toString().replace(/"/g, '&quot;');
}
/**
 * Custom converter to support VS Code WebView security
 */
class AsciidoctorWebViewConverter {
    constructor(textDocument, webviewResourceProvider, cspArbitergetSecurityLevelForResource, cspArbiterShouldDisableSecurityWarnings, contributions, previewConfigurations, antoraDocumentContext, line = undefined, state, krokiServerUrl) {
        this.textDocument = textDocument;
        this.webviewResourceProvider = webviewResourceProvider;
        this.contributions = contributions;
        this.antoraDocumentContext = antoraDocumentContext;
        this.krokiServerUrl = krokiServerUrl;
        const textDocumentUri = textDocument.uri;
        this.basebackend = 'html';
        this.outfilesuffix = '.html';
        this.supports_templates = true;
        this.baseConverter = processor.Html5Converter.create();
        this.securityLevel = cspArbitergetSecurityLevelForResource;
        this.config = previewConfigurations;
        this.initialData = {
            source: textDocumentUri.toString(),
            line,
            lineCount: textDocument.lineCount,
            scrollPreviewWithEditor: this.config.scrollPreviewWithEditor,
            scrollEditorWithPreview: this.config.scrollEditorWithPreview,
            doubleClickToSwitchToEditor: this.config.doubleClickToSwitchToEditor,
            preservePreviewWhenHidden: this.config.preservePreviewWhenHidden,
            disableSecurityWarnings: cspArbiterShouldDisableSecurityWarnings,
        };
        this.state = state || {};
    }
    // alias to $convert method to use AsciidoctorWebViewConverter as option in processor.convert method in Asciidoctor.js
    $convert(node, transform) {
        return this.convert(node, transform);
    }
    /**
     Convert links to ensure WebView security for preview through use of data-href attribute
     * @param node        Type of node in Asciidoctor AST
     * @param transform   An optional string transform that hints at which transformation should be applied to this node
     * @returns           Converted node
     */
    convert(node, transform) {
        var _a;
        const nodeName = transform || node.getNodeName();
        if (nodeName === 'document') {
            // Content Security Policy
            const nonce = new Date().getTime() + '' + new Date().getMilliseconds();
            const webviewResourceProvider = this.webviewResourceProvider;
            const csp = getCspForResource(webviewResourceProvider, this.securityLevel, nonce);
            const syntaxHighlighter = node.$syntax_highlighter();
            let assetUriScheme = node.getAttribute('asset-uri-scheme', 'https');
            if (assetUriScheme.trim() !== '') {
                assetUriScheme = `${assetUriScheme}:`;
            }
            const syntaxHighlighterHeadContent = (syntaxHighlighter !== Opal.nil && syntaxHighlighter['$docinfo?']('head'))
                ? syntaxHighlighter.$docinfo('head', node, {})
                : '';
            const syntaxHighlighterFooterContent = (syntaxHighlighter !== Opal.nil && syntaxHighlighter['$docinfo?']('footer'))
                ? syntaxHighlighter.$docinfo('footer', node, {})
                : '';
            const headerDocinfo = node.getDocinfo('header');
            const footerDocinfo = node.getDocinfo('footer');
            return `<!DOCTYPE html>
     <html style="${escapeAttribute(this.getSettingsOverrideStyles(this.config))}">
      <head>
        <meta http-equiv="Content-type" content="text/html;charset=UTF-8">
        ${csp}
        <meta id="vscode-asciidoc-preview-data"
          data-settings="${escapeAttribute(JSON.stringify(this.initialData))}"
          data-strings="${escapeAttribute(JSON.stringify(previewStrings))}"
          data-state="${escapeAttribute(JSON.stringify(this.state))}">
        <script src="${this.extensionResourcePath('pre.js')}" nonce="${nonce}"></script>
        ${this.getStyles(node, webviewResourceProvider, this.textDocument.uri, this.config, this.state)}
        ${syntaxHighlighterHeadContent}
        ${node.getDocinfo()}
        <base href="${webviewResourceProvider.asWebviewUri(this.textDocument.uri)}">
      </head>
      <body${node.getId() ? ` id="${node.getId()}"` : ''} class="${this.getBodyCssClasses(node)}">
        ${headerDocinfo}
        ${this.getDocumentHeader(node)}
        <div id="content">
          ${node.getContent()}
        </div>
        ${this.generateFootnotes(node)}
        ${this.generateFooter(node)}
        <div class="code-line" data-line="${this.textDocument.lineCount}"></div>
        ${this.getScripts(webviewResourceProvider, nonce)}
        ${syntaxHighlighterFooterContent}
        ${this.generateMathJax(node, webviewResourceProvider, nonce)}
        ${footerDocinfo}
      </body>
      </html>`;
        }
        if (nodeName === 'inline_anchor' && node.type === 'link') {
            const href = isSchemeBlacklisted(node.target) ? '#' : node.target;
            const id = node.hasAttribute('id') ? ` id="${node.id}"` : '';
            const role = node.hasAttribute('role') ? ` class="${node.getRole()}"` : '';
            const title = node.hasAttribute('title') ? ` title="${node.title}"` : '';
            return `<a href="${href}"${id}${role}${title} data-href="${href}">${node.text}</a>`;
        }
        if (nodeName === 'image') {
            const nodeAttributes = node.getAttributes();
            const target = nodeAttributes.target;
            const resourceUri = (_a = this.antoraDocumentContext) === null || _a === void 0 ? void 0 : _a.resolveAntoraResourceIds(target, 'image');
            if (resourceUri !== undefined) {
                const alt = resourceUri.split('/').pop().split('.').shift();
                node.setAttribute('target', resourceUri);
                node.setAttribute('alt', alt);
            }
        }
        return this.baseConverter.convert(node, transform);
    }
    generateMathJax(node, webviewResourceProvider, nonce) {
        if (node.isAttribute('stem')) {
            let eqnumsVal = node.getAttribute('eqnums', 'none');
            if (eqnumsVal && eqnumsVal.trim().length === 0) {
                eqnumsVal = 'AMS';
            }
            const eqnumsOpt = ` equationNumbers: { autoNumber: "${eqnumsVal}" } `;
            return `<script nonce="${nonce}">
MathJax = {
  messageStyle: "none",
  // does not work in a sandbox environment
  showMathMenu: false,
  tex2jax: {
    inlineMath: [['\\\\(', '\\\\)']],
    displayMath: [['\\\\[', '\\\\]']],
    ignoreClass: "nostem|nolatexmath"
  },
  asciimath2jax: {
    delimiters: [['\\\\$', '\\\\$']],
    ignoreClass: "nostem|noasciimath"
  },
  TeX: {${eqnumsOpt}}
}
</script>
<script src="${webviewResourceProvider.asMediaWebViewSrc('media', 'mathjax', 'MathJax.js')}?config=TeX-MML-AM_HTMLorMML" nonce="${nonce}"></script>
<script nonce="${nonce}">
MathJax.Hub.Register.StartupHook("AsciiMath Jax Ready", function () {
  MathJax.InputJax.AsciiMath.postfilterHooks.Add(function (data, node) {
    if ((node = data.script.parentNode) && (node = node.parentNode) && node.classList.contains("stemblock")) {
      data.math.root.display = "block"
    }
    return data
  })
})
</script>`;
        }
        return '';
    }
    generateFootnotes(node) {
        if (node.hasFootnotes() && !(node.isAttribute('nofootnotes'))) {
            const footnoteItems = node.getFootnotes().map((footnote) => {
                return `<div class="footnote" id="_footnotedef_${footnote.getIndex()}">
<a href="#_footnoteref_${footnote.getIndex()}">${footnote.getIndex()}</a>. ${footnote.getText()}
</div>`;
            });
            return `<div id="footnotes">
<hr/>
${footnoteItems.join('\n')}
</div>`;
        }
        return '';
    }
    generateFooter(node) {
        if (node.getNofooter()) {
            return '';
        }
        const footerInfos = [];
        if (node.isAttribute('revnumber')) {
            footerInfos.push(`${node.getAttribute('version-label')} ${node.getAttribute('revnumber')}<br/>`);
        }
        const reproducible = node.isAttribute('reproducible');
        if (node.isAttribute('last-update-label') && !reproducible) {
            footerInfos.push(`${node.getAttribute('last-update-label')} ${node.getAttribute('docdatetime')}`);
        }
        return `<div id="footer">
<div id="footer-text">
${footerInfos.join('\n')}
</div>
</div>`;
    }
    getDocumentHeader(node) {
        if (node.getNoheader()) {
            return '';
        }
        const maxWidthAttr = node.hasAttribute('max-width') ? ` style="max-width: ${node.getAttribute('max-width')};"` : '';
        const doctype = node.getDoctype();
        const headerContent = doctype === 'manpage'
            ? this.generateManPageHeader(node)
            : this.generateArticleHeader(node);
        return `<div id="header"${maxWidthAttr}>
${headerContent}
</div>`;
    }
    generateArticleHeader(node) {
        const content = [];
        if (node.hasHeader()) {
            if (!node.getNotitle()) {
                const doctitle = node.getDoctitle({ partition: true, sanitize: true });
                content.push(`<h1>${doctitle.getMain()}${doctitle.hasSubtitle() ? ` <small class="subtitle">${doctitle.getSubtitle()}</small>` : ''}</h1>`);
            }
            const details = this.generateHeaderDetails(node);
            if (details) {
                content.push(details);
            }
        }
        if (node.hasSections() && node.hasAttribute('toc') && node.isAttribute('toc-placement', 'auto')) {
            content.push(`<div id="toc" class="${node.getAttribute('toc-class', 'toc')}">
  <div id="toctitle">${node.getAttribute('toc-title')}</div>
  ${node.getConverter().convert(node, 'outline')}
</div>`);
        }
        return content.join('\n');
    }
    generateHeaderDetails(node) {
        const details = [];
        node.getAuthors().forEach((author, idx) => {
            details.push(`<span id="author${idx > 0 ? idx + 1 : ''}" class="author">${node.$sub_replacements(author.getName())}</span><br/>`);
            const authorEmail = author.getEmail();
            if (authorEmail) {
                details.push(`<span id="email${idx > 0 ? idx + 1 : ''}" class="email">${node.$sub_macros(authorEmail)}</span><br/>`);
            }
        });
        if (node.hasAttribute('revnumber')) {
            const versionLabel = (node.getAttribute('version-label') || '').toLowerCase();
            details.push(`<span id="revnumber">${versionLabel} ${node.getAttribute('revnumber')}${node.hasAttribute('revdate') ? ',' : ''}</span>`);
        }
        if (node.hasAttribute('revdate')) {
            details.push(`<span id="revdate">${node.getAttribute('revdate')}</span>`);
        }
        if (node.hasAttribute('revremark')) {
            details.push(`<span id="revremark">${node.getAttribute('revremark')}</span>`);
        }
        if (details.length > 0) {
            return `<div class="details">
${details.join('\n')}
</div>`;
        }
        return '';
    }
    generateManPageHeader(node) {
        const tocContent = node.hasSections() && node.hasAttribute('toc') && node.hasAttribute('toc-placement', 'auto')
            ? `<div id="toc" class="${node.getAttribute('toc-class', 'toc')}">
<div id="toctitle">${node.getAttribute('toc-title')}</div>
${node.getConverter().convert(node, 'outline')}
</div>`
            : '';
        return `<h1>${node.getDoctitle()} Manual Page</h1>
${tocContent}
${node.hasAttribute('manpurpose') ? this.generateManNameSection(node) : ''}`;
    }
    generateManNameSection(node) {
        let mannameTitle = node.getAttribute('manname-title', 'Name');
        const nextSection = node.getSections()[0];
        if (nextSection && nextSection.getTitle() === nextSection.getTitle().toUpperCase()) {
            mannameTitle = mannameTitle.toUpperCase();
        }
        const mannameIdAttr = node.getAttribute('manname-id') ? ` id="${node.getAttribute('manname-id')}"` : '';
        return `<h2${mannameIdAttr}>${mannameTitle}</h2>
  <div class="sectionbody">
    <p>${node.getAttribute('mannames').join(', ')} - ${node.getAttribute('manpurpose')}</p>
  </div>`;
    }
    getBodyCssClasses(node) {
        const classes = [
            'vscode-body',
            this.config.scrollBeyondLastLine ? 'scrollBeyondLastLine' : undefined,
            this.config.wordWrap ? 'wordWrap' : undefined,
            this.config.markEditorSelection ? 'showEditorSelection' : undefined,
        ];
        const sectioned = node.hasSections();
        if (sectioned && node.isAttribute('toc-class') && node.isAttribute('toc') && node.isAttribute('toc-placement', 'auto')) {
            classes.push(node.getDoctype(), node.getAttribute('toc-class'), `toc-${node.getAttribute('toc-position', 'header')}`);
        }
        else {
            classes.push(node.getDoctype());
        }
        if (node.isRole()) {
            classes.push(node.getRole());
        }
        return classes
            .filter((cssClass) => cssClass !== undefined)
            .join(' ');
    }
    getSettingsOverrideStyles(config) {
        return [
            config.fontFamily ? `--asciidoc-font-family: ${config.fontFamily};` : '',
            isNaN(config.fontSize) ? '' : `--asciidoc-font-size: ${config.fontSize}px;`,
            isNaN(config.lineHeight) ? '' : `--asciidoc-line-height: ${config.lineHeight};`,
        ].join(' ');
    }
    extensionResourcePath(mediaFile) {
        return this.webviewResourceProvider.asMediaWebViewSrc('dist', mediaFile);
    }
    getStyles(node, webviewResourceProvider, resource, config, state) {
        const baseStyles = [];
        for (const previewStyle of this.contributions.previewStyles) {
            baseStyles.push(`<link rel="stylesheet" type="text/css" href="${escapeAttribute(webviewResourceProvider.asWebviewUri(previewStyle))}">`);
        }
        // QUESTION: should we support `stylesdir` and `stylesheet` attributes?
        if (config.previewStyle === '') {
            const builtinStylesheet = config.useEditorStylesheet ? 'asciidoctor-editor.css' : 'asciidoctor-default.css';
            baseStyles.push(`<link rel="stylesheet" type="text/css" href="${webviewResourceProvider.asMediaWebViewSrc('media', builtinStylesheet)}">`);
        }
        if (node.isAttribute('icons', 'font')) {
            baseStyles.push(`<link rel="stylesheet" href="${webviewResourceProvider.asMediaWebViewSrc('media', 'font-awesome', 'css', 'font-awesome.css')}">`);
        }
        return `${baseStyles.join('\n')}
  ${this.computeCustomStyleSheetIncludes(webviewResourceProvider, resource, config)}
  ${this.getImageStabilizerStyles(state)}`;
    }
    getScripts(webviewResourceProvider, nonce) {
        const out = [];
        for (const previewScript of this.contributions.previewScripts) {
            out.push(`<script async src="${escapeAttribute(webviewResourceProvider.asWebviewUri(previewScript))}" nonce="${nonce}" charset="UTF-8"></script>`);
        }
        return out.join('\n');
    }
    computeCustomStyleSheetIncludes(webviewResourceProvider, resource, config) {
        const style = config.previewStyle;
        if (style === '') {
            return '';
        }
        const out = [];
        out.push(`<link rel="stylesheet" class="code-user-style" data-source="${escapeAttribute(style)}" href="${escapeAttribute(this.fixHref(webviewResourceProvider, resource, style))}" type="text/css" media="screen">`);
        return out.join('\n');
    }
    getImageStabilizerStyles(state) {
        let ret = '<style>\n';
        if (state && state.imageInfo) {
            state.imageInfo.forEach((imgInfo) => {
                ret += `#${imgInfo.id}.loading {
  height: ${imgInfo.height}px
  width: ${imgInfo.width}px
}\n`;
            });
        }
        ret += '</style>\n';
        return ret;
    }
    fixHref(webviewResourceProvider, resource, href) {
        // QUESTION: should we use `stylesdir` attribute in here?
        if (!href) {
            return href;
        }
        if (href.startsWith('http:') || href.startsWith('https:') || href.startsWith('file:')) {
            return href;
        }
        // Assume it must be a local file
        if (href.startsWith('/') || /^[a-z]:\\/i.test(href)) {
            return webviewResourceProvider.asWebviewUri(vscode_1.default.Uri.file(href)).toString();
        }
        // Use a workspace relative path if there is a workspace
        const root = vscode_1.default.workspace.getWorkspaceFolder(resource);
        if (root) {
            return webviewResourceProvider.asWebviewUri(vscode_1.default.Uri.joinPath(root.uri, href)).toString();
        }
        // Otherwise look relative to the AsciiDoc file
        return webviewResourceProvider.asWebviewUri(vscode_1.default.Uri.joinPath(uri.Utils.dirname(resource), href)).toString();
    }
}
exports.AsciidoctorWebViewConverter = AsciidoctorWebViewConverter;
//# sourceMappingURL=asciidoctorWebViewConverter.js.map