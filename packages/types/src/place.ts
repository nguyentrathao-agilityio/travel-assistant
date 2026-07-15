export type PlaceCategory =
  | 'attraction'
  | 'restaurant'
  | 'cafe'
  | 'activity'
  | 'nightlife'
  | 'shopping';

export interface Place {
  id: string;
  shortCode: string;
  name: string;
  city: string;
  country: string;
  category: PlaceCategory;
  description: string;
  address: string;
  rating: number;
  reviewCount: number;
  priceLevel: number;
  openingHours?: string;
  imageUrl: string;
  tags: string[];
  isRecommended: boolean;
  latitude?: number;
  longitude?: number;
}

export interface PlaceSearchResult {
  total: number;
  results: Place[];
  city?: string;
  category?: string;
}
