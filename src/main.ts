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

type AppState = {
  query: string;
  mediaType: MediaType;
  market: MarketCode;
  analystNote: string;
  adjustments: Record<string, AnalystAdjustment>;
};

function getAppRoot(): HTMLDivElement {
  const root = document.querySelector<HTMLDivElement>('#app');

  if (!root) {
    throw new Error('App root not found');
  }

  return root;
}

const initialPreset = analystPresets[0];

let state: AppState = {
  query: initialPreset.query,
  mediaType: initialPreset.mediaType,
  market: initialPreset.market,
  analystNote: initialPreset.researchFocus,
  adjustments: {},
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

function exportBrief(): void {
  const scored = scoreCandidates(
    state.query,
    state.mediaType,
    state.market,
    candidateResults,
    state.adjustments,
  );
  const summary = createSummary(state.query, state.mediaType, state.market, scored);
  const lines = [
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
        `${index + 1}. ${result.title} | ${result.mediaType} | ${result.score}/100 | ${result.verdict}`,
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

  navigator.clipboard
    .writeText(lines)
    .then(() => {
      const copied = document.querySelector<HTMLElement>('[data-copy-status]');
      if (copied) {
        copied.textContent = 'Copied analyst brief';
        setTimeout(() => {
          copied.textContent = 'Copy analyst brief';
        }, 1800);
      }
    })
    .catch(() => {
      window.alert(lines);
    });
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

  const appRoot = getAppRoot();

  appRoot.innerHTML = `
    <div class="shell">
      <section class="hero-panel">
        <div class="hero-copy">
          <p class="eyebrow">Analyst Sandbox</p>
          <h1>Media Search Workbench</h1>
          <p class="lede">
            Prototype a realistic media search analyst flow: classify query intent, score results against a rubric,
            and write a quick verdict that sounds like an actual evaluation queue.
          </p>
        </div>
        <div class="hero-metrics">
          <div>
            <span>Top 3 Avg</span>
            <strong>${topThreeAverage}</strong>
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
        </section>

        <section class="results-panel">
          <div class="panel-heading">
            <p class="eyebrow">Ranked Results</p>
            <h2>Query Assessment</h2>
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

          <button class="copy-button" type="button" data-copy-status>Copy analyst brief</button>
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
  const copyButton = document.querySelector<HTMLButtonElement>('[data-copy-status]');

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

  copyButton?.addEventListener('click', exportBrief);
}

render();
