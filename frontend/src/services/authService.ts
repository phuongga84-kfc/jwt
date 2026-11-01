import api from "@/lib/axios.ts";
import type { User } from "@/types/user";

interface AuthResponse {
  accessToken: string;
  user: User;
}

export const authService = {
  signUp: async (
    username: string,
    password: string,
    account: string,
    displayName: string,
  ) => {
    const res = await api.post(
      "auth/signup",
      {
        username,
        password,
        account,
        displayName,
      },
      { withCredentials: true },
    )
    return res.data;
  },
  Login: async (account: string, password: string) => {
    const res = await api.post<AuthResponse>(
      "auth/login", {account, password}, {withCredentials: true},
    )
    return res.data
  },
  refreshSession: async () => {
    const res = await api.post<AuthResponse>(
      "auth/refresh",
      {},
      { withCredentials: true },
    );
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await api.get<{ user: User }>("users/me");
    return res.data.user;
  },
  Logout: async () => {
    return api.post("auth/logout", {}, {withCredentials: true})
  }
};
