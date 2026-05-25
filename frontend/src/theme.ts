export const COLORS = {
  bg: "#F8FAF9",
  surface: "#FFFFFF",
  subtle: "#EEF2F0",
  primary: "#0F4C3A",
  primaryLight: "#15634D",
  primaryDark: "#0A3326",
  onPrimary: "#FFFFFF",
  text: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#64748B",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  // status
  pendingBg: "#FEF3C7",
  pendingText: "#92400E",
  pendingBorder: "#FDE68A",
  inReviewBg: "#E0E7FF",
  inReviewText: "#3730A3",
  inReviewBorder: "#C7D2FE",
  approvedBg: "#D1FAE5",
  approvedText: "#065F46",
  approvedBorder: "#A7F3D0",
  rejectedBg: "#FEE2E2",
  rejectedText: "#991B1B",
  rejectedBorder: "#FECACA",
  danger: "#DC2626",
};

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const RADIUS = { sm: 8, md: 12, lg: 16, full: 9999 };

export const STATUS_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  pending: { bg: COLORS.pendingBg, text: COLORS.pendingText, border: COLORS.pendingBorder },
  in_review: { bg: COLORS.inReviewBg, text: COLORS.inReviewText, border: COLORS.inReviewBorder },
  approved: { bg: COLORS.approvedBg, text: COLORS.approvedText, border: COLORS.approvedBorder },
  rejected: { bg: COLORS.rejectedBg, text: COLORS.rejectedText, border: COLORS.rejectedBorder },
};
