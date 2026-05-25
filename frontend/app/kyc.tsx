import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Camera, IdCard, ShieldAlert, ShieldCheck, Upload } from "lucide-react-native";
import { api, formatApiError } from "../src/api";
import { useI18n } from "../src/i18n";
import { useAuth } from "../src/auth";
import { COLORS, RADIUS } from "../src/theme";
import { pickImage, takeSelfie, PickedFile } from "../src/files";

export default function KycScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, refresh } = useAuth();
  const [passport, setPassport] = useState<PickedFile | null>(null);
  const [selfie, setSelfie] = useState<PickedFile | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!passport || !selfie) return Alert.alert(t("error"), t("requiredFieldsMissing"));
    try {
      setBusy(true);
      await api.post("/kyc/submit", { passport_photo: passport, selfie_photo: selfie });
      await refresh();
      Alert.alert(t("success"), t("kycBannerPending"), [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) { Alert.alert(t("error"), formatApiError(e)); }
    finally { setBusy(false); }
  };

  const pickPassport = async () => {
    try { const f = await pickImage("passport"); if (f) setPassport(f); } catch (e: any) { Alert.alert(t("error"), e?.message); }
  };
  const pickSelfie = async () => {
    try { const f = await takeSelfie("selfie"); if (f) setSelfie(f); } catch (e: any) { Alert.alert(t("error"), e?.message); }
  };

  const status = user?.kyc_status || "none";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity testID="kyc-back" onPress={() => router.back()} style={styles.back}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("kyc")}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.statusBox, status === "approved" && { backgroundColor: COLORS.approvedBg, borderColor: COLORS.approvedBorder }]}>
          {status === "approved" ? (
            <ShieldCheck color={COLORS.approvedText} size={28} />
          ) : (
            <ShieldAlert color={status === "rejected" ? COLORS.rejectedText : COLORS.primary} size={28} />
          )}
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.statusLabel}>{t("kycStatus")}</Text>
            <Text style={styles.statusValue}>
              {status === "none" ? t("kycNone") : status === "pending" ? t("kycPending") : status === "approved" ? t("kycApproved") : t("kycRejected")}
            </Text>
            {!!user?.kyc_note && <Text style={styles.statusNote}>{user.kyc_note}</Text>}
          </View>
        </View>

        <Text style={styles.hint}>{t("kycInfo")}</Text>

        <Text style={styles.label}>{t("kycPassport")}</Text>
        <TouchableOpacity testID="pick-passport" style={styles.uploadBox} onPress={pickPassport} activeOpacity={0.85}>
          {passport?.content ? (
            <Image source={{ uri: `data:${passport.mime};base64,${passport.content}` }} style={styles.preview} resizeMode="cover" />
          ) : (
            <>
              <View style={styles.uploadIcon}><IdCard color={COLORS.primary} size={24} /></View>
              <Text style={styles.uploadText}>{t("pickPhoto")}</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>{t("kycSelfie")}</Text>
        <TouchableOpacity testID="pick-selfie" style={styles.uploadBox} onPress={pickSelfie} activeOpacity={0.85}>
          {selfie?.content ? (
            <Image source={{ uri: `data:${selfie.mime};base64,${selfie.content}` }} style={styles.preview} resizeMode="cover" />
          ) : (
            <>
              <View style={styles.uploadIcon}><Camera color={COLORS.primary} size={24} /></View>
              <Text style={styles.uploadText}>{t("pickPhoto")}</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          testID="kyc-submit"
          style={[styles.button, (!passport || !selfie || busy) && { opacity: 0.5 }]}
          onPress={submit}
          disabled={!passport || !selfie || busy}
          activeOpacity={0.85}
        >
          {busy ? <ActivityIndicator color={COLORS.onPrimary} /> : (
            <>
              <Upload color={COLORS.onPrimary} size={16} />
              <Text style={styles.buttonText}>{t("kycSubmit")}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "700", color: COLORS.text },
  scroll: { padding: 20, paddingBottom: 40 },
  statusBox: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.subtle, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 14,
  },
  statusLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
  statusValue: { color: COLORS.text, fontSize: 16, fontWeight: "800", marginTop: 2 },
  statusNote: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  hint: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "700", color: COLORS.textSecondary, marginBottom: 8, marginTop: 8 },
  uploadBox: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 2, borderColor: COLORS.border, borderStyle: "dashed",
    height: 180, alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 4,
  },
  uploadIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.subtle, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  uploadText: { color: COLORS.primary, fontWeight: "700", fontSize: 14 },
  preview: { width: "100%", height: "100%" },
  button: {
    flexDirection: "row", gap: 8, justifyContent: "center",
    backgroundColor: COLORS.primary, paddingVertical: 16,
    borderRadius: RADIUS.full, alignItems: "center", marginTop: 24,
  },
  buttonText: { color: COLORS.onPrimary, fontWeight: "700", fontSize: 15 },
});
