/**
 * Shortens a full address to a more concise format for display
 * Example: "Goodlife Fitness, 1156, Prospect Street, Uptown Centre, Prospect, Uptown, Fredericton, City of Fredericton, York County, New Brunswick, E3B 3C1, Canada"
 * Becomes: "Goodlife Fitness, Fredericton, New Brunswick"
 */
export function formatShortAddress(fullAddress: string): string {
  if (!fullAddress) return "";

  const parts = fullAddress.split(",").map((part) => part.trim());

  // If it's already short (3 parts or less), return as is
  if (parts.length <= 3) {
    return fullAddress;
  }

  const firstPart = parts[0]; // Venue or street name

  // Try to find city and province/state
  // Usually near the end: ..., City, Province/State, Postal Code, Country
  // We want to skip postal codes (contain numbers) and generic terms
  const skipTerms = ["county", "city of", "region", "district"];

  const meaningfulParts = parts.slice(1, -1).filter((part) => {
    const lower = part.toLowerCase();
    // Skip if it contains numbers (likely street number or postal code)
    if (/\d/.test(part)) return false;
    // Skip generic administrative terms
    if (skipTerms.some((term) => lower.includes(term))) return false;
    // Skip if too short (likely abbreviations or codes)
    if (part.length < 3) return false;
    return true;
  });

  // Take last 2 meaningful parts (usually city and province/state)
  const locationContext = meaningfulParts.slice(-2);

  if (locationContext.length >= 2) {
    return `${firstPart}, ${locationContext.join(", ")}`;
  } else if (locationContext.length === 1) {
    return `${firstPart}, ${locationContext[0]}`;
  } else {
    // Fallback: first part and second-to-last part
    return `${firstPart}, ${parts[parts.length - 2]}`;
  }
}
