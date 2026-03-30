import './style.css';
import {
  analystPresets,
  candidateResults,
  marketLabels,
  mediaTypeLabels,
  researchChecklist,
  rubricLabels,
  type MarketCode,
  type MediaType,
} from './data';
import { createSummary, scoreCandidates, type AnalystAdjustment } from './scoring';

type SavedAssessment = {
  id: string;
  savedAt: string;
  query: string;
  mediaType: MediaType;
  market: MarketCode;
  analystNote: string;
  adjustments: Record<string, AnalystAdjustment>;
  headline: string;
  confidence: string;
  topTitle: string;
  topScore: number;
};

type AppState = {
  query: string;
  mediaType: MediaType;
  market: MarketCode;
  analystNote: string;
  adjustments: Record<string, AnalystAdjustment>;
  history: SavedAssessment[];
  copyStatus: string;
  saveStatus: string;
};

const STORAGE_KEY = 'media-search-workbench-history';
const MAX_HISTORY_ITEMS = 8;

function getAppRoot(): HTMLDivElement {
  const root = document.querySelector<HTMLDivElement>('#app');

  if (!root) {
    throw new Error('App root not found');
  }

  return root;
}

function loadHistory(): SavedAssessment[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as SavedAssessment[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY_ITEMS) : [];
  } catch {
    return [];
  }
}

function persistHistory(history: SavedAssessment[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS)));
}

const initialPreset = analystPresets[0];

