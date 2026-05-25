import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { ArrowLeft, Bell, CheckCheck } from "lucide-react-native";
import { api } from "../src/api";
import { useI18n } from "../src/i18n";
import { COLORS, RADIUS } from "../src/theme";

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get("/notifications/mine");
    setItems(data);
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    api.post("/notifications/read-all").catch(() => {});
  }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const open = async (n: any) => {
    if (!n.read) try { await api.post(`/notifications/${n.id}/read`); } catch {}
    if (n.kind === "payment" && n.request_id) {
      router.push({ pathname: "/payments", params: { requestId: n.request_id } });
    } else if (n.request_id) {
      router.push(`/request/${n.request_id}`);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity testID="notif-back" onPress={() => router.back()} style={styles.back}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("notifications")}</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>
        {items.length === 0 && (
          <View style={styles.empty}><Bell color={COLORS.textMuted} size={28} /><Text style={styles.emptyText}>{t("none")}</Text></View>
        )}
        {items.map((n) => (
          <TouchableOpacity key={n.id} style={[styles.item, !n.read && styles.unread]} onPress={() => open(n)} activeOpacity={0.85} testID={`notif-${n.id}`}>
            <View style={styles.icon}>
              {n.read ? <CheckCheck color={COLORS.textMuted} size={18} /> : <Bell color={COLORS.primary} size={18} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle} numberOfLines={2}>{n.title}</Text>
              {!!n.body && <Text style={styles.itemBody} numberOfLines={3}>{n.body}</Text>}
              <Text style={styles.itemDate}>{new Date(n.created_at).toLocaleString()}</Text>
            </View>
            {!n.read && <View style={styles.dot} />}
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
  empty: { alignItems: "center", paddingVertical: 80 },
  emptyText: { color: COLORS.textMuted, marginTop: 8 },
  item: { flexDirection: "row", gap: 12, alignItems: "flex-start", backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10 },
  unread: { borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.subtle, alignItems: "center", justifyContent: "center" },
  itemTitle: { color: COLORS.text, fontWeight: "800", fontSize: 14 },
  itemBody: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4 },
  itemDate: { color: COLORS.textMuted, fontSize: 11, marginTop: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary, alignSelf: "flex-start", marginTop: 6 },
});
