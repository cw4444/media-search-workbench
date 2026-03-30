# Media Search Workbench

A lightweight prototype for practicing and demonstrating the kind of judgement described in media search analyst roles.

## What it does

- Lets you enter a messy real-world search query.
- Switches between apps, music, video, books, podcasts, and home-audio evaluation.
- Scores seeded candidate results against an analyst-style rubric.
- Surfaces ambiguity, cross-media noise, and a short escalation note.
- Copies an export-ready analyst brief to the clipboard.

## Run it

```bash
npm install
npm run dev
```

## Build it

```bash
npm run build
```

## Why this shape

The job brief is vague, so this MVP focuses on the most defensible automation surface:

1. structure the query
2. rank candidate outcomes against a rubric
3. help the operator write a consistent verdict

It is intentionally local and self-contained, which makes it useful as a portfolio demo or a base for plugging into live APIs later.
