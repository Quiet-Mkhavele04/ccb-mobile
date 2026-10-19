import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'ccb_auth_token';
const USER_KEY = 'ccb_user';

export async function saveAuthToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getAuthToken() {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function removeAuthToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function saveUser(user: any) {
  await SecureStore.setItemAsync(
    USER_KEY,
    JSON.stringify(user)
  );
}

export async function getUser() {
  const user = await SecureStore.getItemAsync(USER_KEY);

  if (!user) {
    return null;
  }

  return JSON.parse(user);
}

export async function removeUser() {
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function clearAuth() {
  await removeAuthToken();
  await removeUser();
}