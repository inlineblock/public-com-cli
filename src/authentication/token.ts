import keytar from 'keytar';

const SERVICE_NAME = 'public-com-cli';
const ACCESS_TOKEN_ACCOUNT = 'access-token';
const EXPIRES_AT_ACCOUNT = 'expires-at';

export interface TokenData {
  accessToken: string;
  expiresAt: number;
}

export async function storeToken(
  accessToken: string,
  validityInMinutes: number
): Promise<void> {
  const expiresAt = Date.now() + validityInMinutes * 60 * 1000;

  await Promise.all([
    keytar.setPassword(SERVICE_NAME, ACCESS_TOKEN_ACCOUNT, accessToken),
    keytar.setPassword(SERVICE_NAME, EXPIRES_AT_ACCOUNT, expiresAt.toString()),
  ]);
}

export async function getToken(): Promise<TokenData | null> {
  const [accessToken, expiresAtStr] = await Promise.all([
    keytar.getPassword(SERVICE_NAME, ACCESS_TOKEN_ACCOUNT),
    keytar.getPassword(SERVICE_NAME, EXPIRES_AT_ACCOUNT),
  ]);

  if (!accessToken || !expiresAtStr) {
    return null;
  }

  return {
    accessToken,
    expiresAt: parseInt(expiresAtStr, 10),
  };
}

export async function deleteToken(): Promise<void> {
  await Promise.all([
    keytar.deletePassword(SERVICE_NAME, ACCESS_TOKEN_ACCOUNT),
    keytar.deletePassword(SERVICE_NAME, EXPIRES_AT_ACCOUNT),
  ]);
}

export function isTokenExpired(expiresAt: number): boolean {
  const bufferMs = 60 * 1000;
  return Date.now() >= expiresAt - bufferMs;
}
