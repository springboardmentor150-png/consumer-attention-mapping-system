import logging
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.models.store import Store
from app.models.shelf import Shelf
from app.models.camera import Camera
from app.models.user import User
from app.models.recommendation import Recommendation
from app.models.product_score import ProductScore
from app.utils.security import hash_password

logger = logging.getLogger(__name__)

def check_and_migrate_schema(engine):
    """Ensure missing columns like zone_coordinates in shelves table are created."""
    try:
        with engine.connect() as conn:
            dialect = engine.dialect.name
            if dialect == "sqlite":
                tables = [r[0] for r in conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'")).fetchall()]
                if "shelves" in tables:
                    columns = [row[1] for row in conn.execute(text("PRAGMA table_info(shelves)")).fetchall()]
                    if "zone_coordinates" not in columns:
                        logger.info("Migrating SQLite schema: adding zone_coordinates column to shelves table...")
                        conn.execute(text("ALTER TABLE shelves ADD COLUMN zone_coordinates TEXT"))
                        conn.commit()
            elif dialect == "postgresql":
                logger.info("Verifying PostgreSQL schema...")
                conn.execute(text("ALTER TABLE shelves ADD COLUMN IF NOT EXISTS zone_coordinates JSONB"))
                conn.commit()
    except Exception as exc:
        logger.warning(f"Schema migration warning: {exc}")

def seed_database(db: Session):
    try:
        # Seed Stores
        if db.query(Store).count() == 0:
            logger.info("Seeding initial store data into database...")
            stores = [
                Store(store_name="Store A - Flagship", location="5th Avenue, NYC"),
                Store(store_name="Store B - Westside", location="Market Street, San Francisco"),
                Store(store_name="Store C - Metro Center", location="Michigan Ave, Chicago"),
            ]
            db.add_all(stores)
            db.commit()

        # Seed Shelves
        if db.query(Shelf).count() == 0:
            logger.info("Seeding initial shelf data into database...")
            first_store = db.query(Store).first()
            store_id = first_store.id if first_store else 1
            shelves = [
                Shelf(shelf_name="Shelf A - Premium Beverages", category="Beverages", store_id=store_id),
                Shelf(shelf_name="Shelf B - Gourmet Snacks", category="Snacks", store_id=store_id),
                Shelf(shelf_name="Shelf C - Smart Electronics", category="Electronics", store_id=store_id),
                Shelf(shelf_name="Shelf D - Beauty & Skincare", category="Cosmetics", store_id=store_id),
            ]
            db.add_all(shelves)
            db.commit()

        # Seed Cameras
        if db.query(Camera).count() == 0:
            logger.info("Seeding initial camera data into database...")
            first_store = db.query(Store).first()
            store_id = first_store.id if first_store else 1
            cameras = [
                Camera(camera_name="Entrance Cam 1", ip_address="192.168.1.101", location="Main Entrance", store_id=store_id),
                Camera(camera_name="Beverages Vision Cam", ip_address="192.168.1.102", location="Beverages Section", store_id=store_id),
                Camera(camera_name="Electronics Overhead Cam", ip_address="192.168.1.103", location="Electronics Section", store_id=store_id),
            ]
            db.add_all(cameras)
            db.commit()

        # Seed Default Users
        if db.query(User).count() == 0:
            logger.info("Seeding default system users into database...")
            users = [
                User(name="Administrator", email="admin@example.com", password=hash_password("admin123"), role="admin"),
                User(name="Store Manager", email="manager@example.com", password=hash_password("manager123"), role="manager"),
                User(name="Retail Analyst", email="analyst@example.com", password=hash_password("analyst123"), role="analyst"),
                User(name="Marketing Manager", email="marketing@example.com", password=hash_password("marketing123"), role="marketing"),
            ]
            db.add_all(users)
            db.commit()

        # Seed Product Scores
        if db.query(ProductScore).count() == 0:
            logger.info("Seeding product scores...")
            product_scores = [
                ProductScore(product_name="Sparkling Energy Drink", shelf_name="Shelf A - Premium Beverages", attention_duration=24.5, interaction_frequency=18, pickup_rate=0.75, conversion_rate=0.62, attractiveness_score=88.5),
                ProductScore(product_name="Organic Dark Chocolate", shelf_name="Shelf B - Gourmet Snacks", attention_duration=32.0, interaction_frequency=25, pickup_rate=0.85, conversion_rate=0.78, attractiveness_score=94.2),
                ProductScore(product_name="Wireless Noise-Canceling Earbuds", shelf_name="Shelf C - Smart Electronics", attention_duration=19.2, interaction_frequency=12, pickup_rate=0.55, conversion_rate=0.45, attractiveness_score=78.0),
            ]
            db.add_all(product_scores)
            db.commit()

        # Seed Recommendations
        if db.query(Recommendation).count() == 0:
            logger.info("Seeding AI recommendations...")
            recs = [
                Recommendation(product_name="Sparkling Energy Drink", shelf_name="Shelf A - Premium Beverages", attractiveness_score=88.5, recommendation_type="success", message="High engagement and dwell time. Maintain prime eye-level positioning."),
                Recommendation(product_name="Organic Dark Chocolate", shelf_name="Shelf B - Gourmet Snacks", attractiveness_score=94.2, recommendation_type="success", message="Top conversion rate across store. Expand shelf width by 20%."),
                Recommendation(product_name="Wireless Noise-Canceling Earbuds", shelf_name="Shelf C - Smart Electronics", attractiveness_score=78.0, recommendation_type="warning", message="Dwell time below section average. Update promotional display signage."),
            ]
            db.add_all(recs)
            db.commit()

    except Exception as exc:
        db.rollback()
        logger.error(f"Error seeding database: {exc}")
