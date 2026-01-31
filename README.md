# Public.com CLI

A command-line interface for interacting with the Public.com API.

## Installation

```bash
npm install -g public-com-cli
```

Or install from source:

```bash
git clone <repository-url>
cd public-com-cli
npm install
npm run build
npm link
```

## Usage

### Authentication

The CLI stores your API key securely in your system's keychain (macOS Keychain, Windows Credential Vault, or Linux Secret Service).

#### Login

Store your API key:

```bash
public-cli auth login -k <your-api-key>
```

#### Check Status

Verify if you're authenticated:

```bash
public-cli auth status
```

#### Logout

Remove your stored API key:

```bash
public-cli auth logout
```

### Configuration

#### Set API Endpoint

Override the default API endpoint (https://api.public.com/):

```bash
public-cli config set-endpoint https://custom-api.example.com/
```

#### Get Current Endpoint

Show the current API endpoint:

```bash
public-cli config get-endpoint
```

#### Reset Endpoint

Reset to the default endpoint:

```bash
public-cli config reset-endpoint
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

| Command                | Description                      |
| ---------------------- | -------------------------------- |
| `npm run build`        | Compile TypeScript to JavaScript |
| `npm run dev`          | Run the CLI in development mode  |
| `npm run format`       | Format code with Prettier        |
| `npm run format:check` | Check code formatting            |
| `npm run typecheck`    | Run TypeScript type checking     |

## Security

- API keys are stored in your system's secure keychain, not in plain text files
- The CLI uses [keytar](https://github.com/atom/keytar) for secure credential storage
- Never share your API key or commit it to version control

## License

MIT License - see [LICENSE.md](LICENSE.md) for details.
