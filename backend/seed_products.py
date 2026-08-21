"""
Seed Retail Store Shelves and Products with Product Scores & Interactions
"""

import sys
import os
import uuid
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
from app.database import SessionLocal, engine, Base
import app.models
from app.models import Store, StoreZone, Shelf, Product, ProductScore, ProductInteraction, ShopperSession

Base.metadata.create_all(bind=engine)
db = SessionLocal()

store = db.query(Store).first()
if not store:
    store = Store(
        store_id=uuid.uuid4(),
        store_name="Main Retail Supermarket",
        location="Central Plaza, Floor 1"
    )
    db.add(store)
    db.commit()

# Clear existing products & scores to re-seed cleanly
db.query(ProductInteraction).delete()
db.query(ProductScore).delete()
db.query(Product).delete()
db.query(Shelf).delete()
db.query(StoreZone).delete()
db.commit()

# 1. Create Zones
zones = {
    "Area 1 (Beverages)": StoreZone(store_id=store.store_id, zone_name="Area 1 (Beverages)", coordinates={"x1": 0.55, "y1": 0.04, "x2": 0.96, "y2": 0.48}),
    "Area 2 (Snacks)": StoreZone(store_id=store.store_id, zone_name="Area 2 (Snacks)", coordinates={"x1": 0.04, "y1": 0.04, "x2": 0.52, "y2": 0.28}),
    "Area 3 (Main Floor)": StoreZone(store_id=store.store_id, zone_name="Area 3 (Main Floor)", coordinates={"x1": 0.12, "y1": 0.22, "x2": 0.76, "y2": 0.78}),
    "Register / Checkout": StoreZone(store_id=store.store_id, zone_name="Register / Checkout", coordinates={"x1": 0.02, "y1": 0.30, "x2": 0.28, "y2": 0.85}),
    "Store Entrance": StoreZone(store_id=store.store_id, zone_name="Store Entrance", coordinates={"x1": 0.70, "y1": 0.50, "x2": 0.98, "y2": 0.95}),
}
for z in zones.values():
    db.add(z)
db.commit()

# 2. Create Shelves
shelves = {
    "Beverage Cooler Bay": Shelf(store_id=store.store_id, zone_id=zones["Area 1 (Beverages)"].zone_id, shelf_name="Beverage Cooler Bay", category="Beverages", coordinates={"x1": 0.55, "y1": 0.10, "x2": 0.95, "y2": 0.40}),
    "Snack & Chips Island": Shelf(store_id=store.store_id, zone_id=zones["Area 2 (Snacks)"].zone_id, shelf_name="Snack & Chips Island", category="Snacks", coordinates={"x1": 0.10, "y1": 0.05, "x2": 0.50, "y2": 0.25}),
    "Canned Foods & Grocery": Shelf(store_id=store.store_id, zone_id=zones["Area 3 (Main Floor)"].zone_id, shelf_name="Canned Foods & Grocery", category="Grocery", coordinates={"x1": 0.50, "y1": 0.25, "x2": 0.75, "y2": 0.70}),
    "POS Checkout Display": Shelf(store_id=store.store_id, zone_id=zones["Register / Checkout)" if "Register / Checkout)" in zones else "Register / Checkout"].zone_id, shelf_name="POS Checkout Display", category="Impulse", coordinates={"x1": 0.05, "y1": 0.35, "x2": 0.25, "y2": 0.75}),
}
for sh in shelves.values():
    db.add(sh)
db.commit()

