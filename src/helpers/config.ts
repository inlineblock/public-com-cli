import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CONFIG_DIR = join(homedir(), '.public-cli');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

const DEFAULT_ENDPOINT = 'https://api.public.com/';

interface Config {
  endpoint?: string;
}

async function ensureConfigDir(): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
}

async function readConfig(): Promise<Config> {
  try {
    const content = await readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(content) as Config;
  } catch {
    return {};
  }
}

async function writeConfig(config: Config): Promise<void> {
  await ensureConfigDir();
  await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

export async function getEndpoint(): Promise<string> {
  const config = await readConfig();
  return config.endpoint ?? DEFAULT_ENDPOINT;
}

export async function setEndpoint(endpoint: string): Promise<void> {
  const config = await readConfig();
  config.endpoint = endpoint;
  await writeConfig(config);
}

export async function resetEndpoint(): Promise<void> {
  const config = await readConfig();
  delete config.endpoint;
  await writeConfig(config);
}

export function getDefaultEndpoint(): string {
  return DEFAULT_ENDPOINT;
}
