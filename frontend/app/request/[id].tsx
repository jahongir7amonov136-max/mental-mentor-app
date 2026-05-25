import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  TextInput, Alert, KeyboardAvoidingView, Platform, Linking, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, FileText, Key as KeyIcon, Mail, Phone, User, Star, Download } from "lucide-react-native";
import { api, formatApiError } from "../../src/api";
import { useI18n } from "../../src/i18n";
import { useAuth } from "../../src/auth";
import { COLORS, RADIUS } from "../../src/theme";
import { StatusBadge } from "../../src/components";

export default function RequestDetail() {  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const { user } = useAuth();
  const [req, setReq] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => api.get(`/requests/${id}`).then(({ data }) => setReq(data));
  useEffect(() => { load(); }, [id]);

  const submitRating = async () => {
    if (!rating) return Alert.alert(t("error"), t("yourRating"));
    try {
      setBusy(true);
      await api.post(`/requests/${id}/rate`, { rating, comment });
      Alert.alert(t("thanks"), "", [{ text: "OK", onPress: () => load() }]);
    } catch (e: any) { Alert.alert(t("error"), formatApiError(e)); }
    finally { setBusy(false); }
  };

  if (!req) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  const isOwner = user?.id === req.user_id;
  const needsRating = isOwner && req.status === "approved" && !req.rating && !req.closed;
  const documents = (req.files || []).filter((f: any) => f.field !== "ekey");
  const ekeys = (req.files || []).filter((f: any) => f.field === "ekey");

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity testID="rd-back" onPress={() => router.back()} style={styles.back}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("requestDetails")}</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.kicker}>{req.category === "single_window" ? t("singleWindow") : t("accounting")}</Text>
            <Text style={styles.title}>{req.service_title}</Text>
            <View style={{ marginTop: 12 }}>
              <StatusBadge status={req.closed ? "approved" : req.status} label={req.closed ? t("closed") : t(req.status)} />
            </View>
            <Text style={styles.date}>{t("submittedAt")}: {new Date(req.created_at).toLocaleString()}</Text>
          </View>

          {req.payment_required && isOwner && req.payment_status !== "paid" && (
            <TouchableOpacity testID="go-pay" style={styles.payCta} onPress={() => router.push({ pathname: "/payments", params: { requestId: req.id } })} activeOpacity={0.85}>
              <Text style={styles.payCtaText}>
                💳{" "}
                {req.payment_status === "receipt_pending"
                  ? t("receiptPending")
                  : req.payment_status === "receipt_rejected"
                  ? t("receiptRejected")
                  : `${t("paymentRequired")} · ${req.payment_amount?.toLocaleString() || ""} so'm`}{" "}
                →
              </Text>
            </TouchableOpacity>
          )}
          {req.payment_status === "paid" && (
            <View style={styles.paidBanner}>
              <Text style={styles.paidBannerText}>✓ {t("paid")}</Text>
            </View>
          )}
          {req.payment_status === "receipt_pending" && isOwner && (
            <View style={styles.pendingBanner}>
              <Text style={styles.pendingText}>{t("receiptPending")}</Text>
            </View>
          )}

          {req.admin_note ? (
            <View style={styles.noteCard}>
              <Text style={styles.noteLabel}>{t("adminNote")}</Text>
              <Text style={styles.noteText}>{req.admin_note}</Text>
            </View>
          ) : null}

          {needsRating && (
            <View style={styles.ratingCard}>
              <Text style={styles.ratingTitle}>{t("rateService")}</Text>
              <Text style={styles.ratingHint}>{t("rateRequired")}</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity key={s} testID={`star-${s}`} onPress={() => setRating(s)} activeOpacity={0.7}>
                    <Star
                      color={s <= rating ? "#F59E0B" : COLORS.border}
                      fill={s <= rating ? "#F59E0B" : "transparent"}
                      size={38}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                testID="rate-comment"
                value={comment}
                onChangeText={setComment}
                placeholder={t("ratingComment")}
                placeholderTextColor={COLORS.textMuted}
                multiline
                style={styles.ratingInput}
              />
              <TouchableOpacity
                testID="rate-submit"
                style={[styles.ratingBtn, (!rating || busy) && { opacity: 0.5 }]}
                onPress={submitRating}
                disabled={!rating || busy}
                activeOpacity={0.85}
              >
                {busy ? <ActivityIndicator color={COLORS.onPrimary} /> : <Text style={styles.ratingBtnText}>{t("submitRating")}</Text>}
              </TouchableOpacity>
            </View>
          )}

          {req.rating && (
            <View style={styles.noteCard}>
              <Text style={styles.noteLabel}>{t("yourRating")}</Text>
              <View style={{ flexDirection: "row", gap: 4, marginTop: 6 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} color="#F59E0B" fill={s <= req.rating ? "#F59E0B" : "transparent"} size={18} />
                ))}
              </View>
              {!!req.rating_comment && <Text style={[styles.noteText, { marginTop: 6 }]}>{req.rating_comment}</Text>}
            </View>
          )}

          <Text style={styles.sectionLabel}>{t("description")}</Text>
          <View style={styles.box}>
            <Text style={styles.bodyText}>{req.form_data?.description || t("none")}</Text>
          </View>

          <Text style={styles.sectionLabel}>{t("files")}</Text>
          {documents.length ? documents.map((f: any, i: number) => <FileViewer key={`d-${i}`} f={f} />) : <View style={styles.box}><Text style={styles.bodyText}>{t("none")}</Text></View>}

          <Text style={styles.sectionLabel}>E-KEY / ERI</Text>
          {ekeys.length ? ekeys.map((f: any, i: number) => <FileViewer key={`k-${i}`} f={f} ekey />) : <View style={styles.box}><Text style={styles.bodyText}>{t("none")}</Text></View>}

          <Text style={styles.sectionLabel}>User</Text>
          <View style={styles.box}>
            <View style={styles.row}><User color={COLORS.textSecondary} size={16} /><Text style={styles.rowText}>{req.user_name}</Text></View>
            <View style={styles.row}><Mail color={COLORS.textSecondary} size={16} /><Text style={styles.rowText}>{req.user_email}</Text></View>
            <View style={styles.row}><Phone color={COLORS.textSecondary} size={16} /><Text style={styles.rowText}>{req.user_phone}</Text></View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  center: { alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "700", color: COLORS.text },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: 18, marginBottom: 16 },
  kicker: { fontSize: 11, fontWeight: "700", color: COLORS.primary, letterSpacing: 1, textTransform: "uppercase" },
  title: { fontSize: 20, fontWeight: "800", color: COLORS.text, marginTop: 4 },
  date: { color: COLORS.textMuted, fontSize: 12, marginTop: 12 },
  noteCard: {
    backgroundColor: COLORS.subtle, borderRadius: RADIUS.md, padding: 14, marginBottom: 16,
    borderLeftWidth: 4, borderLeftColor: COLORS.primary,
  },
  noteLabel: { fontSize: 11, fontWeight: "700", color: COLORS.primary, letterSpacing: 0.8, textTransform: "uppercase" },
  noteText: { color: COLORS.text, fontSize: 14, marginTop: 4 },
  ratingCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 18, marginBottom: 16,
    borderWidth: 2, borderColor: COLORS.primary,
  },
  ratingTitle: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  ratingHint: { fontSize: 12, color: COLORS.textMuted, marginTop: 4, marginBottom: 14 },
  starsRow: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 14 },
  ratingInput: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md,
    padding: 12, minHeight: 70, textAlignVertical: "top", color: COLORS.text,
    backgroundColor: COLORS.bg,
  },
  ratingBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: RADIUS.full, alignItems: "center", marginTop: 12 },
  ratingBtnText: { color: COLORS.onPrimary, fontWeight: "700" },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, marginTop: 8 },
  box: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 8 },
  bodyText: { color: COLORS.text, fontSize: 14, lineHeight: 20 },
  fileItem: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: 12, marginBottom: 8 },
  fileName: { color: COLORS.text, fontWeight: "600", fontSize: 13 },
  fileSize: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  rowText: { color: COLORS.text, fontSize: 13 },
  filePreview: { width: "100%", height: 240, borderRadius: RADIUS.md, backgroundColor: COLORS.border, marginBottom: 6 },
  fileActions: { flexDirection: "row", gap: 8, marginTop: 6 },
  fileBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.subtle, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.full },
  fileBtnText: { color: COLORS.primary, fontWeight: "700", fontSize: 12 },
  payCta: { backgroundColor: COLORS.primary, padding: 16, borderRadius: RADIUS.md, alignItems: "center", marginBottom: 16 },
  payCtaText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  paidBanner: { backgroundColor: COLORS.approvedBg, padding: 12, borderRadius: RADIUS.md, alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: COLORS.approvedBorder },
  paidBannerText: { color: COLORS.approvedText, fontWeight: "800" },
  pendingBanner: { backgroundColor: COLORS.subtle, padding: 12, borderRadius: RADIUS.md, alignItems: "center", marginBottom: 16 },
  pendingText: { color: COLORS.textSecondary, fontWeight: "600", fontSize: 13 },
});

function FileViewer({ f, ekey }: { f: any; ekey?: boolean }) {
  const isImage = f.mime?.startsWith("image/") && !!f.content;
  const dataUri = f.content ? `data:${f.mime};base64,${f.content}` : "";
  const open = async () => {
    if (!dataUri) return;
    try { await Linking.openURL(dataUri); } catch {}
  };
  return (
    <View style={styles.box}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {ekey ? <KeyIcon color={COLORS.primary} size={18} /> : <FileText color={COLORS.primary} size={18} />}
        <View style={{ flex: 1 }}>
          <Text style={styles.fileName}>{f.name}</Text>
          <Text style={styles.fileSize}>{(f.size / 1024).toFixed(1)} KB · {f.mime}</Text>
        </View>
      </View>
      {isImage && <Image source={{ uri: dataUri }} style={[styles.filePreview, { marginTop: 10 }]} resizeMode="cover" />}
      {!!f.content && (
        <View style={styles.fileActions}>
          <TouchableOpacity style={styles.fileBtn} onPress={open} activeOpacity={0.85} testID={`open-${f.name}`}>
            <Download color={COLORS.primary} size={14} />
            <Text style={styles.fileBtnText}>Open / Download</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
