// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import internal = require('stream');

var decorationTypeArr:decorationInterface[] = [];

// To save pre-scanned file, load them immedaitely, save time
const MATCH_ARR_SIZE = 20; // number of files to save
var matchArr:matchArrInterface[] = [];

// This is for when you run command pallete "enable" & "disable"
var g_activate = false;



// i made this global so i can dispose it in deactivate function
var treeView:vscode.TreeView<SymbolTreeItem>;
// i made this global so i can dispose it in deactivate function
// Create a tree data provider for the view
// this variable, i believe is to create the sidebar, but not the list inside of it
var treeDataProvider:TreeDataProvider;



interface decorationInterface {
	decorationTypeArr:vscode.TextEditorDecorationType;
	ranges:vscode.Range[];
}

export function activate(context: vscode.ExtensionContext) {
	let editor = vscode.window.activeTextEditor;
	if(!editor) {
		treeDataProvider.dispose();
		return;
	}




	// get all the symbols of the current active editor
	let symbolTreeItem:SymbolTreeItem[] = [];
	treeDataProvider= new TreeDataProvider(symbolTreeItem);




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
	let timeout: NodeJS.Timer | undefined = undefined;
	
	// main function, will recolor the words
	function updateDecorations() {

		if (!g_activate) {
			return;
		}

		let language = getCurrentActiveEditorLanguage();
		// for now, just make it to plaintext.json first
		let JSONPath = getJSONPath(language);
		create_JSON_file_if_not_exist(JSONPath, language);
		let JSONData = getJSONData(JSONPath);

		var editor = vscode.window.activeTextEditor;
		if(!editor) {
			treeDataProvider.dispose();
			return;
		}
		const filepath = editor.document.fileName;
		const filename = path.basename(filepath);
		const numberOfChar = editor.document.getText().length;

		// check if current editor exists in array
		let existsIndex = matchArr.findIndex(element => element.filename === filename);
		if (existsIndex >= 0) {
			treeDataProvider.refresh(matchArr[existsIndex].children);

			// check if file has new changes,
			// if yes, continue the rest of the code to update the array with new data
			// if no, exit
			// Update: Ignore this first
			// The problem is, the decoration wont update
			// I tried to fix it, but I dont find a way to 'clear decoration'
			// Hence, the solution become mroe and more complex
			// For now, is okay, let it continue to run the rest of code

			// if (matchArr[existsIndex].numberOfChar === numberOfChar) {
			// 	return;
			// }
		}


		var document = editor.document;
		var text = document.getText();
		var ranges: vscode.Range[] = [];
		let colors = Object.keys(JSONData);
		var treeArr:SymbolTreeItem[] = [];


		// push filename into first in the list
		treeArr.push(new SymbolTreeItem(filename, vscode.TreeItemCollapsibleState.None, null, null, []));


		// for each color, set decoration
		for (let color of colors) {


			// Push to treeview
			treeArr.push(new SymbolTreeItem(color, vscode.TreeItemCollapsibleState.Expanded, null, null, []));
			let existsIndex_Color = treeArr.findIndex(element => element.label === color);


			ranges = [];
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
					const line_number = document.lineAt(start).lineNumber + 1;


					// put these words into array
					ranges.push(range);
					treeArr[existsIndex_Color].children?.push(new SymbolTreeItem(
						line_number + " : " + match[0],
						vscode.TreeItemCollapsibleState.None,
						line_number,
						range));


				}
			}
			// Only color minimap for red color for now
			if (color == 'red') {
				decorationTypeArr.push(
					{
						decorationTypeArr : vscode.window.createTextEditorDecorationType({
							// Text editor color
							color: color,
							// Minimap color
							overviewRulerColor: color,
							overviewRulerLane: vscode.OverviewRulerLane.Right,
						}),
						// this pushes a copy of the array
						// if dont do this, the array pushed into here, are of the same array
						// once the original got modified, this will be modified as well
						ranges: [...ranges]
					});
			} else {
				decorationTypeArr.push(
					{
						decorationTypeArr : vscode.window.createTextEditorDecorationType({
							color: color,
						}),
						ranges: [...ranges]
					});
			}
		}

		// Update decoration
		for(const decorationInterface of decorationTypeArr)
		{
			let decorationType = decorationInterface.decorationTypeArr;
			let ranges = decorationInterface.ranges;
			// change the color, according to the words in the array
			editor.setDecorations(decorationType, ranges);
		}

		// Check array size
		while(matchArr.length > MATCH_ARR_SIZE)
		{
			// dispose 1st element in a loop
			for (const child of matchArr[0].children)
				child.dispose();
			// this will remove the 1st element of array
			matchArr.shift();
		}

		// Update array & treelist
		if(existsIndex >= 0) {

			// delete the previous data
			for(let child of matchArr[existsIndex].children)
				child.dispose();
			// discard / de-reference all the array elements
			// to allow JS to garbage collect it
			matchArr[existsIndex].children = null as any;
			// now push the new symbols to it
			matchArr[existsIndex].numberOfChar = numberOfChar;
			matchArr[existsIndex].children = treeArr;
			// refresh the tree
			treeDataProvider.refresh(matchArr[existsIndex].children);

		} else {

			matchArr.push({filename:filename, numberOfChar:numberOfChar, children:treeArr});
			treeDataProvider.refresh(treeArr);
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
		if(!editor)
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




	// by putting this code, no need to trigger 'activate', it will auto load
	vscode.window.registerTreeDataProvider(
		'wordRecolorView', // this one has to follow "view" section in package.json
		treeDataProvider
	);

	// by putting this code, i dk, put or not put the tree will be printed still
	// the only thing is, it assign to variable, and you use that variable for listening to clicked event
	treeView = vscode.window.createTreeView<SymbolTreeItem>(
		'wordRecolorView', 
		{
			treeDataProvider : treeDataProvider,
			showCollapseAll: true,
			canSelectMany: true
		}
	);

	// Listen for selection
	treeView.onDidChangeSelection(event => {
		let editor = vscode.window.activeTextEditor;
		if(	editor == null )
		{
			return;
		}

		// get the selected object
		const selectedItems = event.selection as SymbolTreeItem[];

		// have to put as vscode.Range at behind else it will flag error
		const range = selectedItems[0].range as vscode.Range;

		// move the cursor to the location
		const newSelection = new vscode.Selection(range.start, range.start);
		editor.selection = newSelection;
		// Reveal the range in the editor
		editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
	});




	let disposable1 = vscode.commands.registerCommand('wordrecolor.activate', () => {
		// This command has the same name as "activate()" function
		// But i tested that, simply by putting log,
		// When you first run `activate`, it will run `activate()` function
		// then when you run `activate` again, only this snipppet is ran,
		// the actual `activate()` function is not ran.
		g_activate = true;
	});

	let disposable2 = vscode.commands.registerCommand('wordrecolor.openJSON', async () => {
		let language = getCurrentActiveEditorLanguage();
		let JSONPath = getJSONPath(language);

		// Open the file in the editor
		const document = await vscode.workspace.openTextDocument(JSONPath);
		await vscode.window.showTextDocument(document);
	});

	let disposable3 = vscode.commands.registerCommand('wordrecolor.deactivate', () => {
		g_activate = false;
		resetDecoration(decorationTypeArr);

		treeDataProvider.dispose();
		treeDataProvider.refresh([]);
	});

	let disposable4 = vscode.commands.registerCommand('wordrecolor.clearJSON', () => {
		removeAllJSONFromDirectory();
	});

	// This will put the command specified in package.json into command palette (CTRL + SHIFT + P)
	context.subscriptions.push(disposable1);
	context.subscriptions.push(disposable2);
	context.subscriptions.push(disposable3);
	context.subscriptions.push(disposable4);
}

