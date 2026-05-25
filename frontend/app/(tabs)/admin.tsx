import React, { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList,
  RefreshControl, Alert, ScrollView, Modal, Switch, Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Search, X, ChevronRight, ShieldCheck, Users, MessageSquare, Phone, FileText, CreditCard, Newspaper, UserPlus } from "lucide-react-native";
import { api, formatApiError } from "../../src/api";
import { useAuth, isSuperAdmin } from "../../src/auth";
import { useI18n } from "../../src/i18n";
import { COLORS, RADIUS } from "../../src/theme";
import { StatusBadge } from "../../src/components";

const STATUSES = ["pending", "in_review", "approved", "rejected"] as const;
const CATS = ["single_window", "accounting"] as const;

export default function AdminHub() {
  const { t } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const superAdmin = isSuperAdmin(user);
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [editStatus, setEditStatus] = useState<string>("pending");
  const [editNote, setEditNote] = useState("");
  const [editPayReq, setEditPayReq] = useState(false);
  const [editPayAmount, setEditPayAmount] = useState("");
  const [editPayNote, setEditPayNote] = useState("");
  const [receiptDetail, setReceiptDetail] = useState<any>(null);
  const [receiptNote, setReceiptNote] = useState("");

  const load = useCallback(async () => {
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (catFilter) params.category = catFilter;
      if (search) params.search = search;
      const [{ data: list }, { data: s }] = await Promise.all([
        api.get("/admin/requests", { params }),
        api.get("/admin/stats"),
      ]);
      setItems(list);
      setStats(s);
    } catch (e: any) { Alert.alert(t("error"), formatApiError(e)); }
  }, [statusFilter, catFilter, search, t]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const insets = useSafeAreaInsets();
  const scrollBottom = 72 + Math.max(insets.bottom, 24);

  const openEditor = async (req: any) => {
    setEditing(req);
    setEditStatus(req.status);
    setEditNote(req.admin_note || "");
    setEditPayReq(!!req.payment_required);
    setEditPayAmount(req.payment_amount ? String(req.payment_amount) : "");
    setEditPayNote(req.payment_note || "");
    setReceiptNote("");
    setReceiptDetail(null);
    if (req.payment_status === "receipt_pending") {
      try {
        const { data } = await api.get(`/requests/${req.id}`);
        setReceiptDetail(data);
      } catch {
        /* ignore */
      }
    }
  };

  const reviewReceipt = async (decision: "approved" | "rejected") => {
    if (!editing) return;
    try {
      await api.patch(`/admin/requests/${editing.id}/receipt`, {
        decision,
        note: receiptNote,
      });
      setEditing(null);
      setReceiptDetail(null);
      await load();
    } catch (e: any) {
      Alert.alert(t("error"), formatApiError(e));
    }
  };

  const saveStatus = async () => {
    try {
      await api.patch(`/admin/requests/${editing.id}/status`, {
        status: editStatus,
        admin_note: editNote,
        payment_required: editPayReq,
        payment_amount: editPayAmount ? parseFloat(editPayAmount) : 0,
        payment_note: editPayNote,
      });
      setEditing(null);
      await load();
    } catch (e: any) { Alert.alert(t("error"), formatApiError(e)); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>{superAdmin ? t("superAdminPanel") : t("adminPanel")}</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: scrollBottom }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {stats && (
          <View style={styles.statsRow}>
            <Stat label={t("totalRequests")} value={stats.total} />
            <Stat label={t("pending")} value={stats.pending} accent={COLORS.pendingText} />
            <Stat label={t("approved")} value={stats.approved} accent={COLORS.approvedText} />
            <Stat label={t("activeUsers")} value={stats.users} />
          </View>
        )}

        <View style={styles.adminNav}>
          <NavTile icon={<ShieldCheck color={COLORS.primary} size={20} />} label={t("reviewKyc")} count={stats?.kyc_pending} onPress={() => router.push("/admin/kyc")} testID="nav-kyc" />
          <NavTile icon={<MessageSquare color={COLORS.primary} size={20} />} label={t("supportChat")} count={stats?.support_open} onPress={() => router.push("/admin/support")} testID="nav-support" />
          <NavTile icon={<Newspaper color={COLORS.primary} size={20} />} label={t("newsMgmt")} onPress={() => router.push("/admin/news")} testID="nav-news" />
          {superAdmin && (
            <>
              <NavTile icon={<UserPlus color={COLORS.primary} size={20} />} label={t("adminMgmt")} onPress={() => router.push("/admin/staff")} testID="nav-staff" />
              <NavTile icon={<Users color={COLORS.primary} size={20} />} label={t("teamMgmt")} onPress={() => router.push("/admin/team")} testID="nav-team" />
              <NavTile icon={<Phone color={COLORS.primary} size={20} />} label={t("contactMgmt")} onPress={() => router.push("/admin/contact")} testID="nav-contact" />
              <NavTile icon={<CreditCard color={COLORS.primary} size={20} />} label={t("paymentMethods")} onPress={() => router.push("/admin/payments")} testID="nav-payments" />
            </>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <FileText color={COLORS.textMuted} size={14} />
          <Text style={styles.sectionLabel}>{t("allRequests")}</Text>
        </View>

        <View style={styles.filterBar}>
          <View style={styles.searchBox}>
            <Search color={COLORS.textMuted} size={16} />
            <TextInput
              testID="admin-search"
              value={search}
              onChangeText={setSearch}
              placeholder={t("search")}
              placeholderTextColor={COLORS.textMuted}
              style={styles.searchInput}
              onSubmitEditing={load}
              returnKeyType="search"
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 10 }}>
            <Chip label={t("all") || "All"} active={statusFilter === null} onPress={() => setStatusFilter(null)} testID="filter-all" />
            {STATUSES.map((s) => (
              <Chip key={s} label={t(s)} active={statusFilter === s} onPress={() => setStatusFilter(s)} testID={`filter-${s}`} />
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 6 }}>
            <Chip label={t("all") || "All"} active={catFilter === null} onPress={() => setCatFilter(null)} testID="cat-all" />
            {CATS.map((c) => (
              <Chip key={c} label={c === "single_window" ? t("singleWindow") : t("accounting")} active={catFilter === c} onPress={() => setCatFilter(c)} testID={`cat-${c}`} />
            ))}
          </ScrollView>
        </View>

        <FlatList
          scrollEnabled={false}
          data={items}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<View style={{ alignItems: "center", padding: 40 }}><Text style={{ color: COLORS.textMuted }}>{t("noApplications")}</Text></View>}
          renderItem={({ item }) => (
            <TouchableOpacity testID={`admin-req-${item.id}`} style={styles.row} activeOpacity={0.85} onPress={() => openEditor(item)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowKicker}>{item.category === "single_window" ? t("singleWindow") : t("accounting")}</Text>
                <Text style={styles.rowTitle}>{item.service_title}</Text>
                <Text style={styles.rowMeta}>{item.user_name} · {item.user_phone}</Text>
                <View style={{ marginTop: 8 }}>
                  <StatusBadge status={item.closed ? "approved" : item.status} label={item.closed ? t("closed") : t(item.status)} />
                </View>
              </View>
              <ChevronRight color={COLORS.textMuted} size={18} />
            </TouchableOpacity>
          )}
        />
      </ScrollView>

      <Modal visible={!!editing} animationType="slide" transparent onRequestClose={() => setEditing(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>{editing?.service_title}</Text>
              <TouchableOpacity testID="modal-close" onPress={() => setEditing(null)}>
                <X color={COLORS.text} size={22} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>{editing?.user_name} · {editing?.user_phone || editing?.user_email}</Text>

            <TouchableOpacity
              testID="open-detail"
              style={styles.detailLink}
              onPress={() => { const id = editing.id; setEditing(null); router.push(`/request/${id}`); }}
            >
              <Text style={styles.detailLinkText}>{t("requestDetails")} →</Text>
            </TouchableOpacity>

            <Text style={styles.modalLabel}>{t("updateStatus")}</Text>
            <View style={styles.statusGrid}>
              {STATUSES.map((s) => (
                <TouchableOpacity
                  key={s}
                  testID={`set-status-${s}`}
                  style={[styles.statusBtn, editStatus === s && styles.statusBtnActive]}
                  onPress={() => setEditStatus(s)}
                >
                  <Text style={[styles.statusBtnText, editStatus === s && { color: COLORS.onPrimary }]}>{t(s)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>{t("adminNote")}</Text>
            <TextInput
              testID="admin-note"
              style={styles.modalInput}
              value={editNote}
              onChangeText={setEditNote}
              multiline
              numberOfLines={3}
              placeholderTextColor={COLORS.textMuted}
            />

            <View style={styles.payRow}>
              <Text style={styles.modalLabel}>{t("paymentRequired")}</Text>
              <Switch testID="pay-toggle" value={editPayReq} onValueChange={setEditPayReq} />
            </View>
            {editPayReq && (
              <>
                <Text style={styles.modalLabel}>{t("amount")} (so'm)</Text>
                <TextInput testID="pay-amount-input" style={styles.modalInput} value={editPayAmount} onChangeText={setEditPayAmount} keyboardType="numeric" placeholderTextColor={COLORS.textMuted} />
                <Text style={styles.modalLabel}>{t("description")}</Text>
                <TextInput testID="pay-note-input" style={styles.modalInput} value={editPayNote} onChangeText={setEditPayNote} multiline placeholderTextColor={COLORS.textMuted} />
              </>
            )}

            {editing?.payment_status === "receipt_pending" && receiptDetail?.payment_receipt && (
              <View style={styles.receiptReview}>
                <Text style={styles.modalLabel}>{t("reviewReceipt")}</Text>
                <Image
                  source={{
                    uri: receiptDetail.payment_receipt.content.startsWith("data:")
                      ? receiptDetail.payment_receipt.content
                      : `data:${receiptDetail.payment_receipt.mime};base64,${receiptDetail.payment_receipt.content}`,
                  }}
                  style={styles.receiptImg}
                  resizeMode="contain"
                />
                <TextInput
                  testID="receipt-note"
                  style={styles.modalInput}
                  value={receiptNote}
                  onChangeText={setReceiptNote}
                  placeholder={t("adminNote")}
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                />
                <View style={styles.receiptActions}>
                  <TouchableOpacity testID="receipt-approve" style={styles.approveBtn} onPress={() => reviewReceipt("approved")}>
                    <Text style={styles.approveText}>{t("approveReceipt")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity testID="receipt-reject" style={styles.rejectBtn} onPress={() => reviewReceipt("rejected")}>
                    <Text style={styles.rejectText}>{t("rejectReceipt")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity testID="save-status" style={styles.saveBtn} onPress={saveStatus} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>{t("save")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, accent ? { color: accent } : null]}>{value ?? 0}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function Chip({ label, active, onPress, testID }: { label: string; active: boolean; onPress: () => void; testID?: string }) {
  return (
    <TouchableOpacity testID={testID} onPress={onPress} style={[styles.chip, active && styles.chipActive]} activeOpacity={0.85}>
      <Text style={[styles.chipText, active && { color: COLORS.onPrimary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function NavTile({ icon, label, count, onPress, testID }: { icon: any; label: string; count?: number; onPress: () => void; testID?: string }) {
  return (
    <TouchableOpacity testID={testID} style={styles.navTile} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.navIcon}>{icon}</View>
      <Text style={styles.navLabel} numberOfLines={2}>{label}</Text>
      {!!count && count > 0 && (
        <View style={styles.badge}><Text style={styles.badgeText}>{count}</Text></View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: "800", color: COLORS.text },
  statsRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, paddingVertical: 12 },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: 12, alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "800", color: COLORS.text },
  statLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 4, textTransform: "uppercase", letterSpacing: 0.8 },
  adminNav: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, paddingBottom: 4 },
  navTile: {
    width: "48%", backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, padding: 14, gap: 8, position: "relative",
  },
  navIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.subtle, alignItems: "center", justifyContent: "center" },
  navLabel: { color: COLORS.text, fontWeight: "700", fontSize: 13 },
  badge: { position: "absolute", top: 10, right: 10, backgroundColor: COLORS.danger, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 12, minWidth: 22, alignItems: "center" },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingTop: 18 },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase" },
  filterBar: { paddingHorizontal: 16, paddingTop: 4 },
  searchBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.full,
    paddingHorizontal: 14, height: 44, gap: 8,
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.text, fontWeight: "600", fontSize: 12 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10 },
  rowKicker: { fontSize: 10, fontWeight: "700", color: COLORS.primary, letterSpacing: 1, textTransform: "uppercase" },
  rowTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text, marginTop: 2 },
  rowMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 40 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text, flex: 1, marginRight: 12 },
  modalSub: { color: COLORS.textMuted, fontSize: 13, marginTop: 4 },
  detailLink: { paddingVertical: 10 },
  detailLinkText: { color: COLORS.primary, fontWeight: "700", fontSize: 13 },
  modalLabel: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, marginTop: 12 },
  statusGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statusBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  statusBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  statusBtnText: { color: COLORS.text, fontWeight: "600", fontSize: 12 },
  modalInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 12, minHeight: 60, color: COLORS.text, fontSize: 14, backgroundColor: COLORS.bg, textAlignVertical: "top" },
  payRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  saveBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: RADIUS.full, alignItems: "center", marginTop: 18 },
  saveBtnText: { color: COLORS.onPrimary, fontWeight: "700", fontSize: 15 },
  receiptReview: { marginTop: 8 },
  receiptImg: { width: "100%", height: 180, borderRadius: RADIUS.md, backgroundColor: COLORS.bg, marginBottom: 8 },
  receiptActions: { flexDirection: "row", gap: 8, marginTop: 8 },
  approveBtn: { flex: 1, backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: RADIUS.full, alignItems: "center" },
  approveText: { color: COLORS.onPrimary, fontWeight: "700", fontSize: 13 },
  rejectBtn: { flex: 1, backgroundColor: COLORS.danger, paddingVertical: 12, borderRadius: RADIUS.full, alignItems: "center" },
  rejectText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
