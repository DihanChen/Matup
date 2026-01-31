// Sport type to emoji mapping utility

export const sportEmojis: Record<string, string> = {
  running: "🏃",
  tennis: "🎾",
  cycling: "🚴",
  gym: "💪",
  yoga: "🧘",
  basketball: "🏀",
  soccer: "⚽",
  swimming: "🏊",
  hiking: "🥾",
  golf: "⛳",
  volleyball: "🏐",
  baseball: "⚾",
  football: "🏈",
  hockey: "🏒",
  skiing: "⛷️",
  snowboarding: "🏂",
  surfing: "🏄",
  boxing: "🥊",
  martial_arts: "🥋",
  climbing: "🧗",
  rowing: "🚣",
  badminton: "🏸",
  table_tennis: "🏓",
  skateboarding: "🛹",
  dance: "💃",
  pilates: "🤸",
  crossfit: "🏋️",
  other: "🎯",
};

export function getSportEmoji(sportType: string): string {
  const normalized = sportType.toLowerCase().replace(/\s+/g, "_");
  return sportEmojis[normalized] || "🎯";
}
