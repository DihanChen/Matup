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

export const QUICK_TIMES = [
  { value: "06:00", label: "06:00 AM" },
  { value: "07:00", label: "07:00 AM" },
  { value: "08:00", label: "08:00 AM" },
  { value: "09:00", label: "09:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "13:00", label: "01:00 PM" },
  { value: "14:00", label: "02:00 PM" },
  { value: "15:00", label: "03:00 PM" },
  { value: "16:00", label: "04:00 PM" },
  { value: "17:00", label: "05:00 PM" },
  { value: "18:00", label: "06:00 PM" },
  { value: "19:00", label: "07:00 PM" },
  { value: "20:00", label: "08:00 PM" },
  { value: "21:00", label: "09:00 PM" },
];

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
