const API_BASE = window.location.origin;
const grid = document.getElementById("atlas-grid");

const STATS = [
  { key: "Income", label: "Avg income", fmt: (v) => `$${Math.round(v).toLocaleString()}` },
  { key: "Total_spending", label: "Avg spend / 2yr", fmt: (v) => `$${Math.round(v).toLocaleString()}` },
  { key: "Total_Children", label: "Avg children", fmt: (v) => v.toFixed(2) },
  { key: "Response", label: "Response rate", fmt: (v) => `${(v * 100).toFixed(1)}%` },
];

function order(clusters) {
  const colorOrder = { red: 0, blue: 1, yellow: 2, green: 3 };
  return clusters.slice().sort((a, b) => colorOrder[a.color] - colorOrder[b.color]);
}

async function load() {
  const res = await fetch(`${API_BASE}/api/insights`);
  const data = await res.json();
  const clusters = order(data.clusters);

  const maxByStat = {};
  STATS.forEach((s) => {
    maxByStat[s.key] = Math.max(...clusters.map((c) => c[s.key]));
  });

  grid.innerHTML = clusters
    .map((c) => {
      const share = ((c.size / data.datasetTotals.recordsAfterCleaning) * 100).toFixed(1);
      const statRows = STATS.map((s) => {
        const value = c[s.key];
        const pct = Math.max(6, (value / maxByStat[s.key]) * 100);
        return `
          <div class="seg-stat-row">
            <span class="label">${s.label}</span>
            <span class="seg-bar-track"><span class="seg-bar-fill" style="width:${pct}%; background:${c.hex}"></span></span>
            <span class="value">${s.fmt(value)}</span>
          </div>`;
      }).join("");

      return `
        <article class="seg-card">
          <div class="seg-card-bar" style="background:${c.hex}"></div>
          <div class="seg-card-body">
            <div class="seg-card-top">
              <h3 class="seg-card-name" style="color:${c.hex}">${c.name}</h3>
              <div class="seg-card-share"><b>${share}%</b>${c.size.toLocaleString()} customers</div>
            </div>
            <p class="seg-card-tagline">${c.tagline}</p>
            ${statRows}
            <div class="seg-card-action">
              <b>Recommended channel</b>
              ${c.action}
            </div>
          </div>
        </article>`;
    })
    .join("");
}

load();
