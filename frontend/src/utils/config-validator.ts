import type { AppConfig } from '../types/auth';

export function isValidConfig(config: unknown): config is AppConfig {
  if (!config || typeof config !== 'object') {
    return false;
  }

  const c = config as Record<string, unknown>;

  return (
    typeof c.region === 'string' &&
    typeof c.userPoolId === 'string' &&
    typeof c.userPoolClientId === 'string' &&
    typeof c.cognitoDomain === 'string' &&
    typeof c.identityPoolId === 'string' &&
    typeof c.siteRegion === 'string'
  );
}

export async function loadConfig(): Promise<AppConfig> {
  try {
    const response = await fetch('/config.json');
    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.statusText}`);
    }

    const config = await response.json();

    if (!isValidConfig(config)) {
      throw new Error('Invalid config structure');
    }

    return config;
  } catch (error) {
    console.error('Failed to load config:', error);
    throw error;
  }
}
