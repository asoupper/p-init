# P_Init

A Visual Studio Code extension that automatically renders every `__init__.py` file in the Explorer using contextual colors (empty files stay mid-grey, non-empty entries default to a subtle translucent white overlay).

## Features

Control and manage `__init__.py` files in your Python projects directly from VS Code.

## Requirements

- Visual Studio Code v1.105.1 or higher
- Node.js for development

## Extension Settings
This extension contributes two settings:

- `p-init.emptyInitFileColor`: Accepts a VS Code theme token (e.g. `list.highlightForeground`) or a hex value such as `#FF4081`. Hex values are stored under the `pinit.decorations.initFileEmpty` color token.
- `p-init.nonEmptyInitFileColor`: Applies to non-empty `__init__.py` files (defaults to #FFFFFF99). Hex values are stored under `pinit.decorations.initFile`.

You can open the `P_Init` output channel (View → Output → P_Init) to view simple activation logs, including when color changes are applied.

## Known Issues

None at this time.

## Release Notes

### 0.0.5

- Raise the minimum VS Code requirement to 1.105.1 so we stay aligned with the current Pylance baseline.

### 0.0.4

- Tweak the default non-empty `__init__.py` color to a translucent white overlay for better contrast.

### 0.0.3

- Differentiate decorations for empty vs. non-empty `__init__.py` files with independent settings.

### 0.0.2

- Allow configuring the decoration color through `p-init.initFileColor`, supporting both theme tokens and hex values.

### 0.0.1

- Initial release of P_Init extension.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
