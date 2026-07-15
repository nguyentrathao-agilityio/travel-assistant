export const apiHotel = {
  id: 'HTL001',
  short_code: 'BM',
  code: 'BM-001',
  name: 'Beach Moon Hotel',
  city: 'Da Nang',
  country: 'Vietnam',
  address: '123 Vo Nguyen Giap',
  star_rating: 4,
  price_per_night: 60,
  currency: 'USD',
  amenities: ['pool', 'wifi', 'breakfast'],
  rating: 4.5,
  review_count: 320,
  image_url: 'https://example.com/hotel.jpg',
  available: true,
  available_rooms: 5,
  max_occupancy_per_room: 3,
  nights: 3,
  total_price: 180,
};

export const apiHotelsResponse = (results = [apiHotel]) => ({
  total: results.length,
  limit: 20,
  offset: 0,
  results,
  search: {
    city: 'Da Nang',
    check_in: '2026-08-10',
    check_out: '2026-08-13',
    nights: 3,
    rooms: 1,
    adults: 2,
    children: 0,
  },
});

export const hotelInput = {
  city: 'Da Nang',
  checkIn: '2026-08-10',
  checkOut: '2026-08-13',
};
