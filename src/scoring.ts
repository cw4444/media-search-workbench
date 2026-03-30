import {
  type CandidateResult,
  type MarketCode,
  type MediaType,
  rubricLabels,
} from './data';

export type AnalystAdjustment = 'boost' | 'watch' | 'drop' | 'none';

export type ScoredResult = CandidateResult & {
  score: number;
  verdict: 'Relevant' | 'Acceptable' | 'Off-target';
  matchedTerms: string[];
  rubric: Record<keyof typeof rubricLabels, number>;
};

const stopWords = new Set([
  'a',
  'an',
  'and',
  'best',
  'for',
  'free',
  'in',
  'of',
  'on',
  'pod',
  'the',
  'to',
  'with',
]);

export function normaliseQuery(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !stopWords.has(token));
}

function scoreExactness(tokens: string[], candidate: CandidateResult): { score: number; matchedTerms: string[] } {
  const haystack = `${candidate.title} ${candidate.creator} ${candidate.tags.join(' ')}`.toLowerCase();
  const matchedTerms = tokens.filter((token) => haystack.includes(token));
  const coverage = tokens.length === 0 ? 0 : matchedTerms.length / tokens.length;
  const phraseBonus = haystack.includes(tokens.join(' ')) ? 18 : 0;

  return {
    score: Math.min(100, Math.round(coverage * 65) + phraseBonus),
    matchedTerms,
  };
}

function scoreIntent(mediaType: MediaType, tokens: string[], candidate: CandidateResult): number {
  let score = candidate.mediaType === mediaType ? 68 : 30;

  const intentHints: Partial<Record<MediaType, string[]>> = {
    apps: ['app', 'planner', 'tool'],
    music: ['lyrics', 'song', 'album', 'track'],
    video: ['video', 'official', 'watch'],
    books: ['book', 'novel', 'audiobook', 'read'],
    podcasts: ['podcast', 'episode', 'listen'],
    home: ['speaker', 'kitchen', 'homepod', 'voice'],
  };

  const hints = intentHints[mediaType] ?? [];
  const overlap = hints.filter((hint) => tokens.includes(hint) || candidate.tags.includes(hint)).length;
  score += overlap * 8;

  if (mediaType === 'podcasts' && candidate.mediaType === 'apps') {
    score -= 18;
  }

  if (mediaType === 'apps' && candidate.mediaType === 'video') {
    score -= 12;
  }

  return Math.max(0, Math.min(100, score));
}

function scoreMarketFit(market: MarketCode, candidate: CandidateResult): number {
  if (candidate.regions.includes('Global')) {
    return 88;
  }

  return candidate.regions.includes(market) ? 92 : 34;
}

function scoreTrendFit(tokens: string[], candidate: CandidateResult): number {
  const trendText = `${candidate.trendSignals.join(' ')} ${candidate.tags.join(' ')}`.toLowerCase();
  const overlap = tokens.filter((token) => trendText.includes(token)).length;
  return Math.min(100, 52 + overlap * 12 + candidate.trendSignals.length * 4);
}

function scoreTrust(candidate: CandidateResult): number {
  const trustText = `${candidate.qualitySignals.join(' ')} ${candidate.storefront}`.toLowerCase();
  let score = 58 + candidate.qualitySignals.length * 8;

  if (trustText.includes('official') || trustText.includes('trusted')) {
    score += 12;
  }

  return Math.min(100, score);
}

export function applyAdjustment(score: number, adjustment: AnalystAdjustment): number {
  if (adjustment === 'boost') {
    return Math.min(100, score + 10);
  }

  if (adjustment === 'watch') {
    return Math.max(0, score - 4);
  }

  if (adjustment === 'drop') {
    return Math.max(0, score - 18);
  }

  return score;
}

export function scoreCandidates(
  query: string,
  mediaType: MediaType,
  market: MarketCode,
  candidates: CandidateResult[],
  adjustments: Record<string, AnalystAdjustment>,
): ScoredResult[] {
  const tokens = normaliseQuery(query);

  return candidates
    .map((candidate) => {
      const exactness = scoreExactness(tokens, candidate);
      const rubric = {
        exactness: exactness.score,
        intent: scoreIntent(mediaType, tokens, candidate),
        marketFit: scoreMarketFit(market, candidate),
        trendFit: scoreTrendFit(tokens, candidate),
        trust: scoreTrust(candidate),
      };

      const rawScore = Math.round(
        rubric.exactness * 0.34 +
          rubric.intent * 0.29 +
          rubric.marketFit * 0.12 +
          rubric.trendFit * 0.12 +
          rubric.trust * 0.13,
      );

      const score = applyAdjustment(rawScore, adjustments[candidate.id] ?? 'none');

      let verdict: ScoredResult['verdict'] = 'Off-target';
      if (score >= 78) {
        verdict = 'Relevant';
      } else if (score >= 58) {
        verdict = 'Acceptable';
      }

      return {
        ...candidate,
        matchedTerms: exactness.matchedTerms,
        rubric,
        score,
        verdict,
      };
    })
    .sort((left, right) => right.score - left.score);
}

export function createSummary(
  query: string,
  mediaType: MediaType,
  market: MarketCode,
  results: ScoredResult[],
): { headline: string; rationale: string; confidence: string; escalation: string } {
  const topResult = results[0];
  const strongMatches = results.filter((result) => result.verdict === 'Relevant').length;
  const mediumMatches = results.filter((result) => result.verdict === 'Acceptable').length;
  const hasCrossMediaNoise = results.slice(0, 4).some((result) => result.mediaType !== mediaType);

  const confidence =
    topResult.score >= 85 && !hasCrossMediaNoise
      ? 'High confidence'
      : topResult.score >= 70
        ? 'Moderate confidence'
        : 'Low confidence';

  const headline = `${topResult.verdict} for "${query}" in ${market}`;

  const rationale = `${topResult.title} leads because it best fits ${mediaType} intent, shows ${topResult.matchedTerms.length || 1} query-aligned signal(s), and carries a ${topResult.score}/100 analyst score. ${strongMatches} result(s) look strongly relevant and ${mediumMatches} remain usable with caution.`;

  const escalation = hasCrossMediaNoise
    ? 'Escalate if the task guidelines require a single-format answer, because nearby cross-media results may reflect ambiguous user intent.'
    : 'No escalation suggested unless the task requires a stricter market or licensing check.';

  return { headline, rationale, confidence, escalation };
}
