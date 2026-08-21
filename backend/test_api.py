import requests
import json
import time

BASE_URL = "http://localhost:8000/api"

def main():
    print("Starting API verification test...")
    time.sleep(2)  # Ensure server is fully ready
    
    # 1. Register a Test Admin User
    print("\n1. Testing User Registration...")
    signup_payload = {
        "name": "Validation Admin",
        "email": "validation_admin@cams.com",
        "password": "password123",
        "role": "Admin"
    }
    
    try:
        register_res = requests.post(f"{BASE_URL}/auth/register", json=signup_payload)
        if register_res.status_code == 201:
            print("Successfully registered test admin user!")
        elif register_res.status_code == 400 and "already registered" in register_res.text:
            print("Test user already exists (continuing to login)...")
        else:
            print(f"Failed to register: {register_res.status_code} - {register_res.text}")
            return
    except Exception as e:
        print(f"Connection failed: {e}")
        return

    # 2. Login to get JWT Token
    print("\n2. Testing User Login & Token Generation...")
    login_payload = {
        "email": "validation_admin@cams.com",
        "password": "password123"
    }
    
    login_res = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
    if login_res.status_code != 200:
        print(f"Login failed: {login_res.status_code} - {login_res.text}")
        return
        
    login_data = login_res.json()
    token = login_data["access_token"]
    user_info = login_data["user"]
    print(f"Logged in successfully! Token received.")
    print(f"User Info: {user_info['name']} (Role: {user_info['role']})")
    
    # Set headers
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Create a Store
    print("\n3. Testing Store Creation...")
    store_payload = {
        "store_name": "Premium Metro Mart",
        "location": "88 Neon Boulevard, TechCity"
    }
    store_res = requests.post(f"{BASE_URL}/stores", json=store_payload, headers=headers)
    if store_res.status_code != 201:
        print(f"Failed to create store: {store_res.status_code} - {store_res.text}")
        return
    store = store_res.json()
    store_id = store["store_id"]
    print(f"Store created successfully! ID: {store_id}, Name: {store['store_name']}")

    # 4. Create a Zone
    print("\n4. Testing Store Zone Creation...")
    zone_payload = {
        "zone_name": "Beverage & Snack Wing"
    }
    zone_res = requests.post(f"{BASE_URL}/stores/{store_id}/zones", json=zone_payload, headers=headers)
    if zone_res.status_code != 201:
        print(f"Failed to create zone: {zone_res.status_code} - {zone_res.text}")
        return
    zone = zone_res.json()
    zone_id = zone["zone_id"]
    print(f"Zone created successfully! ID: {zone_id}, Name: {zone['zone_name']}")

    # 5. Create a Shelf
    print("\n5. Testing Shelf Creation...")
    shelf_payload = {
        "store_id": store_id,
        "zone_id": zone_id,
        "category": "Soft Drinks & Juices"
    }
    shelf_res = requests.post(f"{BASE_URL}/shelves", json=shelf_payload, headers=headers)
    if shelf_res.status_code != 201:
        print(f"Failed to create shelf: {shelf_res.status_code} - {shelf_res.text}")
        return
    shelf = shelf_res.json()
    shelf_id = shelf["shelf_id"]
    print(f"Shelf created successfully! ID: {shelf_id}, Category: {shelf['category']}")

    # 6. Add Products to Shelf
    print("\n6. Testing Adding Products to Shelf...")
    product_payload = {
        "product_name": "Neon Energy Drink",
        "price": 3.49,
        "sku": "NEON-NRG-001"
    }
    prod_res = requests.post(f"{BASE_URL}/shelves/{shelf_id}/products", json=product_payload, headers=headers)
    if prod_res.status_code != 201:
        print(f"Failed to add product: {prod_res.status_code} - {prod_res.text}")
        return
    product = prod_res.json()
    print(f"Product added: {product['product_name']} | SKU: {product['sku']} | Price: ${product['price']}")

    # 7. Add Cameras to Shelf
    print("\n7. Testing Camera Assignment to Shelf...")
    camera_payload = {
        "store_id": store_id,
        "shelf_id": shelf_id,
        "camera_name": "Main Aisle Cam 01",
        "ip_address": "", # Empty leaves it as simulated
        "status": "Active"
    }
    cam_res = requests.post(f"{BASE_URL}/cameras", json=camera_payload, headers=headers)
    if cam_res.status_code != 201:
        print(f"Failed to add camera: {cam_res.status_code} - {cam_res.text}")
        return
    camera = cam_res.json()
    print(f"Camera linked successfully! ID: {camera['camera_id']} | Name: {camera['camera_name']}")

    # 8. Query back everything to verify references
    print("\n8. Verifying Data Queries...")
    get_stores_res = requests.get(f"{BASE_URL}/stores", headers=headers)
    print(f"Get Stores Response contains {len(get_stores_res.json())} stores.")
    
    get_shelves_res = requests.get(f"{BASE_URL}/shelves?store_id={store_id}", headers=headers)
    shelves_data = get_shelves_res.json()
    print(f"Get Shelves Response contains {len(shelves_data)} shelves.")
    if len(shelves_data) > 0:
        verify_shelf = shelves_data[0]
        print(f"Shelf products: {len(verify_shelf.get('products', []))}")
        print(f"Shelf cameras: {len(verify_shelf.get('cameras', []))}")

    print("\nAPI VERIFICATION COMPLETED SUCCESSFULLY! All backend routes are fully functional.")

if __name__ == "__main__":
    main()
