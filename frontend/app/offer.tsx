import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { FileText, CheckSquare, Square } from "lucide-react-native";
import { api, formatApiError } from "../src/api";
import { useAuth } from "../src/auth";
import { useI18n } from "../src/i18n";
import { COLORS, RADIUS } from "../src/theme";

export default function OfferScreen() {
  const { user, refresh, logout, updateUser } = useAuth();
  const { t, lang } = useI18n();
  const router = useRouter();
  const [text, setText] = useState("");
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/legal/offer", { params: { lang } })
      .then(({ data }) => setText(data.text || ""))
      .catch(() =>
        setText(
          "Ushbu ofertani tasdiqlash orqali siz 21-ASR XIZMATLARI MARKAZI ga shaxsiy ma'lumotlaringizdan foydalanishga ruxsat berasiz."
        )
      )
      .finally(() => setLoading(false));
  }, [lang]);

  const onAccept = async () => {
    if (!checked) return Alert.alert(t("error"), t("offerMustAgree"));
    try {
      setBusy(true);
      const { data } = await api.post("/auth/accept-offer");
      updateUser(data);
      await refresh();
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert(t("error"), formatApiError(e));
    } finally {
      setBusy(false);
    }
  };

  const onDecline = async () => {
    Alert.alert(t("offerTitle"), t("offerDeclineHint"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("logout"),
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <FileText color={COLORS.primary} size={28} />
        <Text style={styles.title}>{t("offerTitle")}</Text>
        <Text style={styles.sub}>{t("offerSubtitle")}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.body}>{text}</Text>
        </ScrollView>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          testID="offer-checkbox"
          style={styles.checkRow}
          onPress={() => setChecked((v) => !v)}
          activeOpacity={0.8}
        >
          {checked ? (
            <CheckSquare color={COLORS.primary} size={22} />
          ) : (
            <Square color={COLORS.textMuted} size={22} />
          )}
          <Text style={styles.checkText}>{t("offerAgreeLabel")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="offer-accept"
          style={[styles.acceptBtn, (!checked || busy) && { opacity: 0.5 }]}
          onPress={onAccept}
          disabled={!checked || busy}
        >
          {busy ? (
            <ActivityIndicator color={COLORS.onPrimary} />
          ) : (
            <Text style={styles.acceptText}>{t("offerAccept")}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity testID="offer-decline" onPress={onDecline}>
          <Text style={styles.decline}>{t("offerDecline")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: 20, paddingBottom: 8, alignItems: "center" },
  title: { fontSize: 20, fontWeight: "800", color: COLORS.text, marginTop: 10, textAlign: "center" },
  sub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6, textAlign: "center" },
  scroll: { padding: 20, paddingBottom: 24 },
  body: { fontSize: 14, lineHeight: 22, color: COLORS.text },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 16 },
  checkText: { flex: 1, fontSize: 13, color: COLORS.text, lineHeight: 20 },
  acceptBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: RADIUS.full,
    alignItems: "center",
  },
  acceptText: { color: COLORS.onPrimary, fontWeight: "700", fontSize: 15 },
  decline: { textAlign: "center", color: COLORS.textMuted, marginTop: 14, fontSize: 13 },
});
