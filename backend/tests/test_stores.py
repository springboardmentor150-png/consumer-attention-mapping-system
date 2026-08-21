import pytest


def test_create_and_list_stores(client, admin_headers):
    # Create Store
    create_res = client.post(
        "/api/stores",
        headers=admin_headers,
        json={"store_name": "Flagship Retail Store", "location": "123 High Street, NY"}
    )
    assert create_res.status_code == 201
    store = create_res.json()
    assert store["store_name"] == "Flagship Retail Store"
    store_id = store["store_id"]

    # List Stores
    list_res = client.get("/api/stores", headers=admin_headers)
    assert list_res.status_code == 200
    stores = list_res.json()
    assert len(stores) >= 1

    # Create Zone
    zone_res = client.post(
        f"/api/stores/{store_id}/zones",
        headers=admin_headers,
        json={"zone_name": "Entrance Zone", "coordinates": {"x1": 0, "y1": 0, "x2": 100, "y2": 100}}
    )
    assert zone_res.status_code == 201
    zone = zone_res.json()
    assert zone["zone_name"] == "Entrance Zone"

    # Create Shelf
    shelf_res = client.post(
        "/api/shelves",
        headers=admin_headers,
        json={
            "store_id": store_id,
            "zone_id": zone["zone_id"],
            "shelf_name": "Beverage Shelf A",
            "category": "Beverages"
        }
    )
    assert shelf_res.status_code == 201
    shelf = shelf_res.json()
    assert shelf["shelf_name"] == "Beverage Shelf A"

    # Create Product
    product_res = client.post(
        "/api/products",
        headers=admin_headers,
        json={
            "shelf_id": shelf["shelf_id"],
            "product_name": "Organic Green Tea",
            "category": "Beverages",
            "brand": "PureTea",
            "sku": "TEA-001",
            "price": 3.99
        }
    )
    assert product_res.status_code == 201
    product = product_res.json()
    assert product["product_name"] == "Organic Green Tea"
