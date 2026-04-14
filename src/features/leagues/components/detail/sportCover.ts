const SPORT_COVER_MAP: Record<string, string> = {
  tennis: "tennis",
  pickleball: "pickleball",
  running: "running",
  basketball: "basketball",
  soccer: "soccer",
  gym: "gym",
  yoga: "yoga",
  cycling: "cycling",
  hiking: "hiking",
};

export function getSportCoverImage(sportType: string | null | undefined): string {
  const key = sportType ?? "";
  const cover = SPORT_COVER_MAP[key] ?? "tennis";
  return `/covers/${cover}.jpg`;
}
