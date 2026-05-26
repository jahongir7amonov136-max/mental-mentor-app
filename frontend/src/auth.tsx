import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, TOKEN_KEY } from "./api";

export type User = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  role: "user" | "admin" | "super_admin";
  language?: string;
  kyc_status?: "none" | "pending" | "approved" | "rejected";
  kyc_note?: string;
  offer_accepted_at?: string | null;
  offer_version?: string | null;
  created_at?: string;
  blocked?: boolean;
  blocked_at?: string | null;
  blocked_note?: string;
};

export const isStaff = (u?: User | null) =>
  u?.role === "admin" || u?.role === "super_admin";

export const isSuperAdmin = (u?: User | null) => u?.role === "super_admin";

export const needsOffer = (u?: User | null) =>
  !!u && u.role === "user" && !u.offer_accepted_at;

/** Backend bilan bir xil telefon formati */
export function normalizePhone(phone: string): string {
  let p = (phone || "").trim().replace(/\s/g, "").replace(/-/g, "");
  if (p && !p.startsWith("+")) {
    if (p.startsWith("998")) p = "+" + p;
    else if (p.length === 9 && p[0] === "9") p = "+998" + p;
  }
  return p;
}

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<User>;
  register: (data: {
    first_name: string;
    last_name: string;
    phone: string;
    password: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateUser: (user: User) => void;
};

const Ctx = createContext<AuthCtx>({} as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        setUser(null);
        return;
      }
      const { data } = await api.get<User>("/auth/me");
      setUser(data);
    } catch {
      await AsyncStorage.removeItem(TOKEN_KEY);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const login = useCallback(async (phone: string, password: string) => {
    const { data } = await api.post("/auth/login", {
      phone: normalizePhone(phone),
      password,
    });
    await AsyncStorage.setItem(TOKEN_KEY, data.access_token);
    setUser(data.user);
    return data.user as User;
  }, []);

  const register = useCallback(
    async (d: {
      first_name: string;
      last_name: string;
      phone: string;
      password: string;
    }) => {
      const { data } = await api.post("/auth/register", {
        ...d,
        phone: normalizePhone(d.phone),
      });
      await AsyncStorage.setItem(TOKEN_KEY, data.access_token);
      setUser(data.user);
      return data.user as User;
    },
    []
  );

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const updateUser = useCallback((u: User) => {
    setUser(u);
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, refresh, updateUser }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
