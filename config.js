// ── eLwazi Metrics Observatory — configuration ──────────────────────────
// This is the ONLY file you need to touch to point the dashboard at your
// own Google Sheet. Everything else regenerates automatically.

const CONFIG = {
  // Paste your "Publish to web" CSV URL here.
  // How to get it:
  //   1. Open your Google Sheet
  //   2. File → Share → Publish to web
  //   3. Choose the metrics tab, format = CSV, click Publish
  //   4. Copy the link it gives you and paste it below
  SHEET_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSYCKnD_tJ8vT6KdG34TeFQ12ZWWJCX64ig8UKvXgTJX1XmutZ49JSW-FayARh79HzGkZEKtYFhHg4F/pub?gid=189042258&single=true&output=csv",

  // Shown in the footer as a clickable link back to the editable source.
  // Paste the normal (non-published) sheet URL so editors can find it.
  SHEET_EDIT_URL: "https://docs.google.com/spreadsheets/d/125RQ_mvGWYh6rZa49IKOukhGPModEFYOngM4-aZMhDw/edit?gid=189042258#gid=189042258",

  // How often (ms) the dashboard re-fetches the sheet while the page is open.
  // 5 minutes by default. Set to 0 to disable auto-refresh.
  REFRESH_INTERVAL_MS: 5 * 60 * 1000,

  // Display order for focus areas. Anything in the data not listed here
  // is appended at the end automatically, so this is optional to maintain.
  FOCUS_AREA_ORDER: [
    "Driving increased access to open data content",
    "Advancing Collaborative Research Through Infrastructure & Technical Integration",
    "Building Sustainable & Community-driven Infrastructure Research Ecosystems"
  ]
};
