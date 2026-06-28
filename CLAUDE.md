# Al-Ihsaan Hifz Tracker — Claude Code Context

## Project Overview
Single-file progressive web app for Quranic memorization (Hifz) tracking.
Stack: vanilla React (CDN), Supabase backend, PWA service worker.
All app code lives in `index.html` — there is no separate build step.

## Push & Deploy Flow
1. Make edits to `index.html` in this Claude Code session
2. Commit with a descriptive message
3. Push to `master`
4. Cloudflare Pages auto-deploys (connected directly to the GitHub repo)

**Live URL**: `https://alihsaanhifz.pages.dev`

## Architecture

### File Structure
```
index.html   ← entire app (React + CSS + JS, ~5700 lines)
CLAUDE.md    ← this file
```

### Key Constants (index.html lines 42–43)
```js
const SUPABASE_URL = "https://yyfkoenhpotzcuwxpnsy.supabase.co"
const SUPABASE_KEY = "<anon key>"   // public-safe anon key
```

### Service Worker Cache Versioning
When making changes, bump the cache version string near the top of the file:
```js
const CACHE_NAME = 'hifz-YYYYMMDD-HHMMSS'
```
This forces browsers to pick up the new version.

## Supabase Schema (inferred)
- `sabaq_records`  — daily reading records
- `dor_records`    — degree-of-repetition entries
- `daily_sabaq`    — daily summary per student
- `year_plan`      — yearly memorization plan
- `profiles`       — student profiles (auto-created on XLSX import)

## Common Edits
- **UI / logic changes**: edit `index.html`, bump `CACHE_NAME`, commit & push to master
- **Supabase schema**: use Supabase MCP tools (`mcp__Supabase__apply_migration`, etc.)
- **Add a new feature**: find the relevant React component section in `index.html` by searching for a unique string nearby
