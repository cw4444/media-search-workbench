export type MediaType = 'apps' | 'music' | 'video' | 'books' | 'podcasts' | 'home';

export type MarketCode = 'UK' | 'US' | 'CA' | 'AU' | 'IN';

export type AnalystPreset = {
  id: string;
  label: string;
  mediaType: MediaType;
  market: MarketCode;
  query: string;
  researchFocus: string;
};

export type CandidateResult = {
  id: string;
  title: string;
  creator: string;
  mediaType: MediaType;
  storefront: string;
  regions: Array<MarketCode | 'Global'>;
  tags: string[];
  trendSignals: string[];
  qualitySignals: string[];
  description: string;
};

export const analystPresets: AnalystPreset[] = [
  {
    id: 'taylor-lyrics',
    label: 'Music intent',
    mediaType: 'music',
    market: 'UK',
    query: 'taylor swift fortnight lyrics',
    researchFocus: 'Check if intent is clearly lyrics-focused or mixed with video/search gossip intent.',
  },
  {
    id: 'sleep-podcast',
    label: 'Podcast ambiguity',
    mediaType: 'podcasts',
    market: 'US',
    query: 'sleep podcast for anxiety',
    researchFocus: 'Validate whether calming podcasts outrank generic meditation apps and white-noise videos.',
  },
  {
    id: 'recipe-app',
    label: 'App relevance',
    mediaType: 'apps',
    market: 'CA',
    query: 'meal planner app free',
    researchFocus: 'Prefer high-intent app listings over editorial or generic wellness content.',
  },
  {
    id: 'book-series',
    label: 'Book entity match',
    mediaType: 'books',
    market: 'AU',
    query: 'fourth wing audiobook',
    researchFocus: 'Check whether book format intent is understood across store results and nearby franchises.',
  },
  {
    id: 'home-audio',
    label: 'Home pod eval',
    mediaType: 'home',
    market: 'UK',
    query: 'best podcast speakers for kitchen',
    researchFocus: 'Assess home-device and voice-audio utility rather than media title matching alone.',
  },
];

export const mediaTypeLabels: Record<MediaType, string> = {
  apps: 'Apps',
  music: 'Music',
  video: 'Video',
  books: 'Books',
  podcasts: 'Podcasts',
  home: 'Home Audio',
};

export const marketLabels: Record<MarketCode, string> = {
  UK: 'United Kingdom',
  US: 'United States',
  CA: 'Canada',
  AU: 'Australia',
  IN: 'India',
};

