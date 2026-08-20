# SmartCart – E-commerce Customer Segmentation

An **unsupervised machine learning project** that segments e-commerce customers based on demographics, purchasing behaviour, website activity and engagement patterns.

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

```text id="3h5k0g"
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

The project uses:

* **PCA** for dimensionality reduction
* **K-Means Clustering**
* **Agglomerative Clustering**
* **Elbow Method**
* **Silhouette Score**

The final segmentation analysis uses **4 customer clusters**.

## Results

The resulting clusters are profiled using:

* Income
* Total spending
* Purchase behaviour
* Purchase channels
* Website activity
* Recency

This reveals distinct customer behaviour patterns that can be used to support targeted marketing and customer engagement strategies.

## Tech Stack

**Python · Pandas · NumPy · Scikit-learn · Matplotlib · Seaborn · Jupyter Notebook**

