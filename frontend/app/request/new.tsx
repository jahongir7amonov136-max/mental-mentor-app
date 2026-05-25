import React, { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, UploadCloud, FileText, X, Key, ShieldAlert } from "lucide-react-native";
import { api, formatApiError } from "../../src/api";
import { useI18n } from "../../src/i18n";
import { useAuth } from "../../src/auth";
import { COLORS, RADIUS } from "../../src/theme";
import { pickDocument, PickedFile } from "../../src/files";

export default function NewRequest() {
  const { category, service_id, service_title } = useLocalSearchParams<{
    category: string; service_id: string; service_title: string;
  }>();
  const router = useRouter();
  const { t } = useI18n();
  const { user } = useAuth();

  const [description, setDescription] = useState("");
  const [documents, setDocuments] = useState<PickedFile[]>([]);
  const [ekeys, setEkeys] = useState<PickedFile[]>([]);
  const [busy, setBusy] = useState(false);

  if (user && user.kyc_status !== "approved") {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity testID="new-back" onPress={() => router.back()} style={styles.back}>
            <ArrowLeft color={COLORS.text} size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("requestService")}</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.kycGate}>
          <View style={styles.kycGateIcon}><ShieldAlert color={COLORS.primary} size={40} /></View>
          <Text style={styles.kycGateTitle}>{t("kycRequired")}</Text>
          <Text style={styles.kycGateDesc}>{t("kycInfo")}</Text>
          <TouchableOpacity testID="go-kyc" style={styles.kycGateBtn} onPress={() => router.replace("/kyc")} activeOpacity={0.85}>
            <Text style={styles.kycGateBtnText}>{t("goVerify")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const addDoc = async () => {
    try {
      const f = await pickDocument("document");
      if (f) setDocuments((p) => [...p, f]);
    } catch (e: any) { Alert.alert(t("error"), e?.message || "Error"); }
  };
  const addEkey = async () => {
    try {
      const f = await pickDocument("ekey");
      if (f) setEkeys((p) => [...p, f]);
    } catch (e: any) { Alert.alert(t("error"), e?.message || "Error"); }
  };

  const submit = async () => {
    try {
      setBusy(true);
      await api.post("/requests", {
        category, service_id, service_title,
        form_data: { description },
        documents, ekey_files: ekeys,
      });
      Alert.alert(t("success"), t("requestSubmitted"), [
        { text: "OK", onPress: () => router.replace("/(tabs)/services") },
      ]);
    } catch (e: any) {
      Alert.alert(t("error"), formatApiError(e));
    } finally { setBusy(false); }
  };

  const renderFileList = (list: PickedFile[], setter: (l: PickedFile[]) => void, tidPrefix: string) =>
    list.map((f, i) => (
      <View key={`${tidPrefix}-${i}`} testID={`${tidPrefix}-${i}`} style={styles.fileItem}>
        <FileText color={COLORS.primary} size={18} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.fileName} numberOfLines={1}>{f.name}</Text>
          <Text style={styles.fileSize}>{(f.size / 1024).toFixed(1)} KB</Text>
        </View>
        <TouchableOpacity testID={`${tidPrefix}-remove-${i}`} onPress={() => setter(list.filter((_, x) => x !== i))}>
          <X color={COLORS.danger} size={18} />
        </TouchableOpacity>
      </View>
    ));

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity testID="new-back" onPress={() => router.back()} style={styles.back}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("requestService")}</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.svcBanner}>
            <Text style={styles.svcKicker}>
              {category === "single_window" ? t("singleWindow") : t("accounting")}
            </Text>
            <Text testID="new-svc-title" style={styles.svcTitle}>{service_title}</Text>
          </View>

          <Text style={styles.label}>{t("description")}</Text>
          <TextInput
            testID="new-description"
            value={description}
            onChangeText={setDescription}
            placeholder={t("descriptionPlaceholder")}
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={5}
            style={[styles.input, { minHeight: 110, textAlignVertical: "top" }]}
          />

          <Text style={styles.label}>{t("uploadDocs")}</Text>
          <TouchableOpacity testID="upload-doc-btn" style={styles.dropzone} onPress={addDoc} activeOpacity={0.85}>
            <View style={styles.dropIcon}><UploadCloud color={COLORS.primary} size={22} /></View>
            <Text style={styles.dropTitle}>{t("addFile")}</Text>
            <Text style={styles.dropHint}>{t("uploadHint")}</Text>
          </TouchableOpacity>
          {renderFileList(documents, setDocuments, "doc")}

          <Text style={styles.label}>{t("uploadEkey")}</Text>
          <TouchableOpacity testID="upload-ekey-btn" style={styles.dropzone} onPress={addEkey} activeOpacity={0.85}>
            <View style={styles.dropIcon}><Key color={COLORS.primary} size={22} /></View>
            <Text style={styles.dropTitle}>{t("addFile")}</Text>
            <Text style={styles.dropHint}>.pfx / .pem / .key</Text>
          </TouchableOpacity>
          {renderFileList(ekeys, setEkeys, "ekey")}

          <TouchableOpacity
            testID="submit-request"
            style={[styles.button, busy && { opacity: 0.6 }]}
            disabled={busy}
            onPress={submit}
            activeOpacity={0.85}
          >
            {busy ? <ActivityIndicator color={COLORS.onPrimary} /> : <Text style={styles.buttonText}>{t("submitRequest")}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "700", color: COLORS.text },
  scroll: { padding: 20, paddingBottom: 40 },
  svcBanner: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: 18, marginBottom: 20 },
  svcKicker: { color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  svcTitle: { color: COLORS.onPrimary, fontSize: 20, fontWeight: "800", marginTop: 4 },
  label: { fontSize: 13, fontWeight: "700", color: COLORS.textSecondary, marginBottom: 8, marginTop: 14 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md,
    paddingHorizontal: 14, paddingVertical: 14, fontSize: 15,
    backgroundColor: COLORS.surface, color: COLORS.text, marginBottom: 4,
  },
  dropzone: {
    borderWidth: 2, borderColor: COLORS.border, borderStyle: "dashed",
    borderRadius: RADIUS.lg, paddingVertical: 22, alignItems: "center",
    backgroundColor: COLORS.surface, marginBottom: 10,
  },
  dropIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.subtle, alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  dropTitle: { fontWeight: "700", color: COLORS.text, fontSize: 14 },
  dropHint: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  fileItem: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, padding: 12, marginBottom: 8,
  },
  fileName: { color: COLORS.text, fontWeight: "600", fontSize: 13 },
  fileSize: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  button: {
    backgroundColor: COLORS.primary, paddingVertical: 16,
    borderRadius: RADIUS.full, alignItems: "center", marginTop: 24,
  },
  buttonText: { color: COLORS.onPrimary, fontWeight: "700", fontSize: 15 },
  kycGate: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  kycGateIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.subtle,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  kycGateTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text, textAlign: "center" },
  kycGateDesc: { fontSize: 13, color: COLORS.textMuted, textAlign: "center", marginTop: 8, lineHeight: 18 },
  kycGateBtn: {
    marginTop: 20, backgroundColor: COLORS.primary,
    paddingHorizontal: 28, paddingVertical: 14, borderRadius: RADIUS.full,
  },
  kycGateBtnText: { color: COLORS.onPrimary, fontWeight: "700", fontSize: 14 },
});