// this method is called when your extension is disabled
export function deactivate() {
	resetDecoration(decorationTypeArr);
	treeDataProvider.dispose();
	treeView.dispose();
	matchArr = null as any;

	// Delete all JSON file
	// Probably no need, as user mayu reenable the extension again and finds the JSON they did is gone lmao
	// I guess it will be gone once you uninstall the extension
	// removeAllJSONFromDirectory();
}

export function removeAllJSONFromDirectory(): void {
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

// Get the JSON File
function getJSONData(JSONPath: string): any {
	let fileContents = fs.readFileSync(JSONPath, "utf8");
	let JSONData: any = JSON.parse(fileContents);
	return JSONData;
}

// To get the JSON file path that the extension will be looking
// This JSON describe what keyword to recolor
function getJSONPath(language: string|null): string {
	// if language passed in is null, then set it to 'plaintext.json'
	if(language == null)
		language = 'plaintext'
	return vscode.env.appRoot + '/word-recolor/' + language + '.json';
}

// To get the current active editor language
function getCurrentActiveEditorLanguage(): string {
	let language;
	let editor = vscode.window.activeTextEditor;
	
	if (editor) {
		language = editor.document.languageId;
	}
	else
	{
		language = 'No language detected';
	}

	return language;
}

// Generated by Bing
function getFunctionNameAndLineNumber(): [string, number] {
    const error = new Error();
    const stack = error.stack?.split('\n')[2];
    const functionName = stack?.match(/at (\S+)/)?.[1] ?? '';
    const lineNumber = parseInt(stack?.match(/:(\d+):/)?.[1] ?? '', 10);
    return [functionName, lineNumber];
}

// for resetting the decoration applied to active editor
export function resetDecoration(decorationTypes:decorationInterface[])
{
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


// to create file, then write the JSON content into it
export function create_JSON_file_if_not_exist(filePath:string, language:string|null): void {
	let readBuffer = '';
	let readBufferJSON = '';
	let writeBuffer = '';
	let segments;
	let parentDir:any;

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
	if (!fs.existsSync(parentDir))
	{
		fs.mkdir(parentDir, { recursive : true }, (err) => {
			if (err) {
				console.error(err);
			}
			else
			{
				console.log(parentDir + " created");
			}
		})
	}

	// create file & write
	fs.writeFileSync(filePath, writeBuffer, 'utf8');
}






// this class holds the detail of list of symbols that regex matches
// one symbol for 1 class

/*
TODO: U WANNA CHECK HOW TO DISPOSE THIS CLASS OBJECT PROPERLY
*/
class SymbolTreeItem extends vscode.TreeItem {
	// to hold the subtree items.
	// a tree can be expended further, revealing more trees
	// these sub-trees are 'children'
	children: SymbolTreeItem[]|undefined;

	constructor(
		// this is the string that appear on the tree list,
		// to decide whether this is used to display the string,
		// is by passing which variable into the `super` there
		public readonly label: string,
		// whether they collapse or not, hold `CTRL`, hover over TreeItemCollapsibleState to see more
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly lineNumber?: number|null,
		public readonly range?: vscode.Range|null,
		children?: SymbolTreeItem[],
		// public readonly id?: string,
		// public readonly command?: vscode.Command,
		// public readonly iconPath: string | Uri | { light: string | Uri; dark: string | Uri } | ThemeIcon;
	) {
		// use intellisense to hover over `suepr` and see, 
		// the 1st param is the string that will be appearing on the tree
		super(label, collapsibleState);
		this.children = children;
	}

	// TODO: attempting to dispose object properly
	// my `children` will be undefined when running this code
	/*
			listOfSymbolsArr.push({
			parent:key, 
			children:[new SymbolTreeItem(
				'null',
				vscode.TreeItemCollapsibleState.None)
			]
		});
	*/
	// because, i didn't pass in any children
	// thus, i should dispose `super` instead, cos this is what constructed in constructor
	// however, TreeItem doesn't have `dispose` method
	// so.. how to dispose this TreeItem?..
	// it is told that, just dispose your class member resources

	// Update: Dont use this dispose
	// At first, I tot use this dispose for "deactivate" function to clear buffer
	// But turns out, the more correct dispose is in Class TreeDataProvider
	// Only use this dispose for "deactivate()" function where you deactivate your extension

	dispose() {
		// super.dispose();
		if (this.children) {
			for (const child of this.children) {
				child.dispose();
			}
			this.children = null as any;
		}
	}
}


interface matchArrInterface {
	filename: string;
	numberOfChar: number; // number of char for the document, use to check whether file has new changes
	// the list of symbols for the file
	// their chidlren. Eg: 'main()', 'read_line()'
	children: SymbolTreeItem[];
}


// Define a class for the tree data provider
class TreeDataProvider implements vscode.TreeDataProvider<SymbolTreeItem> {

	// the data to hold the whole symbol trees
	// eg:
	// function
	// - main()
	// - read_line()
	// macro
	// - UPRINTF
	// - AB_UPGRADE
	private data: SymbolTreeItem[]|undefined;

	constructor(data:any) {
		this.data = data;
	}
	
	// A private event emitter that fires the onDidChangeTreeData event
	private _onDidChangeTreeData: vscode.EventEmitter<SymbolTreeItem | undefined | null | void> = new vscode.EventEmitter<SymbolTreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<SymbolTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

	// required, read the document
	// the `element` will only be triggered when you expand the collapsed tree
	getChildren(element?: SymbolTreeItem): vscode.ProviderResult<SymbolTreeItem[]> {
		// element will be undefined for tree that doesn't collapse, that is, vscode.TreeItemCollapsibleState.None
		if(element == undefined)
		{
			// which means, no children, thus, just return the object's data
			return this.data;
		}
		// else, return the children
		return element.children;
	}

	// required, read the document
	getTreeItem(element: SymbolTreeItem): vscode.TreeItem {
		// Return the element as a tree item
		return element;
	}

	// A refresh method that updates the tree view data and fires the event
	refresh(data?: SymbolTreeItem[]): void {
		// free the previous memory
		this.dispose();
		// Update the data source for the tree view
		this.data = data;
		// Fire the event to notify VS Code that the tree view has changed
		this._onDidChangeTreeData.fire();
	}

	dispose(): void {
		this.data = null as any
	}

}



