/**
 * Pure-JS reimplementation of the SmartCart clustering pipeline.
 *
 * The model itself (StandardScaler, PCA(3), KMeans(k=4)) was fit once in
 * Python/scikit-learn on smartcart_customers.csv. Rather than shipping a
 * Python runtime, we exported the fitted parameters (means, scales, PCA
 * components, cluster centers) to data/model_artifact.json and replicate
 * the exact linear-algebra steps here. Given the same fitted parameters,
 * this produces identical cluster assignments to the notebook.
 *
 * Pipeline (must mirror smartcart_customer_segmentation.ipynb exactly):
 *   1. Feature engineering: Age, Customer_Tenure_Days, Total_spending, Total_Children
 *   2. Education / Marital_Status bucketing (same replace-map as notebook, bugs and all)
 *   3. One-hot encode Education, Living_With
 *   4. StandardScaler
 *   5. PCA -> 3 components
 *   6. KMeans (k=4) -> nearest centroid
 */

const fs = require("fs");
const path = require("path");

const ARTIFACT = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "data", "model_artifact.json"), "utf-8")
);

// Persona metadata derived from the actual fitted cluster means (see /api/insights
// for the raw numbers) and cross-checked against the instructor's board:
// Cluster 0 = Red = Family Shoppers, 1 = Blue = Loyal High-Spenders,
// 2 = Yellow = Digital Bargain Browsers, 3 = Green = Best-ROI Singles.
const PERSONAS = {
  0: {
    name: "Family Shoppers",
    color: "red",
    hex: "#D6493F",
    livingWith: "Partnered, with children",
    tagline: "Budget-minded households buying for the whole family.",
    action: "Send deal-of-the-week coupons and discount bundles — they respond to price, not premium positioning.",
  },
  1: {
    name: "Loyal High-Spenders",
    color: "blue",
    hex: "#2E5FE0",
    livingWith: "Partnered, high income",
    tagline: "Established household spenders who buy in-store and via catalog.",
    action: "Enroll in a loyalty / rewards program — they already spend, reward repeat purchase.",
  },
  2: {
    name: "Digital Bargain Browsers",
    color: "yellow",
    hex: "#C98A1F",
    livingWith: "Single, budget-conscious",
    tagline: "Frequent web visitors who browse a lot but convert on discounts.",
    action: "Retarget with digital ads and flash sales/coupons to convert browsing into checkout.",
  },
  3: {
    name: "Best-ROI Singles",
    color: "green",
    hex: "#2F9E58",
    livingWith: "Single, high income",
    tagline: "Fewer touchpoints needed — highest campaign response rate of any segment.",
    action: "Offer premium / concierge services — best marketing ROI, low discount dependency.",
  },
};

// --- Step A: replicate the notebook's category bucketing (including its quirks) ---
function bucketEducation(raw) {
  const map = {
    Basic: "Undergraduate",
    "2n Cycle": "Undergraduate",
    Graduation: "Graduate",
    Master: "Postgraduate",
    Phd: "Postgraduate", // NOTE: dataset actually contains "PhD" (capital D), so this
    // branch never fires in training — "PhD" passes through unchanged, exactly like
    // in the source notebook. We replicate that faithfully so live predictions match
    // the trained model's category set (Education_PhD is a real column it learned).
  };
  return map[raw] !== undefined ? map[raw] : raw;
}

function bucketLivingWith(raw) {
  const map = {
    Married: "Partner",
    Together: "Partner",
    Single: "Alone",
    Divorced: "Alone",
    Widow: "Alone",
    Absurd: "Alone",
    YOLO: "Alone",
  };
  return map[raw] !== undefined ? map[raw] : raw;
}