export const candidateResults: CandidateResult[] = [
  {
    id: 'app-mealime',
    title: 'Mealime Meal Plans & Recipes',
    creator: 'Mealime Meal Plans Inc.',
    mediaType: 'apps',
    storefront: 'App Store',
    regions: ['Global'],
    tags: ['meal planner', 'recipes', 'shopping list', 'free tier', 'healthy eating'],
    trendSignals: ['weekly featured in food blogs', 'strong mobile reviews'],
    qualitySignals: ['4.8 rating', 'clear onboarding', 'consistent updates'],
    description: 'A focused meal-planning app with grocery automation and strong relevance for planning intent.',
  },
  {
    id: 'app-yummly',
    title: 'Yummly Recipes & Meal Tools',
    creator: 'Yummly',
    mediaType: 'apps',
    storefront: 'App Store',
    regions: ['UK', 'US', 'CA', 'AU'],
    tags: ['meal planner', 'recipe finder', 'personalised recommendations'],
    trendSignals: ['recognisable consumer brand'],
    qualitySignals: ['large catalog', 'high brand familiarity'],
    description: 'Recipe-centric app with planning utilities, suited to broad meal discovery intent.',
  },
  {
    id: 'music-fortnight',
    title: 'Fortnight (feat. Post Malone)',
    creator: 'Taylor Swift',
    mediaType: 'music',
    storefront: 'Apple Music',
    regions: ['Global'],
    tags: ['lyrics', 'official audio', 'pop', 'charting'],
    trendSignals: ['current cultural relevance', 'fan search spikes'],
    qualitySignals: ['official artist release', 'entity match'],
    description: 'Exact track match with strong lyric-intent signals and current mainstream relevance.',
  },
  {
    id: 'music-taylor-essentials',
    title: 'Taylor Swift Essentials',
    creator: 'Apple Music',
    mediaType: 'music',
    storefront: 'Apple Music',
    regions: ['Global'],
    tags: ['playlist', 'artist collection', 'editorial'],
    trendSignals: ['high engagement playlist'],
    qualitySignals: ['trusted editorial source'],
    description: 'Useful for artist discovery, but weaker than an exact song match when the query names a track.',
  },
  {
    id: 'video-fortnight',
    title: 'Fortnight (Official Music Video)',
    creator: 'Taylor Swift',
    mediaType: 'video',
    storefront: 'Video Store',
    regions: ['Global'],
    tags: ['official video', 'music video', 'lyrics adjacent'],
    trendSignals: ['high-view release', 'cross-platform buzz'],
    qualitySignals: ['official upload', 'strong title alignment'],
    description: 'Highly relevant when the user likely wants the visual asset instead of only the song listing.',
  },
  {
    id: 'podcast-sleep',
    title: 'Nothing Much Happens',
    creator: 'Kathryn Nicolai',
    mediaType: 'podcasts',
    storefront: 'Podcasts',
    regions: ['Global'],
    tags: ['sleep podcast', 'anxiety relief', 'calm stories', 'bedtime'],
    trendSignals: ['frequently recommended in wellness roundups'],
    qualitySignals: ['clear episode taxonomy', 'durable audience'],
    description: 'A strong exact-intent candidate for users seeking anxiety-friendly sleep audio.',
  },
  {
    id: 'podcast-sleep-meditation',
    title: 'Tracks To Relax Sleep Meditations',
    creator: 'Tracks To Relax',
    mediaType: 'podcasts',
    storefront: 'Podcasts',
    regions: ['UK', 'US', 'CA', 'AU'],
    tags: ['sleep', 'guided meditation', 'anxiety', 'wellness'],
    trendSignals: ['steady niche popularity'],
    qualitySignals: ['large back catalog'],
    description: 'Useful alternative when meditation intent is slightly stronger than storytelling intent.',
  },
  {
    id: 'app-calm',
    title: 'Calm',
    creator: 'Calm.com',
    mediaType: 'apps',
    storefront: 'App Store',
    regions: ['Global'],
    tags: ['sleep', 'anxiety', 'meditation', 'subscription'],
    trendSignals: ['top wellness brand'],
    qualitySignals: ['high trust', 'broad feature set'],
    description: 'Strong wellness brand, but may be off-target when the request specifically asks for podcasts.',
  },
  {
    id: 'book-fourth-wing',
    title: 'Fourth Wing',
    creator: 'Rebecca Yarros',
    mediaType: 'books',
    storefront: 'Books',
    regions: ['Global'],
    tags: ['fantasy', 'audiobook', 'bestseller', 'dragon series'],
    trendSignals: ['BookTok momentum', 'series fandom'],
    qualitySignals: ['exact title match', 'trusted author entity'],
    description: 'Direct entity match that satisfies title intent and commonly co-occurs with audiobook searches.',
  },
  {
    id: 'book-iron-flame',
    title: 'Iron Flame',
    creator: 'Rebecca Yarros',
    mediaType: 'books',
    storefront: 'Books',
    regions: ['Global'],
    tags: ['sequel', 'fantasy', 'audiobook'],
    trendSignals: ['franchise adjacency'],
    qualitySignals: ['same author', 'series relevance'],
    description: 'Good adjacent result, but secondary when the first book title is explicitly queried.',
  },
  {
    id: 'home-sonos',
    title: 'Sonos Era 100',
    creator: 'Sonos',
    mediaType: 'home',
    storefront: 'Home Devices',
    regions: ['UK', 'US', 'CA', 'AU'],
    tags: ['speaker', 'podcasts', 'kitchen audio', 'voice ready'],
    trendSignals: ['popular home upgrade', 'strong review presence'],
    qualitySignals: ['trusted hardware brand', 'multiroom audio'],
    description: 'Good match for home listening utility when the user appears to be shopping for speaker capability.',
  },
  {
    id: 'home-homepod',
    title: 'HomePod mini',
    creator: 'Apple',
    mediaType: 'home',
    storefront: 'Home Devices',
    regions: ['UK', 'US', 'CA', 'AU', 'IN'],
    tags: ['smart speaker', 'podcasts', 'kitchen', 'voice assistant'],
    trendSignals: ['strong Apple ecosystem fit'],
    qualitySignals: ['brand authority', 'voice workflow relevance'],
    description: 'Likely relevant when the task involves home pod evaluation and spoken-audio playback.',
  },
  {
    id: 'video-recipe',
    title: '15-Minute Meal Prep Recipes',
    creator: 'Kitchen Daily',
    mediaType: 'video',
    storefront: 'Video Store',
    regions: ['Global'],
    tags: ['recipes', 'meal prep', 'short-form cooking'],
    trendSignals: ['strong short-video behavior'],
    qualitySignals: ['clear use case'],
    description: 'Useful adjacent result for cooking intent, but weaker than a direct app result for app-focused tasks.',
  },
];

export const rubricLabels = {
  exactness: 'Exact Match',
  intent: 'Intent Coverage',
  marketFit: 'Market Fit',
  trendFit: 'Trend Awareness',
  trust: 'Source Trust',
} as const;

export const researchChecklist = [
  'Check whether the query is navigational, exploratory, or format-specific.',
  'Look for market-sensitive spelling, storefront availability, and local licensing issues.',
  'Compare official entities against adjacent editorial, playlist, sequel, or franchise results.',
  'Flag ambiguity when video, audio, app, and hardware intent are all plausible.',
  'Write the verdict in analyst language: relevant, acceptable, off-target, or needs escalation.',
];
