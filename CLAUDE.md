# CLAUDE.md

This file provides guidance for Claude Code when working on this project.

## Project Overview

This is a CLI application for interacting with the Public.com API. It is built with TypeScript, Commander.js for CLI parsing, and Keytar for secure credential storage.

## Build Commands

```bash
npm install        # Install dependencies
npm run build      # Compile TypeScript
npm run dev        # Run in development mode (uses tsx)
npm run format     # Format code with Prettier
npm run typecheck  # Type-check without emitting
```

## Architecture

```
src/
├── index.ts           # CLI entry point
├── commands/          # Command definitions (one file per command group)
├── authentication/    # Credential storage and retrieval
└── helpers/           # Shared utilities (output formatting, validation)
```

## Code Style

- Use Prettier for formatting (run `npm run format`)
- Use ES modules (`import`/`export`)
- Add `.js` extension to relative imports (required for NodeNext module resolution)
- Prefer async/await over callbacks
- Use strict TypeScript (enabled in tsconfig.json)

## Adding New Commands

1. Create a new file in `src/commands/` (e.g., `portfolio.ts`)
2. Export a function that returns a `Command` instance
3. Import and add the command in `src/index.ts` using `program.addCommand()`

## Security Considerations

- API keys are stored in the system keychain via Keytar, never in files
- Validate all user input before processing
- Never log or display API keys in output
- Use `process.exit(1)` for error conditions after displaying user-friendly messages
