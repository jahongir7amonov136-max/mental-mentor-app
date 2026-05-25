import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Send } from "lucide-react-native";
import { api } from "../../../src/api";
import { useI18n } from "../../../src/i18n";
import { COLORS, RADIUS } from "../../../src/theme";

export default function AdminChat() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/admin/support/messages/${userId}`);
      setMsgs(data);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
    } catch {}
  }, [userId]);

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
    try { await api.post("/admin/support/messages", { user_id: userId, text: t_ }); await load(); }
    catch {}
    finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity testID="achat-back" onPress={() => router.back()} style={styles.back}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("supportChat")}</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={80}>
        <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16 }} onContentSizeChange={() => scrollRef.current?.scrollToEnd()}>
          {msgs.map((m) => (
            <View key={m.id} style={[styles.bubble, m.sender === "admin" ? styles.bubbleAdmin : styles.bubbleUser]}>
              <Text style={[styles.bubbleText, m.sender === "admin" && { color: COLORS.onPrimary }]}>{m.text}</Text>
              <Text style={[styles.time, m.sender === "admin" && { color: "rgba(255,255,255,0.7)" }]}>
                {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.inputBar}>
          <TextInput testID="achat-input" value={text} onChangeText={setText} placeholder={t("writeMessage")} placeholderTextColor={COLORS.textMuted} style={styles.input} multiline />
          <TouchableOpacity testID="achat-send" style={styles.sendBtn} onPress={send} disabled={busy || !text.trim()} activeOpacity={0.85}>
            {busy ? <ActivityIndicator color="#fff" size="small" /> : <Send color="#fff" size={18} />}
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
  title: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "700", color: COLORS.text },
  bubble: { maxWidth: "80%", padding: 12, borderRadius: 14, marginBottom: 8 },
  bubbleAdmin: { alignSelf: "flex-end", backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleUser: { alignSelf: "flex-start", backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, color: COLORS.text },
  time: { fontSize: 10, color: COLORS.textMuted, marginTop: 4 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", padding: 10, borderTopWidth: 1, borderTopColor: COLORS.borderLight, backgroundColor: COLORS.surface, gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, maxHeight: 100, color: COLORS.text, fontSize: 14 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
});
