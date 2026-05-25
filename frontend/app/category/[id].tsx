import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronRight, ArrowLeft } from "lucide-react-native";
import { api } from "../../src/api";
import { useI18n } from "../../src/i18n";
import { COLORS, RADIUS } from "../../src/theme";

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, lang } = useI18n();
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    api.get("/services/catalog").then(({ data }) => {
      setServices(data[id as string] || []);
    });
  }, [id]);

  const title = id === "single_window" ? t("singleWindow") : t("accounting");
  const titleKey = `title_${lang}` as const;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity testID="cat-back" onPress={() => router.back()} style={styles.back}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>{t("chooseService")}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>

      <FlatList
        data={services}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            testID={`svc-${item.id}`}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: "/request/new",
                params: {
                  category: id,
                  service_id: item.id,
                  service_title: item[titleKey] || item.title_en,
                },
              })
            }
          >
            <View style={styles.iconBox}>
              <Text style={styles.iconText}>{(item[titleKey] || item.title_en)[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.svcTitle}>{item[titleKey] || item.title_en}</Text>
            </View>
            <ChevronRight color={COLORS.textMuted} size={18} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12 },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  kicker: { fontSize: 11, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase" },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.text },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.subtle,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { color: COLORS.primary, fontWeight: "800", fontSize: 18 },
  svcTitle: { fontSize: 15, fontWeight: "600", color: COLORS.text },
});
