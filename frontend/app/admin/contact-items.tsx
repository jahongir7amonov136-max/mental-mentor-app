import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Plus, Edit, Trash2, Globe } from "lucide-react-native";
import { api, formatApiError } from "../../src/api";
import { useAuth, isSuperAdmin } from "../../src/auth";
import { useI18n } from "../../src/i18n";
import { COLORS, RADIUS } from "../../src/theme";

type Item = { id?: string; label: string; icon: string; value: string; href: string; order: number; active: boolean };
const EMPTY: Item = { label: "", icon: "globe", value: "", href: "", order: 0, active: true };

export default function AdminContactItems() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (user && !isSuperAdmin(user)) router.replace("/(tabs)/admin");
  }, [user, router]);
  const [list, setList] = useState<any[]>([]);
  const [editing, setEditing] = useState<Item | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get("/admin/contact-items");
    setList(data);
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      if (editing.id) await api.patch(`/admin/contact-items/${editing.id}`, editing);
      else await api.post("/admin/contact-items", editing);
      setEditing(null);
      await load();
    } catch (e: any) { Alert.alert(t("error"), formatApiError(e)); }
    finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    Alert.alert(t("delete") + "?", "", [
      { text: t("cancel"), style: "cancel" },
      { text: t("delete"), style: "destructive", onPress: async () => {
        try { await api.delete(`/admin/contact-items/${id}`); await load(); }
        catch (e: any) { Alert.alert(t("error"), formatApiError(e)); }
      }},
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity testID="ci-back" onPress={() => router.back()} style={styles.back}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("customContacts")}</Text>
        <TouchableOpacity testID="ci-add" style={styles.addBtn} onPress={() => setEditing({ ...EMPTY })}>
          <Plus color={COLORS.onPrimary} size={18} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {list.length === 0 && <Text style={styles.empty}>{t("none")}</Text>}
        {list.map((it) => (
          <View key={it.id} style={styles.card}>
            <View style={styles.iconBox}><Globe color={COLORS.primary} size={20} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{it.label}</Text>
              <Text style={styles.value} numberOfLines={1}>{it.value}</Text>
            </View>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setEditing(it)}><Edit color={COLORS.primary} size={16} /></TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => remove(it.id)}><Trash2 color={COLORS.danger} size={16} /></TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal visible={!!editing} animationType="slide" transparent onRequestClose={() => setEditing(null)}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.sheet}>
            <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
              <Text style={styles.sheetTitle}>{editing?.id ? "Edit" : "Add"} {t("customContacts")}</Text>

              {([
                ["label", "Label (Instagram, WhatsApp, ...)"],
                ["value", "Value (display)"],
                ["href", "Link/URL (https://t.me/... or tel:+99890...)"],
              ] as const).map(([k, lab]) => (
                <View key={k}>
                  <Text style={styles.lbl}>{lab}</Text>
                  <TextInput testID={`ci-${k}`} value={(editing as any)?.[k] || ""} onChangeText={(v) => setEditing({ ...(editing as any), [k]: v })} style={styles.input} autoCapitalize="none" placeholderTextColor={COLORS.textMuted} />
                </View>
              ))}

              <View style={styles.activeRow}>
                <Text style={styles.lbl}>{t("active")}</Text>
                <Switch value={editing?.active ?? true} onValueChange={(v) => setEditing({ ...(editing as Item), active: v })} />
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
                <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => setEditing(null)}><Text style={styles.btnGhostText}>{t("cancel")}</Text></TouchableOpacity>
                <TouchableOpacity testID="ci-save" style={[styles.btn, styles.btnPrimary]} onPress={save} disabled={busy}>
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
  empty: { color: COLORS.textMuted, textAlign: "center", paddingVertical: 40 },
  card: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: 12, marginBottom: 10 },
  iconBox: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.subtle, alignItems: "center", justifyContent: "center" },
  label: { color: COLORS.text, fontWeight: "800", fontSize: 14 },
  value: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.subtle, alignItems: "center", justifyContent: "center" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: COLORS.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "92%" },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text, marginBottom: 8 },
  lbl: { fontSize: 12, fontWeight: "700", color: COLORS.textSecondary, marginBottom: 6, marginTop: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 12, fontSize: 14, backgroundColor: COLORS.surface, color: COLORS.text },
  activeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.full, alignItems: "center" },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
  btnGhost: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  btnGhostText: { color: COLORS.text, fontWeight: "700" },
});
