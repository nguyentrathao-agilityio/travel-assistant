import type { KnowledgeDocument } from '../schemas/knowledge';

/**
 * Small, trusted starter corpus. Production ingestion should replace/extend this
 * with versioned content fetched from allow-listed official sources.
 */
export const KNOWLEDGE_CORPUS: KnowledgeDocument[] = [
  {
    id: 'vn-evisa-official',
    title: 'Vietnam electronic visa portal',
    content:
      'Vietnam immigration publishes electronic visa application and status services on its official portal. Entry eligibility, permitted duration, fees, and processing guidance can change; travelers must verify the current rules for their nationality on the official portal before travel.',
    sourceUrl: 'https://evisa.gov.vn/',
    sourceName: 'Vietnam Immigration Department',
    country: 'Vietnam',
    category: 'entry',
    updatedAt: '2026-07-30',
    validUntil: null,
    authority: 'official',
  },
  {
    id: 'vn-tourism-practical',
    title: 'Vietnam practical travel information',
    content:
      'Official Vietnam tourism guidance covers practical destination planning, transportation, weather, culture, and responsible travel. Conditions differ by region and season, so an itinerary should be checked against the destination and travel dates.',
    sourceUrl: 'https://vietnam.travel/plan-your-trip',
    sourceName: 'Vietnam National Authority of Tourism',
    country: 'Vietnam',
    category: 'planning',
    updatedAt: '2026-07-30',
    validUntil: null,
    authority: 'official',
  },
  {
    id: 'jp-visa-official',
    title: 'Japan visa and entry guidance',
    content:
      'Japan Ministry of Foreign Affairs maintains nationality-specific visa and entry guidance. Visa exemption and application requirements depend on passport, purpose, and length of stay; verify the current official guidance before booking.',
    sourceUrl: 'https://www.mofa.go.jp/j_info/visit/visa/index.html',
    sourceName: 'Ministry of Foreign Affairs of Japan',
    country: 'Japan',
    category: 'entry',
    updatedAt: '2026-07-30',
    validUntil: null,
    authority: 'official',
  },
  {
    id: 'jp-travel-planning',
    title: 'Japan official travel planning guide',
    content:
      'Japan National Tourism Organization provides destination, transportation, accessibility, etiquette, and seasonal planning guidance. Rail and local transit options should be combined with live schedules when building an itinerary.',
    sourceUrl: 'https://www.japan.travel/en/plan/',
    sourceName: 'Japan National Tourism Organization',
    country: 'Japan',
    category: 'planning',
    updatedAt: '2026-07-30',
    validUntil: null,
    authority: 'official',
  },
  {
    id: 'thailand-entry-official',
    title: 'Thailand consular visa information',
    content:
      'Thailand consular authorities publish visa categories and entry requirements. Requirements vary by nationality and trip purpose; travelers should verify current rules with the official consular source and their airline before departure.',
    sourceUrl: 'https://www.thaievisa.go.th/',
    sourceName: 'Thailand Ministry of Foreign Affairs',
    country: 'Thailand',
    category: 'entry',
    updatedAt: '2026-07-30',
    validUntil: null,
    authority: 'official',
  },
  {
    id: 'general-safe-planning',
    title: 'Safe itinerary planning principles',
    content:
      'A feasible itinerary leaves transfer buffers, groups nearby activities, checks accessibility and opening hours, and avoids treating estimated prices as live availability. Travelers should confirm health, safety, and entry information using current official sources.',
    sourceUrl: 'https://www.unwto.org/responsible-tourist',
    sourceName: 'UN Tourism',
    category: 'safety',
    updatedAt: '2026-07-30',
    validUntil: null,
    authority: 'curated',
  },
];
