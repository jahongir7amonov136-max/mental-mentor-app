import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Send } from "lucide-react-native";
import { api } from "../src/api";
import { useI18n } from "../src/i18n";
import { COLORS, RADIUS } from "../src/theme";

export default function SupportScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/support/messages/mine");
      setMsgs(data);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
    } catch {}
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 10000);
    return () => clearInterval(iv);
  }, [load]);

  const send = async () => {
    const t_ = text.trim();
    if (!t_) return;
    setBusy(true);
    setText("");
    try {
      await api.post("/support/messages", { text: t_ });
      await load();
    } catch {}
    finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity testID="sup-back" onPress={() => router.back()} style={styles.back}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t("supportChat")}</Text>
          <Text style={styles.sub}>{t("supportDesc")}</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={80}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} onContentSizeChange={() => scrollRef.current?.scrollToEnd()}>
          {msgs.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t("supportDesc")}</Text>
            </View>
          )}
          {msgs.map((m) => (
            <View key={m.id} style={[styles.bubble, m.sender === "admin" ? styles.bubbleAdmin : styles.bubbleUser]}>
              <Text style={[styles.bubbleText, m.sender === "user" && { color: COLORS.onPrimary }]}>{m.text}</Text>
              <Text style={[styles.bubbleTime, m.sender === "user" && { color: "rgba(255,255,255,0.7)" }]}>
                {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            testID="sup-input"
            value={text}
            onChangeText={setText}
            placeholder={t("writeMessage")}
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
            multiline
          />
          <TouchableOpacity testID="sup-send" style={styles.sendBtn} onPress={send} disabled={busy || !text.trim()} activeOpacity={0.85}>
            {busy ? <ActivityIndicator color={COLORS.onPrimary} size="small" /> : <Send color={COLORS.onPrimary} size={18} />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  sub: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 20 },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyText: { color: COLORS.textMuted, fontSize: 13, textAlign: "center", paddingHorizontal: 40 },
  bubble: { maxWidth: "80%", padding: 12, borderRadius: 14, marginBottom: 8 },
  bubbleUser: { alignSelf: "flex-end", backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleAdmin: { alignSelf: "flex-start", backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, color: COLORS.text },
  bubbleTime: { fontSize: 10, color: COLORS.textMuted, marginTop: 4 },
  inputBar: {
    flexDirection: "row", alignItems: "flex-end", padding: 10,
    borderTopWidth: 1, borderTopColor: COLORS.borderLight, backgroundColor: COLORS.surface, gap: 8,
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10, maxHeight: 100, color: COLORS.text, fontSize: 14,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
});
