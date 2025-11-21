// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

const INIT_FILENAME = '__init__.py';

export class InitFileDecorationProvider implements vscode.FileDecorationProvider {
	private _onDidChange = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
	readonly onDidChangeFileDecorations = this._onDidChange.event;

	constructor(private output?: vscode.OutputChannel) {}

	provideFileDecoration(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<vscode.FileDecoration> {
		try {
			if (uri && uri.path) {
					const name = path.basename(uri.fsPath);
				if (name === INIT_FILENAME) {
					const config = vscode.workspace.getConfiguration('p-init');
					const color = config.get<string>('initFileColor') || '#FF4081';
					// Logging for diagnosis
					this.output?.appendLine(`provideFileDecoration: ${uri.fsPath} (name=${name}) -> color=${color}`);
					console.log(`P_Init: provideFileDecoration for ${uri.fsPath} (name=${name}) -> color=${color}`);
					// The FileDecoration API expects a ThemeColor, but consumers have asked
					// to use hex colors. Cast the hex string to ThemeColor so it is passed
					// through at runtime. Note: some themes may not honor raw hex strings.
					return new vscode.FileDecoration(undefined, 'P_Init file', color as unknown as vscode.ThemeColor);
				}
			}
		} catch (e) {
			console.error('Error in InitFileDecorationProvider:', e);
		}
		return undefined;
	}

	// helper to fire change event for all URIs (undefined signals change for all)
	refresh() {
		this._onDidChange.fire(undefined);
	}
}

export function activate(context: vscode.ExtensionContext) {
	console.log('P_Init: activating extension');
	// Create an output channel for diagnostics (kept in subscriptions)
	const output = vscode.window.createOutputChannel('P_Init');
	context.subscriptions.push(output);
	output.appendLine('P_Init: activate() called');
	console.log('P_Init: activate() called');

	const provider = new InitFileDecorationProvider();
	context.subscriptions.push(vscode.window.registerFileDecorationProvider(provider));

	// Watch for changes to any __init__.py files in the workspace and refresh decorations
	try {
		const watcher = vscode.workspace.createFileSystemWatcher('**/__init__.py');
		context.subscriptions.push(watcher);
		watcher.onDidCreate(uri => {
			output.appendLine(`watcher: created ${uri.fsPath}`);
			console.log(`P_Init: watcher created ${uri.fsPath}`);
			provider.refresh();
		}, null, context.subscriptions);
		watcher.onDidChange(uri => {
			output.appendLine(`watcher: changed ${uri.fsPath}`);
			console.log(`P_Init: watcher changed ${uri.fsPath}`);
			provider.refresh();
		}, null, context.subscriptions);
		watcher.onDidDelete(uri => {
			output.appendLine(`watcher: deleted ${uri.fsPath}`);
			console.log(`P_Init: watcher deleted ${uri.fsPath}`);
			provider.refresh();
		}, null, context.subscriptions);
	} catch (e) {
		output.appendLine(`P_Init: watcher setup failed: ${String(e)}`);
		console.error('P_Init: watcher setup failed', e);
	}

	// When configuration changes, refresh decorations
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('p-init.initFileColor')) {
			const newColor = vscode.workspace.getConfiguration('p-init').get('initFileColor');
			output.appendLine(`configuration changed: p-init.initFileColor -> ${String(newColor)}`);
			console.log(`P_Init: configuration changed: p-init.initFileColor -> ${String(newColor)}`);
			provider.refresh();
		}
	}));

	// Keep a simple command for debugging
	const disposable = vscode.commands.registerCommand('p-init.helloWorld', () => {
		output.appendLine('command: p-init.helloWorld invoked');
		console.log('P_Init: command p-init.helloWorld invoked');
		vscode.window.showInformationMessage('Hello World from P_Init!');
	});
	context.subscriptions.push(disposable);
}

export function deactivate() {}
