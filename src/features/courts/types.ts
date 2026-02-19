export type Court = {
  id: string;
  name: string;
  description: string | null;
  address: string;
  latitude: number;
  longitude: number;
  sport_types: string[];
  image_url: string | null;
  created_by: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
};

export type CourtWithDistance = Court & {
  distance?: number;
};

export type CourtCreateFormData = {
  name: string;
  description: string;
  address: string;
  coordinates: { lat: number; lng: number } | null;
  sportTypes: string[];
  imageUrl: string;
};
