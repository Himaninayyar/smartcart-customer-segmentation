const form = document.getElementById("predict-form");
const submitBtn = document.getElementById("submit-btn");
const errorMsg = document.getElementById("error-msg");
const receiptHolder = document.getElementById("receipt-holder");

const API_BASE = window.location.origin;

function val(id) {
  const el = document.getElementById(id);
  if (!el) return undefined;
  if (el.type === "checkbox") return el.checked;
  return el.value;
}

function buildPayload() {
  return {
    yearBirth: val("yearBirth"),
    education: val("education"),
    maritalStatus: val("maritalStatus"),
    kidhome: val("kidhome"),
    teenhome: val("teenhome"),
    dtCustomer: val("dtCustomer"),
    income: val("income"),
    mntWines: val("mntWines"),
    mntFruits: val("mntFruits"),
    mntMeatProducts: val("mntMeatProducts"),
    mntFishProducts: val("mntFishProducts"),
    mntSweetProducts: val("mntSweetProducts"),
    mntGoldProds: val("mntGoldProds"),
    numDealsPurchases: val("numDealsPurchases"),
    numWebPurchases: val("numWebPurchases"),
    numCatalogPurchases: val("numCatalogPurchases"),
    numStorePurchases: val("numStorePurchases"),
    numWebVisitsMonth: val("numWebVisitsMonth"),
    recency: val("recency"),
    response: val("response"),
    complain: val("complain"),
  };
}

// Deterministic "barcode" pattern derived from the cluster id + PCA point,
// so each segment prints a visually distinct code — not decorative noise.
function barcodeGradient(seedString) {
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash * 31 + seedString.charCodeAt(i)) >>> 0;
  }
  const bars = [];
  let pos = 0;
  let h = hash;
  while (pos < 100) {
    h = (h * 1103515245 + 12345) >>> 0;
    const w = 1 + (h % 4);
    const gap = 1 + ((h >> 8) % 3);
    bars.push(`var(--ink) ${pos}px, var(--ink) ${pos + w}px, transparent ${pos + w}px, transparent ${pos + w + gap}px`);
    pos += w + gap;
  }
  return `repeating-linear-gradient(90deg, ${bars.join(",")})`;
}

function renderReceipt(result, payload) {
  const persona = result.persona;
  const code = `SC-${String(result.cluster).padStart(2, "0")}-${persona.color.toUpperCase()}`;
  const now = new Date();
  const stamp = now.toISOString().slice(0, 19).replace("T", " ");

  const confidenceRows = result.confidence
    .slice()
    .sort((a, b) => b.score - a.score)
    .map((c) => {
      const p = PERSONA_LOOKUP[c.cluster];
      return `
        <div class="confidence-item">
          <span>${p.name}</span>
          <span class="confidence-track"><span class="confidence-fill" style="width:${c.score}%; background:${p.hex}"></span></span>
          <span>${c.score.toFixed(1)}%</span>
        </div>`;
    })
    .join("");

  receiptHolder.innerHTML = `
    <div class="receipt">
      <div class="receipt-bar" style="background:${persona.hex}"></div>
      <div class="receipt-row"><span>Segment code</span><span>${code}</span></div>
      <h3 class="receipt-cluster-name" style="color:${persona.hex}">${persona.name}</h3>
      <p class="receipt-tagline">${persona.tagline}</p>
      <div class="barcode" style="background-image:${barcodeGradient(code + payload.income)}"></div>
      <div class="confidence-list">${confidenceRows}</div>
      <hr class="receipt-divider" />
      <div class="receipt-action">
        <b>Recommended action</b>
        ${persona.action}
      </div>
      <div class="receipt-footer">
        <span>SCANNED ${stamp} UTC</span>
        <span>${persona.livingWith}</span>
      </div>
    </div>
  `;
}

let PERSONA_LOOKUP = {};

async function loadPersonas() {
  try {
    const res = await fetch(`${API_BASE}/api/insights`);
    const data = await res.json();
    data.clusters.forEach((c) => {
      PERSONA_LOOKUP[c.cluster] = c;
    });
    const t = data.datasetTotals;
    document.getElementById("stat-strip").innerHTML = `
      <div class="stat"><b>${t.totalRecords.toLocaleString()}</b><span>Customer Records</span></div>
      <div class="stat"><b>${t.featuresUsed}</b><span>Model Features</span></div>
      <div class="stat"><b>${t.segments}</b><span>Segments</span></div>
      <div class="stat"><b>3</b><span>PCA Components</span></div>
    `;
  } catch (e) {
    console.warn("Could not preload personas", e);
  }
}
loadPersonas();

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.style.display = "none";
  submitBtn.disabled = true;
  submitBtn.textContent = "Scanning…";

  const payload = buildPayload();

  try {
    const res = await fetch(`${API_BASE}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Request failed (${res.status})`);
    }
    const result = await res.json();
    renderReceipt(result, payload);
  } catch (err) {
    errorMsg.textContent = `Couldn't scan customer: ${err.message}`;
    errorMsg.style.display = "block";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Scan customer →";
  }
});
