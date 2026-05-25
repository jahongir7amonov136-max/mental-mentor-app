import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Phone, Mail, MapPin, Clock, Globe, Send as TgIcon, User, PhoneCall } from "lucide-react-native";
import { api } from "../src/api";
import { useI18n } from "../src/i18n";
import { COLORS, RADIUS } from "../src/theme";

export default function AboutScreen() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const [data, setData] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    api.get("/about").then(({ data }) => setData(data));
    api.get("/contact-items").then(({ data }) => setItems(data));
  }, []);

  const addr = data?.contact?.[`address_${lang}`] || data?.contact?.address_uz || "";
  const tg = data?.contact?.telegram || "";
  const tgHref = tg.startsWith("http") ? tg : tg.startsWith("@") ? `https://t.me/${tg.slice(1)}` : tg ? `https://t.me/${tg}` : "";
  const phone = data?.contact?.phone || "";
  const email = data?.contact?.email || "";
  const web = data?.contact?.website || "";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity testID="ab-back" onPress={() => router.back()} style={styles.back}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("aboutUs")}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Image source={require("../assets/images/logo-brand.png")} style={styles.logo} resizeMode="contain" />
        <Text style={styles.brand}>{t("appName")}</Text>
        <Text style={styles.brandSub}>{t("appSubtitle")}</Text>

        <Text style={styles.sectionLabel}>{t("team")}</Text>
        {(data?.team || []).map((m: any) => (
          <View key={m.id} style={styles.memberCard} testID={`member-${m.id}`}>
            {m.photo ? (
              <Image source={{ uri: `data:image/jpeg;base64,${m.photo}` }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarFallback}><User color={COLORS.primary} size={24} /></View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.memberName}>{m.name}</Text>
              <Text style={styles.memberRole}>{m.role}</Text>
              {!!m.phone && <Text style={styles.memberMeta}>{m.phone}</Text>}
              {!!m.email && <Text style={styles.memberMeta}>{m.email}</Text>}
            </View>
          </View>
        ))}

        <Text style={styles.sectionLabel}>{t("contactInfo")}</Text>
        <View style={styles.contactCard}>
          {!!addr && <ContactRow icon={<MapPin color={COLORS.primary} size={16} />} label={t("address")} value={addr} />}
          {!!phone && <ContactRow icon={<Phone color={COLORS.primary} size={16} />} label={t("phone")} value={phone} href={`tel:${phone.replace(/\s+/g, "")}`} />}
          {!!data?.contact?.short_number && <ContactRow icon={<PhoneCall color={COLORS.primary} size={16} />} label="Qisqa raqam" value={data.contact.short_number} href={`tel:${data.contact.short_number.replace(/\s+/g, "")}`} />}
          {!!email && <ContactRow icon={<Mail color={COLORS.primary} size={16} />} label={t("email")} value={email} href={`mailto:${email}`} />}
          {!!data?.contact?.working_hours && <ContactRow icon={<Clock color={COLORS.primary} size={16} />} label={t("workingHours")} value={data.contact.working_hours} />}
          {!!tg && <ContactRow icon={<TgIcon color={COLORS.primary} size={16} />} label="Telegram" value={tg} href={tgHref} />}
          {!!web && <ContactRow icon={<Globe color={COLORS.primary} size={16} />} label="Website" value={web} href={web.startsWith("http") ? web : `https://${web}`} />}
          {items.map((it) => (
            <ContactRow key={it.id} icon={<Globe color={COLORS.primary} size={16} />} label={it.label} value={it.value} href={it.href || undefined} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ContactRow({ icon, label, value, href }: { icon: any; label: string; value: string; href?: string }) {
  const Wrap: any = href ? TouchableOpacity : View;
  const onPress = href ? () => Linking.openURL(href).catch(() => {}) : undefined;
  return (
    <Wrap style={styles.contactRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.contactIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text style={[styles.contactValue, href && { color: COLORS.primary }]}>{value}</Text>
      </View>
    </Wrap>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "700", color: COLORS.text },
  scroll: { padding: 20, paddingBottom: 40, alignItems: "stretch" },
  logo: { alignSelf: "center", width: 150, height: 100, marginTop: 4, marginBottom: 8 },
  brand: { textAlign: "center", fontSize: 22, fontWeight: "900", color: COLORS.primary, letterSpacing: 2 },
  brandSub: { textAlign: "center", color: COLORS.textMuted, fontSize: 13, marginBottom: 24 },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10, marginTop: 10 },
  memberCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10,
  },
  avatarImg: { width: 56, height: 56, borderRadius: 28 },
  avatarFallback: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.subtle,
    alignItems: "center", justifyContent: "center",
  },
  memberName: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  memberRole: { fontSize: 12, color: COLORS.primary, fontWeight: "700", marginTop: 2 },
  memberMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  contactCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, padding: 6,
  },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12 },
  contactIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.subtle, alignItems: "center", justifyContent: "center" },
  contactLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  contactValue: { fontSize: 14, color: COLORS.text, marginTop: 2 },
});
