import * as vscode from 'vscode';

let statusBarItem: vscode.StatusBarItem;
let enabled = true;

export function activate(context: vscode.ExtensionContext) {
    enabled = context.globalState.get('ipynbMdWordCountEnabled', true);

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    context.subscriptions.push(statusBarItem);

    const updateWordCount = () => {
        if (!enabled) {
            statusBarItem.hide();
            return;
        }

        const notebookEditor = vscode.window.activeNotebookEditor;
        const textEditor = vscode.window.activeTextEditor;

        // If an .ipynb file is open
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

    // Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('ipynb-md-wordcount-statusbar.enable', () => {
            enabled = true;
            context.globalState.update('ipynbMdWordCountEnabled', true);
            updateWordCount();
            vscode.window.showInformationMessage('Markdown Word Count Enabled');
        }),

        vscode.commands.registerCommand('ipynb-md-wordcount-statusbar.disable', () => {
            enabled = false;
            context.globalState.update('ipynbMdWordCountEnabled', false);
            statusBarItem.hide();
            vscode.window.showInformationMessage('Markdown Word Count Disabled');
        }),

        vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('ipynb-md-wordcount-statusbar.enabled')) {
                const configValue = vscode.workspace
                    .getConfiguration()
                    .get<boolean>('ipynb-md-wordcount-statusbar.enabled', true);

                enabled = configValue;
                context.globalState.update('ipynbMdWordCountEnabled', configValue);

                if (enabled) {
                    updateWordCount();
                } else {
                    statusBarItem.hide();
                }

                vscode.window.showInformationMessage(`Markdown Word Count ${enabled ? 'Enabled' : 'Disabled'} via Settings`);
            }
        }),

        // Notebook or markdown updates
        vscode.window.onDidChangeActiveNotebookEditor(updateWordCount),
        vscode.window.onDidChangeActiveTextEditor(updateWordCount),
        vscode.workspace.onDidChangeNotebookDocument(updateWordCount),
        vscode.workspace.onDidChangeTextDocument(event => {
            const notebookEditor = vscode.window.activeNotebookEditor;
            const textEditor = vscode.window.activeTextEditor;

            if (
                notebookEditor &&
                notebookEditor.notebook.getCells().some(cell => cell.document.uri.toString() === event.document.uri.toString())
            ) {
                updateWordCount();
                return;
            }

            if (
                textEditor &&
                textEditor.document.uri.toString() === event.document.uri.toString() &&
                textEditor.document.languageId === 'markdown'
            ) {
                updateWordCount();
                return;
            }
        })
    );

    // Initial count
    updateWordCount();
}


export function deactivate() {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}