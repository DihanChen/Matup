export interface EventCreateFormData {
  sportType: string;
  date: string;
  time: string;
  duration: number;
  location: string;
  coordinates: { lat: number; lng: number } | null;
  locationName: string;
  addressLine: string;
  title: string;
  description: string;
  skillLevel: string;
  maxParticipants: number;
}
