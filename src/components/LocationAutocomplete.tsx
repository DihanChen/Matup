"use client";

import { useState, useEffect, useRef } from "react";

type LocationSuggestion = {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
  };
};

type LocationAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  onLocationSelect: (location: { address: string; lat: number; lng: number }) => void;
  placeholder?: string;
  required?: boolean;
};

export default function LocationAutocomplete({
  value,
  onChange,
  onLocationSelect,
  placeholder = "Enter a location",
  required = false,
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions from Nominatim
  async function fetchSuggestions(query: string) {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setSearchAttempted(false);
      return;
    }

    setIsLoading(true);
    setSearchAttempted(true);

    try {
      // Using Nominatim's free API with a 1-second debounce to respect rate limits
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          new URLSearchParams({
            q: query,
            format: "json",
            addressdetails: "1",
            limit: "5",
          }),
        {
          headers: {
            "Accept-Language": "en-US,en",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        setIsOpen(true); // Always open to show results or "no results" message
      }
    } catch (error) {
      console.error("Error fetching location suggestions:", error);
      setSuggestions([]);
      setIsOpen(true);
    } finally {
      setIsLoading(false);
    }
  }

  // Debounce search to respect Nominatim rate limits (1 req/sec)
  function handleInputChange(inputValue: string) {
    onChange(inputValue);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(inputValue);
    }, 1000); // 1 second debounce
  }

  function handleSelectSuggestion(suggestion: LocationSuggestion) {
    const formattedAddress = suggestion.display_name;
    onChange(formattedAddress);
    onLocationSelect({
      address: formattedAddress,
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    });
    setSuggestions([]);
    setIsOpen(false);
    setSearchAttempted(false);
  }

  // Format a shorter display name from the suggestion
  function formatShortName(suggestion: LocationSuggestion): string {
    const parts = [];
    const addr = suggestion.address;

    if (addr.city) parts.push(addr.city);
    else if (addr.town) parts.push(addr.town);
    else if (addr.village) parts.push(addr.village);

    if (addr.state) parts.push(addr.state);
    if (addr.country) parts.push(addr.country);

    return parts.join(", ") || suggestion.display_name;
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => value.length >= 3 && suggestions.length > 0 && setIsOpen(true)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2 border border-zinc-300 rounded-lg bg-white text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
      />

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <svg
            className="animate-spin h-5 w-5 text-emerald-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      )}

      {/* Suggestions dropdown */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-6 text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-600">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="text-sm font-medium">Searching locations...</span>
              </div>
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors border-b border-zinc-100 last:border-b-0"
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg mt-0.5">📍</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-zinc-900 truncate">
                      {formatShortName(suggestion)}
                    </div>
                    <div className="text-sm text-zinc-500 truncate">
                      {suggestion.display_name}
                    </div>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-zinc-500">
              <div className="text-2xl mb-2">🔍</div>
              <div className="text-sm">No locations found</div>
              <div className="text-xs text-zinc-400 mt-1">Try a different search term</div>
            </div>
          )}
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs mt-1 flex items-center gap-1">
        {isLoading ? (
          <span className="text-emerald-600 font-medium animate-pulse">⏳ Searching...</span>
        ) : searchAttempted && !isLoading && suggestions.length > 0 ? (
          <span className="text-emerald-600">✓ {suggestions.length} location{suggestions.length !== 1 ? 's' : ''} found - select one below</span>
        ) : value.length > 0 && value.length < 3 ? (
          <span className="text-zinc-500">Type at least 3 characters to search</span>
        ) : (
          <span className="text-zinc-500">Start typing to search for a location</span>
        )}
      </p>
    </div>
  );
}
