import * as SecureStore from
  'expo-secure-store';

const ACCESS_TOKEN_KEY =
  'ccb_access_token';

export async function saveAccessToken(
  token: string
) {
  await SecureStore.setItemAsync(
    ACCESS_TOKEN_KEY,
    token
  );
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(
    ACCESS_TOKEN_KEY
  );
}

export async function removeAccessToken() {
  await SecureStore.deleteItemAsync(
    ACCESS_TOKEN_KEY
  );
}