# eLwazi Metrics Observatory

A live, public dashboard for your project's indicators — hosted free on GitHub Pages, fed by a Google Sheet you edit like any spreadsheet. No code editing needed after setup.

---

## How it works

```
You edit numbers in Google Sheets
         ↓
Sheet is "published to web" as a CSV link
         ↓
Dashboard (GitHub Pages) fetches that CSV every time someone visits
         ↓
Charts, cards, and the full table update automatically
```

There's no server and no database — GitHub Pages only hosts static files. The Google Sheet *is* your database. This means:
- ✅ Updating a number in the sheet updates the live site (next page load — no redeploy, no git commit)
- ✅ You never touch code to change data
- ⚠️ Anyone with the published CSV link can **read** the data (fine, since you said public is ok)
- ⚠️ Only people you've given **edit access to the Google Sheet** can change numbers

---

## Part 1 — Set up the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) → **Blank spreadsheet**.
2. Import your starting data: **File → Import → Upload** → select `data/elwazi-metrics-for-google-sheets.xlsx` (included in this project) → **Insert new sheet(s)**.
3. Rename the tab to `metrics` (the dashboard doesn't care about the tab name, but it keeps things tidy).
4. **Don't rename or reorder the columns** in row 1 — the dashboard matches them by name:

   | Column | What goes here |
   |---|---|
   | `id` | Groups breakdown rows under one parent metric. Leave blank on a sub-row to nest it under the metric above. |
   | `focus_area` | One of your three programme themes. Leave blank on rows after the first occurrence — it carries forward visually. |
   | `metric` | The indicator name. |
   | `sub_label` | Only for breakdown rows (e.g. "Twitter/X" under "social media followers"). Leave blank otherwise. |
   | `source_method` | How it's measured. |
   | `value_raw` | The reading exactly as you'd write it (can include text). |
   | `value_numeric` | Just the number, no units or comments — this is what gets charted. Leave blank if there's no clean number yet. |
   | `frequency` | How often it's measured, in your own words. |
   | `impact_area` | Strategic theme(s) it feeds into. |
   | `working_group` | Who owns it. |
   | `cadence_monthly` / `cadence_quarterly` / `cadence_6months` / `cadence_yearly` | Put `1` in whichever applies, leave the rest blank or `0`. |

5. **To add a brand new metric**: add a new row, give it a new `id` number, fill in `focus_area` and `metric` at minimum.
6. **To update an existing number**: just edit the `value_numeric` (and `value_raw`) cell. That's it.

### Publish it
1. **File → Share → Publish to web**.
2. Under "Link", choose the `metrics` sheet (not "Entire document") and format **Comma-separated values (.csv)**.
3. Click **Publish**, confirm.
4. Copy the URL it gives you — looks like:
   `https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?gid=0&single=true&output=csv`

> This published link is read-only and updates automatically a minute or two after you edit the sheet — you don't need to re-publish after every change.

---

## Part 2 — Point the dashboard at your sheet

Open `js/config.js` and replace two lines:

```js
SHEET_CSV_URL: "PASTE_YOUR_PUBLISHED_CSV_LINK_HERE",
SHEET_EDIT_URL: "PASTE_YOUR_NORMAL_GOOGLE_SHEET_LINK_HERE",
```

`SHEET_EDIT_URL` is just for the "view source sheet" link in the footer — use your regular sheet URL (the one you see in the address bar while editing).

Commit and push that one-line change — this is the *only* code edit you'll make, and only once.

---

## Part 3 — Deploy to GitHub Pages

1. Create a **new public repository** on GitHub (e.g. `elwazi-metrics`).
2. Upload everything in this folder to the repo (drag-and-drop on the GitHub web UI works fine — no git command line required):
   - `index.html`
   - `css/style.css`
   - `js/app.js`
   - `js/config.js`
   - `data/metrics.csv` *(only used as a fallback/demo — once you set `SHEET_CSV_URL` it's not read)*
3. Go to the repo's **Settings → Pages**.
4. Under "Build and deployment" → Source, choose **Deploy from a branch**.
5. Branch: `main`, folder: `/ (root)`. Save.
6. Wait ~1 minute, then visit the URL GitHub shows you (`https://yourusername.github.io/elwazi-metrics/`).

---

## Updating going forward

- **Change a number** → edit the Google Sheet → refresh the live page (changes propagate within a minute or two of editing).
- **Add a new metric** → add a row to the sheet with a new `id`.
- **Change the look** → edit `css/style.css`. Colors are all defined as CSS variables at the top of the file.
- **Change cadence colors/legend** → edit the `.cadence-strip` section in `index.html` and matching CSS.

## Files in this project

```
index.html              the page structure
css/style.css           all visual styling
js/config.js            ← the one file you edit: your sheet URL
js/app.js               fetches the sheet, renders everything
data/metrics.csv         starter data (fallback if you haven't set a sheet URL yet)
data/elwazi-metrics-for-google-sheets.xlsx   import this into Google Sheets to start
```

## Limitations to know about

- The published CSV is technically public to anyone with the link, even though the Sheet itself can stay access-controlled for editing.
- Google's publish-to-web refresh isn't instant — allow a minute or two after editing before checking the live site.
- This is read-only from the dashboard's side; there's no "edit from the website" button. If you later want that, the realistic path is a small form that writes to the Sheet via the Google Sheets API (a different, small project) — happy to help with that when you're ready.
