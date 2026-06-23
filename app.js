// ── eLwazi Metrics Observatory — app logic ──────────────────────────────
// Fetches the published sheet CSV, groups rows by metric + focus area,
// and renders the readout strip, focus-area modules, and full log table.

(function () {
  "use strict";

  const els = {
    statusDot: document.getElementById("status-dot"),
    statusText: document.getElementById("status-text"),
    lastUpdated: document.getElementById("last-updated"),
    readoutCards: document.getElementById("readout-cards"),
    focusAreas: document.getElementById("focus-areas"),
    fullTableBody: document.getElementById("full-table-body"),
    sourceLink: document.getElementById("source-link"),
  };

  els.sourceLink.href = CONFIG.SHEET_EDIT_URL;

  function setStatus(state, text) {
    els.statusDot.className = "status-dot status-" + state;
    els.statusText.textContent = text;
  }

  function cacheBustedUrl(url) {
    const sep = url.includes("?") ? "&" : "?";
    return url + sep + "_t=" + Date.now();
  }

  // ── tiny RFC4180-ish CSV parser (handles quoted fields, escaped quotes,
  // commas/newlines inside quotes) — no external dependency required. ──
  function parseCSV(text) {
    const rows = [];
    let row = [], field = "", inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += c;
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field); field = "";
      } else if (c === "\n") {
        row.push(field); rows.push(row); row = []; field = "";
      } else if (c === "\r") {
        // skip, paired \n handles the row break
      } else {
        field += c;
      }
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }

    if (!rows.length) return [];
    const header = rows[0].map(h => h.trim());
    return rows.slice(1)
      .filter(r => r.some(v => v !== ""))
      .map(r => {
        const obj = {};
        header.forEach((h, idx) => { obj[h] = (r[idx] !== undefined ? r[idx] : "").trim(); });
        return obj;
      });
  }

  function loadData() {
    setStatus("loading", "Fetching latest figures…");
    fetch(cacheBustedUrl(CONFIG.SHEET_CSV_URL))
      .then(resp => {
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        return resp.text();
      })
      .then(text => {
        const rows = parseCSV(text).filter(r => r.metric && r.metric.trim());
        render(rows);
        setStatus("live", "Live");
        els.lastUpdated.textContent = "Checked " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      })
      .catch(err => {
        console.error(err);
        setStatus("error", "Could not reach data source");
      });
  }

  // ── grouping ────────────────────────────────────────────────────────
  function groupByMetric(rows) {
    const byId = new Map();
    for (const r of rows) {
      const id = r.id;
      if (!byId.has(id)) {
        byId.set(id, {
          id,
          focus_area: r.focus_area,
          metric: r.metric,
          source_method: r.source_method,
          frequency: r.frequency,
          impact_area: r.impact_area,
          working_group: r.working_group,
          value_raw: r.value_raw,
          value_numeric: r.value_numeric,
          cadence: {
            monthly: r.cadence_monthly === "1",
            quarterly: r.cadence_quarterly === "1",
            sixmonths: r.cadence_6months === "1",
            yearly: r.cadence_yearly === "1",
          },
          breakdowns: [],
        });
      }
      const entry = byId.get(id);
      if (r.sub_label && r.sub_label.trim()) {
        entry.breakdowns.push({ label: r.sub_label.trim(), value: r.value_numeric, raw: r.value_raw });
      }
      // carry forward focus_area text if the parent row lacked it
      if (!entry.focus_area && r.focus_area) entry.focus_area = r.focus_area;
    }
    return Array.from(byId.values());
  }

  function groupByFocus(metrics) {
    const map = new Map();
    for (const m of metrics) {
      const key = m.focus_area || "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(m);
    }
    const ordered = [];
    for (const key of CONFIG.FOCUS_AREA_ORDER) {
      if (map.has(key)) { ordered.push([key, map.get(key)]); map.delete(key); }
    }
    for (const [k, v] of map) ordered.push([k, v]);
    return ordered;
  }

  function hasNumber(m) {
    return m.value_numeric !== "" && m.value_numeric !== undefined && !isNaN(parseFloat(m.value_numeric));
  }

  // ── readout strip (headline totals) ──────────────────────────────────
  function renderReadouts(metrics) {
    els.readoutCards.innerHTML = "";
    const numericMetrics = metrics.filter(hasNumber);
    const totalTracked = metrics.length;
    const totalWithData = numericMetrics.length;
    const sumAll = numericMetrics.reduce((s, m) => s + parseFloat(m.value_numeric), 0);
    const groups = new Set(metrics.map(m => m.working_group).filter(Boolean).join(",").split(",").map(s => s.trim()).filter(Boolean));

    const cards = [
      { label: "Indicators tracked", value: totalTracked, suffix: "" },
      { label: "With current readings", value: totalWithData, suffix: "" },
      { label: "Working groups reporting", value: groups.size, suffix: "" },
      { label: "Focus areas", value: CONFIG.FOCUS_AREA_ORDER.length, suffix: "" },
    ];

    for (const c of cards) {
      const div = document.createElement("div");
      div.className = "readout-card";
      div.innerHTML = `<div class="readout-value">${c.value}${c.suffix}</div><div class="readout-label">${c.label}</div>`;
      els.readoutCards.appendChild(div);
    }
  }

  // ── focus area blocks ─────────────────────────────────────────────────
  function cadenceDots(cadence) {
    const parts = [];
    if (cadence.monthly) parts.push('<span class="dot dot-monthly" title="Monthly"></span>');
    if (cadence.quarterly) parts.push('<span class="dot dot-quarterly" title="Quarterly"></span>');
    if (cadence.sixmonths) parts.push('<span class="dot dot-6months" title="Bi-annual"></span>');
    if (cadence.yearly) parts.push('<span class="dot dot-yearly" title="Annual"></span>');
    if (!parts.length) parts.push('<span class="dot dot-none" title="Ad hoc / not yet scheduled"></span>');
    return parts.join("");
  }

  function renderFocusAreas(groupedByFocus) {
    els.focusAreas.innerHTML = "";
    const tpl = document.getElementById("tpl-focus-block");
    const cardTpl = document.getElementById("tpl-metric-card");

    groupedByFocus.forEach(([focusName, metrics], idx) => {
      const block = tpl.content.cloneNode(true);
      const article = block.querySelector(".focus-block");
      article.querySelector(".focus-index").textContent = String(idx + 1).padStart(2, "0");
      article.querySelector(".focus-title").textContent = focusName;
      article.querySelector(".focus-count").textContent = metrics.length + " indicator" + (metrics.length === 1 ? "" : "s");

      const grid = article.querySelector(".focus-grid");
      metrics.forEach(m => {
        const card = cardTpl.content.cloneNode(true);
        const cardEl = card.querySelector(".metric-card");
        cardEl.querySelector(".metric-cadence-dot").innerHTML = cadenceDots(m.cadence);
        cardEl.querySelector(".metric-wg").textContent = m.working_group || "";

        const valueEl = cardEl.querySelector(".metric-value");
        if (hasNumber(m)) {
          valueEl.textContent = Number(m.value_numeric).toLocaleString();
        } else if (m.value_raw && m.value_raw.trim()) {
          valueEl.textContent = "—";
          valueEl.classList.add("metric-value-narrative");
        } else {
          valueEl.textContent = "·";
          valueEl.classList.add("metric-value-pending");
        }

        cardEl.querySelector(".metric-label").textContent = m.metric;

        const breakdownEl = cardEl.querySelector(".metric-breakdown");
        if (m.breakdowns.length) {
          breakdownEl.innerHTML = m.breakdowns.map(b =>
            `<span class="breakdown-chip"><strong>${b.value || b.raw || ""}</strong> ${b.label}</span>`
          ).join("");
        } else {
          breakdownEl.remove();
        }

        const metaEl = cardEl.querySelector(".metric-meta");
        if (m.value_raw && !hasNumber(m) && m.value_raw.trim()) {
          metaEl.textContent = m.value_raw.length > 90 ? m.value_raw.slice(0, 90) + "…" : m.value_raw;
        } else if (m.frequency) {
          metaEl.textContent = m.frequency.split("\n")[0];
        } else {
          metaEl.remove();
        }

        grid.appendChild(card);
      });

      els.focusAreas.appendChild(block);
    });
  }

  // ── full log table ───────────────────────────────────────────────────
  function renderTable(metrics) {
    els.fullTableBody.innerHTML = "";
    metrics.forEach(m => {
      const tr = document.createElement("tr");
      const reading = hasNumber(m) ? Number(m.value_numeric).toLocaleString() : (m.value_raw || "—");
      tr.innerHTML = `
        <td>${m.focus_area || ""}</td>
        <td>${m.metric}</td>
        <td class="cell-reading">${reading}</td>
        <td>${(m.frequency || "").split("\n")[0]}</td>
        <td>${m.working_group || ""}</td>
      `;
      els.fullTableBody.appendChild(tr);
    });
  }

  function render(rows) {
    const metrics = groupByMetric(rows);
    const grouped = groupByFocus(metrics);
    renderReadouts(metrics);
    renderFocusAreas(grouped);
    renderTable(metrics);
  }

  loadData();
  if (CONFIG.REFRESH_INTERVAL_MS > 0) {
    setInterval(loadData, CONFIG.REFRESH_INTERVAL_MS);
  }
})();
