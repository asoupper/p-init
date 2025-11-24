// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

const INIT_FILENAME = '__init__.py';
const CONFIG_SECTION = 'p-init';
const EMPTY_COLOR_SETTING_NAME = 'emptyInitFileColor';
const NON_EMPTY_COLOR_SETTING_NAME = 'nonEmptyInitFileColor';
const EMPTY_COLOR_SETTING_KEY = `${CONFIG_SECTION}.${EMPTY_COLOR_SETTING_NAME}`;
const NON_EMPTY_COLOR_SETTING_KEY = `${CONFIG_SECTION}.${NON_EMPTY_COLOR_SETTING_NAME}`;
const DEFAULT_EMPTY_COLOR = '#70707099';
const DEFAULT_NON_EMPTY_COLOR = '#FFFFFF99';
export const EMPTY_DECORATION_THEME_ID = 'pinit.decorations.initFileEmpty';
export const NON_EMPTY_DECORATION_THEME_ID = 'pinit.decorations.initFile';
// Export legacy identifier for downstream tests that still import the single-color constant.
export const DECORATION_THEME_ID = NON_EMPTY_DECORATION_THEME_ID;

type InitFileColors = {
	empty: vscode.ThemeColor;
	nonEmpty: vscode.ThemeColor;
};

interface FileStateInspector {
	isEmpty(uri: vscode.Uri): Promise<boolean>;
}

class WorkspaceFileStateInspector implements FileStateInspector {
	async isEmpty(uri: vscode.Uri): Promise<boolean> {
		const stat = await vscode.workspace.fs.stat(uri);
		return stat.size === 0;
	}
}

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
	private colors: InitFileColors;
	private readonly inspector: FileStateInspector;
	private readonly emptinessCache = new Map<string, boolean>();

	constructor(initialColors: InitFileColors, inspector: FileStateInspector = new WorkspaceFileStateInspector()) {
		this.colors = initialColors;
		this.inspector = inspector;
	}

	async provideFileDecoration(uri: vscode.Uri): Promise<vscode.FileDecoration | undefined> {
		const name = path.basename(uri.fsPath);
		if (name !== INIT_FILENAME) {
			return undefined;
		}
		const isEmpty = await this.isFileEmpty(uri);
		const color = isEmpty ? this.colors.empty : this.colors.nonEmpty;
		const tooltip = isEmpty ? 'Empty __init__.py file' : 'Non-empty __init__.py file';
		return new vscode.FileDecoration(undefined, tooltip, color);
	}

	refresh(): void {
		this.emitter.fire(undefined);
	}

	setColors(colors: InitFileColors): void {
		this.colors = colors;
		this.invalidateCache();
		this.refresh();
	}

	invalidateCache(uri?: vscode.Uri): void {
		if (uri) {
			this.emptinessCache.delete(uri.fsPath);
			return;
		}
		this.emptinessCache.clear();
	}

	private async isFileEmpty(uri: vscode.Uri): Promise<boolean> {
		const cacheKey = uri.fsPath;
		if (this.emptinessCache.has(cacheKey)) {
			return this.emptinessCache.get(cacheKey)!;
		}
		try {
			const empty = await this.inspector.isEmpty(uri);
			this.emptinessCache.set(cacheKey, empty);
			return empty;
		} catch (error) {
			console.warn(`P_Init: failed to inspect ${uri.fsPath}`, error);
			this.emptinessCache.delete(cacheKey);
			return false;
		}
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

	const colors = await resolveDecorationThemeColors(output);
	const provider = new InitFileDecorationProvider(colors);
	context.subscriptions.push(vscode.window.registerFileDecorationProvider(provider));

	try {
		const watcher = vscode.workspace.createFileSystemWatcher('**/__init__.py');
		context.subscriptions.push(watcher);
		watcher.onDidCreate(uri => {
			provider.invalidateCache(uri);
			provider.refresh();
		}, null, context.subscriptions);
		watcher.onDidChange(uri => {
			provider.invalidateCache(uri);
			provider.refresh();
		}, null, context.subscriptions);
		watcher.onDidDelete(uri => {
			provider.invalidateCache(uri);
			provider.refresh();
		}, null, context.subscriptions);
	} catch (error) {
		output.appendLine(`Watcher setup failed: ${String(error)}`);
		console.error('P_Init: watcher setup failed', error);
	}

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(async event => {
		if (event.affectsConfiguration(EMPTY_COLOR_SETTING_KEY) || event.affectsConfiguration(NON_EMPTY_COLOR_SETTING_KEY)) {
			output.appendLine('Detected init file color change. Applying new values...');
			const updatedColors = await resolveDecorationThemeColors(output);
			provider.setColors(updatedColors);
		}
	}));

	output.appendLine('Empty and non-empty __init__.py files now use their respective colors from the P_Init settings.');
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
async function resolveDecorationThemeColors(output: vscode.OutputChannel): Promise<InitFileColors> {
	const emptyColor = await resolveColorFromSetting(EMPTY_COLOR_SETTING_NAME, EMPTY_DECORATION_THEME_ID, DEFAULT_EMPTY_COLOR, output);
	const nonEmptyColor = await resolveColorFromSetting(NON_EMPTY_COLOR_SETTING_NAME, NON_EMPTY_DECORATION_THEME_ID, DEFAULT_NON_EMPTY_COLOR, output);
	return { empty: emptyColor, nonEmpty: nonEmptyColor };
}

async function resolveColorFromSetting(settingName: string, themeId: string, fallback: string, output: vscode.OutputChannel): Promise<vscode.ThemeColor> {
	const colorSetting = getConfiguredColor(settingName, fallback);
	if (isHexColor(colorSetting)) {
		await applyColorCustomization(themeId, colorSetting, output);
		return new vscode.ThemeColor(themeId);
	}
	await removeColorCustomizationIfPresent(themeId, output);
	return new vscode.ThemeColor(colorSetting);
}

function getConfiguredColor(settingName: string, fallback: string): string {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	const value = config.get<string>(settingName);
	return (value && value.trim()) || fallback;
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
async function applyColorCustomization(themeId: string, hexColor: string, output: vscode.OutputChannel): Promise<void> {
	// Store the requested hex color under a dedicated token so FileDecoration can reference it.
	const config = vscode.workspace.getConfiguration();
	const target = getColorCustomizationTarget();
	const customizations = { ...(config.get<Record<string, unknown>>('workbench.colorCustomizations') || {}) };
	if (customizations[themeId] === hexColor) {
		return;
	}
	customizations[themeId] = hexColor;
	await config.update('workbench.colorCustomizations', customizations, target);
	output.appendLine(`Applied hex color ${hexColor} to ${themeId}.`);
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
async function removeColorCustomizationIfPresent(themeId: string, output: vscode.OutputChannel): Promise<void> {
	// Clean up previously set custom colors when the user switches back to a theme token.
	const config = vscode.workspace.getConfiguration();
	const customizations = { ...(config.get<Record<string, unknown>>('workbench.colorCustomizations') || {}) };
	if (!(themeId in customizations)) {
		return;
	}
	delete customizations[themeId];
	const target = getColorCustomizationTarget();
	await config.update('workbench.colorCustomizations', Object.keys(customizations).length ? customizations : undefined, target);
	output.appendLine(`Removed custom hex color for ${themeId}.`);
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
