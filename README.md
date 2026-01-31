# Public.com CLI

A command-line interface for interacting with the Public.com API.

## Installation

```bash
npm install -g public-com-cli
```

Or install from source:

```bash
git clone https://github.com/inlineblock/public-com-cli.git
cd public-com-cli
npm install
npm run build
npm link
```

## Quick Start

```bash
# Authenticate with your API key
public-cli auth login -k <your-api-key>

# List your accounts
public-cli accounts

# View portfolio
public-cli portfolio <accountId>

# Get a quote
public-cli quotes <accountId> AAPL TSLA
```

## Commands

### Authentication

```bash
# Store your API key (validates against the API)
public-cli auth login -k <your-api-key>

# Check authentication status and view account info
public-cli auth status

# Remove stored credentials
public-cli auth logout
```

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
| `--no-retry`    | Disable automatic retries on server errors |
| `-V, --version` | Output version number                      |
| `-h, --help`    | Display help                               |

## Error Handling

The CLI includes automatic retry logic for server errors:

- **5XX errors**: Exponential backoff retry (up to 3 attempts over ~30 seconds)
- **429 (Rate Limited)**: Respects `Retry-After` header
- **401 (Unauthorized)**: Automatically refreshes access token and retries

Use `--no-retry` to disable automatic retries.

## Development

### Prerequisites

- Node.js 18.0.0 or higher
- npm

### Setup

```bash
npm install
```

### Commands

| Command                | Description                      |
| ---------------------- | -------------------------------- |
| `npm run build`        | Compile TypeScript to JavaScript |
| `npm run dev`          | Run the CLI in development mode  |
| `npm run format`       | Format code with Prettier        |
| `npm run format:check` | Check code formatting            |
| `npm run typecheck`    | Run TypeScript type checking     |

## Security

- API keys are stored in your system's secure keychain, not in plain text files
- Access tokens are cached in the keychain with expiration tracking
- The CLI uses [keytar](https://github.com/atom/keytar) for secure credential storage
- Never share your API key or commit it to version control

## License

MIT License - see [LICENSE.md](LICENSE.md) for details.
