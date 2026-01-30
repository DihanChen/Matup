import { formatShortAddress } from "@/lib/formatAddress";

type LocationLinkProps = {
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  className?: string;
  showIcon?: boolean;
  asButton?: boolean; // Use button/span instead of anchor to avoid nested links
  showFullAddress?: boolean; // Show full address instead of shortened version
};

export default function LocationLink({
  location,
  latitude,
  longitude,
  className = "",
  showIcon = true,
  asButton = false,
  showFullAddress = false,
}: LocationLinkProps) {
  const displayLocation = showFullAddress ? location : formatShortAddress(location);
  // If we have coordinates, use them for more accurate Google Maps link
  // Otherwise, use the location string for search
  const mapsUrl =
    latitude && longitude
      ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    window.open(mapsUrl, "_blank", "noopener,noreferrer");
  };

  const content = (
    <>
      {showIcon && <span>📍</span>}
      <span className="truncate" title={location}>{displayLocation}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-3 h-3 flex-shrink-0 opacity-50"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
        />
      </svg>
    </>
  );

  if (asButton) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1 hover:text-emerald-600 transition-colors ${className}`}
      >
        {content}
      </button>
    );
  }

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 hover:text-emerald-600 transition-colors ${className}`}
      onClick={(e) => e.stopPropagation()} // Prevent parent click handlers
    >
      {content}
    </a>
  );
}
