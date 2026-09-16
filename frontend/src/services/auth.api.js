import { apiGet, apiPost } from './api.js';

const USER_KEY = 'nortexCurrentUser';

export const getUsers = async () => {
  const result = await apiGet('/auth/users');
  return result.users || [];
};

export const login = async (employeeCode) => {
  const result = await apiPost('/auth/login', { employeeCode });
  localStorage.setItem(USER_KEY, JSON.stringify(result.user));
  return result.user;
};

export const getCurrentUser = () => {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
  catch { return null; }
};

export const logout = () => localStorage.removeItem(USER_KEY);
export const requireUser = () => {
  const user = getCurrentUser();
  if (!user) throw new Error('Please login first.');
  return user;
};
