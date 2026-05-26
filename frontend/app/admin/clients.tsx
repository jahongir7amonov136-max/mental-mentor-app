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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Phone,
  Search,
  UserCheck,
} from "lucide-react-native";
import { api, formatApiError } from "../../src/api";
import { useAuth, isStaff, normalizePhone } from "../../src/auth";
import { useI18n } from "../../src/i18n";
import { COLORS, RADIUS } from "../../src/theme";

interface ClientUser {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  kyc_status: string;
  offer_accepted_at?: string;
  blocked?: boolean;
  blocked_at?: string | null;
  created_at?: string;
}

export default function AdminClients() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();
  const [list, setList] = useState<ClientUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<ClientUser | null>(null);
  const [newPhone, setNewPhone] = useState("");

  useEffect(() => {
    if (user && !isStaff(user)) router.replace("/(tabs)");
  }, [user, router]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = search.trim() ? { search: search.trim() } : {};
      const { data } = await api.get<ClientUser[]>("/admin/clients", { params });
      setList(data);
    } catch (e: any) {
      Alert.alert(t("error"), formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, [search, t]);

  useEffect(() => {
    load();
  }, [load]);

  const openPhoneEdit = (u: ClientUser) => {
    setEditing(u);
    setNewPhone(u.phone);
  };

  const savePhone = async () => {
    if (!editing || !newPhone.trim()) {
      return Alert.alert(t("error"), t("requiredFieldsMissing"));
    }
    setBusy(true);
    try {
      await api.patch(`/admin/clients/${editing.id}/phone`, {
        phone: normalizePhone(newPhone.trim()),
      });
      setEditing(null);
      await load();
      Alert.alert(t("success"), t("phoneUpdated"));
    } catch (e: any) {
      Alert.alert(t("error"), formatApiError(e));
    } finally {
      setBusy(false);
    }
  };

  const toggleBlock = (u: ClientUser) => {
    const isBlocked = !!u.blocked;
    Alert.alert(
      isBlocked ? t("unblockUser") : t("blockUser"),
      isBlocked ? t("unblockConfirm") : t("blockConfirm"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: isBlocked ? t("unblockUser") : t("blockUser"),
          style: isBlocked ? "default" : "destructive",
          onPress: async () => {
            setBusy(true);
            try {
              if (isBlocked) {
                await api.patch(`/admin/clients/${u.id}/unblock`);
              } else {
                await api.patch(`/admin/clients/${u.id}/block`, { note: "" });
              }
              await load();
            } catch (e: any) {
              Alert.alert(t("error"), formatApiError(e));
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity testID="clients-back" onPress={() => router.back()} style={styles.back}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("clientsMgmt")}</Text>
        <View style={{ width: 44 }} />
      </View>

      <Text style={styles.hint}>{t("clientsMgmtHint")}</Text>

      <View style={styles.searchBox}>
        <Search color={COLORS.textMuted} size={16} />
        <TextInput
          testID="clients-search"
          value={search}
          onChangeText={setSearch}
          placeholder={t("search")}
          placeholderTextColor={COLORS.textMuted}
          style={styles.searchInput}
          onSubmitEditing={load}
          returnKeyType="search"
        />
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {list.length === 0 && <Text style={styles.empty}>{t("none")}</Text>}
          {list.map((u) => (
            <View key={u.id} testID={`client-${u.id}`} style={[styles.card, u.blocked && styles.cardBlocked]}>
              <View style={styles.cardTop}>
                <View style={styles.av}>
                  <Text style={styles.avText}>
                    {(u.first_name?.[0] || "") + (u.last_name?.[0] || "")}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.uName}>
                    {u.first_name} {u.last_name}
                  </Text>
                  <Text style={styles.uPhone}>{u.phone}</Text>
                  <View style={styles.badges}>
                    <View style={styles.badgeOk}>
                      <UserCheck color={COLORS.approvedText} size={12} />
                      <Text style={styles.badgeOkText}>{t("kycApproved")}</Text>
                    </View>
                    <Text style={[styles.statusTag, u.blocked ? styles.statusBlocked : styles.statusActive]}>
                      {u.blocked ? t("userBlocked") : t("userActive")}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  testID={`client-phone-${u.id}`}
                  style={styles.actionBtn}
                  onPress={() => openPhoneEdit(u)}
                  activeOpacity={0.85}
                >
                  <Phone color={COLORS.primary} size={16} />
                  <Text style={styles.actionText}>{t("changePhone")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID={`client-block-${u.id}`}
                  style={[styles.actionBtn, u.blocked ? styles.unblockBtn : styles.blockBtn]}
                  onPress={() => toggleBlock(u)}
                  activeOpacity={0.85}
                  disabled={busy}
                >
                  {u.blocked ? (
                    <CheckCircle2 color={COLORS.approvedText} size={16} />
                  ) : (
                    <Ban color={COLORS.rejectedText} size={16} />
                  )}
                  <Text style={[styles.actionText, u.blocked ? { color: COLORS.approvedText } : { color: COLORS.rejectedText }]}>
                    {u.blocked ? t("unblockUser") : t("blockUser")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={!!editing} animationType="slide" transparent onRequestClose={() => setEditing(null)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t("changePhone")}</Text>
            <Text style={styles.modalSub}>
              {editing?.first_name} {editing?.last_name}
            </Text>
            <Text style={styles.label}>{t("newPhone")}</Text>
            <TextInput
              testID="new-phone-input"
              style={styles.input}
              value={newPhone}
              onChangeText={setNewPhone}
              keyboardType="phone-pad"
              placeholder="+998901234567"
              placeholderTextColor={COLORS.textMuted}
            />
            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(null)}>
                <Text style={styles.cancelText}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="save-phone"
                style={styles.saveBtn}
                onPress={savePhone}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator color={COLORS.onPrimary} />
                ) : (
                  <Text style={styles.saveText}>{t("save")}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700", color: COLORS.text },
  hint: {
    fontSize: 13,
    color: COLORS.textMuted,
    paddingHorizontal: 20,
    paddingBottom: 10,
    lineHeight: 18,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: COLORS.text },
  scroll: { padding: 16, paddingTop: 8, paddingBottom: 40 },
  empty: { textAlign: "center", color: COLORS.textMuted, marginTop: 32 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardBlocked: { borderColor: COLORS.rejectedBorder, backgroundColor: COLORS.rejectedBg },
  cardTop: { flexDirection: "row", gap: 12 },
  av: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.subtle,
    alignItems: "center",
    justifyContent: "center",
  },
  avText: { fontWeight: "700", color: COLORS.primary },
  uName: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  uPhone: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8, alignItems: "center" },
  badgeOk: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.approvedBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  badgeOkText: { fontSize: 11, fontWeight: "600", color: COLORS.approvedText },
  statusTag: { fontSize: 11, fontWeight: "700" },
  statusActive: { color: COLORS.approvedText },
  statusBlocked: { color: COLORS.rejectedText },
  actions: { flexDirection: "row", gap: 8, marginTop: 14 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  blockBtn: { borderColor: COLORS.rejectedBorder },
  unblockBtn: { borderColor: COLORS.approvedBorder },
  actionText: { fontSize: 12, fontWeight: "600", color: COLORS.primary },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modal: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: 20,
    paddingBottom: 32,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  modalSub: { fontSize: 14, color: COLORS.textMuted, marginTop: 4, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.bg,
  },
  modalRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelText: { fontWeight: "600", color: COLORS.textSecondary },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  saveText: { fontWeight: "700", color: COLORS.onPrimary },
});
