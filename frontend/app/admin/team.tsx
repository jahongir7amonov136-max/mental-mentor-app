import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Modal,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Plus, Edit, Trash2, User, Camera } from "lucide-react-native";
import { api, formatApiError } from "../../src/api";
import { useAuth, isSuperAdmin } from "../../src/auth";
import { useI18n } from "../../src/i18n";
import { COLORS, RADIUS } from "../../src/theme";
import { pickImage } from "../../src/files";

type Member = { id?: string; name: string; role: string; email: string; phone: string; photo: string; order: number; bio: string };
const EMPTY: Member = { name: "", role: "", email: "", phone: "", photo: "", order: 0, bio: "" };

export default function AdminTeam() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (user && !isSuperAdmin(user)) router.replace("/(tabs)/admin");
  }, [user, router]);
  const [list, setList] = useState<any[]>([]);
  const [editing, setEditing] = useState<Member | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get("/about");
    setList(data.team || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const pickPhoto = async () => {
    try {
      const f = await pickImage("photo");
      if (f && editing) setEditing({ ...editing, photo: f.content });
    } catch (e: any) { Alert.alert(t("error"), e?.message); }
  };

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      const payload = { ...editing };
      if (editing.id) {
        await api.patch(`/admin/team/${editing.id}`, payload);
      } else {
        await api.post("/admin/team", payload);
      }
      setEditing(null);
      await load();
    } catch (e: any) { Alert.alert(t("error"), formatApiError(e)); }
    finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    Alert.alert(t("delete") + "?", "", [
      { text: t("cancel"), style: "cancel" },
      { text: t("delete"), style: "destructive", onPress: async () => {
        try { await api.delete(`/admin/team/${id}`); await load(); }
        catch (e: any) { Alert.alert(t("error"), formatApiError(e)); }
      }},
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity testID="team-back" onPress={() => router.back()} style={styles.back}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("teamMgmt")}</Text>
        <TouchableOpacity testID="team-add" style={styles.addBtn} onPress={() => setEditing({ ...EMPTY })}>
          <Plus color={COLORS.onPrimary} size={18} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {list.map((m) => (
          <View key={m.id} style={styles.card} testID={`team-${m.id}`}>
            {m.photo ? (
              <Image source={{ uri: `data:image/jpeg;base64,${m.photo}` }} style={styles.avImg} />
            ) : (
              <View style={styles.avFallback}><User color={COLORS.primary} size={20} /></View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.mName}>{m.name}</Text>
              <Text style={styles.mRole}>{m.role}</Text>
              {!!m.phone && <Text style={styles.mMeta}>{m.phone}</Text>}
            </View>
            <TouchableOpacity testID={`edit-${m.id}`} style={styles.iconBtn} onPress={() => setEditing(m)}>
              <Edit color={COLORS.primary} size={16} />
            </TouchableOpacity>
            <TouchableOpacity testID={`del-${m.id}`} style={styles.iconBtn} onPress={() => remove(m.id)}>
              <Trash2 color={COLORS.danger} size={16} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal visible={!!editing} animationType="slide" transparent onRequestClose={() => setEditing(null)}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.sheet}>
            <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
              <Text style={styles.sheetTitle}>{editing?.id ? t("editMember") : t("addMember")}</Text>

              <TouchableOpacity testID="team-photo" style={styles.photoPicker} onPress={pickPhoto} activeOpacity={0.85}>
                {editing?.photo ? (
                  <Image source={{ uri: `data:image/jpeg;base64,${editing.photo}` }} style={styles.photoPickerImg} />
                ) : (
                  <View style={styles.photoPickerInner}><Camera color={COLORS.primary} size={24} /><Text style={styles.photoPickerText}>{t("pickPhoto")}</Text></View>
                )}
              </TouchableOpacity>

              {([
                ["name", t("name")], ["role", t("role")], ["email", t("email")], ["phone", t("phone")], ["bio", t("bio")],
              ] as const).map(([k, label]) => (
                <View key={k}>
                  <Text style={styles.lbl}>{label}</Text>
                  <TextInput
                    testID={`team-${k}`}
                    value={(editing as any)?.[k] || ""}
                    onChangeText={(v) => setEditing({ ...(editing as any), [k]: v })}
                    style={[styles.input, k === "bio" && { minHeight: 80, textAlignVertical: "top" }]}
                    multiline={k === "bio"}
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              ))}

              <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
                <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => setEditing(null)} activeOpacity={0.85}>
                  <Text style={styles.btnGhostText}>{t("cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity testID="team-save" style={[styles.btn, styles.btnPrimary]} onPress={save} disabled={busy} activeOpacity={0.85}>
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
  avImg: { width: 48, height: 48, borderRadius: 24 },
  avFallback: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.subtle, alignItems: "center", justifyContent: "center" },
  mName: { color: COLORS.text, fontWeight: "800", fontSize: 14 },
  mRole: { color: COLORS.primary, fontWeight: "700", fontSize: 12, marginTop: 2 },
  mMeta: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.subtle, alignItems: "center", justifyContent: "center" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: COLORS.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "90%" },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text, marginBottom: 16 },
  photoPicker: { alignSelf: "center", width: 110, height: 110, borderRadius: 55, borderWidth: 2, borderStyle: "dashed", borderColor: COLORS.border, overflow: "hidden", marginBottom: 16, backgroundColor: COLORS.surface },
  photoPickerImg: { width: "100%", height: "100%" },
  photoPickerInner: { flex: 1, alignItems: "center", justifyContent: "center" },
  photoPickerText: { color: COLORS.primary, fontSize: 11, marginTop: 4, fontWeight: "700" },
  lbl: { fontSize: 12, fontWeight: "700", color: COLORS.textSecondary, marginBottom: 6, marginTop: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 12, fontSize: 14, backgroundColor: COLORS.surface, color: COLORS.text },
  btn: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.full, alignItems: "center" },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
  btnGhost: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  btnGhostText: { color: COLORS.text, fontWeight: "700" },
});
