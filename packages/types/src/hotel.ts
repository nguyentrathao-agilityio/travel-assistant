export interface Hotel {
  id: string;
  shortCode: string;
  name: string;
  city: string;
  country: string;
  address: string;
  starRating: number;
  pricePerNight: number;
  currency: string;
  amenities: string[];
  rating: number;
  reviewCount: number;
  imageUrl?: string;
}

export interface HotelAvailability extends Hotel {
  available: boolean;
  availableRooms: number;
  maxOccupancyPerRoom: number;
  nights: number;
  totalPrice: number;
}

export interface HotelSearchResult {
  total: number;
  results: HotelAvailability[];
}
