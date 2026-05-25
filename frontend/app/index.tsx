import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import { useAuth, needsOffer, isStaff } from "../src/auth";
import { COLORS } from "../src/theme";

export default function Index() {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  if (!user) return <Redirect href="/(auth)/login" />;
  if (!isStaff(user) && needsOffer(user)) return <Redirect href="/offer" />;
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg },
});
