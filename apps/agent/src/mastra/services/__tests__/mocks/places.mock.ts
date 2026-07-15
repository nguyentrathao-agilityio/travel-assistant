export const apiPlace = {
  id: 'PL001',
  short_code: 'MB',
  name: 'My Khe Beach',
  city: 'Da Nang',
  country: 'Vietnam',
  category: 'attraction',
  description: 'One of the most beautiful beaches in Vietnam.',
  address: 'My Khe, Da Nang',
  rating: 4.7,
  review_count: 1200,
  price_level: 1,
  opening_hours: 'Open 24h',
  image_url: 'https://example.com/beach.jpg',
  tags: ['beach', 'sunset'],
  is_recommended: true,
  latitude: 16.06,
  longitude: 108.24,
};

export const apiPlacesResponse = (results = [apiPlace]) => ({
  total: results.length,
  results,
  city: 'Da Nang',
  category: null,
});
