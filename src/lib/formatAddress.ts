/**
 * Shortens a full address to a more concise format for display
 * Example: "Central Park Tennis Courts, Central Park, Manhattan, New York County, New York, United States"
 * Becomes: "Central Park Tennis Courts, New York"
 */
export function formatShortAddress(fullAddress: string): string {
  if (!fullAddress) return "";

  const parts = fullAddress.split(",").map((part) => part.trim());

  // If it's already short (3 parts or less), return as is
  if (parts.length <= 3) {
    return fullAddress;
  }

  // Strategy: Take first part (venue/street) and last 1-2 parts (state/country or city/country)
  const firstPart = parts[0]; // Venue or street name

  // Get meaningful location context from the end
  // Usually the pattern is: ..., City, State, Country or ..., City, Country
  const lastPart = parts[parts.length - 1]; // Country
  const secondLastPart = parts[parts.length - 2]; // State or City

  // If the address has multiple parts, show: "First part, State/City"
  // This gives context without being overwhelming
  if (parts.length > 4) {
    return `${firstPart}, ${secondLastPart}`;
  } else {
    // For shorter addresses, show first and last
    return `${firstPart}, ${lastPart}`;
  }
}
