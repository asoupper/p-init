import * as assert from 'assert';
import * as vscode from 'vscode';
import { InitFileDecorationProvider, EMPTY_DECORATION_THEME_ID, NON_EMPTY_DECORATION_THEME_ID } from '../extension';

suite('InitFileDecorationProvider Test Suite', () => {
	const colors = {
		empty: new vscode.ThemeColor(EMPTY_DECORATION_THEME_ID),
		nonEmpty: new vscode.ThemeColor(NON_EMPTY_DECORATION_THEME_ID),
	};

	test('decorates only __init__.py files', async () => {
		const provider = new InitFileDecorationProvider(colors, { isEmpty: async () => false });
		const initUri = vscode.Uri.file('/some/path/__init__.py');
		const otherUri = vscode.Uri.file('/some/path/not_init.py');

		const initDecoration = await provider.provideFileDecoration(initUri);
		const otherDecoration = await provider.provideFileDecoration(otherUri);

		assert.ok(initDecoration, 'Expected decoration for __init__.py');
		if (initDecoration) {
			assert.strictEqual(initDecoration.tooltip, 'Non-empty __init__.py file');
			assert.strictEqual(initDecoration.color?.id, NON_EMPTY_DECORATION_THEME_ID);
		}
		assert.strictEqual(otherDecoration, undefined, 'Expected no decoration for other files');
	});

	test('uses empty color for empty files', async () => {
		const provider = new InitFileDecorationProvider(colors, { isEmpty: async () => true });
		const initUri = vscode.Uri.file('/some/path/__init__.py');

		const decoration = await provider.provideFileDecoration(initUri);

		assert.ok(decoration);
		if (decoration) {
			assert.strictEqual(decoration.tooltip, 'Empty __init__.py file');
			assert.strictEqual(decoration.color?.id, EMPTY_DECORATION_THEME_ID);
		}
	});
});
