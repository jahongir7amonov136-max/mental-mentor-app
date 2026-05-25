import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LogOut, Mail, Phone, User as UserIcon, Globe, Shield, ShieldCheck, ShieldAlert, MessageCircle, Info, ChevronRight, CreditCard } from "lucide-react-native";
import { useAuth, isStaff, isSuperAdmin } from "../../src/auth";
import { useI18n, Lang } from "../../src/i18n";
import { COLORS, RADIUS } from "../../src/theme";

const LANGUAGES: { code: Lang; native: string }[] = [
  { code: "uz", native: "O'zbekcha" },
  { code: "ru", native: "Русский" },
  { code: "en", native: "English" },
];

export default function Profile() {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useI18n();
  const router = useRouter();

  const onLogout = () =>
    Alert.alert(t("logout"), "?", [
      { text: t("cancel"), style: "cancel" },
      { text: t("logout"), style: "destructive", onPress: async () => { await logout(); router.replace("/(auth)/login"); } },
    ]);

  const kyc = user?.kyc_status || "none";
  const kycColor = kyc === "approved" ? COLORS.approvedText : kyc === "rejected" ? COLORS.rejectedText : COLORS.primary;
  const kycLabel = kyc === "approved" ? t("kycApproved") : kyc === "pending" ? t("kycPending") : kyc === "rejected" ? t("kycRejected") : t("kycNone");
  const insets = useSafeAreaInsets();
  const scrollBottom = 72 + Math.max(insets.bottom, 24);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottom }]}>
        <Text style={styles.title}>{t("profile")}</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.first_name?.[0] || "") + (user?.last_name?.[0] || "")}
            </Text>
          </View>
          <Text testID="profile-name" style={styles.userName}>{user?.first_name} {user?.last_name}</Text>
          {isStaff(user) && (
            <View style={styles.adminBadge}>
              <Shield color={COLORS.primary} size={12} />
              <Text style={styles.adminBadgeText}>{isSuperAdmin(user) ? "SUPER ADMIN" : "ADMIN"}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          {!!user?.email && (
            <>
              <View style={styles.row}><Mail color={COLORS.textSecondary} size={18} /><Text style={styles.rowText}>{user.email}</Text></View>
              <View style={styles.divider} />
            </>
          )}
          <View style={styles.row}><Phone color={COLORS.textSecondary} size={18} /><Text style={styles.rowText}>{user?.phone}</Text></View>
          <View style={styles.divider} />
          <View style={styles.row}><UserIcon color={COLORS.textSecondary} size={18} /><Text style={styles.rowText}>{user?.first_name} {user?.last_name}</Text></View>
        </View>

        {!isStaff(user) && (
          <TouchableOpacity testID="link-kyc" style={styles.linkRow} onPress={() => router.push("/kyc")} activeOpacity={0.85}>
            <View style={[styles.linkIcon, { backgroundColor: COLORS.subtle }]}>
              {kyc === "approved" ? <ShieldCheck color={kycColor} size={20} /> : <ShieldAlert color={kycColor} size={20} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkTitle}>{t("kyc")}</Text>
              <Text style={[styles.linkSub, { color: kycColor }]}>{kycLabel}</Text>
            </View>
            <ChevronRight color={COLORS.textMuted} size={18} />
          </TouchableOpacity>
        )}

        <TouchableOpacity testID="link-payments" style={styles.linkRow} onPress={() => router.push("/payments")} activeOpacity={0.85}>
          <View style={[styles.linkIcon, { backgroundColor: COLORS.subtle }]}>
            <CreditCard color={COLORS.primary} size={20} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>{t("payment")}</Text>
            <Text style={styles.linkSub}>Payme · Click · Xazna · Paynet</Text>
          </View>
          <ChevronRight color={COLORS.textMuted} size={18} />
        </TouchableOpacity>

        <TouchableOpacity testID="link-support" style={styles.linkRow} onPress={() => router.push("/support")} activeOpacity={0.85}>
          <View style={[styles.linkIcon, { backgroundColor: COLORS.subtle }]}>
            <MessageCircle color={COLORS.primary} size={20} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>{t("supportChat")}</Text>
            <Text style={styles.linkSub}>{t("supportDesc")}</Text>
          </View>
          <ChevronRight color={COLORS.textMuted} size={18} />
        </TouchableOpacity>

        <TouchableOpacity testID="link-about" style={styles.linkRow} onPress={() => router.push("/about")} activeOpacity={0.85}>
          <View style={[styles.linkIcon, { backgroundColor: COLORS.subtle }]}>
            <Info color={COLORS.primary} size={20} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>{t("aboutUs")}</Text>
            <Text style={styles.linkSub}>21-ASR · {t("team")}</Text>
          </View>
          <ChevronRight color={COLORS.textMuted} size={18} />
        </TouchableOpacity>

        <Text style={styles.sectionLabel}><Globe color={COLORS.textMuted} size={12} />  {t("language")}</Text>
        <View style={styles.langGroup}>
          {LANGUAGES.map((l) => {
            const active = lang === l.code;
            return (
              <TouchableOpacity key={l.code} testID={`lang-${l.code}`} style={[styles.langBtn, active && styles.langBtnActive]} onPress={() => setLang(l.code)} activeOpacity={0.85}>
                <Text style={[styles.langCode, active && { color: COLORS.onPrimary }]}>{l.code.toUpperCase()}</Text>
                <Text style={[styles.langName, active && { color: COLORS.onPrimary }]}>{l.native}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity testID="logout-btn" style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.85}>
          <LogOut color={COLORS.danger} size={18} />
          <Text style={styles.logoutText}>{t("logout")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "800", color: COLORS.text, marginBottom: 16 },
  profileCard: {
    alignItems: "center", backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: 24, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16,
  },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { color: COLORS.onPrimary, fontSize: 28, fontWeight: "800" },
  userName: { fontSize: 20, fontWeight: "800", color: COLORS.text },
  adminBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.subtle, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, marginTop: 8 },
  adminBadgeText: { color: COLORS.primary, fontWeight: "700", fontSize: 11, letterSpacing: 0.5 },
  section: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16, marginBottom: 18 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 12 },
  rowText: { color: COLORS.text, fontSize: 14 },
  divider: { height: 1, backgroundColor: COLORS.borderLight },
  linkRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, padding: 12, marginBottom: 10,
  },
  linkIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  linkTitle: { color: COLORS.text, fontWeight: "700", fontSize: 14 },
  linkSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 1, marginTop: 6, marginBottom: 10, textTransform: "uppercase" },
  langGroup: { flexDirection: "row", gap: 8, marginBottom: 24 },
  langBtn: { flex: 1, alignItems: "center", backgroundColor: COLORS.surface, paddingVertical: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
  langBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  langCode: { fontWeight: "800", color: COLORS.text, fontSize: 14, letterSpacing: 1 },
  langName: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 16, borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.danger,
  },
  logoutText: { color: COLORS.danger, fontWeight: "700", fontSize: 14 },
});
