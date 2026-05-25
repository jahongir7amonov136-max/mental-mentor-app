import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Modal,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Plus, Edit, Trash2, Newspaper, Camera } from "lucide-react-native";
import { api, formatApiError } from "../../src/api";
import { useAuth, isStaff } from "../../src/auth";
import { useI18n } from "../../src/i18n";
import { COLORS, RADIUS } from "../../src/theme";
import { pickImage } from "../../src/files";

type News = {
  id?: string;
  title: string;
  body: string;
  image: string;
  active: boolean;
  order: number;
};

const EMPTY: News = { title: "", body: "", image: "", active: true, order: 0 };

export default function AdminNews() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();
  const [list, setList] = useState<any[]>([]);
  const [editing, setEditing] = useState<News | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user && !isStaff(user)) router.replace("/(tabs)");
  }, [user, router]);

  const load = useCallback(async () => {
    const { data } = await api.get("/admin/news");
    setList(data);
  }, []);
  useEffect(() => { load(); }, [load]);

  const pickPhoto = async () => {
    const f = await pickImage("news");
    if (f && editing) setEditing({ ...editing, image: f.content });
  };

  const save = async () => {
    if (!editing?.title?.trim() || !editing?.body?.trim()) {
      return Alert.alert(t("error"), t("requiredFieldsMissing"));
    }
    setBusy(true);
    try {
      const payload = { ...editing, title: editing.title.trim(), body: editing.body.trim() };
      if (editing.id) await api.patch(`/admin/news/${editing.id}`, payload);
      else await api.post("/admin/news", payload);
      setEditing(null);
      await load();
      Alert.alert(t("success"), t("newsSaved"));
    } catch (e: any) {
      Alert.alert(t("error"), formatApiError(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = (id: string) => {
    Alert.alert(t("delete") + "?", "", [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/admin/news/${id}`);
            await load();
          } catch (e: any) {
            Alert.alert(t("error"), formatApiError(e));
          }
        },
      },
    ]);
  };

  const previewUri = editing?.image
    ? editing.image.startsWith("data:")
      ? editing.image
      : `data:image/jpeg;base64,${editing.image}`
    : null;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("newsMgmt")}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setEditing({ ...EMPTY })}>
          <Plus color={COLORS.onPrimary} size={18} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {list.length === 0 && <Text style={styles.empty}>{t("none")}</Text>}
        {list.map((n) => (
          <View key={n.id} style={styles.card}>
            {n.has_image && n.image ? (
              <Image
                source={{ uri: n.image.startsWith("data:") ? n.image : `data:image/jpeg;base64,${n.image}` }}
                style={styles.thumb}
              />
            ) : (
              <View style={styles.thumbFb}><Newspaper color={COLORS.primary} size={20} /></View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{n.title}</Text>
              <Text style={styles.cardBody} numberOfLines={2}>{n.body}</Text>
              <Text style={styles.meta}>{n.active ? t("active") : t("inactive")}</Text>
            </View>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setEditing(n)}><Edit color={COLORS.primary} size={16} /></TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => remove(n.id)}><Trash2 color={COLORS.danger} size={16} /></TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal visible={!!editing} animationType="slide" transparent onRequestClose={() => setEditing(null)}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.sheet}>
            <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
              <Text style={styles.sheetTitle}>{editing?.id ? t("editNews") : t("addNews")}</Text>

              <Text style={styles.lbl}>{t("newsTitle")}</Text>
              <TextInput
                value={editing?.title || ""}
                onChangeText={(v) => setEditing({ ...(editing as News), title: v })}
                style={styles.input}
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.lbl}>{t("newsBody")}</Text>
              <TextInput
                value={editing?.body || ""}
                onChangeText={(v) => setEditing({ ...(editing as News), body: v })}
                style={[styles.input, { minHeight: 100 }]}
                multiline
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.lbl}>{t("photo")}</Text>
              {previewUri ? <Image source={{ uri: previewUri }} style={styles.preview} resizeMode="cover" /> : null}
              <TouchableOpacity style={styles.pickBtn} onPress={pickPhoto}>
                <Camera color={COLORS.primary} size={18} />
                <Text style={styles.pickText}>{t("pickPhoto")}</Text>
              </TouchableOpacity>

              <View style={styles.activeRow}>
                <Text style={styles.lbl}>{t("active")}</Text>
                <Switch value={editing?.active ?? true} onValueChange={(v) => setEditing({ ...(editing as News), active: v })} />
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
                <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => setEditing(null)}>
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
  empty: { color: COLORS.textMuted, textAlign: "center", paddingVertical: 40 },
  card: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, padding: 10, marginBottom: 10,
  },
  thumb: { width: 56, height: 56, borderRadius: 8 },
  thumbFb: { width: 56, height: 56, borderRadius: 8, backgroundColor: COLORS.subtle, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontWeight: "800", fontSize: 14, color: COLORS.text },
  cardBody: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  meta: { fontSize: 10, color: COLORS.primary, fontWeight: "700", marginTop: 4 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.subtle, alignItems: "center", justifyContent: "center" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: COLORS.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "92%" },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text, marginBottom: 8 },
  lbl: { fontSize: 12, fontWeight: "700", color: COLORS.textSecondary, marginBottom: 6, marginTop: 12, textTransform: "uppercase" },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 12, fontSize: 14, backgroundColor: COLORS.surface, color: COLORS.text },
  preview: { width: "100%", height: 140, borderRadius: RADIUS.md, marginBottom: 8 },
  pickBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.full },
  pickText: { color: COLORS.primary, fontWeight: "700" },
  activeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.full, alignItems: "center" },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
  btnGhost: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  btnGhostText: { color: COLORS.text, fontWeight: "700" },
});
