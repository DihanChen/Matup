"use client";

interface Activity {
  id: string;
  name: string;
}

interface ActivityCardProps {
  activity: Activity;
  selected: boolean;
  onSelect: (id: string) => void;
}

export const ACTIVITIES: Activity[] = [
  { id: 'running', name: 'Running' },
  { id: 'tennis', name: 'Tennis' },
  { id: 'cycling', name: 'Cycling' },
  { id: 'gym', name: 'Gym' },
  { id: 'yoga', name: 'Yoga' },
  { id: 'basketball', name: 'Basketball' },
  { id: 'soccer', name: 'Soccer' },
  { id: 'hiking', name: 'Hiking' },
  { id: 'other', name: 'Other' },
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
        relative p-4 sm:p-5 lg:p-6 rounded-2xl cursor-pointer transition-all duration-200
        bg-zinc-100 flex flex-col items-center text-center
        hover:scale-105 hover:shadow-lg
        ${selected
          ? 'ring-2 ring-yellow-400 ring-offset-2 scale-105 shadow-lg'
          : 'hover:ring-2 hover:ring-zinc-300'
        }
      `}
    >
      <div className="text-zinc-900 mb-2 sm:mb-3">
        <ActivityIcon id={activity.id} className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10" />
      </div>
      <div className="text-zinc-900 font-semibold text-xs sm:text-sm">{activity.name}</div>
    </button>
  );
}

export { ActivityIcon };
