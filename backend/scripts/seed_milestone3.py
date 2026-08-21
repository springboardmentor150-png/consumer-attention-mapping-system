"""
CAMS Milestone 3 — Live Database Seeder
Calls the live FastAPI endpoints + direct DB inserts to populate real data
for the Milestone 3 Behavioral Intelligence, Heatmaps & Recommendations features.
Run while uvicorn is running: python scripts/seed_milestone3.py
"""
import sys
import os
import uuid
import json
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# ─── HTTP helpers ─────────────────────────────────────────────────────────────

def http_post(url, data=None, token=None):
    body = json.dumps(data).encode() if data else b""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        resp = urllib.request.urlopen(req, timeout=20)
        return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

def http_get(url, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers)
    try:
        resp = urllib.request.urlopen(req, timeout=20)
        return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

# ─── Seed sessions directly into PostgreSQL ───────────────────────────────────

def seed_db_direct(store_id: str, camera_id: str):
    """Insert synthetic ShopperSessions + AttentionEvents directly via SQLAlchemy."""
    import asyncio
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    from dotenv import dotenv_values

    env = dotenv_values(os.path.join(os.path.dirname(__file__), "..", ".env"))
    db_url = env.get("DATABASE_URL", "")
    if not db_url:
        print("  [ERROR] DATABASE_URL not found in .env")
        return False

    async_url = (db_url
        .replace("postgresql://", "postgresql+asyncpg://")
        .replace("postgresql+psycopg2://", "postgresql+asyncpg://")
    )

    from app.models.shopper_session import ShopperSession
    from app.models.attention_event import AttentionEvent

    synthetic = [
        {
            "anon": "synthetic_explorer_01",
            "dwell": 380.0,
            "path": [{"x": float(i * 3), "y": float((i * 2) % 30), "zone_id": f"zone_{i%4+1}"} for i in range(25)],
            "zones": ["zone_1", "zone_2", "zone_3", "zone_4"],
            "events": 8,
            "event_dur": 5.0,
        },
        {
            "anon": "synthetic_quick_02",
            "dwell": 85.0,
            "path": [{"x": float(i * 2), "y": 5.0, "zone_id": "zone_1"} for i in range(5)],
            "zones": ["zone_1"],
            "events": 2,
            "event_dur": 2.0,
        },
        {
            "anon": "synthetic_comparison_03",
            "dwell": 240.0,
            "path": [{"x": float(10 + i), "y": 10.0, "zone_id": "zone_2"} for i in range(8)],
            "zones": ["zone_2"],
            "events": 25,
            "event_dur": 4.0,
        },
        {
            "anon": "synthetic_impulse_04",
            "dwell": 140.0,
            "path": [{"x": float(i) * 2.5, "y": float(i), "zone_id": f"zone_{i%2+1}"} for i in range(10)],
            "zones": ["zone_1", "zone_2"],
            "events": 5,
            "event_dur": 3.0,
        },
        {
            "anon": "synthetic_loyal_05",
            "dwell": 210.0,
            "path": [{"x": 15.0, "y": float(i * 4), "zone_id": "zone_3"} for i in range(10)],
            "zones": ["zone_3"],
            "events": 4,
            "event_dur": 6.0,
        },
    ]

    async def _insert():
        engine = create_async_engine(async_url, echo=False)
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        now = datetime.now(timezone.utc)
        created = 0

        async with async_session() as db:
            for sd in synthetic:
                sid = str(uuid.uuid4())
                entry_time = now - timedelta(seconds=sd["dwell"] + 60)
                exit_time  = now - timedelta(seconds=60)

                sess = ShopperSession(
                    id=sid,
                    store_id=store_id,
                    camera_id=camera_id,
                    anonymous_id=sd["anon"],
                    entry_time=entry_time,
                    exit_time=exit_time,
                    total_dwell_time_seconds=sd["dwell"],
                    path_data=sd["path"],
                    zones_visited=sd["zones"],
                    is_active=False,
                )
                db.add(sess)

                for _ in range(sd["events"]):
                    ev = AttentionEvent(
                        session_id=sid,
                        camera_id=camera_id,
                        event_type="gaze_start",
                        is_looking_at_shelf=True,
                        attention_duration_seconds=sd["event_dur"],
                        confidence_score=0.85,
                    )
                    db.add(ev)

                created += 1
                print(f"     + {sd['anon']} ({sd['dwell']}s dwell, {sd['events']} gaze events)")

            await db.commit()
        await engine.dispose()
        return created

    count = asyncio.run(_insert())
    print(f"  Inserted {count} synthetic sessions into PostgreSQL")
    return count > 0

# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    BASE = "http://localhost:8000/api"

    print("=" * 68)
    print("  CAMS MILESTONE 3 - LIVE DATABASE SEEDER")
    print("=" * 68)

    # Step 1: Login
    print("\n[1/6] Logging in...")
    token = None
    for creds in [
        {"email": "admin@example.com", "password": "Admin@123"},
        {"email": "storemanager@gmail.com", "password": "store@23"},
    ]:
        code, body = http_post(f"{BASE}/auth/login", creds)
        if code == 200 and isinstance(body, dict) and "access_token" in body:
            token = body["access_token"]
            print(f"  OK Logged in as {creds['email']}")
            break
    if not token:
        print("  FAIL Login failed. Is uvicorn running? Run: uvicorn app.main:app --reload")
        sys.exit(1)

    # Step 2: Get store
    print("\n[2/6] Fetching store ID...")
    code, stores = http_get(f"{BASE}/stores", token)
    if code != 200 or not isinstance(stores, list) or len(stores) == 0:
        print(f"  FAIL No stores found: {code}")
        sys.exit(1)
    store_id = stores[0]["id"]
    store_name = stores[0]["name"]
    print(f"  OK Store: '{store_name}' ({store_id})")

    # Step 3: Get or create camera
    print("\n[3/6] Finding or creating camera...")
    camera_id = None

    code, cam_body = http_get(f"{BASE}/cameras?store_id={store_id}", token)
    if code == 200:
        cam_list = cam_body if isinstance(cam_body, list) else cam_body.get("cameras", [])
        for c in cam_list:
            if c.get("store_id") == store_id:
                camera_id = c["id"]
                print(f"  OK Using existing camera: {c['name']} ({camera_id})")
                break

    if not camera_id:
        # Auto-create a synthetic camera
        print("  No camera found. Creating synthetic camera...")
        cam_data = {
            "store_id": store_id,
            "name": "Synthetic Cam 01",
            "camera_type": "ip",
            "rtsp_url": "rtsp://synthetic:0/stream",
            "ip_address": "192.168.1.100",
            "resolution": "1920x1080",
            "fps": 30,
            "location_description": "Main aisle overhead",
            "mount_height_cm": 300.0,
            "field_of_view_degrees": 90.0,
            "status": "inactive",
        }
        code, cam_resp = http_post(f"{BASE}/cameras", cam_data, token)
        if code in (200, 201) and isinstance(cam_resp, dict):
            camera_id = cam_resp["id"]
            print(f"  OK Created camera: {cam_resp['name']} ({camera_id})")
        else:
            print(f"  FAIL Could not create camera: {code} — {cam_resp}")
            sys.exit(1)

    # Step 4: Seed synthetic sessions if DB is empty
    print("\n[4/6] Checking & seeding tracking sessions...")
    code, segs = http_get(f"{BASE}/behavior/segments/{store_id}", token)
    already_classified = (code == 200 and isinstance(segs, dict) and segs.get("total_sessions", 0) > 0)

    if already_classified:
        print(f"  OK Already have {segs['total_sessions']} classified sessions - skipping seeding")
    else:
        print("  Seeding 5 synthetic shopper sessions (Explorer, Quick, Comparison, Impulse, Loyal)...")
        ok = seed_db_direct(store_id, camera_id)
        if not ok:
            print("  FAIL DB seeding failed")
            sys.exit(1)

    # Step 5: Classify sessions
    print("\n[5/6] Running behavioral classification (POST /behavior/classify)...")
    code, body = http_post(f"{BASE}/behavior/classify/{store_id}", token=token)
    if code == 200:
        classified = body.get("sessions_classified", 0)
        dist = body.get("segment_distribution", [])
        print(f"  OK Classified: {classified} sessions")
        for d in dist:
            print(f"     {d['segment_type'].replace('_',' ').title()}: {d['count']} ({d['percentage']}%)")
    else:
        print(f"  FAIL: {code} {body}")

    # Step 6: Calculate scores + recommendations
    print("\n[6/6] Scoring products & generating recommendations...")
    code2, body2 = http_post(f"{BASE}/scoring/calculate/{store_id}?period=week", token=token)
    if code2 == 200:
        scored = body2.get("total_products_scored", 0)
        avg    = body2.get("avg_composite_score", 0.0)
        print(f"  OK Scoring: {scored} products | Avg score: {avg:.1f}")
        if scored == 0:
            print("     (No products linked to shelves yet - add products in /stores)")
    else:
        print(f"  Scoring: {code2} {body2}")

    code3, body3 = http_post(f"{BASE}/recommendations/generate/{store_id}", token=token)
    if code3 == 200:
        total = body3.get("total_recommendations", 0)
        high  = body3.get("high_priority_count", 0)
        print(f"  OK Recommendations: {total} total ({high} high priority)")
    else:
        print(f"  Recommendations: {code3} {body3}")

    print("\n" + "=" * 68)
    print("  DONE! Now test the frontend:")
    print("  /behavior       -> click 'Refresh Behavior Analysis'")
    print("  /heatmaps       -> click 'Generate Heatmap'")
    print("  /recommendations-> click 'Calculate Product Scores' then 'Run Rule Engine'")
    print(f"\n  Store ID: {store_id}")
    print("=" * 68)


if __name__ == "__main__":
    main()
