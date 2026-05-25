import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Image, Animated, Easing, LayoutChangeEvent } from "react-native";
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

/** Gorizontal yuguruvchi matn — 1 ta yangilik bo'lsa ham harakatlanadi */
function MarqueeStrip({ text }: { text: string }) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [segmentWidth, setSegmentWidth] = useState(0);

  useEffect(() => {
    if (segmentWidth <= 0) return;
    scrollX.setValue(0);
    const anim = Animated.loop(
      Animated.timing(scrollX, {
        toValue: -segmentWidth,
        duration: Math.max(segmentWidth * 18, 6000),
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [segmentWidth, text, scrollX]);

  const onMeasure = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== segmentWidth) setSegmentWidth(w);
  };

  return (
    <View style={styles.marqueeBox}>
      <Animated.View style={[styles.marqueeRow, { transform: [{ translateX: scrollX }] }]}>
        <Text style={styles.marqueeText} onLayout={onMeasure}>
          {text}
        </Text>
        <Text style={[styles.marqueeText, styles.marqueeGap]}>{text}</Text>
      </Animated.View>
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

  const marqueeText = items
    .map((n) => `${n.title}${n.body ? ` — ${n.body}` : ""}`)
    .join("          •          ");

  const boxHeight =
    items.length === 1 ? CARD_HEIGHT + 8 : Math.min(240, items.length * (CARD_HEIGHT + CARD_GAP) + 8);

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Newspaper color={COLORS.primary} size={14} />
        <Text style={styles.label}>{title}</Text>
      </View>

      <MarqueeStrip text={marqueeText} />

      <View style={[styles.viewport, { height: boxHeight, marginTop: 10 }]}>
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
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  marqueeBox: {
    height: 40,
    overflow: "hidden",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    justifyContent: "center",
  },
  marqueeRow: { flexDirection: "row", alignItems: "center" },
  marqueeText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.onPrimary,
    flexShrink: 0,
  },
  marqueeGap: { marginLeft: 48 },
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
    width: 100,
    height: "100%",
    backgroundColor: COLORS.subtle,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, padding: 10, justifyContent: "center" },
  cardTitle: { fontSize: 14, fontWeight: "800", color: COLORS.text, marginBottom: 4 },
  cardText: { fontSize: 12, lineHeight: 17, color: COLORS.textSecondary },
});
