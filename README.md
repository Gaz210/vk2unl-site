# VK2UNL — station site

Static blog + station log built with [Eleventy](https://www.11ty.dev/), deployed to GitHub Pages.

## Local dev

```
npm install
npm run serve
```

Opens at `http://localhost:8080`.

## Structure

- `src/posts/*.md` — blog posts (add a new `.md` file, front matter needs `title`, `date`, `layout: post.njk`)
- `src/_data/qsos.json` — your QSO log. Every entry needs `lat`/`lng` so it can be plotted on the globe and shown on the log page. Add contacts here as you make them.
- `src/_data/site.json` — callsign, QTH, grid square, DMR ID, and the two feed URLs below.
- `src/index.njk` — homepage with the globe hero
- `src/log.njk` — full QSO log table (sortable, filterable)
- `src/propagation.njk` — live band conditions

## Deploying to GitHub Pages

1. Push this repo to GitHub.
2. In repo Settings → Pages, set Source to "GitHub Actions".
3. If this repo is **not** `<yourusername>.github.io` (i.e. it's a project page like `github.com/you/vk2unl-site`), edit `.github/workflows/deploy.yml` and set `ELEVENTY_PATH_PREFIX: /vk2unl-site/` (your repo name, with slashes).
4. Push to `main` — the Action builds and deploys automatically.

## Wiring up "online now" status

The badge on the homepage polls a JSON URL you set in `src/_data/site.json` → `onlineStatusUrl`. It expects:

```json
{ "online": true, "detail": "on 146.700 Beecroft repeater" }
```

Simplest option given your TrueNAS setup: a small cron job (or a container alongside your `arr` stack) that checks whatever you use to know you're active (radio keyed, DMR hotspot active, whatever signal you have) and writes that JSON to a **GitHub Gist** via the GitHub API, then point `onlineStatusUrl` at the Gist's raw URL. Gists support CORS on raw content, so the browser can fetch it directly with no server needed on the Pages side.

## Propagation data

`src/js/propagation.js` fetches HamQSL's free solar-terrestrial XML feed directly in the browser. HamQSL doesn't send CORS headers, so if the direct fetch is blocked, it falls back to a public CORS proxy. If both fail (proxy uptime isn't guaranteed), it shows a link straight to hamqsl.com — worth keeping an eye on and swapping the proxy if it goes down.

## DMR ID

Once you've got one, drop it into `site.json` → `dmrId` and it'll show up in the header stats automatically.
