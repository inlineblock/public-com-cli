# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.4] - 2025-02-02

### Added

- Interactive login mode - run `auth login` without `-k` flag to enter API key securely (won't appear in shell history)
- Global `--json` flag for machine-readable JSON output on all commands
- User-Agent header on all API requests (`public-com-cli/<version>`)

### Changed

- Updated README with features summary, JSON output examples, and improved documentation

## [0.1.3] - 2025-02-02

### Fixed

- Checkmark formatting now displays inline with message text on all commands

### Changed

- Added colors to trading status indicators (green for enabled, red for disabled)
- Consistent output formatting across all commands

## [0.1.2] - 2025-02-01

### Added

- Update checker that notifies users when a new version is available

## [0.1.1] - 2025-02-01

### Added

- Colors and formatting for CLI output
- Visual indicators for success, error, info, and warning messages

## [0.1.0] - 2025-02-01

### Added

- Initial release
- Authentication with secure keychain storage
- Account listing and portfolio viewing
- Transaction history with date filtering and pagination
- Instrument search and details
- Real-time quotes for stocks, ETFs, crypto, and options
- Option chain and Greeks lookup
- Order management (place, preview, cancel, view)
- Shell completion for Bash, Zsh, and Fish
- Automatic retry with exponential backoff
- Standalone binary builds
