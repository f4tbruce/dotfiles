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
exports.createLink = exports.createDirectory = exports.createDirectories = exports.createFile = exports.removeFiles = exports.getWorkspaceUri = void 0;
const vscode_1 = __importStar(require("vscode"));
function getWorkspaceUri() {
    return vscode_1.default.workspace.workspaceFolders[0].uri;
}
exports.getWorkspaceUri = getWorkspaceUri;
function removeFiles(files) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const file of files) {
            if (yield exists(file)) {
                yield vscode_1.default.workspace.fs.delete(file, { recursive: true });
            }
        }
    });
}
exports.removeFiles = removeFiles;
function exists(file) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield vscode_1.default.workspace.fs.stat(file);
            return true;
        }
        catch (err) {
            if (err instanceof vscode_1.FileSystemError && err.code === 'FileNotFound') {
                return false;
            }
            else {
                throw err;
            }
        }
    });
}
function createFile(content, ...pathSegments) {
    return __awaiter(this, void 0, void 0, function* () {
        const file = vscode_1.default.Uri.joinPath(getWorkspaceUri(), ...pathSegments);
        yield vscode_1.default.workspace.fs.writeFile(file, Buffer.from(content));
        return file;
    });
}
exports.createFile = createFile;
function createDirectories(...pathSegments) {
    return __awaiter(this, void 0, void 0, function* () {
        const currentPath = [];
        for (const pathSegment of pathSegments) {
            currentPath.push(pathSegment);
            const dir = vscode_1.default.Uri.joinPath(getWorkspaceUri(), ...currentPath);
            try {
                const stat = yield vscode_1.default.workspace.fs.stat(dir);
                if (stat.type === (vscode_1.FileType.Directory | vscode_1.FileType.SymbolicLink)) {
                    // continue
                }
                else {
                    yield vscode_1.default.workspace.fs.createDirectory(dir);
                }
            }
            catch (err) {
                if (err instanceof vscode_1.FileSystemError && err.code === 'FileNotFound') {
                    yield vscode_1.default.workspace.fs.createDirectory(dir);
                }
                else {
                    throw err;
                }
            }
        }
    });
}
exports.createDirectories = createDirectories;
function createDirectory(...pathSegments) {
    return __awaiter(this, void 0, void 0, function* () {
        const dir = vscode_1.default.Uri.joinPath(getWorkspaceUri(), ...pathSegments);
        yield vscode_1.default.workspace.fs.createDirectory(dir);
        return dir;
    });
}
exports.createDirectory = createDirectory;
function createLink(existingPathSegments, newPathSegments) {
    return __awaiter(this, void 0, void 0, function* () {
        const fs = require('fs').promises;
        const workspaceUri = getWorkspaceUri();
        const existingPath = vscode_1.default.Uri.joinPath(workspaceUri, ...existingPathSegments);
        const newPath = vscode_1.default.Uri.joinPath(workspaceUri, ...newPathSegments);
        yield fs.symlink(existingPath.fsPath, newPath.fsPath);
        return newPath;
    });
}
exports.createLink = createLink;
//# sourceMappingURL=workspaceHelper.js.map