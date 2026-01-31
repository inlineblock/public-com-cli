export function isValidApiKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }

  const trimmed = apiKey.trim();

  if (trimmed.length === 0) {
    return false;
  }

  if (trimmed.length < 16) {
    return false;
  }

  return true;
}
