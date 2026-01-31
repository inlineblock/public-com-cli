import { Command } from 'commander';

const BASH_COMPLETION_SCRIPT = `
###-begin-public-cli-completions-###
#
# public-cli bash completion
#
# Installation:
#   public-cli completion bash >> ~/.bashrc
#   # or
#   public-cli completion bash > /usr/local/etc/bash_completion.d/public-cli
#

_public_cli_completions() {
    local cur prev commands global_opts

    COMPREPLY=()
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"

    commands="auth config accounts portfolio history instruments instrument quotes options-expirations options-chain order-preflight order-place order order-cancel option-greeks completion help"
    global_opts="--no-retry --version --help"

    # Auth subcommands
    auth_commands="login logout status"

    # Config subcommands
    config_commands="set-endpoint get-endpoint reset-endpoint"

    case "\${COMP_WORDS[1]}" in
        auth)
            if [[ \${COMP_CWORD} -eq 2 ]]; then
                COMPREPLY=( \$(compgen -W "\${auth_commands}" -- "\${cur}") )
                return 0
            fi
            case "\${COMP_WORDS[2]}" in
                login)
                    COMPREPLY=( \$(compgen -W "-k --key" -- "\${cur}") )
                    return 0
                    ;;
            esac
            ;;
        config)
            if [[ \${COMP_CWORD} -eq 2 ]]; then
                COMPREPLY=( \$(compgen -W "\${config_commands}" -- "\${cur}") )
                return 0
            fi
            ;;
        portfolio|history|quotes|options-expirations|options-chain|order-preflight|order-place|order|order-cancel|option-greeks)
            # These commands need accountId as first arg
            return 0
            ;;
        instruments)
            COMPREPLY=( \$(compgen -W "-t --type --trading --fractional --options --spreads" -- "\${cur}") )
            return 0
            ;;
        instrument)
            COMPREPLY=( \$(compgen -W "-t --type" -- "\${cur}") )
            return 0
            ;;
        completion)
            if [[ \${COMP_CWORD} -eq 2 ]]; then
                COMPREPLY=( \$(compgen -W "bash zsh fish" -- "\${cur}") )
                return 0
            fi
            ;;
        help)
            if [[ \${COMP_CWORD} -eq 2 ]]; then
                COMPREPLY=( \$(compgen -W "\${commands}" -- "\${cur}") )
                return 0
            fi
            ;;
    esac

    if [[ \${COMP_CWORD} -eq 1 ]]; then
        COMPREPLY=( \$(compgen -W "\${commands} \${global_opts}" -- "\${cur}") )
        return 0
    fi
}

complete -F _public_cli_completions public-cli
complete -F _public_cli_completions public-com-cli
###-end-public-cli-completions-###
`.trim();

const ZSH_COMPLETION_SCRIPT = `
#compdef public-cli public-com-cli

###-begin-public-cli-completions-###
#
# public-cli zsh completion
#
# Installation:
#   public-cli completion zsh > ~/.zsh/completions/_public-cli
#   # Then add to ~/.zshrc: fpath=(~/.zsh/completions $fpath)
#

_public-cli() {
    local -a commands
    commands=(
        'auth:Manage authentication with Public.com API'
        'config:Manage CLI configuration'
        'accounts:List your trading accounts'
        'portfolio:View portfolio for an account'
        'history:View transaction history for an account'
        'instruments:List available trading instruments'
        'instrument:Get details for a specific instrument'
        'quotes:Get quotes for one or more instruments'
        'options-expirations:Get available option expiration dates'
        'options-chain:Get option chain for an instrument'
        'order-preflight:Preview estimated costs for an order'
        'order-place:Place a new order'
        'order:Get order details'
        'order-cancel:Cancel an open order'
        'option-greeks:Get option Greeks'
        'completion:Generate shell completion script'
        'help:Display help for command'
    )

    _arguments -C \\
        '--no-retry[Disable automatic retries]' \\
        '--version[Output version number]' \\
        '--help[Display help]' \\
        '1: :->command' \\
        '*::arg:->args'

    case "$state" in
        command)
            _describe -t commands 'command' commands
            ;;
        args)
            case "\${words[1]}" in
                auth)
                    local -a auth_commands
                    auth_commands=(
                        'login:Store your API key'
                        'logout:Remove stored credentials'
                        'status:Check authentication status'
                    )
                    _describe -t auth_commands 'auth command' auth_commands
                    ;;
                config)
                    local -a config_commands
                    config_commands=(
                        'set-endpoint:Set the API endpoint URL'
                        'get-endpoint:Show the current API endpoint'
                        'reset-endpoint:Reset to default endpoint'
                    )
                    _describe -t config_commands 'config command' config_commands
                    ;;
                completion)
                    _values 'shell' bash zsh fish
                    ;;
            esac
            ;;
    esac
}

_public-cli "$@"
###-end-public-cli-completions-###
`.trim();

