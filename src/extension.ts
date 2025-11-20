// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

const INIT_FILENAME = '__init__.py';

export class InitFileDecorationProvider implements vscode.FileDecorationProvider {
	private _onDidChange = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
	readonly onDidChangeFileDecorations = this._onDidChange.event;

	provideFileDecoration(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<vscode.FileDecoration> {
		try {
			if (uri && uri.path) {
					const name = path.basename(uri.fsPath);
				if (name === INIT_FILENAME) {
					const config = vscode.workspace.getConfiguration('p-init');
						const colorSetting = config.get<string>('initFileColor') || '';
						// Explorer coloring via ThemeColor tokens is supported; if user supplied a theme token, use it.
						// For now, always show a visible badge so the file is obvious in the Explorer.
						const badge = 'init';
						let color: vscode.ThemeColor | undefined;
						if (colorSetting && !colorSetting.startsWith('#')) {
							color = new vscode.ThemeColor(colorSetting);
						}
						return new vscode.FileDecoration(badge, 'P_Init file', color);
				}
			}
		} catch (e) {
			// ignore
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

	const provider = new InitFileDecorationProvider();
	context.subscriptions.push(vscode.window.registerFileDecorationProvider(provider));

	// Watch for changes to any __init__.py files in the workspace and refresh decorations
	try {
		const watcher = vscode.workspace.createFileSystemWatcher('**/__init__.py');
		context.subscriptions.push(watcher);
		watcher.onDidCreate(() => provider.refresh(), null, context.subscriptions);
		watcher.onDidChange(() => provider.refresh(), null, context.subscriptions);
		watcher.onDidDelete(() => provider.refresh(), null, context.subscriptions);
	} catch (e) {
		// ignore environments that don't support workspace (e.g., tests)
	}

	// When configuration changes, refresh decorations
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('p-init.initFileColor')) {
			provider.refresh();
		}
	}));

	// Keep a simple command for debugging
	const disposable = vscode.commands.registerCommand('p-init.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from P_Init!');
	});
	context.subscriptions.push(disposable);
}

export function deactivate() {}
