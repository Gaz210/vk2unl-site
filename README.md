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
- `src/_data/qsos.adx` — your QSO log in **ADX** (ADIF's XML format). This is the real amateur radio logging standard — almost every logging program (Log4OM, N1MM+, DXKeeper, CloudLog, HRD, etc.) can export it directly. Export from your software, drop the file in here (overwrite it), commit, push — the site rebuilds and the globe/log table update automatically.
- `src/_data/qsos.js` — parses the ADX file at build time (no need to touch this unless your software's export uses non-standard field names).
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

## How QSO locations are plotted

The globe and log table need a location per contact. Rather than typing lat/lng by hand, the build reads each record's `GRIDSQUARE` field (the Maidenhead locator of the station you worked — most logging software fills this in automatically from their callsign/QRZ lookup) and converts it to lat/lng. If a record has no gridsquare, it's skipped on the globe but still shows in the table.
