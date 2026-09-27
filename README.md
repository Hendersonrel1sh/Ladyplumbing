# Apprenticeship Logbook

A simple, private logbook for tracking a plumbing apprenticeship: log tasks against
quick-select categories, add notes and photos, and generate a printable logbook for
interviews or appraisals.

It's a static site — no server, no account, no build step. It runs entirely in your
browser and stores entries locally on whichever device you use it on.

## Features

- **Quick-select task categories** covering common Plumbing & Domestic Heating
  apprenticeship areas (cold/hot water, central heating, drainage, sanitary
  appliances, pipework and jointing, pressure testing, fault finding, environmental
  technology, health & safety, and more) — or type your own.
- **Level of involvement** per entry — Observed / Assisted / Completed independently —
  so your progression over time is visible.
- **Notes, hours, and an optional "witnessed by" name** for each entry.
- **Photos**, resized and compressed automatically so they don't blow out browser
  storage.
- **Filters** by category and date range.
- **Logbook generator** — builds a clean, printable document (use your browser's
  "Print → Save as PDF") from whatever entries match your current filters, with a
  summary of entries, hours, and categories covered. Good for interviews and
  appraisals.
- **Backup / restore** — entries live in this browser only, so export a `.json`
  backup regularly and commit it to your repo (or just keep the download). Import
  merges with or replaces your current entries.

## Running it locally

No build step — just open `index.html` in a browser, or serve the folder:

```bash
cd ladyplumbing-app
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploying to GitHub Pages

1. Copy these files (`index.html`, `style.css`, `app.js`) into your repo:
   `https://github.com/Hendersonrel1sh/Ladyplumbing`
2. Commit and push to the `main` branch:
   ```bash
   git add index.html style.css app.js README.md
   git commit -m "Add apprenticeship logbook app"
   git push
   ```
3. In the repo on GitHub: **Settings → Pages → Source**, choose the `main` branch
   and `/ (root)` folder, then save.
4. GitHub will publish it at `https://hendersonrel1sh.github.io/Ladyplumbing/`
   (usually within a minute or two).

## Important: where your data lives

Entries and photos are stored in your browser's local storage, on the device and
browser you used to add them — they are **not** pushed to GitHub automatically, and
they will **not** appear if you open the site on a different device or browser.

To keep things safe and to work across devices:

- Use **Export backup (.json)** in the left rail regularly.
- Commit that file into a `backups/` folder in your repo if you want it
  version-controlled alongside your code.
- Use **Import backup** on another device (or after clearing your browser data) to
  restore it.

Browser storage typically allows several MB per site — comfortably hundreds of
entries with photos, but if you're logging heavily, export and clear older entries
now and then to stay well within that.

## Customising the task list

The quick-select categories are defined near the top of `app.js` in the
`CATEGORIES` array — edit that list to match your specific course or awarding body
if it differs from the default set.
