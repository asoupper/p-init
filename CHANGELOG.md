# Change Log

All notable changes to the "p-init" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

## [0.0.5] - 2025-11-24

- Lower the extension engine requirement to VS Code 1.105.1 to match the current Pylance baseline.

## [0.0.4] - 2025-11-24

- Adjust the default non-empty `__init__.py` decoration color to a translucent white overlay for better Explorer contrast.
- Raise the minimum VS Code engine requirement to 1.106.1 to align with the tested runtime.

## [0.0.3] - 2025-11-24

- Introduce separate decorations for empty vs. non-empty `__init__.py` files with dedicated settings.
- Add `pinit.decorations.initFileEmpty` color token plus `p-init.emptyInitFileColor` and `p-init.nonEmptyInitFileColor` configuration entries.
- Cache and refresh file state to avoid repeated disk reads while keeping decorations up to date.

## [0.0.2] - 2025-11-24

- Add `p-init.initFileColor` setting to let users choose hex colors or theme tokens.
- Wire `workbench.colorCustomizations` updates so decorations honor hex values.
- Document configuration and log behavior.