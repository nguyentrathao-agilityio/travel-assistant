export const mockTip = {
  id: 'api-1',
  category: 'safety',
  scope: 'country',
  title: 'Keep document copies',
  content: 'Store digital copies of your passport.',
  is_essential: true,
  location: 'Vietnam',
};

export const apiTipsResponse = (tips: object[]) => ({
  country: 'Vietnam',
  city: 'Da Nang',
  count: tips.length,
  summary: 'Vietnam is a Southeast Asian country known for its beaches and street food.',
  tips,
});
