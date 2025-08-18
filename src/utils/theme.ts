interface AccentColor {
  name: string;
  value: string;
  class: string;
}

export const ACCENT_COLORS: AccentColor[] = [
  // Primary Colors (Blue first as default)
  { name: "Blue", value: "#0A84FF", class: "bg-[#0A84FF]" },
  { name: "Matrix Green", value: "#00FF41", class: "bg-[#00FF41]" },
  { name: "Neon Red", value: "#FF003C", class: "bg-[#FF003C]" },
  { name: "Purple", value: "#BF5AF2", class: "bg-[#BF5AF2]" },
  { name: "Orange", value: "#FF9F0A", class: "bg-[#FF9F0A]" },
  { name: "Pink", value: "#FF375F", class: "bg-[#FF375F]" },
  // Row 2 — Mid tones aligned to columns: [Blue, Green, Red, Purple, Orange, Pink]
  { name: "Deep Blue", value: "#0040DD", class: "bg-[#0040DD]" },
  { name: "Deep Green", value: "#2E8B57", class: "bg-[#2E8B57]" },
  { name: "Rose", value: "#FF6B6B", class: "bg-[#FF6B6B]" },
  { name: "Deep Purple", value: "#8A2BE2", class: "bg-[#8A2BE2]" },
  { name: "Amber", value: "#FFB020", class: "bg-[#FFB020]" },
  { name: "Coral", value: "#FF7D6B", class: "bg-[#FF7D6B]" },
  // Row 3 — Lighter/pastel tones aligned to columns
  { name: "Teal", value: "#64D2FF", class: "bg-[#64D2FF]" },
  { name: "Mint", value: "#66D4CF", class: "bg-[#66D4CF]" },
  { name: "Peach", value: "#FFB38A", class: "bg-[#FFB38A]" },
  { name: "Lavender", value: "#E4B4F4", class: "bg-[#E4B4F4]" },
  { name: "Yellow", value: "#FFD60A", class: "bg-[#FFD60A]" },
  { name: "Pastel Pink", value: "#FFC0CB", class: "bg-[#FFC0CB]" },
]; 