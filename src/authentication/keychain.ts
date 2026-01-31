import keytar from 'keytar';

const SERVICE_NAME = 'public-com-cli';
const ACCOUNT_NAME = 'api-key';

export async function storeApiKey(apiKey: string): Promise<void> {
  await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, apiKey);
}

export async function getApiKey(): Promise<string | null> {
  return keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
}

export async function deleteApiKey(): Promise<boolean> {
  return keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
}

export async function hasApiKey(): Promise<boolean> {
  const key = await getApiKey();
  return key !== null;
}
