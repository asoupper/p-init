import * as assert from 'assert';
import * as vscode from 'vscode';
import { InitFileDecorationProvider } from '../extension';

suite('InitFileDecorationProvider Test Suite', () => {
	test('provides decoration for __init__.py and not for other files', async () => {
		const provider = new InitFileDecorationProvider();

		const initUri = vscode.Uri.file('/some/path/__init__.py');
		const otherUri = vscode.Uri.file('/some/path/not_init.py');

		const initDecoration = await provider.provideFileDecoration(initUri, new vscode.CancellationTokenSource().token);
		const otherDecoration = await provider.provideFileDecoration(otherUri, new vscode.CancellationTokenSource().token);

		assert.ok(initDecoration, 'Expected decoration for __init__.py');
		if (initDecoration) {
			assert.strictEqual(initDecoration.tooltip, 'P_Init file');
			// color is provided as a hex string cast to ThemeColor at runtime; access via any
			const c = (initDecoration as any).color;
			assert.ok(c, 'Expected a color value for __init__.py decoration');
			assert.strictEqual(c, '#FF4081');
		}

		assert.strictEqual(otherDecoration, undefined, 'Expected no decoration for non-init file');
	});
});
