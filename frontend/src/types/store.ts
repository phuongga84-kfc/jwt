import type { User } from "./user";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;
  sessionReady: boolean;
  clearState: () => void;
  restoreSession: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  signUp: (
    username: string,
    password: string,
    account: string,
    displayName: string,
  ) => Promise<void>;
  Login: (account: string, password: string) => Promise<boolean>;
  Logout: () => Promise<void>;
}
