import { yellow, bold, dim } from './output.js';
import { VERSION, PACKAGE_NAME } from '../version.js';

// Only check in production (not when running via tsx/ts-node)
const isProduction =
  !process.argv[1]?.includes('tsx') &&
  !process.argv[1]?.includes('ts-node') &&
  !process.env.npm_lifecycle_script?.includes('tsx');

function compareVersions(current: string, latest: string): number {
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const curr = currentParts[i] || 0;
    const lat = latestParts[i] || 0;
    if (lat > curr) return 1;
    if (lat < curr) return -1;
  }
  return 0;
}

export async function checkForUpdates(): Promise<void> {
  if (!isProduction) return;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(
      `https://registry.npmjs.org/${PACKAGE_NAME}/latest`,
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    if (!response.ok) return;

    const data = (await response.json()) as { version: string };
    const latestVersion = data.version;

    if (compareVersions(VERSION, latestVersion) > 0) {
      console.error();
      console.error(
        yellow('⚠') +
          ` Update available: ${dim(VERSION)} → ${bold(latestVersion)}`
      );
      console.error(
        dim(`  Run ${bold(`npm install -g ${PACKAGE_NAME}`)} to update`)
      );
      console.error();
    }
  } catch {
    // Silently ignore update check failures
  }
}
