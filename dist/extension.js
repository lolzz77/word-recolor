/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = require("fs");

/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("path");

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.create_JSON_file_if_not_exist = exports.resetDecoration = exports.removeAllJSONFromDirectory = exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __webpack_require__(1);
const fs = __webpack_require__(2);
const path = __webpack_require__(3);
var decorationTypeArr = [];
function activate(context) {
    let disposable1 = vscode.commands.registerCommand('wordrecolor.activate', () => {
        let editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        // just a note, you can set the italic font style and such
        // const nullDecorationType = vscode.window.createTextEditorDecorationType({
        //     color: '#ff00f2', // Pink
        // 	fontStyle: 'italic',
        // 	// This is how you do it
        // 	// fontWeight: 'bold',
        // 	// fontStyle: 'italic',
        // 	// textDecoration: 'underline'
        // });
        // This is to delay the trigger update
        // This is to increase performance
        // Now, everytime you type in file, it will trigger the extension to colorize words
        // However, we dont want it to colorize immediately, but after a short delay
        let timeout = undefined;
        // main function, will recolor the words
        function updateDecorations() {
            let language = getCurrentActiveEditorLanguage();
            // for now, just make it to plaintext.json first
            let JSONPath = getJSONPath(language);
            create_JSON_file_if_not_exist(JSONPath, language);
            let JSONData = getJSONData(JSONPath);
            var editor = vscode.window.activeTextEditor;
            if (!editor)
                return;
            var document = editor.document;
            var text = document.getText();
            var ranges = [];
            let colors = Object.keys(JSONData);
            // for each color, set decoration
            for (let color of colors) {
                let keywords = JSONData[color];
                // for each keywords of the colors, set up ranges
                for (let keyword of keywords) {
                    let match;
                    // match case-insensitive-ly
                    let regex = new RegExp("\\b(" + keyword + ")\\b", "gi");
                    while (match = regex.exec(text)) {
                        const start = document.positionAt(match.index);
                        const end = document.positionAt(match.index + match[0].length);
                        const range = new vscode.Range(start, end);
                        // put these words into array
                        ranges.push(range);
                    }
                }
                decorationTypeArr.push({
                    decorationTypeArr: vscode.window.createTextEditorDecorationType({ color: color }),
                    // this pushes a copy of the array
                    // if dont do this, the array pushed into here, are of the same array
                    // once the original got modified, this will be modified as well
                    ranges: [...ranges]
                });
            }
            for (const decorationInterface of decorationTypeArr) {
                let decorationType = decorationInterface.decorationTypeArr;
                let ranges = decorationInterface.ranges;
                // change the color, according to the words in the array
                editor.setDecorations(decorationType, ranges);
            }
        }
        function triggerUpdateDecorations() {
            if (timeout) {
                clearTimeout(timeout);
                timeout = undefined;
            }
            timeout = setTimeout(updateDecorations, 500);
        }
        // This one I think apply changes based on current active file you're editting
        if (vscode.window.activeTextEditor) {
            resetDecoration(decorationTypeArr);
            triggerUpdateDecorations();
        }
        // This one will handle event handling
        // This will trigger function to colotizes the word
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (!editor)
                return;
            resetDecoration(decorationTypeArr);
            triggerUpdateDecorations();
        }, null, context.subscriptions);
        // This one will handle event handling
        // This will trigger function to colotizes the word
        vscode.workspace.onDidChangeTextDocument(event => {
            if (vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document) {
                resetDecoration(decorationTypeArr);
                triggerUpdateDecorations();
            }
        }, null, context.subscriptions);
    });
    let disposable2 = vscode.commands.registerCommand('wordrecolor.showPath', () => {
        let JSONPath = getJSONPath(null);
        vscode.window.showInformationMessage(JSONPath);
    });
    let disposable3 = vscode.commands.registerCommand('wordrecolor.clear', () => {
        resetDecoration(decorationTypeArr);
    });
    // This will put the command specified in package.json into command palette (CTRL + SHIFT + P)
    context.subscriptions.push(disposable1);
    context.subscriptions.push(disposable2);
    context.subscriptions.push(disposable3);
}
exports.activate = activate;
// this method is called when your extension is disabled
function deactivate() {
    resetDecoration(decorationTypeArr);
    // Delete all JSON file
    // Probably no need, as user mayu reenable the extension again and finds the JSON they did is gone lmao
    // I guess it will be gone once you uninstall the extension
    // removeAllJSONFromDirectory();
}
exports.deactivate = deactivate;
function removeAllJSONFromDirectory() {
    const JSONPath = getJSONPath(null);
    const dirPath = path.dirname(JSONPath);
    if (!fs.existsSync(dirPath)) {
        return;
    }
    // Read all files in the directory
    fs.readdir(dirPath, (err, files) => {
        if (err) {
            console.error(`Error reading directory: ${err.message}`);
            return;
        }
        // Iterate over all files and delete them
        files.forEach(file => {
            const fileToDelete = path.join(dirPath, file);
            fs.unlink(fileToDelete, (err) => {
                if (err) {
                    console.error(`Error deleting file: ${fileToDelete} - ${err.message}`);
                }
            });
        });
    });
}
exports.removeAllJSONFromDirectory = removeAllJSONFromDirectory;
// Get the JSON File
function getJSONData(JSONPath) {
    let fileContents = fs.readFileSync(JSONPath, "utf8");
    let JSONData = JSON.parse(fileContents);
    return JSONData;
}
// To get the JSON file path that the extension will be looking
// This JSON describe what keyword to recolor
function getJSONPath(language) {
    // if language passed in is null, then set it to 'plaintext.json'
    if (language == null)
        language = 'plaintext';
    return vscode.env.appRoot + '/word-recolor/' + language + '.json';
}
// To get the current active editor language
function getCurrentActiveEditorLanguage() {
    let language;
    let editor = vscode.window.activeTextEditor;
    if (editor) {
        language = editor.document.languageId;
    }
    else {
        language = 'No language detected';
    }
    return language;
}
// Generated by Bing
function getFunctionNameAndLineNumber() {
    const error = new Error();
    const stack = error.stack?.split('\n')[2];
    const functionName = stack?.match(/at (\S+)/)?.[1] ?? '';
    const lineNumber = parseInt(stack?.match(/:(\d+):/)?.[1] ?? '', 10);
    return [functionName, lineNumber];
}
// for resetting the decoration applied to active editor
function resetDecoration(decorationTypes) {
    // Reset all decoration types to their default state
    for (const decorationInterface of decorationTypes) {
        decorationInterface.decorationTypeArr.dispose();
        // it seems vscode.Range has no dispose() method
        // just set the array to null them.
        decorationInterface.ranges.length = 0;
    }
    // delete all the elements
    decorationTypes.length = 0;
}
exports.resetDecoration = resetDecoration;
// to create file, then write the JSON content into it
function create_JSON_file_if_not_exist(filePath, language) {
    let readBuffer = '';
    let readBufferJSON = '';
    let writeBuffer = '';
    let segments;
    let parentDir;
    // the current repo json file
    // eg: word-recolor/jsonFile/plaintext.json
    // Note: Im referring this repo JSON file.
    let repo_json_file = __dirname + "/../jsonFile/" + language + ".json";
    // get the parent dir of the file path
    segments = filePath.split('/'); // split the path by slashes
    segments.pop(); // remove the last segment (file name)
    parentDir = segments.join('/'); // join the remaining segments with slashes
    // check if the JSON file that im going to write exists in the user folder
    // eg: /root/.vscode-server/bin/138f619c86f1199955d53b4166bef66ef252935c/word-recolor/plaintext.json
    // Note: This is not the repo JSON file.
    if (fs.existsSync(filePath)) {
        return;
    }
    // only read if the repo JSON file exists
    // eg: word-recolor/jsonFile/plaintext.json
    // Note: Im referring this repo JSON file.
    if (fs.existsSync(repo_json_file)) {
        readBuffer = fs.readFileSync(repo_json_file, 'utf-8');
        readBufferJSON = JSON.parse(readBuffer);
        writeBuffer = JSON.stringify(readBufferJSON, null, 4); // 4 spaces indentation
    }
    // create parent folder if not exists
    if (!fs.existsSync(parentDir)) {
        fs.mkdir(parentDir, { recursive: true }, (err) => {
            if (err) {
                console.error(err);
            }
            else {
                console.log(parentDir + " created");
            }
        });
    }
    // create file & write
    fs.writeFileSync(filePath, writeBuffer, 'utf8');
}
exports.create_JSON_file_if_not_exist = create_JSON_file_if_not_exist;

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map