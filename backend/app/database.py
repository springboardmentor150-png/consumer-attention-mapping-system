import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
import logging

load_dotenv()

logger = logging.getLogger(__name__)

# ── Database URL — MUST be provided via .env or environment variable ──
# SECURITY: Never hardcode credentials in source code.
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    logger.warning(
        "DATABASE_URL environment variable not set. "
        "Falling back to local SQLite database."
    )
    DATABASE_URL = "sqlite:///cams.db"

# Try initializing database engine with fallback
def _build_engine(url: str):
    if url.startswith("sqlite"):
        return create_engine(
            url,
            connect_args={"check_same_thread": False},
            echo=False
        )
    # Prefer psycopg2 over pg8000 if postgresql+pg8000 given and psycopg2 is available
    if "postgresql+pg8000" in url:
        try:
            import psycopg2
            url = url.replace("postgresql+pg8000", "postgresql+psycopg2")
        except ImportError:
            pass
    return create_engine(
        url,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        pool_timeout=10,
        echo=False,
    )

try:
    engine = _build_engine(DATABASE_URL)
    # Quick connectivity test
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    logger.info(f"Connected to primary database: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else 'local'}")
except Exception as conn_err:
    logger.warning(f"Primary database connection failed ({conn_err}). Falling back to local SQLite database 'cams.db'.")
    DATABASE_URL = "sqlite:///cams.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False}, echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency: yields a database session, closes on exit."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_default_admin():
    """Ensure default admin user exists with password admin123."""
    from .models import User
    import bcrypt
    db = SessionLocal()
    try:
        pw_hash = bcrypt.hashpw(b"admin123", bcrypt.gensalt()).decode("utf-8")
        admin = db.query(User).filter(User.email == "admin@store.com").first()
        if not admin:
            admin = User(
                name="System Admin",
                email="admin@store.com",
                password_hash=pw_hash,
                role="Admin",
                is_active=True
            )
            db.add(admin)
        else:
            admin.password_hash = pw_hash
            admin.is_active = True
        db.commit()
        logger.info("Guaranteed admin user ready: admin@store.com / admin123")
    except Exception as e:
        logger.warning(f"Could not seed admin user: {e}")
    finally:
        db.close()


def run_migrations():
    """Ensure missing columns in PostgreSQL or SQLite are added gracefully."""
    is_sqlite = engine.url.drivername.startswith("sqlite")
    if is_sqlite:
        cols_to_add = [
            ("shopper_sessions", "shopper_code", "VARCHAR(20)"),
            ("shopper_sessions", "behavior_segment", "VARCHAR(100)"),
            ("shopper_sessions", "ai_insight", "VARCHAR(500)"),
        ]
        with engine.connect() as conn:
            for table, col, col_type in cols_to_add:
                try:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type};"))
                    conn.commit()
                except Exception as e:
                    logger.debug(f"SQLite migration note: {e}")
    else:
        queries = [
            "ALTER TABLE shopper_sessions ADD COLUMN IF NOT EXISTS shopper_code VARCHAR(20);",
            "ALTER TABLE shopper_sessions ADD COLUMN IF NOT EXISTS behavior_segment VARCHAR(100);",
            "ALTER TABLE shopper_sessions ADD COLUMN IF NOT EXISTS ai_insight VARCHAR(500);",
        ]
        with engine.connect() as conn:
            for q in queries:
                try:
                    conn.execute(text(q))
                    conn.commit()
                except Exception as e:
                    logger.debug(f"Postgres migration note: {e}")


def init_db():
    """Create all tables if they don't exist, seed default admin, and seed initial store/shelves."""
    try:
        Base.metadata.create_all(bind=engine)
        run_migrations()
        logger.info("Database tables initialized successfully.")
        seed_default_admin()
        seed_initial_data()
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise


