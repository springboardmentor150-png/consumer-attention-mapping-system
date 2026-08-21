import pytest


def test_end_to_end_analytics_and_intelligence(client, admin_headers):
    # 1. Create Store
    store_res = client.post(
        "/api/stores",
        headers=admin_headers,
        json={"store_name": "E2E Retail Superstore", "location": "Sector 5"}
    )
    store = store_res.json()
    store_id = store["store_id"]

    # 2. Check initial analytics overview
    overview_res = client.get("/api/analytics/overview", headers=admin_headers)
    assert overview_res.status_code == 200
    overview = overview_res.json()
    assert "total_shopper_sessions" in overview
    assert "purchase_conversion" in overview
    assert "POS" in overview["purchase_conversion"]  # Verified purchase conversion disclaimer

    # 3. Check heatmap endpoint
    heatmap_res = client.get(f"/api/attention/heatmap?store_id={store_id}&heatmap_type=traffic", headers=admin_headers)
    assert heatmap_res.status_code == 200
    heatmap = heatmap_res.json()
    assert "grid" in heatmap
    assert "disclaimer" in heatmap

    # 4. Generate recommendations
    recs_res = client.post(f"/api/recommendations/generate?store_id={store_id}", headers=admin_headers)
    assert recs_res.status_code == 200
    recs_data = recs_res.json()
    assert "generated" in recs_data

    # 5. List recommendations
    list_recs = client.get(f"/api/recommendations?store_id={store_id}", headers=admin_headers)
    assert list_recs.status_code == 200

    # 6. Generate report
    report_req = client.post(
        "/api/reports/generate",
        headers=admin_headers,
        json={
            "report_type": "consumer_attention",
            "report_format": "csv",
            "store_id": store_id
        }
    )
    assert report_req.status_code == 202
    report = report_req.json()
    assert report["status"] in ["generating", "completed"]
