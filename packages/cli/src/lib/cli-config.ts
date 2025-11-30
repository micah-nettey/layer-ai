import os from 'os';
import path from 'path';
import fs from 'fs/promises';

const CONFIG_DIR = path.join(os.homedir(), '.layer');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export interface CLIConfig {
  activeProfile: string; 
  profiles: Record<string, ProfileConfig>;
}

export interface ProfileConfig {
  apiKey: string;
  baseUrl: string;
}

export async function loadCLIConfig(): Promise<CLIConfig> {
  try {
    const content = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {
      activeProfile: 'default',
      profiles: {}
    };
  }
}

export async function saveCLIConfig(config: CLIConfig): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true }); // create if it doesn't exist
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export async function getActiveProfile(): Promise<ProfileConfig> {
  const config = await loadCLIConfig(); 
  const profile = config.profiles[config.activeProfile];

  if (!profile) {
    throw new Error('No active profile found. Run layer login');
  }

  return profile;
}