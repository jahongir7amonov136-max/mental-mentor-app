import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image,
  Modal, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Plus, Edit, Trash2, CreditCard, QrCode, Camera } from "lucide-react-native";
import { api, formatApiError } from "../../src/api";
import { useAuth, isSuperAdmin } from "../../src/auth";
import { useI18n } from "../../src/i18n";
import { COLORS, RADIUS } from "../../src/theme";
import { pickImage } from "../../src/files";

type Method = { id?: string; name: string; kind: "qr" | "link"; value: string; description: string; order: number; active: boolean };
const EMPTY: Method = { name: "", kind: "link", value: "", description: "", order: 0, active: true };

export default function AdminPayments() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (user && !isSuperAdmin(user)) router.replace("/(tabs)/admin");
  }, [user, router]);
  const [list, setList] = useState<any[]>([]);
  const [editing, setEditing] = useState<Method | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get("/admin/payments");
    setList(data);
  }, []);
  useEffect(() => { load(); }, [load]);

  const pickQr = async () => {
    try {
      const f = await pickImage("qr");
      if (f && editing) setEditing({ ...editing, value: f.content });
    } catch (e: any) { Alert.alert(t("error"), e?.message); }
  };

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      const payload = { ...editing };
      if (editing.id) await api.patch(`/admin/payments/${editing.id}`, payload);
      else await api.post("/admin/payments", payload);
      setEditing(null);
      await load();
    } catch (e: any) { Alert.alert(t("error"), formatApiError(e)); }
    finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    Alert.alert(t("delete") + "?", "", [
      { text: t("cancel"), style: "cancel" },
      { text: t("delete"), style: "destructive", onPress: async () => {
        try { await api.delete(`/admin/payments/${id}`); await load(); }
        catch (e: any) { Alert.alert(t("error"), formatApiError(e)); }
      }},
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity testID="pm-back" onPress={() => router.back()} style={styles.back}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("paymentMethods")}</Text>
        <TouchableOpacity testID="pm-add" style={styles.addBtn} onPress={() => setEditing({ ...EMPTY })}>
          <Plus color={COLORS.onPrimary} size={18} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {list.map((m) => (
          <View key={m.id} style={styles.card}>
            <View style={styles.iconBox}>
              {m.kind === "qr" ? <QrCode color={COLORS.primary} size={20} /> : <CreditCard color={COLORS.primary} size={20} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cName}>{m.name}</Text>
              <Text style={styles.cMeta} numberOfLines={1}>{m.kind === "qr" ? "QR kod" : m.value}</Text>
              {!m.active && <Text style={styles.inactiveTag}>INACTIVE</Text>}
            </View>
            <TouchableOpacity testID={`pm-edit-${m.id}`} style={styles.iconBtn} onPress={() => setEditing(m)}>
              <Edit color={COLORS.primary} size={16} />
            </TouchableOpacity>
            <TouchableOpacity testID={`pm-del-${m.id}`} style={styles.iconBtn} onPress={() => remove(m.id)}>
              <Trash2 color={COLORS.danger} size={16} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal visible={!!editing} animationType="slide" transparent onRequestClose={() => setEditing(null)}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.sheet}>
            <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
              <Text style={styles.sheetTitle}>{editing?.id ? "Edit" : "Add"} {t("paymentMethods")}</Text>

              <Text style={styles.lbl}>{t("name")}</Text>
              <TextInput testID="pm-name" value={editing?.name || ""} onChangeText={(v) => setEditing({ ...(editing as Method), name: v })} style={styles.input} placeholderTextColor={COLORS.textMuted} />

              <Text style={styles.lbl}>{t("kind")}</Text>
              <View style={styles.kindRow}>
                {(["link", "qr"] as const).map((k) => (
                  <TouchableOpacity key={k} testID={`pm-kind-${k}`} style={[styles.kindBtn, editing?.kind === k && styles.kindBtnActive]} onPress={() => setEditing({ ...(editing as Method), kind: k })}>
                    <Text style={[styles.kindText, editing?.kind === k && { color: COLORS.onPrimary }]}>{k === "link" ? "Link/URL" : "QR Image"}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {editing?.kind === "qr" ? (
                <TouchableOpacity testID="pm-qr-pick" style={styles.qrPicker} onPress={pickQr} activeOpacity={0.85}>
                  {editing?.value ? (
                    <Image source={{ uri: `data:image/png;base64,${editing.value}` }} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
                  ) : (
                    <View style={{ alignItems: "center" }}>
                      <Camera color={COLORS.primary} size={26} />
                      <Text style={styles.qrPickerText}>{t("pickPhoto")}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ) : (
                <>
                  <Text style={styles.lbl}>URL</Text>
                  <TextInput testID="pm-url" value={editing?.value || ""} onChangeText={(v) => setEditing({ ...(editing as Method), value: v })} style={styles.input} placeholder="https://..." autoCapitalize="none" placeholderTextColor={COLORS.textMuted} />
                </>
              )}

              <Text style={styles.lbl}>{t("description")}</Text>
              <TextInput testID="pm-desc" value={editing?.description || ""} onChangeText={(v) => setEditing({ ...(editing as Method), description: v })} style={[styles.input, { minHeight: 60 }]} multiline placeholderTextColor={COLORS.textMuted} />

              <View style={styles.activeRow}>
                <Text style={styles.lbl}>{t("active")}</Text>
                <Switch value={editing?.active ?? true} onValueChange={(v) => setEditing({ ...(editing as Method), active: v })} />
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
                <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => setEditing(null)} activeOpacity={0.85}>
                  <Text style={styles.btnGhostText}>{t("cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity testID="pm-save" style={[styles.btn, styles.btnPrimary]} onPress={save} disabled={busy} activeOpacity={0.85}>
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
  card: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: 12, marginBottom: 10 },
  iconBox: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.subtle, alignItems: "center", justifyContent: "center" },
  cName: { color: COLORS.text, fontWeight: "800", fontSize: 14 },
  cMeta: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  inactiveTag: { color: COLORS.danger, fontSize: 10, fontWeight: "800", marginTop: 4 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.subtle, alignItems: "center", justifyContent: "center" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: COLORS.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "92%" },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text, marginBottom: 8 },
  lbl: { fontSize: 12, fontWeight: "700", color: COLORS.textSecondary, marginBottom: 6, marginTop: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 12, fontSize: 14, backgroundColor: COLORS.surface, color: COLORS.text, textAlignVertical: "top" },
  kindRow: { flexDirection: "row", gap: 8 },
  kindBtn: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, alignItems: "center", borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  kindBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  kindText: { color: COLORS.text, fontWeight: "700", fontSize: 13 },
  qrPicker: { height: 200, borderRadius: RADIUS.md, borderWidth: 2, borderStyle: "dashed", borderColor: COLORS.border, backgroundColor: COLORS.surface, alignItems: "center", justifyContent: "center", overflow: "hidden", marginTop: 4 },
  qrPickerText: { color: COLORS.primary, fontWeight: "700", fontSize: 12, marginTop: 6 },
  activeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.full, alignItems: "center" },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
  btnGhost: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  btnGhostText: { color: COLORS.text, fontWeight: "700" },
});
