import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

/** APK/EAS buildda .env yuklanmasa app.json extra dan olinadi */
const BASE =
  process.env.EXPO_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
  (Constants.expoConfig?.extra as { EXPO_PUBLIC_BACKEND_URL?: string } | undefined)
    ?.EXPO_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
  "";

export const TOKEN_KEY = "swsp_token";

export const api = axios.create({
  baseURL: BASE ? `${BASE}/api` : "/api",
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers = config.headers || {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

export function formatApiError(err: { response?: { data?: { detail?: unknown } }; message?: string }): string {
  if (!BASE) {
    return "Server manzili sozlanmagan. APK ni qayta build qiling (EXPO_PUBLIC_BACKEND_URL).";
  }
  const detail = err?.response?.data?.detail;
  if (!detail) {
    const msg = err?.message || "";
    if (/network error/i.test(msg) || /timeout/i.test(msg)) {
      return "Serverga ulanib bo‘lmadi. Internetni tekshiring yoki biroz kutib qayta urinib ko‘ring.";
    }
    return msg || "Network error";
  }
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e: { msg?: string }) => (e?.msg ? e.msg : JSON.stringify(e))).join(" ");
  return JSON.stringify(detail);
}
