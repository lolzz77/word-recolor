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
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __webpack_require__(1);
const fs = __webpack_require__(2);
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    // This will register command name and trigger a function with it
    // The function is empty, because I dont need it
    // I have to write this, else, the extension wont run
    let disposable = vscode.commands.registerCommand('wordrecolor.activate', () => {
        let editor = vscode.window.activeTextEditor;
        if (editor) {
            // display the JSON file path that this extension will be searching for
            // display the current active editor
            let language = getCurrentActiveEditorLanguage();
            console.log('Language: ' + language);
            // vscode.window.showInformationMessage('Language: ' + language);
            let JSONPath = getJSONPath(language);
            console.log('JSON Path: ' + JSONPath);
            // vscode.window.showInformationMessage('JSON Path: ' + JSONPath);
        }
        else {
            vscode.window.showInformationMessage('No language detected');
        }
    });
    // This will put the command specified in package.json into command palette (CTRL + SHIFT + P)
    context.subscriptions.push(disposable);
    let language = getCurrentActiveEditorLanguage();
    // for now, just make it to default.json first
    let JSONPath = getJSONPath(null);
    let data = getJSONData(JSONPath);
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
        var editor = vscode.window.activeTextEditor;
        if (editor) {
            var document = editor.document;
            var text = document.getText();
            var ranges = [];
            let colors = Object.keys(data);
            for (let color of colors) {
                console.log(color);
                var DecorationType = vscode.window.createTextEditorDecorationType({
                    color: color
                });
                let keywords = data[color];
                for (let keyword of keywords) {
                    console.log(keyword);
                    let match;
                    // a dynamic regex
                    // match case-insensitive-ly
                    let regex = new RegExp("\\b(" + keyword + ")\\b", "gi");
                    while (match = regex.exec(text)) {
                        const start = document.positionAt(match.index);
                        const end = document.positionAt(match.index + match[0].length);
                        const range = new vscode.Range(start, end);
                        // put these words into array
                        ranges.push(range);
                    }
                    // change the color, according to the words in the array
                    editor.setDecorations(DecorationType, ranges);
                }
            }
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
        triggerUpdateDecorations();
    }
    // This one will handle event handling
    // This will trigger function to colotizes the word
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);
    // This one will handle event handling
    // This will trigger function to colotizes the word
    vscode.workspace.onDidChangeTextDocument(event => {
        if (vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document) {
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);
}
exports.activate = activate;
// Get the JSON File
function getJSONData(JSONPath) {
    let fileContents = fs.readFileSync(JSONPath, "utf8");
    let data = JSON.parse(fileContents);
    return data;
}
// To get the JSON file path that the extension will be looking
// This JSON describe what keyword to recolor
function getJSONPath(language) {
    // if language passed in is null, then set it to 'default.json'
    if (language == null)
        language = 'default';
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
// This method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map