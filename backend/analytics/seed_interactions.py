from database import SessionLocal
from models import ProductInteraction
from datetime import datetime, timedelta


db = SessionLocal()

try:

    interactions = [

        # ==========================
        # Product A
        # High attention + good pickup + good conversion
        # ==========================

        ProductInteraction(
            product_id=1,
            tracker_id=1,
            interaction_type="view",
            interaction_time=datetime.now() - timedelta(minutes=30)
        ),

        ProductInteraction(
            product_id=1,
            tracker_id=2,
            interaction_type="view",
            interaction_time=datetime.now() - timedelta(minutes=25)
        ),

        ProductInteraction(
            product_id=1,
            tracker_id=3,
            interaction_type="view",
            interaction_time=datetime.now() - timedelta(minutes=20)
        ),

        ProductInteraction(
            product_id=1,
            tracker_id=1,
            interaction_type="pickup",
            interaction_time=datetime.now() - timedelta(minutes=18)
        ),

        ProductInteraction(
            product_id=1,
            tracker_id=1,
            interaction_type="purchase",
            interaction_time=datetime.now() - timedelta(minutes=15)
        ),


        # ==========================
        # Product B
        # High attention + low conversion
        # ==========================

        ProductInteraction(
            product_id=2,
            tracker_id=4,
            interaction_type="view",
            interaction_time=datetime.now() - timedelta(minutes=20)
        ),

        ProductInteraction(
            product_id=2,
            tracker_id=5,
            interaction_type="view",
            interaction_time=datetime.now() - timedelta(minutes=18)
        ),

        ProductInteraction(
            product_id=2,
            tracker_id=6,
            interaction_type="view",
            interaction_time=datetime.now() - timedelta(minutes=15)
        ),

        ProductInteraction(
            product_id=2,
            tracker_id=7,
            interaction_type="view",
            interaction_time=datetime.now() - timedelta(minutes=12)
        ),

        ProductInteraction(
            product_id=2,
            tracker_id=4,
            interaction_type="pickup",
            interaction_time=datetime.now() - timedelta(minutes=10)
        ),


        # ==========================
        # Product C
        # Low attention + low interaction
        # ==========================

        ProductInteraction(
            product_id=3,
            tracker_id=8,
            interaction_type="view",
            interaction_time=datetime.now() - timedelta(minutes=10)
        ),

        ProductInteraction(
            product_id=3,
            tracker_id=9,
            interaction_type="view",
            interaction_time=datetime.now() - timedelta(minutes=8)
        )

    ]

    db.add_all(interactions)

    db.commit()

    print("Product interactions added successfully.")

except Exception as e:

    db.rollback()

    print("Error:", e)

finally:

    db.close()