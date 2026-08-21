# SmartCart – E-commerce Customer Segmentation

An **unsupervised machine learning project** that segments e-commerce customers based on demographics, purchasing behaviour, website activity and engagement patterns.

> This folder holds the original research (notebook + data) this project was
> built from. For the deployed app (API + frontend) built on top of this
> model, see the root [`README.md`](../README.md).

## Problem Statement

SmartCart has customer data but uses generic marketing strategies without clearly understanding different customer behaviour patterns.

The goal is to use **unsupervised learning and clustering** to discover meaningful customer segments that can support targeted marketing and customer retention.

## Dataset

* **2,240 customer records**
* **22 attributes**
* Demographics
* Purchase behaviour and spending
* Website activity
* Purchase channels
* Recency and customer complaints

## Approach

```text
Data Cleaning
      ↓
Feature Engineering
      ↓
Categorical Encoding
      ↓
Outlier Handling
      ↓
Feature Scaling
      ↓
PCA
      ↓
Cluster Evaluation
      ↓
K-Means & Agglomerative Clustering
      ↓
Cluster Profiling
```

### Feature Engineering

Created additional behavioural features including:

* Age
* Customer tenure
* Total spending
* Total children

### Clustering

Two clustering algorithms were fit and compared on the PCA-reduced data:

* **K-Means Clustering** — chosen as the final model
* **Agglomerative Clustering** (ward linkage) — fit for comparison

Cluster count was chosen using:

* **Elbow Method**
* **Silhouette Score**

Both point to **4 customer clusters**. K-Means's cluster assignments (not
Agglomerative's) are what the final profiling, visualizations, and the
deployed app are built on.

## Results

The resulting clusters are profiled using:

* Income
* Total spending
* Purchase behaviour
* Purchase channels
* Website activity
* Recency

This reveals four distinct customer segments — used in the deployed app as
**Family Shoppers**, **Loyal High-Spenders**, **Digital Bargain Browsers**,
and **Best-ROI Singles** — that support targeted marketing and customer
engagement strategies.

## Tech Stack

**Python · Pandas · NumPy · Scikit-learn · Matplotlib · Seaborn · Jupyter Notebook**