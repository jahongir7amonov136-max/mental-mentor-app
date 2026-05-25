import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { ArrowLeft, ChevronRight, MessageSquare } from "lucide-react-native";
import { api } from "../../src/api";
import { useI18n } from "../../src/i18n";
import { COLORS, RADIUS } from "../../src/theme";

export default function AdminSupport() {
  const router = useRouter();
  const { t } = useI18n();
  const [threads, setThreads] = useState<any[]>([]);

  const load = useCallback(async () => {
    const { data } = await api.get("/admin/support/threads");
    setThreads(data);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity testID="sup-back" onPress={() => router.back()} style={styles.back}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("openThreads")}</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {threads.length === 0 && (
          <View style={{ alignItems: "center", padding: 60 }}>
            <MessageSquare color={COLORS.textMuted} size={28} />
            <Text style={styles.empty}>{t("none")}</Text>
          </View>
        )}
        {threads.map((th) => (
          <TouchableOpacity
            key={th.user_id}
            testID={`thread-${th.user_id}`}
            style={styles.row}
            onPress={() => router.push(`/admin/chat/${th.user_id}`)}
            activeOpacity={0.85}
          >
            <View style={styles.av}>
              <Text style={styles.avText}>{th.user_name?.split(" ").map((p: string) => p[0]).slice(0, 2).join("")}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{th.user_name}</Text>
              <Text style={styles.last} numberOfLines={1}>{th.last_message || ""}</Text>
            </View>
            {!!th.unread_admin && (
              <View style={styles.badge}><Text style={styles.badgeText}>{th.unread_admin}</Text></View>
            )}
            <ChevronRight color={COLORS.textMuted} size={18} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "700", color: COLORS.text },
  empty: { color: COLORS.textMuted, marginTop: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: 12, marginBottom: 10 },
  av: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  avText: { color: COLORS.onPrimary, fontWeight: "800", fontSize: 13 },
  name: { color: COLORS.text, fontWeight: "700", fontSize: 14 },
  last: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  badge: { backgroundColor: COLORS.danger, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, minWidth: 22, alignItems: "center" },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
});