// --- Step B: build the 19-feature raw vector in the exact trained column order ---
function buildRawFeatureVector(input) {
  const educationBucket = bucketEducation(input.education);
  const livingWithBucket = bucketLivingWith(input.maritalStatus);

  const age = 2026 - Number(input.yearBirth);

  const refDate = new Date(ARTIFACT.reference_date + "T00:00:00Z");
  const joinDate = new Date(input.dtCustomer + "T00:00:00Z");
  const tenureDays = Math.round((refDate.getTime() - joinDate.getTime()) / 86400000);

  const totalSpending =
    Number(input.mntWines || 0) +
    Number(input.mntFruits || 0) +
    Number(input.mntMeatProducts || 0) +
    Number(input.mntFishProducts || 0) +
    Number(input.mntSweetProducts || 0) +
    Number(input.mntGoldProds || 0);

  const totalChildren = Number(input.kidhome || 0) + Number(input.teenhome || 0);

  const values = {
    Income: Number(input.income),
    Recency: Number(input.recency),
    NumDealsPurchases: Number(input.numDealsPurchases),
    NumWebPurchases: Number(input.numWebPurchases),
    NumCatalogPurchases: Number(input.numCatalogPurchases),
    NumStorePurchases: Number(input.numStorePurchases),
    NumWebVisitsMonth: Number(input.numWebVisitsMonth),
    Complain: Number(input.complain ? 1 : 0),
    Response: Number(input.response ? 1 : 0),
    Age: age,
    Customer_Tenure_Days: tenureDays,
    Total_spending: totalSpending,
    Total_Children: totalChildren,
    Education_Graduate: educationBucket === "Graduate" ? 1 : 0,
    Education_PhD: educationBucket === "PhD" ? 1 : 0,
    Education_Postgraduate: educationBucket === "Postgraduate" ? 1 : 0,
    Education_Undergraduate: educationBucket === "Undergraduate" ? 1 : 0,
    Living_With_Alone: livingWithBucket === "Alone" ? 1 : 0,
    Living_With_Partner: livingWithBucket === "Partner" ? 1 : 0,
  };

  return ARTIFACT.feature_order.map((f) => {
    if (!(f in values)) {
      throw new Error(`Missing feature during vector build: ${f}`);
    }
    return values[f];
  });
}

// --- Step C: StandardScaler ---
function scale(vec) {
  return vec.map((v, i) => (v - ARTIFACT.scaler_mean[i]) / ARTIFACT.scaler_scale[i]);
}

// --- Step D: PCA projection (3 components) ---
function projectPCA(vecScaled) {
  const centered = vecScaled.map((v, i) => v - ARTIFACT.pca_mean[i]);
  return ARTIFACT.pca_components.map((component) =>
    component.reduce((sum, w, i) => sum + w * centered[i], 0)
  );
}

// --- Step E: nearest-centroid KMeans assignment ---
function assignCluster(pcaPoint) {
  const distances = ARTIFACT.kmeans_centers.map((center) =>
    Math.sqrt(center.reduce((sum, c, i) => sum + (c - pcaPoint[i]) ** 2, 0))
  );
  let best = 0;
  for (let i = 1; i < distances.length; i++) {
    if (distances[i] < distances[best]) best = i;
  }

  // Turn distances into a soft "confidence" readout (softmax over negative distances)
  const maxD = Math.max(...distances);
  const exp = distances.map((d) => Math.exp(-(d - maxD)));
  const sumExp = exp.reduce((a, b) => a + b, 0);
  const confidence = exp.map((e) => e / sumExp);

  return { cluster: best, distances, confidence };
}

function predict(input) {
  const raw = buildRawFeatureVector(input);
  const scaled = scale(raw);
  const pcaPoint = projectPCA(scaled);
  const { cluster, distances, confidence } = assignCluster(pcaPoint);

  return {
    cluster,
    persona: PERSONAS[cluster],
    pcaPoint,
    confidence: confidence.map((c, i) => ({ cluster: i, score: Math.round(c * 1000) / 10 })),
    debug: { raw, scaled, distances },
  };
}

module.exports = { predict, PERSONAS, ARTIFACT };