# 3. Create Products with Scores
products_data = [
    {
        "name": "Doritos Nacho Cheese 200g", "cat": "Snacks", "brand": "Frito-Lay", "sku": "SNK-DOR-01",
        "shelf": shelves["Snack & Chips Island"], "price": 3.29,
        "score": 0.948, "att": 0.96, "inter": 0.94, "pickup": 0.95, "conv": 0.93, "repeat": 0.90,
        "interactions": 18, "notes": "Top performing product on promotional display island. High eye gaze fixation and rapid customer pickup rate."
    },
    {
        "name": "Coca-Cola Original 500ml", "cat": "Beverages", "brand": "The Coca-Cola Co.", "sku": "BEV-COK-01",
        "shelf": shelves["Beverage Cooler Bay"], "price": 1.99,
        "score": 0.924, "att": 0.94, "inter": 0.92, "pickup": 0.91, "conv": 0.95, "repeat": 0.88,
        "interactions": 22, "notes": "Consistent bestseller in beverage cooler. High impulse conversion and frequent cross-purchases with snacks."
    },
    {
        "name": "Lay's Classic Potato Chips 180g", "cat": "Snacks", "brand": "Frito-Lay", "sku": "SNK-LAY-01",
        "shelf": shelves["Snack & Chips Island"], "price": 2.99,
        "score": 0.895, "att": 0.91, "inter": 0.88, "pickup": 0.90, "conv": 0.89, "repeat": 0.85,
        "interactions": 15, "notes": "Prime eye-level placement on snack rack. Strong continuous engagement from browsing shoppers."
    },
    {
        "name": "Red Bull Energy Drink 250ml", "cat": "Beverages", "brand": "Red Bull", "sku": "BEV-RBL-01",
        "shelf": shelves["Beverage Cooler Bay"], "price": 2.49,
        "score": 0.886, "att": 0.89, "inter": 0.87, "pickup": 0.88, "conv": 0.92, "repeat": 0.82,
        "interactions": 14, "notes": "High attention grabber in upper cooler shelf. Fast grab-and-go decision time."
    },
    {
        "name": "Oreo Double Stuf Cookies 300g", "cat": "Snacks", "brand": "Mondelez", "sku": "SNK-ORE-01",
        "shelf": shelves["Snack & Chips Island"], "price": 3.79,
        "score": 0.872, "att": 0.88, "inter": 0.86, "pickup": 0.87, "conv": 0.89, "repeat": 0.81,
        "interactions": 12, "notes": "Popular bakery bay item. High visual attraction among family shoppers."
    },
    {
        "name": "Tropicana Pure Premium Orange Juice 1L", "cat": "Beverages", "brand": "Tropicana", "sku": "BEV-TRP-01",
        "shelf": shelves["Beverage Cooler Bay"], "price": 3.49,
        "score": 0.852, "att": 0.86, "inter": 0.84, "pickup": 0.85, "conv": 0.88, "repeat": 0.79,
        "interactions": 11, "notes": "Steady morning traffic and targeted searches in chilled juice section."
    },
    {
        "name": "Barilla Penne Rigate 500g", "cat": "Grocery", "brand": "Barilla", "sku": "GRO-BAR-01",
        "shelf": shelves["Canned Foods & Grocery"], "price": 2.19,
        "score": 0.844, "att": 0.85, "inter": 0.83, "pickup": 0.84, "conv": 0.86, "repeat": 0.80,
        "interactions": 9, "notes": "Core staple product in central grocery aisle. High basket penetration."
    },
    {
        "name": "Kellogg's Corn Flakes 500g", "cat": "Grocery", "brand": "Kellogg's", "sku": "GRO-KEL-01",
        "shelf": shelves["Canned Foods & Grocery"], "price": 4.29,
        "score": 0.831, "att": 0.84, "inter": 0.81, "pickup": 0.82, "conv": 0.85, "repeat": 0.81,
        "interactions": 8, "notes": "Prominent breakfast shelf position with strong brand recognition."
    },
    {
        "name": "San Pellegrino Sparkling Water 750ml", "cat": "Beverages", "brand": "Nestle", "sku": "BEV-SAN-01",
        "shelf": shelves["Beverage Cooler Bay"], "price": 2.99,
        "score": 0.810, "att": 0.82, "inter": 0.79, "pickup": 0.80, "conv": 0.84, "repeat": 0.77,
        "interactions": 7, "notes": "Premium beverage cooler item with dedicated health-conscious consumer base."
    },
    {
        "name": "Rold Gold Classic Pretzels 300g", "cat": "Snacks", "brand": "Frito-Lay", "sku": "SNK-RLD-01",
        "shelf": shelves["Snack & Chips Island"], "price": 2.79,
        "score": 0.783, "att": 0.79, "inter": 0.76, "pickup": 0.78, "conv": 0.81, "repeat": 0.74,
        "interactions": 6, "notes": "Secondary snack display placement. Consistent consideration."
    },
    {
        "name": "Campbell's Classic Tomato Soup 400g", "cat": "Grocery", "brand": "Campbell's", "sku": "GRO-CAM-01",
        "shelf": shelves["Canned Foods & Grocery"], "price": 1.89,
        "score": 0.765, "att": 0.77, "inter": 0.75, "pickup": 0.76, "conv": 0.79, "repeat": 0.72,
        "interactions": 5, "notes": "Established staple in canned food aisle."
    },
    {
        "name": "Heinz Baked Beans 415g", "cat": "Grocery", "brand": "Kraft Heinz", "sku": "GRO-HNZ-01",
        "shelf": shelves["Canned Foods & Grocery"], "price": 1.69,
        "score": 0.742, "att": 0.75, "inter": 0.73, "pickup": 0.74, "conv": 0.76, "repeat": 0.70,
        "interactions": 5, "notes": "Good price-point performance in middle shelf row."
    },
    {
        "name": "Trident Spearmint Sugar-Free Gum 3-Pack", "cat": "Impulse", "brand": "Mondelez", "sku": "IMP-TRD-01",
        "shelf": shelves["POS Checkout Display"], "price": 1.49,
        "score": 0.951, "att": 0.97, "inter": 0.95, "pickup": 0.96, "conv": 0.98, "repeat": 0.86,
        "interactions": 24, "notes": "Highest conversion efficiency at checkout counter. Strong impulse trigger during queue dwell."
    },
    {
        "name": "Snickers Milk Chocolate Bar 50g", "cat": "Impulse", "brand": "Mars", "sku": "IMP-SNK-01",
        "shelf": shelves["POS Checkout Display"], "price": 1.29,
        "score": 0.937, "att": 0.95, "inter": 0.93, "pickup": 0.94, "conv": 0.97, "repeat": 0.84,
        "interactions": 20, "notes": "Top grab-and-go confectionery item at point-of-sale terminal."
    }
]

