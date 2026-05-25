import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth, needsOffer } from "../../src/auth";
import { useI18n } from "../../src/i18n";
import { COLORS, RADIUS } from "../../src/theme";
import { formatApiError } from "../../src/api";

export default function Login() {
  const { login } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!phone || !password) return Alert.alert(t("error"), t("requiredFieldsMissing"));
    try {
      setBusy(true);
      const u = await login(phone.trim(), password);
      if (needsOffer(u)) router.replace("/offer");
      else router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert(t("error"), formatApiError(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.decorTop} />
          <View style={styles.decorTopRight} />
          <View style={styles.logoBox}>
            <View style={styles.logoCircle}>
              <Image source={require("../../assets/images/logo-brand.png")} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={styles.brand}>{t("appName")}</Text>
            <Text style={styles.tagline}>Raqamli Xizmatlar Markazi</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>{t("phone")}</Text>
            <TextInput
              testID="login-phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="+998 90 123 45 67"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
            <Text style={styles.label}>{t("password")}</Text>
            <TextInput
              testID="login-password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
              style={styles.input}
            />

            <TouchableOpacity
              testID="login-submit"
              style={[styles.button, busy && { opacity: 0.6 }]}
              onPress={onSubmit}
              disabled={busy}
              activeOpacity={0.85}
            >
              {busy ? (
                <ActivityIndicator color={COLORS.onPrimary} />
              ) : (
                <Text style={styles.buttonText}>{t("login")}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.row}>
              <Text style={styles.muted}>{t("noAccount")} </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity testID="goto-register">
                  <Text style={styles.linkText}>{t("register")}</Text>
                </TouchableOpacity>
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
  scroll: { flexGrow: 1, padding: 20, justifyContent: "center" },
  decorTop: { position: "absolute", top: -120, left: -100, width: 280, height: 280, borderRadius: 140, backgroundColor: COLORS.primary, opacity: 0.07 },
  decorTopRight: { position: "absolute", top: 80, right: -80, width: 180, height: 180, borderRadius: 90, backgroundColor: COLORS.primary, opacity: 0.05 },
  logoBox: { alignItems: "center", marginBottom: 32 },
  logoCircle: { width: 180, height: 180, borderRadius: 90, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: "rgba(15, 76, 58, 0.12)", shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 8, marginBottom: 18 },
  logo: { width: 140, height: 140 },
  brand: { fontSize: 30, fontWeight: "900", color: COLORS.primary, letterSpacing: 3, marginTop: 6 },
  tagline: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6, letterSpacing: 0.5, textAlign: "center" },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    backgroundColor: COLORS.bg,
    color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: RADIUS.full,
    alignItems: "center",
    marginTop: 24,
  },
  buttonText: { color: COLORS.onPrimary, fontWeight: "700", fontSize: 15 },
  row: { flexDirection: "row", justifyContent: "center", marginTop: 18 },
  muted: { color: COLORS.textMuted, fontSize: 14 },
  linkText: { color: COLORS.primary, fontWeight: "700", fontSize: 14 },
});
