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
index.html     ← entire app (React + CSS + JS, ~7700 lines)
sw.js          ← service worker (separate file — see Cache Versioning below)
manifest.json  ← PWA manifest
report.html    ← standalone report viewer (served by an Edge Function link)
icon-192.png, icon-512.png ← PWA icons
CLAUDE.md      ← this file
```

### Key Constants (index.html, top of the main script block)
```js
const SUPABASE_URL = "https://yyfkoenhpotzcuwxpnsy.supabase.co"
const SUPABASE_KEY = "<anon key>"   // public-safe anon key
const APP_VERSION = "hifz-YYYYMMDD-HHMMSS"   // display-only marker, see below — NOT the cache key
```

### Service Worker Cache Versioning — IMPORTANT, easy to get wrong
The actual cache-busting key lives in **`sw.js`** (a separate top-level file, not inside
`index.html`), as its own `CACHE` constant:
```js
// sw.js, line 1
const CACHE = 'hifz-YYYYMMDD-HHMMSS';
```
**Every time `index.html` changes, bump `sw.js`'s `CACHE` string too** (e.g. to the current
timestamp) — this is what makes the browser detect a byte-different `sw.js`, install the new
service worker, show the in-app update banner, and evict the old cache. Skipping this means
users keep getting served the old cached `index.html` indefinitely (stale-while-revalidate
serves the cached response instantly, and the update banner never fires), no matter how many
times `index.html` itself is edited and deployed.

`index.html` also has its own `APP_VERSION` constant (and a matching HTML comment right above
`<head>`) — bump that too, for a human-readable version marker in the source/devtools — but
know that **`APP_VERSION` has no functional effect on caching or the update banner**. Only
`sw.js`'s `CACHE` constant does. Don't mistake one for the other.

## Supabase Schema (inferred)
- `sabaq_records`  — daily reading records
- `dor_records`    — degree-of-repetition entries
- `daily_sabaq`    — daily summary per student
- `year_plan`      — yearly memorization plan
- `profiles`       — student profiles (auto-created on XLSX import)

## Common Edits
- **UI / logic changes**: edit `index.html`, bump `sw.js`'s `CACHE` (and `index.html`'s `APP_VERSION` for the human-readable marker), commit & push to master
- **Supabase schema**: use Supabase MCP tools (`mcp__Supabase__apply_migration`, etc.)
- **Add a new feature**: find the relevant React component section in `index.html` by searching for a unique string nearby
