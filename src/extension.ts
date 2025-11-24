// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

const INIT_FILENAME = '__init__.py';
const DEFAULT_COLOR = '#70707099';
const COLOR_SETTING_KEY = 'p-init.initFileColor';
export const DECORATION_THEME_ID = 'pinit.decorations.initFile';

/**
 * Provides file decorations for Python `__init__.py` files in the VS Code explorer.
 * 
 * This class implements the {@link vscode.FileDecorationProvider} interface to add
 * visual indicators (such as color and tooltip) to `__init__.py` files in the file explorer.
 * The decoration color can be customized and changed dynamically.
 * 
 * @example
 * ```typescript
 * const color = new vscode.ThemeColor('charts.blue');
 * const provider = new InitFileDecorationProvider(color);
 * vscode.window.registerFileDecorationProvider(provider);
 * ```
 */
export class InitFileDecorationProvider implements vscode.FileDecorationProvider {
	private readonly emitter = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
	readonly onDidChangeFileDecorations = this.emitter.event;
	private color: vscode.ThemeColor;

	constructor(initialColor: vscode.ThemeColor) {
		this.color = initialColor;
	}

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

	setColor(color: vscode.ThemeColor): void {
		this.color = color;
		this.refresh();
	}
}

/**
 * Activates the P_Init extension.
 * 
 * This function is called when the extension is activated. It performs the following tasks:
 * - Creates an output channel for logging extension activity
 * - Resolves and applies the initial decoration theme color for `__init__.py` files
 * - Registers a file decoration provider to customize the appearance of `__init__.py` files
 * - Sets up a file system watcher to monitor creation, modification, and deletion of `__init__.py` files
 * - Listens for configuration changes to update the decoration color when the user modifies settings
 * 
 * @param context - The extension context provided by VS Code, used to manage subscriptions and lifecycle
 * @returns A promise that resolves when activation is complete
 */
export async function activate(context: vscode.ExtensionContext) {
	const output = vscode.window.createOutputChannel('P_Init');
	context.subscriptions.push(output);
	output.appendLine('P_Init: activating extension');

	const initialColor = await resolveDecorationThemeColor(output);
	const provider = new InitFileDecorationProvider(initialColor);
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

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(async event => {
		if (event.affectsConfiguration(COLOR_SETTING_KEY)) {
			output.appendLine('Detected init file color change. Applying new value...');
			const updatedColor = await resolveDecorationThemeColor(output);
			provider.setColor(updatedColor);
		}
	}));

	output.appendLine('All __init__.py files now use the color defined by p-init.initFileColor.');
}

/**
 * Called when the extension is deactivated.
 * This function is invoked when the extension is being shut down, either because
 * VS Code is closing or the extension is being disabled or uninstalled.
 * Use this function to perform any necessary cleanup operations.
 */
export function deactivate() {}

/**
 * Resolves the decoration theme color based on user configuration.
 * 
 * If the configured color is a hex value, it applies the color customization and returns
 * a ThemeColor with the decoration theme ID. If it's a theme color token string, it removes
 * any existing color customization and returns a ThemeColor with that token.
 * 
 * @param output - The output channel for logging color customization operations
 * @returns A promise that resolves to a ThemeColor instance
 */
async function resolveDecorationThemeColor(output: vscode.OutputChannel): Promise<vscode.ThemeColor> {
	// Respect user preference: hex values get mapped via color customizations, token strings are used directly.
	const colorSetting = getConfiguredColor();
	if (isHexColor(colorSetting)) {
		await applyColorCustomization(colorSetting, output);
		return new vscode.ThemeColor(DECORATION_THEME_ID);
	}
	await removeColorCustomizationIfPresent(output);
	return new vscode.ThemeColor(colorSetting);
}

/**
 * Retrieves the configured color for the init file from the workspace settings.
 * 
 * @returns The configured color value from the 'p-init.initFileColor' setting,
 * or the DEFAULT_COLOR if the setting is not defined or contains only whitespace.
 */
function getConfiguredColor(): string {
	// Read the extension setting while falling back to a sensible default.
	const config = vscode.workspace.getConfiguration('p-init');
	const value = config.get<string>('initFileColor');
	return (value && value.trim()) || DEFAULT_COLOR;
}

function isHexColor(value: string): boolean {
	return /^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(value);
}


/**
 * Applies a custom color to the workspace's color customizations.
 * 
 * This function updates the `workbench.colorCustomizations` configuration with the specified
 * hex color for the decoration theme. If the color is already applied, the function returns
 * early without making changes.
 * 
 * @param hexColor - The hexadecimal color value to apply (e.g., "#FF5733")
 * @param output - The output channel used for logging the operation
 * @returns A promise that resolves when the color customization has been applied
 * 
 * @remarks
 * The color is stored under a dedicated token referenced by `DECORATION_THEME_ID`,
 * which allows FileDecoration to reference it. The configuration target is determined
 * by the `getColorCustomizationTarget()` function.
 */
async function applyColorCustomization(hexColor: string, output: vscode.OutputChannel): Promise<void> {
	// Store the requested hex color under a dedicated token so FileDecoration can reference it.
	const config = vscode.workspace.getConfiguration();
	const target = getColorCustomizationTarget();
	const customizations = { ...(config.get<Record<string, unknown>>('workbench.colorCustomizations') || {}) };
	if (customizations[DECORATION_THEME_ID] === hexColor) {
		return;
	}
	customizations[DECORATION_THEME_ID] = hexColor;
	await config.update('workbench.colorCustomizations', customizations, target);
	output.appendLine(`Applied hex color ${hexColor} to ${DECORATION_THEME_ID}.`);
}

/**
 * Removes the color customization for the decoration theme if it exists in the workspace configuration.
 * 
 * This function cleans up previously set custom colors when the user switches back to a theme token.
 * If the decoration theme ID is found in the color customizations, it will be deleted and the
 * configuration will be updated. If no other customizations remain, the entire colorCustomizations
 * setting will be set to undefined.
 * 
 * @param output - The output channel where log messages will be written
 * @returns A promise that resolves when the color customization has been removed and the configuration updated
 */
async function removeColorCustomizationIfPresent(output: vscode.OutputChannel): Promise<void> {
	// Clean up previously set custom colors when the user switches back to a theme token.
	const config = vscode.workspace.getConfiguration();
	const customizations = { ...(config.get<Record<string, unknown>>('workbench.colorCustomizations') || {}) };
	if (!(DECORATION_THEME_ID in customizations)) {
		return;
	}
	delete customizations[DECORATION_THEME_ID];
	const target = getColorCustomizationTarget();
	await config.update('workbench.colorCustomizations', Object.keys(customizations).length ? customizations : undefined, target);
	output.appendLine(`Removed custom hex color for ${DECORATION_THEME_ID}.`);
}

/**
 * Determines the appropriate configuration target for color customizations.
 * 
 * @returns {vscode.ConfigurationTarget} Returns `ConfigurationTarget.Workspace` if a workspace is open,
 * otherwise returns `ConfigurationTarget.Global` for user-level settings.
 */
function getColorCustomizationTarget(): vscode.ConfigurationTarget {
	const hasWorkspace = vscode.workspace.workspaceFolders?.length ?? 0 > 0;
	return hasWorkspace
		? vscode.ConfigurationTarget.Workspace
		: vscode.ConfigurationTarget.Global;
}
