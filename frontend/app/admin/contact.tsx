import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { api, formatApiError } from "../../src/api";
import { useAuth, isSuperAdmin } from "../../src/auth";
import { useI18n } from "../../src/i18n";
import { COLORS, RADIUS } from "../../src/theme";

const FIELDS: [string, string][] = [
  ["address_uz", "Address (UZ)"],
  ["address_ru", "Address (RU)"],
  ["address_en", "Address (EN)"],
  ["phone", "Phone"],
  ["short_number", "Qisqa raqam (1313, 1107...)"],
  ["email", "Email"],
  ["working_hours", "Working Hours"],
  ["telegram", "Telegram"],
  ["website", "Website"],
];

export default function AdminContact() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (user && !isSuperAdmin(user)) router.replace("/(tabs)/admin");
  }, [user, router]);
  const [data, setData] = useState<any>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/about").then(({ data }) => setData(data.contact || {}));
  }, []);

  const save = async () => {
    setBusy(true);
    try {
      await api.patch("/admin/contact", data);
      Alert.alert(t("success"), "", [{ text: "OK", onPress: () => router.back() }]);
    } catch (e: any) { Alert.alert(t("error"), formatApiError(e)); }
    finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity testID="contact-back" onPress={() => router.back()} style={styles.back}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("contactMgmt")}</Text>
        <View style={{ width: 44 }} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
          {FIELDS.map(([k, label]) => (
            <View key={k}>
              <Text style={styles.lbl}>{label}</Text>
              <TextInput
                testID={`contact-${k}`}
                value={data[k] || ""}
                onChangeText={(v) => setData({ ...data, [k]: v })}
                style={[styles.input, k.startsWith("address") && { minHeight: 60, textAlignVertical: "top" }]}
                multiline={k.startsWith("address")}
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          ))}
          <TouchableOpacity testID="contact-save" style={styles.btn} onPress={save} disabled={busy} activeOpacity={0.85}>
            {busy ? <ActivityIndicator color={COLORS.onPrimary} /> : <Text style={styles.btnText}>{t("save")}</Text>}
          </TouchableOpacity>

          <TouchableOpacity testID="goto-contact-items" style={styles.linkBtn} onPress={() => router.push("/admin/contact-items")} activeOpacity={0.85}>
            <Text style={styles.linkBtnText}>{t("customContacts")} →</Text>
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
  title: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "700", color: COLORS.text },
  lbl: { fontSize: 11, fontWeight: "700", color: COLORS.textSecondary, letterSpacing: 0.5, textTransform: "uppercase", marginTop: 14, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 12, fontSize: 14, backgroundColor: COLORS.surface, color: COLORS.text },
  btn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: RADIUS.full, alignItems: "center", marginTop: 24 },
  btnText: { color: COLORS.onPrimary, fontWeight: "700", fontSize: 15 },
  linkBtn: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.primary, paddingVertical: 14, borderRadius: RADIUS.full, alignItems: "center", marginTop: 12 },
  linkBtnText: { color: COLORS.primary, fontWeight: "700", fontSize: 14 },
});
