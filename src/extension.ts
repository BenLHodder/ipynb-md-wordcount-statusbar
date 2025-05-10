import * as vscode from 'vscode';

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
   
    // Create and show status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    context.subscriptions.push(statusBarItem);

    // Update status bar text
    const updateWordCount = () => {
        const notebookEditor = vscode.window.activeNotebookEditor;
        const textEditor = vscode.window.activeTextEditor;

        // If an .ipynb notebook is open
        if (notebookEditor) {
            const mdCells = notebookEditor.notebook.getCells().filter(cell =>
                cell.kind === vscode.NotebookCellKind.Markup
            );
            const totalWords = mdCells.reduce((sum, cell) => {
                const matches = cell.document.getText().match(/\b\w+\b/g);
                return sum + (matches ? matches.length : 0);
            }, 0);

            statusBarItem.text = `MD Words (Notebook): ${totalWords}`;
            statusBarItem.show();
            return;
        }

        // If a .md text file is open
        if (textEditor && textEditor.document.languageId === 'markdown') {
            const matches = textEditor.document.getText().match(/\b\w+\b/g);
            const totalWords = matches ? matches.length : 0;

            statusBarItem.text = `MD Words (File): ${totalWords}`;
            statusBarItem.show();
            return;
        }

        statusBarItem.hide();
    };


    // Event listeners for notebook/editor changes
    context.subscriptions.push(
        vscode.window.onDidChangeActiveNotebookEditor(updateWordCount),
        vscode.workspace.onDidChangeNotebookDocument(event => {
            const active = vscode.window.activeNotebookEditor;
            if (active && event.notebook === active.notebook) {updateWordCount();}
        }),
        vscode.workspace.onDidChangeTextDocument(event => {
            const notebookEditor = vscode.window.activeNotebookEditor;
            const textEditor = vscode.window.activeTextEditor;

            // Update if the change affects a markdown notebook cell
            if (
                notebookEditor &&
                notebookEditor.notebook.getCells().some(cell => cell.document.uri.toString() === event.document.uri.toString())
            ) {
                updateWordCount();
                return;
            }

            // Update if the change affects the current markdown text file
            if (
                textEditor &&
                textEditor.document.uri.toString() === event.document.uri.toString() &&
                textEditor.document.languageId === 'markdown'
            ) {
                updateWordCount();
                return;
            }
        }),

    );

    // Initial count
    updateWordCount();
}

export function deactivate() {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}