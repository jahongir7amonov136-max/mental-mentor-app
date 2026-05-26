import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Plus, Edit, Trash2, Layers } from "lucide-react-native";
import { api, formatApiError } from "../../src/api";
import { useAuth, isStaff } from "../../src/auth";
import { useI18n } from "../../src/i18n";
import { COLORS, RADIUS } from "../../src/theme";

type Category = "single_window" | "accounting";

type ServiceItem = {
  id?: string;
  category: Category;
  title_uz: string;
  title_ru: string;
  title_en: string;
  icon: string;
  order: number;
  active: boolean;
  service_id?: string;
};

const EMPTY = (category: Category): ServiceItem => ({
  category,
  title_uz: "",
  title_ru: "",
  title_en: "",
  icon: "circle",
  order: 0,
  active: true,
});

export default function AdminServices() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();
  const [list, setList] = useState<ServiceItem[]>([]);
  const [catFilter, setCatFilter] = useState<Category | "all">("all");
  const [editing, setEditing] = useState<ServiceItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !isStaff(user)) router.replace("/(tabs)");
  }, [user, router]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get<ServiceItem[]>("/admin/services");
      setList(data);
    } catch (e: any) {
      Alert.alert(t("error"), formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered =
    catFilter === "all" ? list : list.filter((s) => s.category === catFilter);

  const openNew = () => {
    const cat: Category = catFilter === "all" ? "single_window" : catFilter;
    setEditing(EMPTY(cat));
  };

  const payloadFrom = (item: ServiceItem) => ({
    category: item.category,
    title_uz: item.title_uz.trim(),
    title_ru: item.title_ru.trim(),
    title_en: item.title_en.trim(),
    icon: (item.icon || "circle").trim(),
    order: Number(item.order) || 0,
    active: item.active,
    ...(item.id ? {} : item.service_id?.trim() ? { service_id: item.service_id.trim() } : {}),
  });

  const save = async () => {
    if (!editing?.title_uz?.trim() || !editing?.title_ru?.trim() || !editing?.title_en?.trim()) {
      return Alert.alert(t("error"), t("requiredFieldsMissing"));
    }
    setBusy(true);
    try {
      const payload = payloadFrom(editing);
      if (editing.id) {
        await api.patch(`/admin/services/${editing.id}`, payload);
      } else {
        await api.post("/admin/services", payload);
      }
      setEditing(null);
      await load();
      Alert.alert(t("success"), t("serviceSaved"));
    } catch (e: any) {
      Alert.alert(t("error"), formatApiError(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = (id: string, title: string) => {
    Alert.alert(t("delete") + "?", title, [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/admin/services/${id}`);
            await load();
            Alert.alert(t("success"), t("serviceDeleted"));
          } catch (e: any) {
            Alert.alert(t("error"), formatApiError(e));
          }
        },
      },
    ]);
  };

  const setField = <K extends keyof ServiceItem>(key: K, value: ServiceItem[K]) => {
    setEditing((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity testID="svc-back" onPress={() => router.back()} style={styles.back}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("servicesMgmt")}</Text>
        <TouchableOpacity testID="svc-add" style={styles.addBtn} onPress={openNew}>
          <Plus color={COLORS.onPrimary} size={18} />
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>{t("servicesMgmtHint")}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label={t("all") || "All"} active={catFilter === "all"} onPress={() => setCatFilter("all")} />
        <Chip label={t("singleWindow")} active={catFilter === "single_window"} onPress={() => setCatFilter("single_window")} />
        <Chip label={t("accounting")} active={catFilter === "accounting"} onPress={() => setCatFilter("accounting")} />
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 32 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {filtered.length === 0 && <Text style={styles.empty}>{t("none")}</Text>}
          {filtered.map((s) => (
            <View key={s.id} testID={`svc-row-${s.id}`} style={[styles.card, !s.active && styles.cardInactive]}>
              <View style={styles.iconBox}>
                <Layers color={COLORS.primary} size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{s.title_uz}</Text>
                <Text style={styles.cardSub}>{s.id}</Text>
                <Text style={styles.meta}>
                  {s.category === "single_window" ? t("singleWindow") : t("accounting")}
                  {" · "}
                  {s.active ? t("active") : t("inactive")}
                </Text>
              </View>
              <TouchableOpacity style={styles.iconBtn} onPress={() => setEditing({ ...s })}>
                <Edit color={COLORS.primary} size={16} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => remove(s.id!, s.title_uz)}>
                <Trash2 color={COLORS.danger} size={16} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={!!editing} animationType="slide" transparent onRequestClose={() => setEditing(null)}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.sheet}>
            <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
              <Text style={styles.sheetTitle}>{editing?.id ? t("editService") : t("addService")}</Text>

              <Text style={styles.lbl}>{t("category")}</Text>
              <View style={styles.catRow}>
                {(["single_window", "accounting"] as Category[]).map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.catBtn, editing?.category === c && styles.catBtnActive]}
                    onPress={() => setField("category", c)}
                  >
                    <Text style={[styles.catBtnText, editing?.category === c && { color: COLORS.onPrimary }]}>
                      {c === "single_window" ? t("singleWindow") : t("accounting")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {!editing?.id && (
                <>
                  <Text style={styles.lbl}>{t("serviceId")}</Text>
                  <TextInput
                    value={editing?.service_id || ""}
                    onChangeText={(v) => setField("service_id", v)}
                    style={styles.input}
                    placeholder="sw_yangi_xizmat"
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="none"
                  />
                </>
              )}

              <Text style={styles.lbl}>{t("titleUz")}</Text>
              <TextInput
                value={editing?.title_uz || ""}
                onChangeText={(v) => setField("title_uz", v)}
                style={styles.input}
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.lbl}>{t("titleRu")}</Text>
              <TextInput
                value={editing?.title_ru || ""}
                onChangeText={(v) => setField("title_ru", v)}
                style={styles.input}
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.lbl}>{t("titleEn")}</Text>
              <TextInput
                value={editing?.title_en || ""}
                onChangeText={(v) => setField("title_en", v)}
                style={styles.input}
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.lbl}>{t("serviceIcon")}</Text>
              <TextInput
                value={editing?.icon || ""}
                onChangeText={(v) => setField("icon", v)}
                style={styles.input}
                placeholder="id-card"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
              />

              <Text style={styles.lbl}>{t("serviceOrder")}</Text>
              <TextInput
                value={String(editing?.order ?? 0)}
                onChangeText={(v) => setField("order", parseInt(v, 10) || 0)}
                style={styles.input}
                keyboardType="numeric"
                placeholderTextColor={COLORS.textMuted}
              />

              <View style={styles.activeRow}>
                <Text style={styles.lbl}>{t("active")}</Text>
                <Switch value={editing?.active ?? true} onValueChange={(v) => setField("active", v)} />
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
                <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => setEditing(null)}>
                  <Text style={styles.btnGhostText}>{t("cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={save} disabled={busy}>
                  {busy ? (
                    <ActivityIndicator color={COLORS.onPrimary} />
                  ) : (
                    <Text style={styles.btnPrimaryText}>{t("save")}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress} activeOpacity={0.85}>
      <Text style={[styles.chipText, active && { color: COLORS.onPrimary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "700", color: COLORS.text },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    fontSize: 13,
    color: COLORS.textMuted,
    paddingHorizontal: 20,
    paddingBottom: 8,
    lineHeight: 18,
  },
  chips: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  empty: { color: COLORS.textMuted, textAlign: "center", paddingVertical: 40 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 10,
  },
  cardInactive: { opacity: 0.65, borderColor: COLORS.borderLight },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.subtle,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontWeight: "800", fontSize: 14, color: COLORS.text },
  cardSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  meta: { fontSize: 10, color: COLORS.primary, fontWeight: "700", marginTop: 4 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.subtle,
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
  },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text, marginBottom: 8 },
  lbl: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginTop: 12,
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 14,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
  },
  catRow: { flexDirection: "row", gap: 8 },
  catBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    backgroundColor: COLORS.surface,
  },
  catBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catBtnText: { fontSize: 12, fontWeight: "700", color: COLORS.textSecondary },
  activeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.full, alignItems: "center" },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnPrimaryText: { color: COLORS.onPrimary, fontWeight: "700" },
  btnGhost: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  btnGhostText: { color: COLORS.text, fontWeight: "700" },
});
