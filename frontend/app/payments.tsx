import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, ExternalLink, CreditCard, QrCode, Upload } from "lucide-react-native";
import { api, formatApiError } from "../src/api";
import { useI18n } from "../src/i18n";
import { COLORS, RADIUS } from "../src/theme";
import { pickImage, type PickedFile } from "../src/files";

export default function PaymentsScreen() {
  const { requestId } = useLocalSearchParams<{ requestId?: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const [methods, setMethods] = useState<any[]>([]);
  const [req, setReq] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [receiptFile, setReceiptFile] = useState<PickedFile | null>(null);

  const loadReq = () => {
    if (requestId) api.get(`/requests/${requestId}`).then(({ data }) => setReq(data));
  };

  useEffect(() => {
    api.get("/payments/methods").then(({ data }) => setMethods(data));
    loadReq();
  }, [requestId]);

  const open = async (m: any) => {
    if (m.kind === "link") {
      try {
        await Linking.openURL(m.value);
      } catch {
        Alert.alert(t("error"), "Cannot open link");
      }
    }
  };

  const uploadReceipt = async () => {
    if (!requestId || !receiptFile) {
      return Alert.alert(t("error"), t("pickReceipt"));
    }
    setBusy(true);
    try {
      await api.post(`/requests/${requestId}/upload-receipt`, { receipt: receiptFile });
      Alert.alert(t("success"), t("receiptUploaded"), [{ text: "OK", onPress: () => loadReq() }]);
      setReceiptFile(null);
    } catch (e: any) {
      Alert.alert(t("error"), formatApiError(e));
    } finally {
      setBusy(false);
    }
  };

  const pickReceiptPreview = async () => {
    const file = await pickImage("payment_receipt");
    if (!file) {
      Alert.alert(t("error"), t("pickReceipt") + " — rasm tanlanmadi yoki ruxsat berilmadi");
      return;
    }
    setReceiptFile(file);
  };

  const receiptPreviewUri = receiptFile
    ? receiptFile.content.startsWith("data:")
      ? receiptFile.content
      : `data:${receiptFile.mime};base64,${receiptFile.content}`
    : null;

  const canUpload =
    req &&
    req.payment_required &&
    req.payment_status !== "paid" &&
    req.payment_status !== "receipt_pending";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity testID="pay-back" onPress={() => router.back()} style={styles.back}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("payment")}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <TouchableOpacity
          testID="goto-history"
          style={styles.historyBtn}
          onPress={() => router.push("/payments-history")}
          activeOpacity={0.85}
        >
          <Text style={styles.historyBtnText}>📊  {t("paymentHistory")} →</Text>
        </TouchableOpacity>

        {req && req.payment_required && (
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>{t("amount")}</Text>
            <Text testID="pay-amount" style={styles.amountValue}>
              {req.payment_amount ? `${req.payment_amount.toLocaleString()} so'm` : "—"}
            </Text>
            {!!req.payment_note && <Text style={styles.amountNote}>{req.payment_note}</Text>}
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>
                {req.payment_status === "paid"
                  ? t("paid")
                  : req.payment_status === "receipt_pending"
                  ? t("receiptPending")
                  : req.payment_status === "receipt_rejected"
                  ? t("receiptRejected")
                  : t("paymentRequired")}
              </Text>
            </View>
            {req.payment_status === "receipt_rejected" && !!req.payment_receipt_note && (
              <Text style={styles.rejectNote}>{req.payment_receipt_note}</Text>
            )}
          </View>
        )}

        <Text style={styles.sectionLabel}>{t("paymentMethods")}</Text>
        {methods.length === 0 && <Text style={styles.empty}>{t("none")}</Text>}
        {methods.map((m) => (
          <TouchableOpacity
            key={m.id}
            testID={`pm-${m.id}`}
            style={styles.methodCard}
            activeOpacity={0.85}
            onPress={() => open(m)}
          >
            <View style={styles.methodIcon}>
              {m.kind === "qr" ? (
                <QrCode color={COLORS.primary} size={22} />
              ) : (
                <CreditCard color={COLORS.primary} size={22} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.methodName}>{m.name}</Text>
              {!!m.description && <Text style={styles.methodDesc}>{m.description}</Text>}
            </View>
            {m.kind === "qr" && m.value ? (
              <Image
                source={{ uri: m.value.startsWith("http") ? m.value : `data:image/png;base64,${m.value}` }}
                style={styles.qr}
              />
            ) : (
              <ExternalLink color={COLORS.textMuted} size={18} />
            )}
          </TouchableOpacity>
        ))}

        {canUpload && (
          <View style={styles.receiptBox}>
            <Text style={styles.sectionLabel}>{t("uploadReceipt")}</Text>
            <Text style={styles.receiptHint}>{t("uploadReceiptHint")}</Text>
            {receiptPreviewUri ? (
              <Image source={{ uri: receiptPreviewUri }} style={styles.receiptImg} resizeMode="contain" />
            ) : null}
            <TouchableOpacity testID="pick-receipt" style={styles.pickBtn} onPress={pickReceiptPreview} activeOpacity={0.85}>
              <Upload color={COLORS.primary} size={18} />
              <Text style={styles.pickBtnText}>{t("pickReceipt")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="submit-receipt"
              style={[styles.paidBtn, busy && { opacity: 0.6 }]}
              onPress={uploadReceipt}
              disabled={busy || !receiptFile}
              activeOpacity={0.85}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.paidBtnText}>{t("submitReceipt")}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {req?.payment_status === "receipt_pending" && (
          <View style={styles.pendingBanner}>
            <Text style={styles.pendingText}>{t("receiptPending")}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "700", color: COLORS.text },
  amountCard: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: 18, marginBottom: 18 },
  amountLabel: { color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  amountValue: { color: "#fff", fontSize: 28, fontWeight: "800", marginTop: 4 },
  amountNote: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 6 },
  statusPill: { alignSelf: "flex-start", marginTop: 10, backgroundColor: "rgba(255,255,255,0.18)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusPillText: { color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  rejectNote: { color: "#FEE2E2", fontSize: 12, marginTop: 8 },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 },
  empty: { color: COLORS.textMuted, textAlign: "center", paddingVertical: 30 },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
  },
  methodIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.subtle, alignItems: "center", justifyContent: "center" },
  methodName: { color: COLORS.text, fontWeight: "800", fontSize: 15 },
  methodDesc: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  qr: { width: 60, height: 60, borderRadius: 8 },
  receiptBox: { marginTop: 8, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: 16 },
  receiptHint: { color: COLORS.textMuted, fontSize: 13, marginBottom: 12 },
  receiptImg: { width: "100%", height: 200, borderRadius: RADIUS.md, marginBottom: 12, backgroundColor: COLORS.bg },
  pickBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.full, marginBottom: 10 },
  pickBtnText: { color: COLORS.primary, fontWeight: "700" },
  paidBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: RADIUS.full, alignItems: "center" },
  paidBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  pendingBanner: { marginTop: 16, padding: 14, backgroundColor: COLORS.subtle, borderRadius: RADIUS.md },
  pendingText: { color: COLORS.textSecondary, textAlign: "center", fontWeight: "600" },
  historyBtn: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.primary, paddingVertical: 14, borderRadius: RADIUS.full, alignItems: "center", marginBottom: 18 },
  historyBtnText: { color: COLORS.primary, fontWeight: "700", fontSize: 14 },
});
