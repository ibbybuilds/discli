import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const CONFIG_DIR = join(homedir(), '.discli');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
const ENV_FILE = join(CONFIG_DIR, '.env');

interface DctlConfig {
  default_server_id?: string;
  default_server_name?: string;
}

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadConfig(): DctlConfig {
  if (!existsSync(CONFIG_FILE)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

export function saveConfig(data: DctlConfig): void {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2) + '\n');
}

export function loadToken(): string | null {
  if (!existsSync(ENV_FILE)) return null;
  const content = readFileSync(ENV_FILE, 'utf-8');
  const match = content.match(/^BOT_TOKEN=(.+)$/m);
  return match ? match[1].trim() : null;
}

export function saveToken(token: string): void {
  ensureConfigDir();
  writeFileSync(ENV_FILE, `BOT_TOKEN=${token}\n`);
}

export function getDefaultServer(): string | null {
  return loadConfig().default_server_id ?? null;
}

export function getDefaultServerName(): string | null {
  return loadConfig().default_server_name ?? null;
}

export function setDefaultServer(id: string, name: string): void {
  const cfg = loadConfig();
  cfg.default_server_id = id;
  cfg.default_server_name = name;
  saveConfig(cfg);
}

export function requireToken(): string {
  const token = loadToken();
  if (!token) {
    console.error('Error: Not configured. Run "discli init" first.');
    process.exit(1);
  }
  return token;
}

export function requireServer(override?: string): string {
  const server = override || getDefaultServer();
  if (!server) {
    console.error('Error: No server selected. Run "discli server select" or use --server <id>.');
    process.exit(1);
  }
  return server;
}
