import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Inbox } from "lucide-react-native";
import { api } from "../../src/api";
import { useI18n } from "../../src/i18n";
import { COLORS, RADIUS } from "../../src/theme";
import { StatusBadge } from "../../src/components";

interface RequestItem {
  id: string;
  category: string;
  service_title: string;
  created_at: string;
  status: string;
}

export default function MyRequests() {
  const { t } = useI18n();
  const router = useRouter();
  const [items, setItems] = useState<RequestItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/requests/mine");
      setItems(data);
    } catch {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("myApplications")}</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 20, paddingTop: 4, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Inbox color={COLORS.textMuted} size={32} />
            <Text style={styles.emptyText}>{t("noApplications")}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            testID={`req-${item.id}`}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => router.push(`/request/${item.id}`)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.catTag}>
                {item.category === "single_window" ? t("singleWindow") : t("accounting")}
              </Text>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.service_title}
              </Text>
              <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleString()}</Text>
            </View>
            <StatusBadge status={item.status} label={t(item.status)} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: "800", color: COLORS.text },
  empty: { alignItems: "center", paddingVertical: 80 },
  emptyText: { color: COLORS.textMuted, marginTop: 8 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  catTag: { fontSize: 11, fontWeight: "700", color: COLORS.primary, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  cardDate: { fontSize: 12, color: COLORS.textMuted, marginTop: 6, marginBottom: 10 },
});
