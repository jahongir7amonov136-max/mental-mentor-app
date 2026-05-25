import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { ArrowLeft, CheckCircle2, Clock, Wallet } from "lucide-react-native";
import { api } from "../src/api";
import { useI18n } from "../src/i18n";
import { COLORS, RADIUS } from "../src/theme";

export default function PaymentsHistory() {
  const router = useRouter();
  const { t } = useI18n();
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get("/requests/mine");
    setItems((data as any[]).filter(r => r.payment_required || r.payment_status === "paid"));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const total = items.filter(i => i.payment_status === "paid").reduce((s, r) => s + (r.payment_amount || 0), 0);
  const pending = items.filter(i => i.payment_status === "required").reduce((s, r) => s + (r.payment_amount || 0), 0);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity testID="ph-back" onPress={() => router.back()} style={styles.back}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("paymentHistory")}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <View style={styles.summary}>
          <View style={styles.sumCard}>
            <Text style={styles.sumLabel}>{t("paid")}</Text>
            <Text style={[styles.sumValue, { color: COLORS.approvedText }]}>{total.toLocaleString()} so'm</Text>
          </View>
          <View style={styles.sumCard}>
            <Text style={styles.sumLabel}>{t("pending")}</Text>
            <Text style={[styles.sumValue, { color: COLORS.pendingText }]}>{pending.toLocaleString()} so'm</Text>
          </View>
        </View>

        {items.length === 0 && (
          <View style={styles.empty}>
            <Wallet color={COLORS.textMuted} size={32} />
            <Text style={styles.emptyText}>{t("none")}</Text>
          </View>
        )}

        {items.map((r) => {
          const paid = r.payment_status === "paid";
          return (
            <TouchableOpacity
              key={r.id}
              testID={`ph-${r.id}`}
              style={styles.item}
              activeOpacity={0.85}
              onPress={() => paid ? router.push(`/request/${r.id}`) : router.push({ pathname: "/payments", params: { requestId: r.id } })}
            >
              <View style={[styles.iconBox, { backgroundColor: paid ? COLORS.approvedBg : COLORS.pendingBg }]}>
                {paid ? <CheckCircle2 color={COLORS.approvedText} size={20} /> : <Clock color={COLORS.pendingText} size={20} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle} numberOfLines={1}>{r.service_title}</Text>
                <Text style={styles.itemDate}>
                  {paid && r.paid_at ? new Date(r.paid_at).toLocaleString() : new Date(r.updated_at).toLocaleString()}
                </Text>
                {!!r.payment_note && <Text style={styles.itemNote} numberOfLines={1}>{r.payment_note}</Text>}
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.amount}>{(r.payment_amount || 0).toLocaleString()}</Text>
                <Text style={styles.amountSm}>so'm</Text>
                <Text style={[styles.statusTag, { color: paid ? COLORS.approvedText : COLORS.pendingText }]}>
                  {paid ? t("paid") : t("paymentRequired")}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "700", color: COLORS.text },
  summary: { flexDirection: "row", gap: 10, marginBottom: 18 },
  sumCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: 14 },
  sumLabel: { fontSize: 11, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase" },
  sumValue: { fontSize: 18, fontWeight: "800", marginTop: 6 },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyText: { color: COLORS.textMuted, marginTop: 8 },
  item: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: 12, marginBottom: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  itemTitle: { color: COLORS.text, fontWeight: "700", fontSize: 14 },
  itemDate: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  itemNote: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  amount: { fontSize: 14, fontWeight: "800", color: COLORS.text },
  amountSm: { fontSize: 10, color: COLORS.textMuted },
  statusTag: { fontSize: 10, fontWeight: "800", marginTop: 4, letterSpacing: 0.5, textTransform: "uppercase" },
});