const FISH_COMPLETION_SCRIPT = `
###-begin-public-cli-completions-###
#
# public-cli fish completion
#
# Installation:
#   public-cli completion fish > ~/.config/fish/completions/public-cli.fish
#

# Disable file completion by default
complete -c public-cli -f
complete -c public-com-cli -f

# Global options
complete -c public-cli -l no-retry -d 'Disable automatic retries'
complete -c public-cli -l version -s V -d 'Output version number'
complete -c public-cli -l help -s h -d 'Display help'

# Commands
complete -c public-cli -n __fish_use_subcommand -a auth -d 'Manage authentication'
complete -c public-cli -n __fish_use_subcommand -a config -d 'Manage CLI configuration'
complete -c public-cli -n __fish_use_subcommand -a accounts -d 'List trading accounts'
complete -c public-cli -n __fish_use_subcommand -a portfolio -d 'View portfolio'
complete -c public-cli -n __fish_use_subcommand -a history -d 'View transaction history'
complete -c public-cli -n __fish_use_subcommand -a instruments -d 'List instruments'
complete -c public-cli -n __fish_use_subcommand -a instrument -d 'Get instrument details'
complete -c public-cli -n __fish_use_subcommand -a quotes -d 'Get quotes'
complete -c public-cli -n __fish_use_subcommand -a options-expirations -d 'Get option expirations'
complete -c public-cli -n __fish_use_subcommand -a options-chain -d 'Get option chain'
complete -c public-cli -n __fish_use_subcommand -a order-preflight -d 'Preview order costs'
complete -c public-cli -n __fish_use_subcommand -a order-place -d 'Place an order'
complete -c public-cli -n __fish_use_subcommand -a order -d 'Get order details'
complete -c public-cli -n __fish_use_subcommand -a order-cancel -d 'Cancel an order'
complete -c public-cli -n __fish_use_subcommand -a option-greeks -d 'Get option Greeks'
complete -c public-cli -n __fish_use_subcommand -a completion -d 'Generate completion script'
complete -c public-cli -n __fish_use_subcommand -a help -d 'Display help'

# Auth subcommands
complete -c public-cli -n '__fish_seen_subcommand_from auth' -a login -d 'Store API key'
complete -c public-cli -n '__fish_seen_subcommand_from auth' -a logout -d 'Remove credentials'
complete -c public-cli -n '__fish_seen_subcommand_from auth' -a status -d 'Check auth status'

# Config subcommands
complete -c public-cli -n '__fish_seen_subcommand_from config' -a set-endpoint -d 'Set API endpoint'
complete -c public-cli -n '__fish_seen_subcommand_from config' -a get-endpoint -d 'Show endpoint'
complete -c public-cli -n '__fish_seen_subcommand_from config' -a reset-endpoint -d 'Reset endpoint'

# Completion subcommands
complete -c public-cli -n '__fish_seen_subcommand_from completion' -a 'bash zsh fish' -d 'Shell type'
###-end-public-cli-completions-###
`.trim();

export function createCompletionCommand(): Command {
  const completion = new Command('completion')
    .description('Generate shell completion script')
    .argument('<shell>', 'Shell type (bash, zsh, fish)')
    .action((shell: string) => {
      switch (shell.toLowerCase()) {
        case 'bash':
          console.log(BASH_COMPLETION_SCRIPT);
          break;
        case 'zsh':
          console.log(ZSH_COMPLETION_SCRIPT);
          break;
        case 'fish':
          console.log(FISH_COMPLETION_SCRIPT);
          break;
        default:
          console.error(`Unknown shell: ${shell}`);
          console.error('Supported shells: bash, zsh, fish');
          process.exit(1);
      }
    });

  return completion;
}
