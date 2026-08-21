from fastapi import APIRouter
from app.database.database import get_db_status

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get("/db-status")
def db_status_check():
    return get_db_status()



from fastapi import APIRouter
from app.database.database import get_db_status

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get("/db-status")
def db_status_check():
    return get_db_status()


@router.get("/manager")
def manager_dashboard():
    return {
        "shoppers": 2453,
        "average_dwell": 18.6,
        "attention_rate": 87,
        "attractiveness_score": 76.4,
        "conversion_rate": 34.2,
        "hourly_traffic": [
            {"hour": "09:00", "count": 120, "peak": False},
            {"hour": "10:00", "count": 210, "peak": False},
            {"hour": "11:00", "count": 380, "peak": True},
            {"hour": "12:00", "count": 490, "peak": True},
            {"hour": "13:00", "count": 410, "peak": True},
            {"hour": "14:00", "count": 330, "peak": False},
            {"hour": "15:00", "count": 290, "peak": False},
            {"hour": "16:00", "count": 420, "peak": True},
            {"hour": "17:00", "count": 510, "peak": True},
            {"hour": "18:00", "count": 360, "peak": False},
        ],
        "product_engagement": [
            {"name": "UltraSmart Watch Gen4", "shelf": "Shelf B - Electronics", "gaze_count": 840, "dwell_sec": 34.5, "engagement_rate": 88},
            {"name": "Organic Almond Milk", "shelf": "Shelf E - Snacks", "gaze_count": 620, "dwell_sec": 19.2, "engagement_rate": 74},
            {"name": "Luxe Radiant Serum", "shelf": "Shelf A - Cosmetics", "gaze_count": 910, "dwell_sec": 42.1, "engagement_rate": 93},
            {"name": "Pro Wireless Headphones", "shelf": "Shelf B - Electronics", "gaze_count": 780, "dwell_sec": 28.6, "engagement_rate": 82},
            {"name": "Artisan Dark Chocolate", "shelf": "Shelf D - Snacks", "gaze_count": 450, "dwell_sec": 14.8, "engagement_rate": 61},
        ],
        "top_shelves": [
            {"name": "Shelf A - Cosmetics", "score": 94, "zone": "Zone 1", "dwell": "24.2s", "status": "Optimal", "efficiency": 92},
            {"name": "Shelf B - Electronics", "score": 88, "zone": "Zone 2", "dwell": "31.0s", "status": "High Dwell", "efficiency": 85},
            {"name": "Shelf E - Premium Snacks", "score": 79, "zone": "Zone 3", "dwell": "16.4s", "status": "Good", "efficiency": 78},
            {"name": "Shelf D - Beverages", "score": 64, "zone": "Zone 4", "dwell": "11.8s", "status": "Underperforming", "efficiency": 60},
        ],
        "conversion_metrics": {
            "browse_to_buy_rate": 34.2,
            "interaction_to_purchase": 68.5,
            "total_conversions": 839,
            "conversion_by_zone": [
                {"zone": "Zone 1 (Cosmetics)", "browse": 850, "bought": 340, "rate": 40.0},
                {"zone": "Zone 2 (Electronics)", "browse": 720, "bought": 216, "rate": 30.0},
                {"zone": "Zone 3 (Snacks)", "browse": 560, "bought": 201, "rate": 35.8},
                {"zone": "Zone 4 (Beverages)", "browse": 323, "bought": 82, "rate": 25.3},
            ]
        },
        "recommendations": [
            {
                "title": "High Attention - Low Conversion Alert",
                "shelf": "Shelf B - Electronics",
                "type": "warning",
                "action": "Consider restructuring shelf placement or lowering promotional pricing to boost conversion."
            },
            {
                "title": "Strong Product Attractiveness",
                "shelf": "Shelf A - Cosmetics",
                "type": "success",
                "action": "Maintain current high-contrast lighting and prime eye-level positioning."
            },
            {
                "title": "Traffic Bottleneck Detected",
                "shelf": "Aisle 2 Corridor",
                "type": "warning",
                "action": "Widen aisle display to prevent shopper overcrowding during peak 17:00 traffic."
            }
        ]
    }


