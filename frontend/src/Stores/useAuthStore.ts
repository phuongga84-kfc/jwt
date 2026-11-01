import { create } from "zustand";
import { toast } from "sonner";
import axios from "axios";
import { authService } from "@/services/authService";
import type { AuthState } from "@/types/store";

let sessionRestorePromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  loading: false,
  sessionReady: false,

  clearState: () => {
    set({ accessToken: null, user: null, loading: false });
  },

  fetchCurrentUser: async () => {
    try {
      const user = await authService.getCurrentUser();
      set({ user });
    } catch (error) {
      console.error("Lỗi khi tải thông tin người dùng:", error);
      toast.error("Không thể tải thông tin người dùng");
    }
  },

  restoreSession: () => {
    if (sessionRestorePromise) {
      return sessionRestorePromise;
    }

    sessionRestorePromise = (async () => {
      try {
        const { accessToken, user } = await authService.refreshSession();
        set({ accessToken, user });
      } catch (error) {
        get().clearState();
        if (!axios.isAxiosError(error) || error.response?.status !== 401) {
          console.error("Lỗi khi khôi phục phiên đăng nhập:", error);
          toast.error("Không thể khôi phục phiên đăng nhập");
        }
      } finally {
        set({ sessionReady: true });
        sessionRestorePromise = null;
      }
    })();

    return sessionRestorePromise;
  },

  signUp: async (username, password, account, displayName) => {
    try {
      set({ loading: true });
      await authService.signUp(username, password, account, displayName);

      toast.success("Đăng ký thành công!");
    } catch (error) {
      toast.error("Đăng ký thất bại");
    } finally {
      set({ loading: false });
    }
  },
  Login: async (account, password) => {
    try {
      set({ loading: true });
      const { accessToken, user } = await authService.Login(account, password);
      set({ accessToken, user, sessionReady: true });

      toast.success("Đăng nhập thành công!");
      return true;
    } catch (error) {
      console.error(error);
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.message ?? "Đăng nhập không thành công"
          : "Đăng nhập không thành công",
      );
      return false;
    } finally {
      set({ loading: false });
    }
  },
  Logout: async () => {
    try {
      await authService.Logout();
      toast.success("Đăng xuất thành công");
    } catch (error) {
      toast.error("Không thể thu hồi phiên trên máy chủ; đã đăng xuất trên thiết bị này");
      console.error("Lỗi khi đăng xuất:", error);
    } finally {
      get().clearState();
    }
  }
}));
