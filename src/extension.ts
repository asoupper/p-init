// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

const INIT_FILENAME = '__init__.py';
export const DECORATION_THEME_ID = 'pinit.decorations.initFile';

export class InitFileDecorationProvider implements vscode.FileDecorationProvider {
	private readonly emitter = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
	readonly onDidChangeFileDecorations = this.emitter.event;

	constructor(private readonly color: vscode.ThemeColor) {}

	provideFileDecoration(uri: vscode.Uri): vscode.ProviderResult<vscode.FileDecoration> {
		const name = path.basename(uri.fsPath);
		if (name === INIT_FILENAME) {
			return new vscode.FileDecoration(undefined, '__init__.py file', this.color);
		}
		return undefined;
	}

	refresh(): void {
		this.emitter.fire(undefined);
	}
}

export function activate(context: vscode.ExtensionContext) {
	const output = vscode.window.createOutputChannel('P_Init');
	context.subscriptions.push(output);
	output.appendLine('P_Init: activating extension');

	const provider = new InitFileDecorationProvider(new vscode.ThemeColor(DECORATION_THEME_ID));
	context.subscriptions.push(vscode.window.registerFileDecorationProvider(provider));

	try {
		const watcher = vscode.workspace.createFileSystemWatcher('**/__init__.py');
		context.subscriptions.push(watcher);
		watcher.onDidCreate(() => provider.refresh(), null, context.subscriptions);
		watcher.onDidChange(() => provider.refresh(), null, context.subscriptions);
		watcher.onDidDelete(() => provider.refresh(), null, context.subscriptions);
	} catch (error) {
		output.appendLine(`Watcher setup failed: ${String(error)}`);
		console.error('P_Init: watcher setup failed', error);
	}

	output.appendLine('All __init__.py files will appear dark grey in the Explorer.');
}

export function deactivate() {}
