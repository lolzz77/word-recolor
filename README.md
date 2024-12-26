# Word Recolor

# What

To colorize words that I want

Because vs code does not support custom words coloring

Here I have recolored 'NULL' 'FALSE' 'TRUE' to different distinguishable colors

![Alt text](https://raw.githubusercontent.com/lolzz77/word-recolor/main/resources/readme/1.png)

# How to
1. Run the command `Word Recolor : activate`

# How it works
1. It will generate default.json file in a path
2. The path can be shown thru the command `Word Recolor : show path`
3. By editting that path, you can make extension to recolor any words to any colors you want
4. After editting it, just switch between tabs and it will reset the effect.

# Commands
1. `Word Recolor : Activate`
- To activate, and actively colorizing the word.
2. `Word Recolor : Deactivate`
- To stop colorizing the word.
3. `Word Recolor : Show JSON Path`
- To show you the path to the JSON file that the extension has generated & used.
- It will use `vscode.window.showInformationMessage`,
- Hence, if you cant see the message pop up, probably you have silented your VS Code notification.
4. `Word Recolor : Clear JSON Files`
- Delete all the generated JSON files.
- It will regenerate the default JSON again when you switch between editors.

# How to Write JSON
1. Note: See `jsonFile/plaintext.json` for reference.
2. In case you have overlapping words, like python.json
- You have "NOT IN" and "IN"
- Those that should be prioritized should put at top.
- Eg: "NOT IN" is higher priority than "IN"
- Hence, put "NOT IN" above of "IN"
- If you didnt, the word "NOT IN", the "NOT" will be colored to red, and "IN" colored in green.
- You will see the word has 2 different colors.
