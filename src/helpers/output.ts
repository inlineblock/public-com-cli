// JSON mode state
let jsonMode = false;

export function setJsonMode(enabled: boolean): void {
  jsonMode = enabled;
}

export function isJsonMode(): boolean {
  return jsonMode;
}

export function outputJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  // Foreground colors
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

// Check if colors should be disabled
const noColor =
  process.env.NO_COLOR !== undefined || process.env.TERM === 'dumb';

function c(color: keyof typeof colors, text: string): string {
  if (noColor) return text;
  return `${colors[color]}${text}${colors.reset}`;
}

export function bold(text: string): string {
  return c('bold', text);
}

export function dim(text: string): string {
  return c('dim', text);
}

export function green(text: string): string {
  return c('green', text);
}

export function red(text: string): string {
  return c('red', text);
}

export function yellow(text: string): string {
  return c('yellow', text);
}

export function blue(text: string): string {
  return c('blue', text);
}

export function cyan(text: string): string {
  return c('cyan', text);
}

export function gray(text: string): string {
  return c('gray', text);
}

export function success(message: string): void {
  console.log(`${green('✓')} ${message}`);
}

export function error(message: string): void {
  console.error(`${red('✗')} ${message}`);
}

export function info(message: string): void {
  console.log(`${blue('ℹ')} ${message}`);
}

export function warn(message: string): void {
  console.warn(`${yellow('⚠')} ${message}`);
}

// Table formatting helpers
export function label(text: string): string {
  return dim(text);
}

export function value(text: string): string {
  return bold(text);
}

export function positive(text: string): string {
  return green(text);
}

export function negative(text: string): string {
  return red(text);
}

export function header(text: string): void {
  console.log(`\n${bold(text)}`);
}

export function subheader(text: string): void {
  console.log(`\n${cyan(text)}`);
}

export function row(labelText: string, valueText: string, indent = 2): void {
  const padding = ' '.repeat(indent);
  console.log(`${padding}${label(labelText)} ${valueText}`);
}
