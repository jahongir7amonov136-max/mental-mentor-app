import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Plus, Trash2, Shield, UserPlus } from "lucide-react-native";
import { api, formatApiError } from "../../src/api";
import { useAuth, isSuperAdmin } from "../../src/auth";
import { useI18n } from "../../src/i18n";
import { COLORS, RADIUS } from "../../src/theme";

type NewAdmin = { first_name: string; last_name: string; phone: string; password: string };
const EMPTY: NewAdmin = { first_name: "", last_name: "", phone: "", password: "" };

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
}

export default function AdminStaff() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();
  const [list, setList] = useState<StaffMember[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<NewAdmin>({ ...EMPTY });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user && !isSuperAdmin(user)) router.replace("/(tabs)/admin");
  }, [user, router]);

  const load = useCallback(async () => {
    const { data } = await api.get("/admin/staff");
    setList(data);
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.first_name || !form.last_name || !form.phone || !form.password) {
      return Alert.alert(t("error"), t("requiredFieldsMissing"));
    }
    if (form.password.length < 6) {
      return Alert.alert(t("error"), t("passwordMin"));
    }
    setBusy(true);
    try {
      await api.post("/admin/staff", {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      setAdding(false);
      setForm({ ...EMPTY });
      await load();
      Alert.alert(t("success"), t("adminCreated"));
    } catch (e: any) {
      Alert.alert(t("error"), formatApiError(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = (u: StaffMember) => {
    if (u.role === "super_admin") return;
    Alert.alert(t("delete") + "?", u.phone, [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/admin/staff/${u.id}`);
            await load();
          } catch (e: any) {
            Alert.alert(t("error"), formatApiError(e));
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("adminMgmt")}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAdding(true)}>
          <Plus color={COLORS.onPrimary} size={18} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={styles.hint}>{t("adminMgmtHint")}</Text>
        {list.map((u) => (
          <View key={u.id} style={styles.card}>
            <View style={styles.avatar}>
              {u.role === "super_admin" ? (
                <Shield color={COLORS.primary} size={20} />
              ) : (
                <UserPlus color={COLORS.primary} size={20} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{u.first_name} {u.last_name}</Text>
              <Text style={styles.phone}>{u.phone}</Text>
              <Text style={styles.role}>{u.role === "super_admin" ? "SUPER ADMIN" : "ADMIN"}</Text>
            </View>
            {u.role !== "super_admin" && u.id !== user?.id && (
              <TouchableOpacity style={styles.delBtn} onPress={() => remove(u)}>
                <Trash2 color={COLORS.danger} size={16} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      <Modal visible={adding} animationType="slide" transparent onRequestClose={() => setAdding(false)}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.sheet}>
            <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
              <Text style={styles.sheetTitle}>{t("addAdmin")}</Text>

              <Text style={styles.lbl}>{t("firstName")}</Text>
              <TextInput value={form.first_name} onChangeText={(v) => setForm({ ...form, first_name: v })} style={styles.input} />

              <Text style={styles.lbl}>{t("lastName")}</Text>
              <TextInput value={form.last_name} onChangeText={(v) => setForm({ ...form, last_name: v })} style={styles.input} />

              <Text style={styles.lbl}>{t("phone")}</Text>
              <TextInput
                value={form.phone}
                onChangeText={(v) => setForm({ ...form, phone: v })}
                style={styles.input}
                keyboardType="phone-pad"
                placeholder="+998901112244"
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.lbl}>{t("password")}</Text>
              <TextInput
                value={form.password}
                onChangeText={(v) => setForm({ ...form, password: v })}
                style={styles.input}
                secureTextEntry
                placeholder="Admin@456"
                placeholderTextColor={COLORS.textMuted}
              />

              <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
                <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => setAdding(false)}>
                  <Text style={styles.btnGhostText}>{t("cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={save} disabled={busy}>
                  {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>{t("save")}</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "700", color: COLORS.text },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  hint: { color: COLORS.textMuted, fontSize: 13, marginBottom: 14, lineHeight: 20 },
  card: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.subtle, alignItems: "center", justifyContent: "center" },
  name: { fontWeight: "800", fontSize: 15, color: COLORS.text },
  phone: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  role: { fontSize: 10, fontWeight: "700", color: COLORS.primary, marginTop: 4, letterSpacing: 0.5 },
  delBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.subtle, alignItems: "center", justifyContent: "center" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: COLORS.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "90%" },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text, marginBottom: 8 },
  lbl: { fontSize: 12, fontWeight: "700", color: COLORS.textSecondary, marginBottom: 6, marginTop: 12, textTransform: "uppercase" },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 12, fontSize: 14, backgroundColor: COLORS.surface, color: COLORS.text },
  btn: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.full, alignItems: "center" },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
  btnGhost: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  btnGhostText: { color: COLORS.text, fontWeight: "700" },
});
