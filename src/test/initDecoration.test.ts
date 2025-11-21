import * as assert from 'assert';
import * as vscode from 'vscode';
import { InitFileDecorationProvider, DECORATION_THEME_ID } from '../extension';

suite('InitFileDecorationProvider Test Suite', () => {
		test('decorates only __init__.py files', async () => {
			const provider = new InitFileDecorationProvider(new vscode.ThemeColor(DECORATION_THEME_ID));
		const initUri = vscode.Uri.file('/some/path/__init__.py');
		const otherUri = vscode.Uri.file('/some/path/not_init.py');

		const initDecoration = await provider.provideFileDecoration(initUri);
		const otherDecoration = await provider.provideFileDecoration(otherUri);

		assert.ok(initDecoration, 'Expected decoration for __init__.py');
		if (initDecoration) {
			assert.strictEqual(initDecoration.tooltip, '__init__.py file');
			assert.ok(initDecoration.color, 'Expected decoration to reference theme color');
		}
		assert.strictEqual(otherDecoration, undefined, 'Expected no decoration for other files');
	});
});
