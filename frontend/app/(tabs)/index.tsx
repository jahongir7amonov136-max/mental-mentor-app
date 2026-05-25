import React, { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Building2, Calculator, ChevronRight, Clock, ShieldAlert, ShieldCheck, Bell } from "lucide-react-native";
import { useAuth, isStaff } from "../../src/auth";
import { useI18n } from "../../src/i18n";
import { COLORS, RADIUS } from "../../src/theme";
import { api } from "../../src/api";
import { StatusBadge } from "../../src/components";
import { NewsTicker, type NewsItem } from "../../src/components/NewsTicker";

interface RequestItem {
  id: string;
  service_title: string;
  created_at: string;
  status: string;
  closed: boolean;
}

export default function Home() {
  const { user, refresh } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [recent, setRecent] = useState<RequestItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [{ data }, { data: c }, { data: newsData }] = await Promise.all([
        api.get("/requests/mine"),
        api.get("/notifications/unread-count").catch(() => ({ data: { count: 0 } })),
        api.get("/news").catch(() => ({ data: [] })),
      ]);
      setRecent(data.slice(0, 3));
      setUnread(c.count || 0);
      setNews(newsData || []);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); refresh(); }, [load, refresh]));

  const onRefresh = async () => { setRefreshing(true); await load(); await refresh(); setRefreshing(false); };
  const kycStatus = user?.kyc_status || "none";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{t("welcomeUser")},</Text>
            <Text testID="home-username" style={styles.userName}>
              {user?.first_name} {user?.last_name}
            </Text>
          </View>
          <TouchableOpacity testID="bell-btn" style={styles.bellBtn} onPress={() => router.push("/notifications")} activeOpacity={0.85}>
            <Bell color={COLORS.text} size={22} />
            {unread > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unread > 9 ? "9+" : unread}</Text>
              </View>
            )}
          </TouchableOpacity>
          <Image source={require("../../assets/images/logo-brand.png")} style={styles.logoSm} resizeMode="contain" />
        </View>

        {kycStatus !== "approved" && !isStaff(user) && (
          <TouchableOpacity
            testID="kyc-banner"
            style={[styles.kycBanner, kycStatus === "rejected" && { backgroundColor: COLORS.rejectedBg, borderColor: COLORS.rejectedBorder }]}
            onPress={() => router.push("/kyc")}
            activeOpacity={0.9}
          >
            <View style={styles.kycIcon}>
              <ShieldAlert color={kycStatus === "rejected" ? COLORS.rejectedText : COLORS.primary} size={22} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.kycTitle}>
                {kycStatus === "pending" ? t("kycBannerPending") : kycStatus === "rejected" ? t("kycBannerRejected") : t("kycRequired")}
              </Text>
              <Text style={styles.kycHint}>{t("goVerify")} →</Text>
            </View>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>{t("quickActions")}</Text>

        <TouchableOpacity
          testID="category-single-window"
          style={[styles.heroCard, { backgroundColor: COLORS.primary }]}
          onPress={() => router.push("/category/single_window")}
          activeOpacity={0.9}
        >
          <View style={styles.heroIconBox}>
            <Building2 color={COLORS.onPrimary} size={28} />
          </View>
          <Text style={styles.heroTitle}>{t("singleWindow")}</Text>
          <Text style={styles.heroDesc}>{t("singleWindowDesc")}</Text>
          <View style={styles.heroFooter}>
            <Text style={styles.heroAction}>{t("chooseService")}</Text>
            <ChevronRight color={COLORS.onPrimary} size={18} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          testID="category-accounting"
          style={[styles.heroCard, styles.heroCardLight]}
          onPress={() => router.push("/category/accounting")}
          activeOpacity={0.9}
        >
          <View style={[styles.heroIconBox, { backgroundColor: COLORS.subtle }]}>
            <Calculator color={COLORS.primary} size={28} />
          </View>
          <Text style={[styles.heroTitle, { color: COLORS.text }]}>{t("accounting")}</Text>
          <Text style={[styles.heroDesc, { color: COLORS.textSecondary }]}>{t("accountingDesc")}</Text>
          <View style={styles.heroFooter}>
            <Text style={[styles.heroAction, { color: COLORS.primary }]}>{t("chooseService")}</Text>
            <ChevronRight color={COLORS.primary} size={18} />
          </View>
        </TouchableOpacity>

        <NewsTicker items={news} title={t("newsTicker")} />

        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>{t("recentRequests")}</Text>
          <TouchableOpacity testID="goto-services" onPress={() => router.push("/(tabs)/services")}>
            <Text style={styles.viewAll}>{t("viewAll")}</Text>
          </TouchableOpacity>
        </View>

        {recent.length === 0 ? (
          <View style={styles.emptyBox}>
            <Clock color={COLORS.textMuted} size={28} />
            <Text style={styles.emptyText}>{t("noApplications")}</Text>
          </View>
        ) : (
          recent.map((r) => (
            <TouchableOpacity
              key={r.id}
              testID={`recent-${r.id}`}
              style={styles.requestItem}
              onPress={() => router.push(`/request/${r.id}`)}
              activeOpacity={0.85}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.reqTitle} numberOfLines={1}>{r.service_title}</Text>
                <Text style={styles.reqDate}>{new Date(r.created_at).toLocaleDateString()}</Text>
              </View>
              <StatusBadge status={r.closed ? "approved" : r.status} label={r.closed ? t("closed") : t(r.status)} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  greeting: { fontSize: 14, color: COLORS.textMuted },
  userName: { fontSize: 24, fontWeight: "800", color: COLORS.text, letterSpacing: -0.5 },
  logoSm: { width: 70, height: 50, marginLeft: 8, borderRadius: 8 },
  bellBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", marginRight: 6 },
  bellBadge: { position: "absolute", top: 6, right: 6, backgroundColor: COLORS.danger, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 10, minWidth: 18, alignItems: "center" },
  bellBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  kycBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.subtle,
    borderRadius: RADIUS.md,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
    gap: 12,
  },
  kycIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, alignItems: "center", justifyContent: "center" },
  kycTitle: { fontWeight: "700", color: COLORS.text, fontSize: 13 },
  kycHint: { color: COLORS.primary, fontWeight: "700", fontSize: 12, marginTop: 2 },
  sectionTitle: {
    fontSize: 12, fontWeight: "700", color: COLORS.textMuted,
    letterSpacing: 1.5, marginBottom: 12, textTransform: "uppercase",
  },
  heroCard: { borderRadius: RADIUS.lg, padding: 22, marginBottom: 14 },
  heroCardLight: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  heroIconBox: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  heroTitle: { fontSize: 22, fontWeight: "800", color: COLORS.onPrimary, letterSpacing: -0.4 },
  heroDesc: { fontSize: 14, color: "rgba(255,255,255,0.85)", marginTop: 4 },
  heroFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 18 },
  heroAction: { color: COLORS.onPrimary, fontWeight: "700", fontSize: 13, letterSpacing: 0.5 },
  recentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  viewAll: { color: COLORS.primary, fontWeight: "700", fontSize: 12, marginBottom: 12 },
  emptyBox: {
    alignItems: "center", paddingVertical: 36,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
  },
  emptyText: { color: COLORS.textMuted, marginTop: 8, fontSize: 13 },
  requestItem: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 14, marginBottom: 8, flexDirection: "row", alignItems: "center",
  },
  reqTitle: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  reqDate: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
});