for p_data in products_data:
    pid = uuid.uuid4()
    prod = Product(
        product_id=pid,
        shelf_id=p_data["shelf"].shelf_id,
        product_name=p_data["name"],
        category=p_data["cat"],
        brand=p_data["brand"],
        sku=p_data["sku"],
        price=p_data["price"]
    )
    db.add(prod)

    pscore = ProductScore(
        score_id=uuid.uuid4(),
        product_id=pid,
        attractiveness_score=p_data["score"],
        attention_score=p_data["att"],
        interaction_score=p_data["inter"],
        pickup_score=p_data["pickup"],
        conversion_score=p_data["conv"],
        repeat_engagement_score=p_data["repeat"],
        is_partial=False,
        calculation_notes=p_data["notes"]
    )
    db.add(pscore)

    # Add sample interactions
    session = db.query(ShopperSession).first()
    if session:
        for _ in range(p_data["interactions"]):
            inter = ProductInteraction(
                interaction_id=uuid.uuid4(),
                session_id=session.session_id,
                product_id=pid,
                interaction_type="picked_up" if _ % 2 == 0 else "viewed",
                timestamp=float(2.5 + (_ % 15)),
                confidence=0.92
            )
            db.add(inter)

db.commit()
print(f"Successfully seeded {len(products_data)} complete retail products with scores!")
db.close()
