const path = require("path");
const express = require("express");
const cors = require("cors");
const { predict, PERSONAS, ARTIFACT } = require("./src/predict");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const REQUIRED_FIELDS = [
  "income",
  "recency",
  "numDealsPurchases",
  "numWebPurchases",
  "numCatalogPurchases",
  "numStorePurchases",
  "numWebVisitsMonth",
  "yearBirth",
  "dtCustomer",
  "education",
  "maritalStatus",
  "kidhome",
  "teenhome",
];

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "smartcart-segment-console" });
});

app.post("/api/predict", (req, res) => {
  const body = req.body || {};
  const missing = REQUIRED_FIELDS.filter((f) => body[f] === undefined || body[f] === "");
  if (missing.length) {
    return res.status(400).json({ error: "Missing required fields", missing });
  }
  try {
    const result = predict(body);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Prediction failed", detail: err.message });
  }
});

app.get("/api/insights", (_req, res) => {
  const clusters = ARTIFACT.cluster_summary.map((row) => ({
    ...row,
    ...PERSONAS[row.cluster],
    size: ARTIFACT.cluster_sizes[String(row.cluster)],
  }));

  res.json({
    datasetTotals: {
      totalRecords: ARTIFACT.n_records_total,
      recordsAfterCleaning: ARTIFACT.n_records_after_cleaning,
      featuresUsed: ARTIFACT.feature_order.length,
      segments: clusters.length,
    },
    clusters,
  });
});

app.listen(PORT, () => {
  console.log(`SmartCart Segment Console running on http://localhost:${PORT}`);
});
