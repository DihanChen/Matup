"use client";

interface Activity {
  id: string;
  name: string;
  gradient: string;
}

interface ActivityCardProps {
  activity: Activity;
  selected: boolean;
  onSelect: (id: string) => void;
}

export const ACTIVITIES: Activity[] = [
  { id: 'running', name: 'Running', gradient: 'from-orange-400 to-amber-500' },
  { id: 'tennis', name: 'Tennis', gradient: 'from-green-400 to-emerald-500' },
  { id: 'cycling', name: 'Cycling', gradient: 'from-blue-400 to-cyan-500' },
  { id: 'gym', name: 'Gym', gradient: 'from-purple-400 to-violet-500' },
  { id: 'yoga', name: 'Yoga', gradient: 'from-pink-400 to-rose-500' },
  { id: 'basketball', name: 'Basketball', gradient: 'from-orange-500 to-red-500' },
  { id: 'soccer', name: 'Soccer', gradient: 'from-green-500 to-teal-500' },
  { id: 'swimming', name: 'Swimming', gradient: 'from-cyan-400 to-blue-500' },
  { id: 'hiking', name: 'Hiking', gradient: 'from-amber-600 to-yellow-700' },
  { id: 'other', name: 'Other', gradient: 'from-zinc-400 to-zinc-500' },
];

function ActivityIcon({ id, className }: { id: string; className?: string }) {
  const iconClass = className || "w-8 h-8";

  switch (id) {
    case 'running':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l3-3 4 2-2 4-3-1-2-2z" />
        </svg>
      );
    case 'tennis':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" d="M3.5 12c0-2 3.8-3.5 8.5-3.5s8.5 1.5 8.5 3.5" />
          <path strokeLinecap="round" d="M3.5 12c0 2 3.8 3.5 8.5 3.5s8.5-1.5 8.5-3.5" />
        </svg>
      );
    case 'cycling':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="6" cy="17" r="3" />
          <circle cx="18" cy="17" r="3" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 17l4-7h4l2 3.5M10 10l2-4h3" />
        </svg>
      );
    case 'gym':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h2m14 0h2M6 12v-2a1 1 0 011-1h1v6H7a1 1 0 01-1-1v-2zm12 0v-2a1 1 0 00-1-1h-1v6h1a1 1 0 001-1v-2zm-10 0h8" />
        </svg>
      );
    case 'yoga':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="5" r="2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v4m0 0l-4 4m4-4l4 4m-8 2h8" />
        </svg>
      );
    case 'basketball':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" d="M12 3v18M3 12h18" />
          <path strokeLinecap="round" d="M5.5 5.5c2 2 2 5.5 0 7.5m13-7.5c-2 2-2 5.5 0 7.5" />
        </svg>
      );
    case 'soccer':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7l3 2.5v4L12 16l-3-2.5v-4L12 7z" />
          <path strokeLinecap="round" d="M12 3v4M12 16v5M3.5 9l3.5 1M17 10l3.5-1M3.5 15l3.5-1.5M17 13.5l3.5 1.5" />
        </svg>
      );
    case 'swimming':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 17c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0" />
          <circle cx="7" cy="9" r="2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 10l5-2 4 3" />
        </svg>
      );
    case 'hiking':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21l6-9 4 3 5-8 3 5" />
          <circle cx="17" cy="7" r="2" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
        </svg>
      );
  }
}

export default function ActivityCard({ activity, selected, onSelect }: ActivityCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(activity.id)}
      className={`
        relative p-6 rounded-2xl cursor-pointer transition-all duration-200
        bg-gradient-to-br ${activity.gradient}
        hover:scale-105 hover:shadow-xl
        ${selected
          ? 'ring-4 ring-emerald-500 ring-offset-2 scale-105 shadow-xl'
          : 'hover:ring-2 hover:ring-white/50'
        }
      `}
    >
      {selected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      <div className="text-white mb-2">
        <ActivityIcon id={activity.id} />
      </div>
      <div className="text-white font-semibold text-sm">{activity.name}</div>
    </button>
  );
}

export { ActivityIcon };
