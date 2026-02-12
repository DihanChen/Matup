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
  { id: 'pickleball', name: 'Pickleball' },
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
  <svg
    className={iconClass}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M21.481 14.068l-2.2-6.585a1 1 0 00-.949-.683 4.865 4.865 0 01-2.893-.907 7.623 7.623 0 01-1.463-3.113 1 1 0 00-1.683-.487l-6 6a1 1 0 00.016 1.43l12.537 12a1 1 0 001.4-.016l1.654-1.658a3.75 3.75 0 000-5.3 1.751 1.751 0 01-.419-.681zm-.992 4.567l-.967.967L8.43 8.984l4.114-4.114A7.358 7.358 0 0014.03 7.307 6.076 6.076 0 0017.6 8.757l1.983 5.943a3.778 3.778 0 00.906 1.464 1.75 1.75 0 010 2.471zM1 17a1 1 0 011-1h8a1 1 0 010 2H2a1 1 0 01-1-1zm0-4a1 1 0 011-1h4a1 1 0 010 2H2a1 1 0 01-1-1zm0 8a1 1 0 011-1h12a1 1 0 010 2H2a1 1 0 01-1-1z" />
  </svg>
      );
    case 'tennis':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="8" />
          <path strokeLinecap="round" d="M8.15 4.95Q13.35 12 8.15 19.05" />
          <path strokeLinecap="round" d="M15.85 4.95Q10.65 12 15.85 19.05" />
        </svg>
      );
    case 'pickleball':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <rect x="4.5" y="3.5" width="8.5" height="12" rx="2.5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.75 15.5v5m-2 0h4" />
          <circle cx="16.75" cy="9.5" r="3.75" />
          <circle cx="16.2" cy="8.3" r="0.45" fill="currentColor" stroke="none" />
          <circle cx="17.9" cy="8.9" r="0.45" fill="currentColor" stroke="none" />
          <circle cx="15.7" cy="10.2" r="0.45" fill="currentColor" stroke="none" />
          <circle cx="17.3" cy="10.9" r="0.45" fill="currentColor" stroke="none" />
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
          <circle cx="12" cy="12" r="8" />
          <path strokeLinecap="round" d="M12 4v16" />
          <path strokeLinecap="round" d="M4 12h16" />
          <path strokeLinecap="round" d="M7.75 5.25Q10.75 8.15 10.75 12Q10.75 15.85 7.75 18.75" />
          <path strokeLinecap="round" d="M16.25 5.25Q13.25 8.15 13.25 12Q13.25 15.85 16.25 18.75" />
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
