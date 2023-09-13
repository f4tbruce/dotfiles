"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderDocx = void 0;
const mammoth = require('mammoth');
function renderDocx(docxPath, panel) {
    // convert the docx to html
    mammoth.convertToHtml({ path: docxPath }).then(function (result) {
        var html = result.value; // The generated HTML
        // remove "Test VSCODE" from the html
        html = html.replace("Test VSCODE", "");
        // craete a webview panel to display the html
        panel.webview.html = html;
    }).done();
}
exports.renderDocx = renderDocx;
//# sourceMappingURL=renderDocx.js.map