export const VIBE_OPTIONS = [
  {
    value: "all",
    label: "Casual",
    description: "Just for fun and fitness",
    color: "bg-green-100 text-green-600",
  },
  {
    value: "intermediate",
    label: "Competitive",
    description: "Intense match, skilled play",
    color: "bg-orange-100 text-orange-600",
  },
  {
    value: "advanced",
    label: "Pro",
    description: "Advanced/Club level players",
    color: "bg-blue-100 text-blue-600",
  },
];

function generateDateOptions() {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 14; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push({
      value: date.toISOString().split("T")[0],
      dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum: date.getDate(),
      month: date.toLocaleDateString("en-US", { month: "short" }),
      isToday: i === 0,
      isTomorrow: i === 1,
    });
  }
  return dates;
}

export const DATE_OPTIONS = generateDateOptions();

function generateQuickTimes() {
  const times: Array<{ value: string; label: string }> = [];
  for (let hour = 6; hour <= 21; hour += 1) {
    for (const minute of [0, 30]) {
      const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      times.push({ value, label: formatTimeDisplay(value) });
    }
  }
  return times;
}

export const QUICK_TIMES = generateQuickTimes();

export function getCoverSrcForSport(sportType: string): string {
  if (sportType === "pickleball") return "/covers/tennis.jpg";
  return `/covers/${sportType}.jpg`;
}

export function formatTimeDisplay(time: string): string {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}
