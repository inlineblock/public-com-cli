# Public.com CLI

A command-line interface for the [Public.com Trading API](https://public.com/api). Trade stocks, ETFs, options, and crypto directly from your terminal.

## Features

- **Portfolio Management** - View positions, buying power, and open orders
- **Market Data** - Real-time quotes, option chains, and Greeks
- **Order Execution** - Place, preview, and cancel orders
- **Transaction History** - View past trades and account activity
- **Secure Authentication** - API keys stored in system keychain (not plain text)
- **JSON Output** - Machine-readable output for scripting (`--json` flag)
- **Shell Completion** - Tab completion for Bash, Zsh, and Fish
- **Auto-Retry** - Automatic retry with backoff for rate limits and server errors

## Installation

```bash
npm install -g public-com-cli
```

After installation, the CLI is available as both `public-cli` and `public-com-cli`:

```bash
public-cli --help
# or
public-com-cli --help
```

### Install from Source

```bash
git clone https://github.com/inlineblock/public-com-cli.git
cd public-com-cli
npm install
npm run build
npm link
```

## Quick Start

```bash
# Authenticate (interactive prompt hides your key)
public-cli auth login

# List your accounts
public-cli accounts

# View portfolio
public-cli portfolio <accountId>

# Get quotes
public-cli quotes <accountId> AAPL TSLA

# Place an order
public-cli order-place <accountId> AAPL -s BUY -T MARKET -q 1
```

## Commands

### Authentication

```bash
# Interactive login (recommended - key won't appear in shell history)
public-cli auth login

# Or provide key directly
public-cli auth login -k <your-api-key>

# Check authentication status and view account info
public-cli auth status

# Remove stored credentials
public-cli auth logout
```

To get your API key: Log into [Public.com](https://public.com), go to Settings > API, and generate a secret key.

### Configuration

```bash
# Set custom API endpoint
public-cli config set-endpoint https://custom-api.example.com/

# View current endpoint
public-cli config get-endpoint

# Reset to default endpoint
public-cli config reset-endpoint
```

### Accounts

```bash
# List all trading accounts
public-cli accounts
```

### Portfolio

```bash
# View portfolio (positions, orders, buying power)
public-cli portfolio <accountId>
```

### Transaction History

```bash
# View transaction history
public-cli history <accountId>

# With date range
public-cli history <accountId> --start 2025-01-01T00:00:00Z --end 2025-01-31T23:59:59Z

# Limit results
public-cli history <accountId> --limit 10

# Pagination
public-cli history <accountId> --next-token <token>
```

### Instruments

```bash
# List all available instruments
public-cli instruments

# Filter by type
public-cli instruments -t EQUITY,ETF

# Filter by trading status
public-cli instruments --trading BUY_AND_SELL

# Get details for a specific instrument
public-cli instrument AAPL
public-cli instrument BTC -t CRYPTO
```

### Market Data

```bash
# Get quotes for one or more symbols
public-cli quotes <accountId> AAPL TSLA GOOGL
public-cli quotes <accountId> BTC ETH -t CRYPTO

# Get option expiration dates
public-cli options-expirations <accountId> AAPL
public-cli options-expirations <accountId> SPX -t UNDERLYING_SECURITY_FOR_INDEX_OPTION

# Get option chain for an expiration date
public-cli options-chain <accountId> AAPL 2025-02-21

# Get option Greeks
public-cli option-greeks <accountId> AAPL250221C00185000
```

### Order Management

```bash
# Preview order costs (preflight)
public-cli order-preflight <accountId> AAPL -s BUY -T MARKET -q 10
public-cli order-preflight <accountId> AAPL -s BUY -T LIMIT -q 10 -l 180.00

# Place an order
public-cli order-place <accountId> AAPL -s BUY -T MARKET -q 10
public-cli order-place <accountId> AAPL -s BUY -T LIMIT -q 10 -l 180.00 --tif DAY

# Get order details
public-cli order <accountId> <orderId>

# Cancel an order
public-cli order-cancel <accountId> <orderId>
```

#### Order Options

| Option             | Description                                                    |
| ------------------ | -------------------------------------------------------------- |
| `-s, --side`       | Order side: `BUY` or `SELL` (required)                         |
| `-T, --order-type` | Order type: `MARKET`, `LIMIT`, `STOP`, `STOP_LIMIT` (required) |
| `-q, --quantity`   | Number of shares/contracts                                     |
| `-a, --amount`     | Dollar amount (alternative to quantity)                        |
| `-l, --limit`      | Limit price (required for LIMIT/STOP_LIMIT)                    |
| `--stop`           | Stop price (required for STOP/STOP_LIMIT)                      |
| `-t, --type`       | Security type (default: EQUITY)                                |
| `--tif`            | Time in force: `DAY` or `GTD` (default: DAY)                   |
| `--session`        | Market session: `CORE` or `EXTENDED` (default: CORE)           |
| `--open-close`     | For options: `OPEN` or `CLOSE`                                 |

## Global Options

| Option          | Description                                |
| --------------- | ------------------------------------------ |
| `--json`        | Output results as JSON for scripting       |
| `--no-retry`    | Disable automatic retries on server errors |
| `-V, --version` | Output version number                      |
| `-h, --help`    | Display help                               |

### JSON Output

Use the `--json` flag to get machine-readable output:

```bash
# Get portfolio as JSON
public-cli --json portfolio <accountId>

# Pipe to jq for filtering
public-cli --json quotes <accountId> AAPL | jq '.[] | .last'

# Use in scripts
BALANCE=$(public-cli --json portfolio <accountId> | jq -r '.buyingPower.buyingPower')
```

## Error Handling

The CLI includes automatic retry logic for server errors:

- **5XX errors**: Exponential backoff retry (up to 3 attempts over ~30 seconds)
- **429 (Rate Limited)**: Respects `Retry-After` header
- **401 (Unauthorized)**: Automatically refreshes access token and retries

Use `--no-retry` to disable automatic retries.

## Shell Completion

Enable tab completion for commands and options:

### Bash

```bash
# Add to ~/.bashrc
public-cli completion bash >> ~/.bashrc
source ~/.bashrc
```

### Zsh

```bash
# Create completions directory and add completion
mkdir -p ~/.zsh/completions
public-cli completion zsh > ~/.zsh/completions/_public-cli

# Add to ~/.zshrc (if not already there)
echo 'fpath=(~/.zsh/completions $fpath)' >> ~/.zshrc
echo 'autoload -Uz compinit && compinit' >> ~/.zshrc
source ~/.zshrc
```

### Fish

```bash
public-cli completion fish > ~/.config/fish/completions/public-cli.fish
```

## Development

### Prerequisites

- Node.js 18.0.0 or higher
- npm

### Setup

```bash
npm install
```

### Commands

| Command                        | Description                                  |
| ------------------------------ | -------------------------------------------- |
| `npm run build`                | Compile TypeScript to JavaScript             |
| `npm run build:binary`         | Build standalone binaries for all platforms  |
| `npm run build:binary:current` | Build standalone binary for current platform |
| `npm run dev`                  | Run the CLI in development mode              |
| `npm run format`               | Format code with Prettier                    |
| `npm run format:check`         | Check code formatting                        |
| `npm run typecheck`            | Run TypeScript type checking                 |

### Building Standalone Binaries

Create a single executable that includes Node.js runtime:

```bash
# Build for current platform only
npm run build:binary:current
./dist/public-com-cli --help

# Build for all platforms (macOS, Linux, Windows)
npm run build:binary
ls dist/bin/
```

The binaries are output to:

- `dist/public-com-cli` (current platform)
- `dist/bin/` (all platforms: macOS ARM64/x64, Linux x64, Windows x64)

## Security

- API keys are stored in your system's secure keychain, not in plain text files
- Access tokens are cached in the keychain with expiration tracking
- The CLI uses [keytar](https://github.com/atom/keytar) for secure credential storage
- Never share your API key or commit it to version control

## License

MIT License - see [LICENSE.md](LICENSE.md) for details.
