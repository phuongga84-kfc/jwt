import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import type { User } from "@/types/user";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ??
    (import.meta.env.MODE === "development"
      ? "http://localhost:5000/api"
      : "http://3.27.23.178:5000/api"),
  withCredentials: true,
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };
let refreshPromise: Promise<string> | null = null;

api.interceptors.request.use(async (config) => {
  const { useAuthStore } = await import("@/Stores/useAuthStore");
  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;
    const requestUrl = originalRequest?.url ?? "";
    const isAuthRequest = /(^|\/)auth\/(login|signup|refresh|logout)(\/|$)/.test(
      requestUrl,
    );

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthRequest
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = api
        .post<{ accessToken: string; user: User }>("auth/refresh", {})
        .then(async ({ data }) => {
          const { useAuthStore } = await import("@/Stores/useAuthStore");
          useAuthStore.setState({
            accessToken: data.accessToken,
            user: data.user,
            sessionReady: true,
          });
          return data.accessToken;
        })
        .catch(async (refreshError: unknown) => {
          const { useAuthStore } = await import("@/Stores/useAuthStore");
          useAuthStore.getState().clearState();
          throw refreshError;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    try {
      const accessToken = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return await api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

export default api;