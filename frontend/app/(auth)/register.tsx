import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, Alert, ActivityIndicator,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useAuth } from "../../src/auth";
import { useI18n } from "../../src/i18n";
import { COLORS, RADIUS } from "../../src/theme";
import { formatApiError } from "../../src/api";

export default function Register() {
  const { register } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!firstName || !lastName || !phone || !password) {
      return Alert.alert(t("error"), t("requiredFieldsMissing"));
    }
    if (password.length < 6) {
      return Alert.alert(t("error"), "Parol kamida 6 ta belgidan iborat bo'lsin");
    }
    try {
      setBusy(true);
      await register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        password,
      });
      router.replace("/offer");
    } catch (e: any) {
      Alert.alert(t("error"), formatApiError(e));
    } finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={styles.back}>
            <ArrowLeft color={COLORS.text} size={22} />
          </TouchableOpacity>

          <Text style={styles.title}>{t("register")}</Text>

          <View style={styles.card}>
            <View style={styles.rowInputs}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.label}>{t("firstName")}</Text>
                <TextInput testID="reg-first-name" value={firstName} onChangeText={setFirstName} style={styles.input} placeholderTextColor={COLORS.textMuted} />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.label}>{t("lastName")}</Text>
                <TextInput testID="reg-last-name" value={lastName} onChangeText={setLastName} style={styles.input} placeholderTextColor={COLORS.textMuted} />
              </View>
            </View>

            <Text style={styles.label}>{t("phone")}</Text>
            <TextInput testID="reg-phone" value={phone} onChangeText={setPhone} placeholder="+998 90 123 45 67" keyboardType="phone-pad" style={styles.input} placeholderTextColor={COLORS.textMuted} />

            <Text style={styles.label}>{t("password")}</Text>
            <TextInput testID="reg-password" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry style={styles.input} placeholderTextColor={COLORS.textMuted} />

            <TouchableOpacity testID="reg-submit" style={[styles.button, busy && { opacity: 0.6 }]} onPress={onSubmit} disabled={busy} activeOpacity={0.85}>
              {busy ? <ActivityIndicator color={COLORS.onPrimary} /> : <Text style={styles.buttonText}>{t("register")}</Text>}
            </TouchableOpacity>

            <View style={styles.row}>
              <Text style={styles.muted}>{t("haveAccount")} </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity testID="goto-login"><Text style={styles.linkText}>{t("login")}</Text></TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flexGrow: 1, padding: 20 },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "800", color: COLORS.text, marginTop: 8, marginBottom: 20 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 20, borderWidth: 1, borderColor: COLORS.border },
  rowInputs: { flexDirection: "row" },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, backgroundColor: COLORS.bg, color: COLORS.text },
  button: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: RADIUS.full, alignItems: "center", marginTop: 24 },
  buttonText: { color: COLORS.onPrimary, fontWeight: "700", fontSize: 15 },
  row: { flexDirection: "row", justifyContent: "center", marginTop: 18 },
  muted: { color: COLORS.textMuted, fontSize: 14 },
  linkText: { color: COLORS.primary, fontWeight: "700", fontSize: 14 },
});
