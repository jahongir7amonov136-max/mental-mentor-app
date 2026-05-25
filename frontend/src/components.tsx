import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, RADIUS, STATUS_COLORS } from "./theme";

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.pending;
  return (
    <View
      testID={`status-badge-${status}`}
      style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }]}
    >
      <View style={[styles.dot, { backgroundColor: c.text }]} />
      <Text style={[styles.text, { color: c.text }]}>
        {(label ?? status).toUpperCase().replace("_", " ")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  text: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
});