def seed_initial_data():
    """Seed initial store, zones, shelves, and products if empty."""
    from .models import Store, StoreZone, Shelf, Product
    db = SessionLocal()
    try:
        store = db.query(Store).first()
        if not store:
            store = Store(
                store_name="Flagship Metro Store",
                location="Main Retail Floor - Zone A",
                description="Primary retail demo location"
            )
            db.add(store)
            db.commit()
            db.refresh(store)

        # Ensure zones exist
        zone_bev = db.query(StoreZone).filter(StoreZone.store_id == store.store_id, StoreZone.zone_name == "Beverages Aisle").first()
        if not zone_bev:
            zone_bev = StoreZone(
                store_id=store.store_id,
                zone_name="Beverages Aisle",
                coordinates={"x1": 0.0, "y1": 0.0, "x2": 0.5, "y2": 0.5},
                description="Cold drinks and teas"
            )
            db.add(zone_bev)

        zone_snack = db.query(StoreZone).filter(StoreZone.store_id == store.store_id, StoreZone.zone_name == "Snacks & Chips Aisle").first()
        if not zone_snack:
            zone_snack = StoreZone(
                store_id=store.store_id,
                zone_name="Snacks & Chips Aisle",
                coordinates={"x1": 0.5, "y1": 0.0, "x2": 1.0, "y2": 0.5},
                description="Packaged snacks and sweets"
            )
            db.add(zone_snack)
        db.commit()

        # Ensure shelves exist
        shelf_bev = db.query(Shelf).filter(Shelf.store_id == store.store_id, Shelf.category == "Beverages").first()
        if not shelf_bev:
            shelf_bev = Shelf(
                store_id=store.store_id,
                zone_id=zone_bev.zone_id if zone_bev else None,
                shelf_name="Beverages Main Shelf",
                category="Beverages",
                coordinates={"x1": 0.1, "y1": 0.1, "x2": 0.45, "y2": 0.45}
            )
            db.add(shelf_bev)

        shelf_snack = db.query(Shelf).filter(Shelf.store_id == store.store_id, Shelf.category == "Snacks").first()
        if not shelf_snack:
            shelf_snack = Shelf(
                store_id=store.store_id,
                zone_id=zone_snack.zone_id if zone_snack else None,
                shelf_name="Snacks & Confectionery Shelf",
                category="Snacks",
                coordinates={"x1": 0.55, "y1": 0.1, "x2": 0.9, "y2": 0.45}
            )
            db.add(shelf_snack)
        db.commit()

        # Ensure products exist
        if shelf_bev:
            p1 = db.query(Product).filter(Product.shelf_id == shelf_bev.shelf_id, Product.product_name == "Organic Green Tea").first()
            if not p1:
                db.add(Product(shelf_id=shelf_bev.shelf_id, product_name="Organic Green Tea", category="Beverages", brand="ZenBrew", price=3.99, sku="BEV-001"))
            p2 = db.query(Product).filter(Product.shelf_id == shelf_bev.shelf_id, Product.product_name == "Sparkling Mineral Water").first()
            if not p2:
                db.add(Product(shelf_id=shelf_bev.shelf_id, product_name="Sparkling Mineral Water", category="Beverages", brand="AquaPure", price=2.49, sku="BEV-002"))

        if shelf_snack:
            p3 = db.query(Product).filter(Product.shelf_id == shelf_snack.shelf_id, Product.product_name == "Crispy Potato Chips").first()
            if not p3:
                db.add(Product(shelf_id=shelf_snack.shelf_id, product_name="Crispy Potato Chips", category="Snacks", brand="CrunchTime", price=2.99, sku="SNK-001"))
            p4 = db.query(Product).filter(Product.shelf_id == shelf_snack.shelf_id, Product.product_name == "Dark Chocolate Bar 70%").first()
            if not p4:
                db.add(Product(shelf_id=shelf_snack.shelf_id, product_name="Dark Chocolate Bar 70%", category="Snacks", brand="ChocoLuxe", price=4.49, sku="SNK-002"))
        db.commit()

        # Ensure default video and shopper tracking sessions exist
        from .models import Video, ShopperSession, TrackingPoint
        import uuid
        DEFAULT_VIDEO_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
        video = db.query(Video).filter(Video.video_id == DEFAULT_VIDEO_ID).first()
        if not video:
            video = Video(
                video_id=DEFAULT_VIDEO_ID,
                store_id=store.store_id,
                filename="test_retail_shopper.mp4",
                file_path="backend/uploads/videos/test_retail_shopper.mp4",
                status="completed",
                fps=25.0,
                duration=60.0
            )
            db.add(video)
            db.commit()
            db.refresh(video)

        session_count = db.query(ShopperSession).filter(ShopperSession.video_id == video.video_id).count()
        if session_count == 0:
            # Create two sample shopper sessions with tracking paths
            s1 = ShopperSession(
                video_id=video.video_id,
                tracker_id=1,
                entry_time=0.0,
                exit_time=45.0,
                total_dwell_time=45.0
            )
            s2 = ShopperSession(
                video_id=video.video_id,
                tracker_id=2,
                entry_time=2.0,
                exit_time=50.0,
                total_dwell_time=48.0
            )
            db.add(s1)
            db.add(s2)
            db.commit()
            db.refresh(s1)
            db.refresh(s2)

            # Generate tracking points across 60 seconds
            pts = []
            for t in range(0, 60):
                frame_num = t * 25
                # Person 1 path moving from left to center
                x1 = 0.20 + (t / 60.0) * 0.40
                y1 = 0.35 + (t % 10) * 0.005
                pts.append(TrackingPoint(
                    session_id=s1.session_id,
                    frame_number=frame_num,
                    timestamp=float(t),
                    x=x1, y=y1, width=0.12, height=0.28,
                    confidence=0.94
                ))
                # Person 2 path standing near shelf right side
                x2 = 0.65 - (t / 60.0) * 0.20
                y2 = 0.45 + (t % 8) * 0.004
                pts.append(TrackingPoint(
                    session_id=s2.session_id,
                    frame_number=frame_num,
                    timestamp=float(t),
                    x=x2, y=y2, width=0.11, height=0.27,
                    confidence=0.91
                ))
            db.bulk_save_objects(pts)
            db.commit()

        logger.info("Initial store, zones, shelves, products, video, and tracking data verified/seeded successfully.")
    except Exception as e:
        logger.warning(f"Could not seed initial data: {e}")
    finally:
        db.close()


def check_db_health() -> dict:
    """Check database connectivity. Returns status dict."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "connected", "url_masked": DATABASE_URL[:30] + "..."}
    except Exception as e:
        return {"status": f"error: {e}", "url_masked": DATABASE_URL[:30] + "..."}
