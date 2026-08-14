# Consumer Attention Mapping System (CAMS)

## 📌 Project Overview

The **Consumer Attention Mapping System (CAMS)** is an AI-powered retail analytics platform designed to understand how customers interact with products and store shelves.

The system uses computer vision, attention analysis, product analytics, and interactive dashboards to help retailers understand customer behavior and improve product placement and store performance.

---

## 🎯 Problem Statement

Traditional retail stores have limited visibility into how customers interact with products.

CAMS addresses this problem by analyzing:

- Customer movement
- Product and shelf interactions
- Customer attention duration
- Product views and pickups
- Purchase conversion
- Shelf engagement
- Customer attention patterns

The collected information is transformed into actionable analytics and recommendations.

---

## 🚀 Objectives

The main objectives of CAMS are:

1. Detect and track shoppers using computer vision.
2. Measure customer attention toward shelves and products.
3. Calculate attention duration and engagement.
4. Generate store heatmaps.
5. Analyze product performance.
6. Calculate product attractiveness scores.
7. Generate intelligent product recommendations.
8. Provide interactive analytics dashboards.
9. Generate CSV and PDF reports.
10. Implement secure authentication and role-based access control.

---

## ✨ Key Features

### 1. Shopper Detection & Tracking

The system detects and tracks shoppers from retail camera/video input.

Technology used:

- YOLOv8
- ByteTrack
- OpenCV

---

### 2. Attention Analysis

CAMS analyzes customer attention toward shelf areas using:

- Face landmarks
- Head pose estimation
- Head direction
- Shelf-zone intersection
- Shopper tracking IDs

The system records attention duration and related engagement metrics.

---

### 3. Heatmap Generation

The system generates a visual heatmap showing areas receiving higher customer attention.

The heatmap can help retailers identify:

- High-attention areas
- Low-attention areas
- Effective shelf positions
- Potential product-placement improvements

---

### 4. Product Analytics

CAMS analyzes product performance using metrics such as:

- Views
- Pickups
- Purchases
- Pickup rate
- Conversion rate
- Attention duration
- Attractiveness score

Example:

```text
Pickup Rate = (Pickups / Views) × 100

Conversion Rate = (Purchases / Pickups) × 100