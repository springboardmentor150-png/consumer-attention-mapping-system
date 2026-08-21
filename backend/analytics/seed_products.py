from database import SessionLocal
from models import Product


db = SessionLocal()

try:

    products = [
        Product(
            product_name="Product A",
            shelf_id=1,
            store_id=1
        ),

        Product(
            product_name="Product B",
            shelf_id=2,
            store_id=1
        ),

        Product(
            product_name="Product C",
            shelf_id=3,
            store_id=1
        )
    ]

    db.add_all(products)
    db.commit()

    print("Products added successfully.")

except Exception as e:

    db.rollback()
    print("Error:", e)

finally:

    db.close()