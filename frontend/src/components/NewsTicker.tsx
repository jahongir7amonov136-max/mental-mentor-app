import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Image, Animated, Easing } from "react-native";
import { Newspaper } from "lucide-react-native";
import { COLORS, RADIUS } from "../theme";

export type NewsItem = {
  id: string;
  title: string;
  body: string;
  image?: string;
  has_image?: boolean;
};

const CARD_GAP = 10;
const CARD_HEIGHT = 108;

function imageUri(image?: string) {
  if (!image) return null;
  return image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`;
}

function NewsCard({ item }: { item: NewsItem }) {
  const uri = imageUri(item.image);
  return (
    <View style={styles.card}>
      {uri ? (
        <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
      ) : (
        <View style={styles.thumbFallback}>
          <Newspaper color={COLORS.primary} size={22} />
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardText} numberOfLines={3}>{item.body}</Text>
      </View>
    </View>
  );
}

export function NewsTicker({ items, title }: { items: NewsItem[]; title: string }) {
  const scrollY = useRef(new Animated.Value(0)).current;

  const doubled = items.length > 0 ? [...items, ...items] : [];

  useEffect(() => {
    if (items.length < 2) {
      scrollY.setValue(0);
      return;
    }
    const oneSet = items.length * (CARD_HEIGHT + CARD_GAP);
    scrollY.setValue(0);
    const anim = Animated.loop(
      Animated.timing(scrollY, {
        toValue: -oneSet,
        duration: Math.max(items.length * 4500, 8000),
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [items, scrollY]);

  if (items.length === 0) return null;

  const boxHeight = items.length === 1 ? CARD_HEIGHT + 8 : Math.min(240, items.length * (CARD_HEIGHT + CARD_GAP) + 8);

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Newspaper color={COLORS.primary} size={14} />
        <Text style={styles.label}>{title}</Text>
      </View>
      <View style={[styles.viewport, { height: boxHeight }]}>
        {items.length === 1 ? (
          <NewsCard item={items[0]} />
        ) : (
          <Animated.View style={{ transform: [{ translateY: scrollY }] }}>
            {doubled.map((item, idx) => (
              <View key={`${item.id}-${idx}`} style={{ marginBottom: CARD_GAP }}>
                <NewsCard item={item} />
              </View>
            ))}
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 18 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  label: {
    fontSize: 12, fontWeight: "700", color: COLORS.textMuted,
    letterSpacing: 1.2, textTransform: "uppercase",
  },
  viewport: { overflow: "hidden", borderRadius: RADIUS.lg },
  card: {
    height: CARD_HEIGHT,
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  thumb: { width: 100, height: "100%" },
  thumbFallback: {
    width: 100, height: "100%", backgroundColor: COLORS.subtle,
    alignItems: "center", justifyContent: "center",
  },
  cardBody: { flex: 1, padding: 10, justifyContent: "center" },
  cardTitle: { fontSize: 14, fontWeight: "800", color: COLORS.text, marginBottom: 4 },
  cardText: { fontSize: 12, lineHeight: 17, color: COLORS.textSecondary },
});
