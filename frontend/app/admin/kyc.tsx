import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, ShieldCheck, ShieldX } from "lucide-react-native";
import { api, formatApiError } from "../../src/api";
import { useI18n } from "../../src/i18n";
import { COLORS, RADIUS } from "../../src/theme";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface KycRecord {
  passport_photo: { content?: string; mime?: string };
  selfie_photo: { content?: string; mime?: string };
}

interface KycDetail {
  record: KycRecord;
}

export default function AdminKyc() {
  const router = useRouter();
  const { t } = useI18n();
  const [list, setList] = useState<User[]>([]);
  const [selected, setSelected] = useState<User | null>(null);
  const [detail, setDetail] = useState<KycDetail | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get("/admin/kyc", { params: { status: "pending" } });
    setList(data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openUser = async (u: any) => {
    setSelected(u);
    setNote("");
    setDetail(null);
    try {
      const { data } = await api.get(`/admin/kyc/${u.id}`);
      setDetail(data);
    } catch (e: any) { Alert.alert(t("error"), formatApiError(e)); }
  };

  const decide = async (decision: "approved" | "rejected") => {
    if (!selected) return;
    try {
      setBusy(true);
      await api.patch(`/admin/kyc/${selected.id}`, { decision, note });
      setSelected(null);
      setDetail(null);
      await load();
    } catch (e: any) { Alert.alert(t("error"), formatApiError(e)); }
    finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity testID="akyc-back" onPress={() => selected ? (setSelected(null), setDetail(null)) : router.back()} style={styles.back}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>{selected ? `${selected.first_name} ${selected.last_name}` : t("reviewKyc")}</Text>
        <View style={{ width: 44 }} />
      </View>

      {!selected ? (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {list.length === 0 && <Text style={styles.empty}>{t("none")}</Text>}
          {list.map((u) => (
            <TouchableOpacity
              key={u.id}
              testID={`kyc-user-${u.id}`}
              style={styles.userRow}
              onPress={() => openUser(u)}
              activeOpacity={0.85}
            >
              <View style={styles.av}><Text style={styles.avText}>{(u.first_name?.[0] || "") + (u.last_name?.[0] || "")}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.uName}>{u.first_name} {u.last_name}</Text>
                <Text style={styles.uMeta}>{u.email} · {u.phone}</Text>
              </View>
              <Text style={styles.pendingTag}>{t("kycPending")}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {!detail ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <>
              <Text style={styles.sectionLabel}>{t("kycPassport")}</Text>
              {detail.record?.passport_photo?.content ? (
                <Image source={{ uri: `data:${detail.record.passport_photo.mime};base64,${detail.record.passport_photo.content}` }} style={styles.photo} />
              ) : <Text style={styles.empty}>{t("none")}</Text>}

              <Text style={styles.sectionLabel}>{t("kycSelfie")}</Text>
              {detail.record?.selfie_photo?.content ? (
                <Image source={{ uri: `data:${detail.record.selfie_photo.mime};base64,${detail.record.selfie_photo.content}` }} style={styles.photo} />
              ) : <Text style={styles.empty}>{t("none")}</Text>}

              <Text style={styles.sectionLabel}>{t("adminNote")}</Text>
              <TextInput testID="kyc-note" value={note} onChangeText={setNote} style={styles.input} multiline placeholderTextColor={COLORS.textMuted} />

              <View style={styles.actions}>
                <TouchableOpacity testID="kyc-reject" style={[styles.btn, styles.btnReject]} onPress={() => decide("rejected")} disabled={busy} activeOpacity={0.85}>
                  <ShieldX color="#fff" size={16} />
                  <Text style={styles.btnText}>{t("reject")}</Text>
                </TouchableOpacity>
                <TouchableOpacity testID="kyc-approve" style={[styles.btn, styles.btnApprove]} onPress={() => decide("approved")} disabled={busy} activeOpacity={0.85}>
                  <ShieldCheck color="#fff" size={16} />
                  <Text style={styles.btnText}>{t("approve")}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "700", color: COLORS.text },
  empty: { color: COLORS.textMuted, textAlign: "center", paddingVertical: 40 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: 12, marginBottom: 10 },
  av: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  avText: { color: COLORS.onPrimary, fontWeight: "800" },
  uName: { color: COLORS.text, fontWeight: "700", fontSize: 14 },
  uMeta: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  pendingTag: { color: COLORS.pendingText, fontSize: 10, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, marginTop: 12 },
  photo: { width: "100%", height: 260, borderRadius: RADIUS.md, backgroundColor: COLORS.border },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 12, minHeight: 70, backgroundColor: COLORS.surface, color: COLORS.text, textAlignVertical: "top" },
  actions: { flexDirection: "row", gap: 10, marginTop: 18 },
  btn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: RADIUS.full },
  btnApprove: { backgroundColor: COLORS.primary },
  btnReject: { backgroundColor: COLORS.danger },
  btnText: { color: "#fff", fontWeight: "700" },
});
