# Deploy — Dreamcoat Project Code Registry

A static page (`index.html`) with two small Netlify Functions that give it a **shared** data store, so everyone on the team sees the same registry no matter whose machine added a code.

```
dreamcoat-site/
├─ index.html                    the app
├─ netlify.toml                  build config
├─ package.json                  one dependency (@netlify/blobs)
└─ netlify/functions/
   ├─ registry.mjs               shared store  → /api/registry  (Netlify Blobs)
   └─ ask.mjs                     AI proxy      → /api/ask        (optional)
```

## Deploy (GitHub → Netlify — recommended, since you'll keep adding data)

1. Create a new GitHub repo and push the entire `dreamcoat-site/` folder (keep the structure).
2. In Netlify: **Add new site → Import an existing project → pick the repo.** Leave the build command empty; publish directory `.`. Netlify reads `netlify.toml` and installs `@netlify/blobs` automatically.
3. Deploy. Your live URL (e.g. `https://your-name.netlify.app`) is what you link from the Dreamcoat homepage. Every `git push` redeploys.

Netlify Blobs is provisioned automatically — there's nothing to set up. The shared store goes live on first visit.

### Quick alternative (no repo)
Drag the `dreamcoat-site` folder onto Netlify's deploy drop zone for an instant URL. Fine for a first look; use the GitHub route once it's the real thing.

## Load your back-dated data
Once it's live, open the site → **Settings → Backup → Import / restore** and select your registry JSON. That writes to the shared store, so it's immediately live for everyone. (You can pull a backup the same way via **Export**.)

## Turn on the "Ask Claude" tab (optional)
The tab hides itself unless an AI connection exists. To enable it on the live site:
- Netlify → **Site configuration → Environment variables** → add `ANTHROPIC_API_KEY` = your key.
- Redeploy. The key lives only on the server; it's never sent to the browser.

Leave it unset and everything else works exactly the same, minus that one tab.

## Keep it private (recommended for an internal tool)
The in-app access code is convenience only — it sits in the page source, and on a static deploy the `/api/registry` endpoint is reachable by anyone with the URL. Pick one:
- **Netlify site password protection** (Site configuration → Access & security) — gates the whole site, including the functions, at the edge. Simplest real protection.
- **Endpoint guard:** set an env var `PCR_KEY` to the same value as the in-app access code (`PASSWORD` near the top of `index.html`). The function then rejects any request without a matching header. The app already sends it.

## Good to know
- **Concurrency:** saves are last-write-wins per data type. For a small team appending codes now and then, that's fine; simultaneous edits to the *same* list could clobber. Tell me if you want optimistic-locking added later.
- **Offline/again-resilient:** the app caches to `localStorage` and writes through to the shared store, so a brief network blip won't lose your entry.
- **Same file, three homes:** this one `index.html` also runs inside a Claude.ai artifact (shared `window.storage`) and as a bare local file (`localStorage`) with no changes.
- **Access code:** change `PASSWORD` near the top of `index.html` before going live.