let state: AppState = {
  query: initialPreset.query,
  mediaType: initialPreset.mediaType,
  market: initialPreset.market,
  analystNote: initialPreset.researchFocus,
  adjustments: {},
  history: loadHistory(),
  copyStatus: 'Copy analyst brief',
  saveStatus: 'Save assessment',
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function adjustmentLabel(adjustment: AnalystAdjustment): string {
  switch (adjustment) {
    case 'boost':
      return 'Boosted';
    case 'watch':
      return 'Watch';
    case 'drop':
      return 'Dropped';
    default:
      return 'Neutral';
  }
}

function verdictTone(score: number): string {
  if (score >= 78) {
    return 'positive';
  }

  if (score >= 58) {
    return 'caution';
  }

  return 'negative';
}

function formatSavedAt(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function setCopyStatus(nextStatus: string): void {
  state = { ...state, copyStatus: nextStatus };
  render();
}

function scheduleStatusReset(kind: 'copy' | 'save'): void {
  window.setTimeout(() => {
    state =
      kind === 'copy'
        ? { ...state, copyStatus: 'Copy analyst brief' }
        : { ...state, saveStatus: 'Save assessment' };
    render();
  }, 1600);
}

function buildBriefLines(): string {
  const scored = scoreCandidates(
    state.query,
    state.mediaType,
    state.market,
    candidateResults,
    state.adjustments,
  );
  const summary = createSummary(state.query, state.mediaType, state.market, scored);

  return [
    'Media Search Analyst Brief',
    `Query: ${state.query}`,
    `Media type: ${mediaTypeLabels[state.mediaType]}`,
    `Market: ${marketLabels[state.market]}`,
    `Headline: ${summary.headline}`,
    `Confidence: ${summary.confidence}`,
    '',
    'Top Results:',
    ...scored.slice(0, 5).map(
      (result, index) =>
        `${index + 1}. ${result.title} | ${mediaTypeLabels[result.mediaType]} | ${result.score}/100 | ${result.verdict}`,
    ),
    '',
    'Rationale:',
    summary.rationale,
    '',
    'Escalation:',
    summary.escalation,
    '',
    'Analyst Note:',
    state.analystNote || 'No manual note added.',
  ].join('\n');
}

function exportBrief(): void {
  const lines = buildBriefLines();

  navigator.clipboard
    .writeText(lines)
    .then(() => {
      setCopyStatus('Copied analyst brief');
      scheduleStatusReset('copy');
    })
    .catch(() => {
      window.alert(lines);
    });
}

function saveAssessment(): void {
  const scored = scoreCandidates(
    state.query,
    state.mediaType,
    state.market,
    candidateResults,
    state.adjustments,
  );
  const summary = createSummary(state.query, state.mediaType, state.market, scored);
  const topResult = scored[0];

  const saved: SavedAssessment = {
    id: `${Date.now()}`,
    savedAt: new Date().toISOString(),
    query: state.query,
    mediaType: state.mediaType,
    market: state.market,
    analystNote: state.analystNote,
    adjustments: { ...state.adjustments },
    headline: summary.headline,
    confidence: summary.confidence,
    topTitle: topResult?.title ?? 'No result',
    topScore: topResult?.score ?? 0,
  };

  const nextHistory = [saved, ...state.history].slice(0, MAX_HISTORY_ITEMS);
  persistHistory(nextHistory);
  state = { ...state, history: nextHistory, saveStatus: 'Assessment saved' };
  render();
  scheduleStatusReset('save');
}

function clearHistory(): void {
  persistHistory([]);
  state = { ...state, history: [] };
  render();
}

function loadAssessment(id: string): void {
  const saved = state.history.find((entry) => entry.id === id);
  if (!saved) {
    return;
  }

  state = {
    ...state,
    query: saved.query,
    mediaType: saved.mediaType,
    market: saved.market,
    analystNote: saved.analystNote,
    adjustments: saved.adjustments,
  };
  render();
}

function createResearchLinks(query: string, mediaType: MediaType, market: MarketCode) {
  const encodedQuery = encodeURIComponent(query);
  const marketHint = encodeURIComponent(`${query} ${marketLabels[market]}`);
  const storefrontByType: Record<MediaType, string> = {
    apps: `https://www.google.com/search?q=${encodeURIComponent(`${query} site:apps.apple.com`)}`,
    music: `https://www.google.com/search?q=${encodeURIComponent(`${query} site:music.apple.com`)}`,
    video: `https://www.youtube.com/results?search_query=${encodedQuery}`,
    books: `https://www.google.com/search?q=${encodeURIComponent(`${query} site:books.apple.com`)}`,
    podcasts: `https://podcasts.apple.com/search?term=${encodedQuery}`,
    home: `https://www.google.com/search?q=${encodeURIComponent(`${query} smart speaker reviews`)}`,
  };

  return [
    {
      label: 'Open web search',
      description: 'Check broad query intent and neighboring entities.',
      href: `https://www.google.com/search?q=${marketHint}`,
    },
    {
      label: 'Open market search',
      description: `Jump to a ${mediaTypeLabels[mediaType].toLowerCase()}-leaning surface.`,
      href: storefrontByType[mediaType],
    },
    {
      label: 'Open trend search',
      description: 'Quickly sanity-check recent chatter and trend direction.',
      href: `https://www.google.com/search?q=${encodeURIComponent(`${query} trends popularity`)}`,
    },
  ];
}

function render(): void {
  const scored = scoreCandidates(
    state.query,
    state.mediaType,
    state.market,
    candidateResults,
    state.adjustments,
  );

  const summary = createSummary(state.query, state.mediaType, state.market, scored);
  const topThreeAverage = Math.round(
    scored.slice(0, 3).reduce((sum, result) => sum + result.score, 0) /
      Math.max(1, scored.slice(0, 3).length),
  );
  const ambiguityCount = scored.slice(0, 5).filter((result) => result.mediaType !== state.mediaType).length;
  const relevantCount = scored.filter((result) => result.verdict === 'Relevant').length;
  const researchLinks = createResearchLinks(state.query, state.mediaType, state.market);

  const appRoot = getAppRoot();

  appRoot.innerHTML = `
    <div class="shell">
      <section class="hero-panel">
        <div class="hero-copy">
          <p class="eyebrow">Portfolio Prototype</p>
          <h1>Media Search Workbench</h1>
          <p class="lede">
            A sharper take on vague media search analyst work: classify messy intent, compare cross-media candidates,
            and leave an auditable verdict instead of vibes-based ranking.
          </p>
          <div class="hero-actions">
            <button class="copy-button hero-action" type="button" data-save-assessment>${escapeHtml(state.saveStatus)}</button>
            <a class="hero-link" href="https://github.com/cw4444/media-search-workbench" target="_blank" rel="noreferrer">View source</a>
          </div>
        </div>
        <div class="hero-metrics">
          <div>
            <span>Top 3 Avg</span>
            <strong>${topThreeAverage}</strong>
          </div>
          <div>
            <span>Strong matches</span>
            <strong>${relevantCount}</strong>
          </div>
          <div>
            <span>Cross-media noise</span>
            <strong>${ambiguityCount}</strong>
          </div>
          <div>
            <span>${summary.confidence}</span>
            <strong>${scored[0]?.score ?? 0}/100</strong>
          </div>
        </div>
      </section>

      <section class="workflow-strip">
        <article>
          <span>01</span>
          <h3>Classify intent</h3>
          <p>Start with market, format, and whether the query is entity-led or exploratory.</p>
        </article>
        <article>
          <span>02</span>
          <h3>Compare candidates</h3>
          <p>Score exactness, intent fit, trust, and trend relevance across likely result types.</p>
        </article>
        <article>
          <span>03</span>
          <h3>Leave a trail</h3>
          <p>Save snapshots, export the verdict, and hand off something another reviewer can defend.</p>
        </article>
      </section>

      <main class="workspace">
        <section class="control-panel">
          <div class="panel-heading">
            <p class="eyebrow">Task Setup</p>
            <h2>Search Brief</h2>
          </div>

          <div class="preset-row">
            ${analystPresets
              .map(
                (preset) => `
                  <button
                    class="preset ${preset.id === findActivePresetId() ? 'is-active' : ''}"
                    data-preset="${preset.id}"
                    type="button"
                  >
                    ${preset.label}
                  </button>
                `,
              )
              .join('')}
          </div>

          <label class="field">
            <span>Search query</span>
            <textarea id="query" rows="3" placeholder="Enter a messy real-world query">${escapeHtml(
              state.query,
            )}</textarea>
          </label>

          <div class="field-grid">
            <label class="field">
              <span>Media domain</span>
              <select id="mediaType">
                ${Object.entries(mediaTypeLabels)
                  .map(
                    ([value, label]) =>
                      `<option value="${value}" ${value === state.mediaType ? 'selected' : ''}>${label}</option>`,
                  )
                  .join('')}
              </select>
            </label>

            <label class="field">
              <span>Market</span>
              <select id="market">
                ${Object.entries(marketLabels)
                  .map(
                    ([value, label]) =>
                      `<option value="${value}" ${value === state.market ? 'selected' : ''}>${label}</option>`,
                  )
                  .join('')}
              </select>
            </label>
          </div>

          <label class="field">
            <span>Analyst research note</span>
            <textarea id="analystNote" rows="4" placeholder="Capture edge cases, ambiguity, or reasons to escalate">${escapeHtml(
              state.analystNote,
            )}</textarea>
          </label>

          <div class="mini-board">
            <div>
              <span>Evaluation rubric</span>
              <ul>
                ${Object.values(rubricLabels)
                  .map((label) => `<li>${label}</li>`)
                  .join('')}
              </ul>
            </div>
            <div>
              <span>Research checklist</span>
              <ul>
                ${researchChecklist.map((item) => `<li>${item}</li>`).join('')}
              </ul>
            </div>
          </div>

          <div class="history-panel">
            <div class="history-heading">
              <div>
                <p class="eyebrow">Saved Cases</p>
                <h3>Assessment History</h3>
              </div>
              ${
                state.history.length
                  ? '<button class="text-button" type="button" data-clear-history>Clear</button>'
                  : ''
              }
            </div>
            ${
              state.history.length
                ? state.history
                    .map(
                      (entry) => `
                        <button class="history-item" type="button" data-load-history="${entry.id}">
                          <span>${escapeHtml(formatSavedAt(entry.savedAt))}</span>
                          <strong>${escapeHtml(entry.query)}</strong>
                          <p>${escapeHtml(entry.topTitle)} · ${entry.topScore}/100 · ${escapeHtml(entry.confidence)}</p>
                        </button>
                      `,
                    )
                    .join('')
                : '<p class="empty-history">Saved assessments stay in your browser so the demo feels like an actual review desk.</p>'
            }
          </div>
        </section>

        <section class="results-panel">
          <div class="panel-heading">
            <p class="eyebrow">Ranked Results</p>
            <h2>Query Assessment</h2>
          </div>

          <div class="research-links">
            ${researchLinks
              .map(
                (link) => `
                  <a class="research-link" href="${link.href}" target="_blank" rel="noreferrer">
                    <strong>${escapeHtml(link.label)}</strong>
                    <span>${escapeHtml(link.description)}</span>
                  </a>
                `,
              )
              .join('')}
          </div>

          <div class="results-list">
            ${scored
              .slice(0, 8)
              .map(
                (result, index) => `
                  <article class="result-card">
                    <div class="result-topline">
                      <div>
                        <p class="result-rank">Result ${index + 1}</p>
                        <h3>${escapeHtml(result.title)}</h3>
                        <p class="result-meta">${escapeHtml(result.creator)} · ${mediaTypeLabels[result.mediaType]} · ${escapeHtml(
                          result.storefront,
                        )}</p>
                      </div>
                      <div class="score-badge ${verdictTone(result.score)}">${result.score}</div>
                    </div>

                    <p class="result-description">${escapeHtml(result.description)}</p>

                    <div class="pill-row">
                      <span class="pill">${result.verdict}</span>
                      <span class="pill subtle">${result.regions.join(', ')}</span>
                      <span class="pill subtle">${result.matchedTerms.length ? result.matchedTerms.join(', ') : 'broad match'}</span>
                    </div>

                    <div class="rubric-grid">
                      ${Object.entries(rubricLabels)
                        .map(
                          ([key, label]) => `
                            <div>
                              <span>${label}</span>
                              <strong>${result.rubric[key as keyof typeof rubricLabels]}</strong>
                            </div>
                          `,
                        )
                        .join('')}
                    </div>

                    <div class="adjustment-row">
                      ${(['none', 'boost', 'watch', 'drop'] as AnalystAdjustment[])
                        .map(
                          (adjustment) => `
                            <button
                              type="button"
                              class="adjustment ${
                                (state.adjustments[result.id] ?? 'none') === adjustment ? 'is-active' : ''
                              }"
                              data-adjustment="${adjustment}"
                              data-result-id="${result.id}"
                            >
                              ${adjustmentLabel(adjustment)}
                            </button>
                          `,
                        )
                        .join('')}
                    </div>
                  </article>
                `,
              )
              .join('')}
          </div>
        </section>

        <aside class="summary-panel">
          <div class="panel-heading">
            <p class="eyebrow">Decision Layer</p>
            <h2>Analyst Verdict</h2>
          </div>

          <div class="summary-block">
            <span>Headline</span>
            <h3>${escapeHtml(summary.headline)}</h3>
          </div>

          <div class="summary-block">
            <span>Rationale</span>
            <p>${escapeHtml(summary.rationale)}</p>
          </div>

          <div class="summary-block">
            <span>Escalation</span>
            <p>${escapeHtml(summary.escalation)}</p>
          </div>

          <div class="summary-strip">
            <div>
              <span>Confidence</span>
              <strong>${summary.confidence}</strong>
            </div>
            <div>
              <span>Best entity</span>
              <strong>${escapeHtml(scored[0]?.title ?? 'No result')}</strong>
            </div>
          </div>

          <div class="summary-actions">
            <button class="copy-button" type="button" data-copy-status>${escapeHtml(state.copyStatus)}</button>
            <button class="secondary-button" type="button" data-save-assessment>${escapeHtml(state.saveStatus)}</button>
          </div>
        </aside>
      </main>
    </div>
  `;

  bindEvents();
}

function findActivePresetId(): string | null {
  const matchingPreset = analystPresets.find(
    (preset) =>
      preset.query === state.query &&
      preset.mediaType === state.mediaType &&
      preset.market === state.market &&
      preset.researchFocus === state.analystNote,
  );

  return matchingPreset?.id ?? null;
}

function bindEvents(): void {
  const queryField = document.querySelector<HTMLTextAreaElement>('#query');
  const mediaField = document.querySelector<HTMLSelectElement>('#mediaType');
  const marketField = document.querySelector<HTMLSelectElement>('#market');
  const noteField = document.querySelector<HTMLTextAreaElement>('#analystNote');

  queryField?.addEventListener('input', (event) => {
    state = { ...state, query: (event.currentTarget as HTMLTextAreaElement).value };
    render();
  });

  mediaField?.addEventListener('change', (event) => {
    state = { ...state, mediaType: (event.currentTarget as HTMLSelectElement).value as MediaType };
    render();
  });

  marketField?.addEventListener('change', (event) => {
    state = { ...state, market: (event.currentTarget as HTMLSelectElement).value as MarketCode };
    render();
  });

  noteField?.addEventListener('input', (event) => {
    state = { ...state, analystNote: (event.currentTarget as HTMLTextAreaElement).value };
    render();
  });

  document.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((button) => {
    button.addEventListener('click', () => {
      const preset = analystPresets.find((item) => item.id === button.dataset.preset);
      if (!preset) {
        return;
      }

      state = {
        ...state,
        query: preset.query,
        mediaType: preset.mediaType,
        market: preset.market,
        analystNote: preset.researchFocus,
        adjustments: {},
      };
      render();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-adjustment]').forEach((button) => {
    button.addEventListener('click', () => {
      const resultId = button.dataset.resultId;
      const adjustment = button.dataset.adjustment as AnalystAdjustment | undefined;

      if (!resultId || !adjustment) {
        return;
      }

      state = {
        ...state,
        adjustments: {
          ...state.adjustments,
          [resultId]: adjustment,
        },
      };
      render();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-save-assessment]').forEach((button) => {
    button.addEventListener('click', saveAssessment);
  });

  document.querySelector('[data-copy-status]')?.addEventListener('click', exportBrief);

  document.querySelector('[data-clear-history]')?.addEventListener('click', clearHistory);

  document.querySelectorAll<HTMLButtonElement>('[data-load-history]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.loadHistory;
      if (id) {
        loadAssessment(id);
      }
    });
  });
}

render();