@router.get("/analyst")
def analyst_dashboard():
    return {
        "total_shoppers": 2453,
        "attention_rate": 87.4,
        "avg_dwell_time": 18.6,
        "heatmaps": {
            "hot_zone": "Shelf A - Cosmetics",
            "cold_zone": "Shelf D - Beverages",
            "active_heat_points": 342,
            "shelf_heat_distribution": [
                {"shelf": "Shelf A", "heat_score": 95, "temp": "Hot"},
                {"shelf": "Shelf B", "heat_score": 84, "temp": "Warm"},
                {"shelf": "Shelf C", "heat_score": 72, "temp": "Warm"},
                {"shelf": "Shelf D", "heat_score": 41, "temp": "Cold"},
                {"shelf": "Shelf E", "heat_score": 78, "temp": "Warm"},
            ]
        },
        "segments": {
            "explorers": 42,
            "quick_buyers": 31,
            "comparison_shoppers": 27
        },
        "demographics": {
            "age_groups": [
                {"group": "18-24", "percentage": 22},
                {"group": "25-34", "percentage": 44},
                {"group": "35-49", "percentage": 21},
                {"group": "50+", "percentage": 13},
            ],
            "gender": [
                {"type": "Female", "percentage": 56},
                {"type": "Male", "percentage": 41},
                {"type": "Other/Unspecified", "percentage": 3},
            ]
        },
        "top_products": [
            {"name": "Luxe Radiant Serum", "score": 96, "gaze_pick_ratio": "84%", "category": "Cosmetics"},
            {"name": "UltraSmart Watch Gen4", "score": 91, "gaze_pick_ratio": "76%", "category": "Electronics"},
            {"name": "Pro Wireless Headphones", "score": 84, "gaze_pick_ratio": "71%", "category": "Electronics"},
            {"name": "Organic Almond Milk", "score": 76, "gaze_pick_ratio": "68%", "category": "Beverages"},
            {"name": "Artisan Dark Chocolate", "score": 72, "gaze_pick_ratio": "59%", "category": "Snacks"}
        ],
        "customer_journey": {
            "avg_journey_time": "14 min 30 sec",
            "top_transitions": [
                {"from_shelf": "Entrance", "to_shelf": "Shelf A (Cosmetics)", "count": 1040, "percentage": 42.3},
                {"from_shelf": "Shelf A (Cosmetics)", "to_shelf": "Shelf B (Electronics)", "count": 680, "percentage": 27.7},
                {"from_shelf": "Shelf B (Electronics)", "to_shelf": "Shelf E (Snacks)", "count": 510, "percentage": 20.7},
                {"from_shelf": "Shelf E (Snacks)", "to_shelf": "Checkout", "count": 890, "percentage": 36.2},
            ],
            "popular_paths": [
                "Entrance ➔ Shelf A ➔ Shelf B ➔ Checkout",
                "Entrance ➔ Shelf E ➔ Shelf D ➔ Checkout",
                "Entrance ➔ Shelf B ➔ Shelf E ➔ Checkout"
            ]
        }
    }


@router.get("/marketing")
def marketing_dashboard():
    return {
        "campaign_effectiveness": 82,
        "product_visibility": 76,
        "promotional_performance": 71,
        "customer_engagement": 84
    }


@router.get("/admin")
def admin_dashboard():
    db_info = get_db_status()
    db_status_label = f"{db_info['status']} ({db_info.get('database_type', 'SQLite')})" if db_info.get("connected") else "Disconnected"

    return {
        "users": 24,
        "stores": 8,
        "shelves": 64,
        "cameras": 18,
        "active_cameras": 16,
        "system_status": "Operational",
        "api_status": "Online",
        "database_status": db_status_label,
        "ai_status": "Running"
    }

