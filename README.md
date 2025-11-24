# P_Init

A Visual Studio Code extension that automatically renders every `__init__.py` file in the Explorer using a configurable tint (dark grey `#70707099` by default).

## Features

Control and manage `__init__.py` files in your Python projects directly from VS Code.

## Requirements

- Visual Studio Code v1.93.0 or higher
- Node.js for development

## Extension Settings
This extension contributes one setting:

- `p-init.initFileColor`: Accepts a VS Code theme token (e.g. `list.highlightForeground`) or a hex value such as `#FF4081`. Hex values are stored in `workbench.colorCustomizations` under `pinit.decorations.initFile`, while theme tokens are referenced directly.

You can open the `P_Init` output channel (View → Output → P_Init) to view simple activation logs, including when color changes are applied.

## Known Issues

None at this time.

## Release Notes

### 0.0.1

Initial release of P_Init extension.

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
