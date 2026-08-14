from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy import text,func
from sqlalchemy.orm import Session
import csv
import io
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    SECRET_KEY,
    ALGORITHM
)

from database import engine, get_db, Base
from models import (
    User,
    Role,
    Store,
    Shelf,
    AttentionRecord,
    ShopperSession,
    Product
)
from schemas import UserRegister, UserLogin, StoreCreate, ShelfCreate
from auth import hash_password, verify_password, create_access_token
from fastapi.responses import FileResponse, StreamingResponse
import os
from scoring import calculate_attractiveness_score
from sqlalchemy import func
from recommendation import generate_recommendation
# Create all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI()
security = HTTPBearer()


def get_current_role(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        role = payload.get("role")

        if not role:
            raise HTTPException(
                status_code=401,
                detail="Role not found in token"
            )

        return role

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )
def require_authenticated_access(
    role: str = Depends(get_current_role)
):
    return role


def require_store_management_access(
    role: str = Depends(get_current_role)
):
    allowed_roles = [
        "Admin",
        "Store Manager"
    ]

    if role not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to manage stores"
        )

    return role
def require_report_access(
    role: str = Depends(get_current_role)
):
    allowed_roles = [
        "Admin",
        "Store Manager",
        "Retail Analyst",
        "Marketing Manager"
    ]

    if role not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access reports"
        )

    return role
def require_csv_access(
    role: str = Depends(get_current_role)
):
    allowed_roles = [
        "Admin",
        "Store Manager",
        "Retail Analyst"
    ]

    if role not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to export CSV reports"
        )

    return role
def require_pdf_access(
    role: str = Depends(get_current_role)
):
    allowed_roles = [
        "Admin",
        "Store Manager",
        "Marketing Manager"
    ]

    if role not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to export PDF reports"
        )

    return role
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "running"}


@app.get("/db-test")
def test_database():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        return {
            "database": "connected",
            "result": result.scalar()
        }


@app.post("/register")
def register_user(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    role = db.query(Role).filter(
        Role.id == user_data.role_id
    ).first()

    if not role:
        raise HTTPException(
            status_code=400,
            detail="Invalid role ID"
        )

    hashed_password = hash_password(
        user_data.password
    )

    new_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        role_id=user_data.role_id
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully",
        "user_id": new_user.id,
        "email": new_user.email,
        "role": role.role_name
    }


@app.post("/login")
def login_user(
    user_data: UserLogin,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        user_data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.role_name
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role.role_name
    }


@app.post("/stores")
def create_store(
    store_data: StoreCreate,
    db: Session = Depends(get_db),
    role: str = Depends(get_current_role)
):
    allowed_roles = [
        "Admin",
        "Store Manager"
    ]

    if role not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to create stores"
        )

    new_store = Store(
        store_name=store_data.store_name,
        location=store_data.location
    )

    db.add(new_store)
    db.commit()
    db.refresh(new_store)

    return {
        "message": "Store created successfully",
        "store": {
            "id": new_store.id,
            "store_name": new_store.store_name,
            "location": new_store.location
        }
    }


@app.get("/stores")
def get_stores(
    db: Session = Depends(get_db),
    role: str = Depends(get_current_role)
):
    stores = db.query(Store).all()

    return [
        {
            "id": store.id,
            "store_name": store.store_name,
            "location": store.location
        }
        for store in stores
    ]


@app.post("/shelves")
def create_shelf(
    shelf_data: ShelfCreate,
    db: Session = Depends(get_db),
    role: str = Depends(get_current_role)
):
    allowed_roles = [
        "Admin",
        "Store Manager"
    ]

    if role not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to create shelves"
        )

    store = db.query(Store).filter(
        Store.id == shelf_data.store_id
    ).first()

    if not store:
        raise HTTPException(
            status_code=404,
            detail="Store not found"
        )

    new_shelf = Shelf(
        store_id=shelf_data.store_id,
        zone_name=shelf_data.zone_name
    )

    db.add(new_shelf)
    db.commit()
    db.refresh(new_shelf)

    return {
        "message": "Shelf created successfully",
        "shelf": {
            "id": new_shelf.id,
            "store_id": new_shelf.store_id,
            "zone_name": new_shelf.zone_name
        }
    }


@app.get("/shelves")
def get_shelves(
    db: Session = Depends(get_db),
    role: str = Depends(get_current_role)
):
    shelves = db.query(Shelf).all()

    return [
        {
            "id": shelf.id,
            "store_id": shelf.store_id,
            "zone_name": shelf.zone_name
        }
        for shelf in shelves
    ]
@app.get("/attention-records")
def get_attention_records(
    db: Session = Depends(get_db),
    role: str = Depends(get_current_role)
):
    records = db.query(AttentionRecord).all()

    return [
        {
            "id": record.id,
            "shopper_id": record.shopper_id,
            "shelf_id": record.shelf_id,
            "attention_start_time": record.attention_start_time,
            "attention_end_time": record.attention_end_time,
            "total_attention_duration": record.total_attention_duration,
            "attention_percentage": record.attention_percentage
        }
        for record in records
    ]
@app.get("/dashboard-summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    role: str = Depends(require_authenticated_access)
):
    shelves = db.query(Shelf).all()

    return [
        {
            "id": shelf.id,
            "store_id": shelf.store_id,
            "zone_name": shelf.zone_name
        }
        for shelf in shelves
    ]
@app.get("/top-shopper")
def get_top_shopper(
    db: Session = Depends(get_db),
    role: str = Depends(require_authenticated_access)
):
    records = db.query(AttentionRecord).all()

    return [
        {
            "id": record.id,
            "shopper_id": record.shopper_id,
            "shelf_id": record.shelf_id,
            "attention_start_time": record.attention_start_time,
            "attention_end_time": record.attention_end_time,
            "total_attention_duration": record.total_attention_duration,
            "attention_percentage": record.attention_percentage
        }
        for record in records
    ]
@app.get("/dashboard-summary")
def dashboard_summary(
    db: Session = Depends(get_db)
):
    total_records = db.query(AttentionRecord).count()

    avg_attention = (
        db.query(func.avg(AttentionRecord.total_attention_duration))
        .scalar()
    )

    max_attention = (
        db.query(func.max(AttentionRecord.total_attention_duration))
        .scalar()
    )

    return {
        "total_records": total_records,
        "average_attention": avg_attention,
        "maximum_attention": max_attention
    }
@app.get("/top-shopper")
def get_top_shopper(
    db: Session = Depends(get_db)
):
    top_record = (
        db.query(AttentionRecord)
        .order_by(AttentionRecord.total_attention_duration.desc())
        .first()
    )

    if not top_record:
        return {"message": "No attention records found"}

    return {
        "shopper_id": top_record.shopper_id,
        "attention_duration": top_record.total_attention_duration,
        "shelf_id": top_record.shelf_id
    }
@app.get("/api/heatmaps/store")
def get_store_heatmap(
    role: str = Depends(require_authenticated_access)
):

    heatmap_path = "heatmap.png"

    if not os.path.exists(heatmap_path):
        raise HTTPException(
            status_code=404,
            detail="Heatmap not found"
        )

    return FileResponse(
        heatmap_path,
        media_type="image/png",
        
    )
@app.get("/api/product-score")
def product_score(
    db: Session = Depends(get_db),
    role: str = Depends(require_authenticated_access)
):

    products = db.query(Product).all()

    results = []

    for product in products:

        pickup_rate = (
            (product.pickups / product.views) * 100
            if product.views > 0
            else 0
        )

        conversion_rate = (
            (product.purchases / product.pickups) * 100
            if product.pickups > 0
            else 0
        )

        score = calculate_attractiveness_score(
            attention_duration=product.attention_duration,
            interaction_frequency=product.views,
            pickup_rate=pickup_rate,
            conversion_rate=conversion_rate,
            repeat_engagement=0,

            store_average_attention=50,
            store_average_interaction=10,
            store_average_pickup=10,
            store_average_conversion=10,
            store_average_repeat=10
        )

        recommendations = generate_recommendation(
            views=product.views,
            pickups=product.pickups,
            purchases=product.purchases,
            attention_duration=product.attention_duration,
            attractiveness_score=score
        )

        product.attractiveness_score = score

        results.append({
            "product_id": product.id,
            "product_name": product.product_name,
            "views": product.views,
            "pickups": product.pickups,
            "purchases": product.purchases,
            "pickup_rate": round(pickup_rate, 2),
            "conversion_rate": round(conversion_rate, 2),
            "attention_duration": product.attention_duration,
            "attractiveness_score": score,
            "recommendation": recommendations
        })

    db.commit()

    return {
        "products": results
    }
@app.get("/api/reports/products/csv")
def export_product_report(
    range: str = "7d",
    store: str = "all",
    db: Session = Depends(get_db),
    role: str = Depends(require_csv_access)
):

    products = db.query(Product).all()

    output = io.StringIO()

    writer = csv.writer(output)

    writer.writerow([
        "Product",
        "Views",
        "Pickups",
        "Purchases",
        "Pickup Rate (%)",
        "Conversion Rate (%)",
        "Attention Duration (sec)",
        "Attractiveness Score",
        "Recommendations"
    ])

    for product in products:

        pickup_rate = (
            (product.pickups / product.views) * 100
            if product.views > 0
            else 0
        )

        conversion_rate = (
            (product.purchases / product.pickups) * 100
            if product.pickups > 0
            else 0
        )

        recommendations = generate_recommendation(
            views=product.views,
            pickups=product.pickups,
            purchases=product.purchases,
            attention_duration=product.attention_duration,
            attractiveness_score=product.attractiveness_score
        )

        writer.writerow([
            product.product_name,
            product.views,
            product.pickups,
            product.purchases,
            round(pickup_rate, 2),
            round(conversion_rate, 2),
            product.attention_duration,
            product.attractiveness_score,
            " | ".join(recommendations)
        ])

    output.seek(0)

    filename = f"product_attention_report_{range}_{store}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition":
                f"attachment; filename={filename}"
        }
    )
@app.get("/api/reports/products/pdf")
def export_product_report_pdf(
    range: str = "7d",
    store: str = "all",
    db: Session = Depends(get_db),
    role: str = Depends(require_pdf_access)
):

    products = db.query(Product).all()

    pdf_buffer = io.BytesIO()

    pdf = canvas.Canvas(pdf_buffer, pagesize=A4)

    width, height = A4

    y = height - 50

    # Title
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(
        50,
        y,
        "Consumer Attention Mapping Report"
    )

    y -= 30

    # Report information
    pdf.setFont("Helvetica", 10)

    pdf.drawString(
        50,
        y,
        f"Date Range: {range}"
    )

    y -= 18

    pdf.drawString(
        50,
        y,
        f"Store: {store}"
    )

    y -= 30

    # Product information
    for product in products:

        pickup_rate = (
            (product.pickups / product.views) * 100
            if product.views > 0
            else 0
        )

        conversion_rate = (
            (product.purchases / product.pickups) * 100
            if product.pickups > 0
            else 0
        )

        recommendations = generate_recommendation(
            views=product.views,
            pickups=product.pickups,
            purchases=product.purchases,
            attention_duration=product.attention_duration,
            attractiveness_score=product.attractiveness_score
        )

        if y < 100:
            pdf.showPage()
            y = height - 50

        pdf.setFont("Helvetica-Bold", 12)
        pdf.drawString(
            50,
            y,
            product.product_name
        )

        y -= 18

        pdf.setFont("Helvetica", 9)

        pdf.drawString(
            60,
            y,
            f"Views: {product.views}"
        )

        y -= 14

        pdf.drawString(
            60,
            y,
            f"Pickups: {product.pickups}"
        )

        y -= 14

        pdf.drawString(
            60,
            y,
            f"Purchases: {product.purchases}"
        )

        y -= 14

        pdf.drawString(
            60,
            y,
            f"Pickup Rate: {pickup_rate:.2f}%"
        )

        y -= 14

        pdf.drawString(
            60,
            y,
            f"Conversion Rate: {conversion_rate:.2f}%"
        )

        y -= 14

        pdf.drawString(
            60,
            y,
            f"Attention Duration: {product.attention_duration} sec"
        )

        y -= 14

        pdf.drawString(
            60,
            y,
            f"Attractiveness Score: {product.attractiveness_score}"
        )

        y -= 18

        pdf.setFont("Helvetica-Bold", 9)

        pdf.drawString(
            60,
            y,
            "Recommendations:"
        )

        y -= 14

        pdf.setFont("Helvetica", 9)

        for recommendation in recommendations:

            if y < 60:
                pdf.showPage()
                y = height - 50

            pdf.drawString(
                70,
                y,
                f"- {recommendation}"
            )

            y -= 14

        y -= 20

    pdf.save()

    pdf_buffer.seek(0)

    filename = (
        f"consumer_attention_report_{range}_{store}.pdf"
    )

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                f"attachment; filename={filename}"
        }
    )
@app.get("/api/reports/attention/csv")
def export_attention_report(
    range: str = "7d",
    store: str = "all",
    db: Session = Depends(get_db),
    role: str = Depends(require_csv_access)
):

    records = (
        db.query(AttentionRecord)
        .order_by(
            AttentionRecord.total_attention_duration.desc()
        )
        .all()
    )

    output = io.StringIO()

    writer = csv.writer(output)

    writer.writerow([
        "Shopper ID",
        "Shelf ID",
        "Attention Start",
        "Attention End",
        "Attention Duration (sec)",
        "Attention Percentage (%)"
    ])

    for record in records:

        writer.writerow([
            record.shopper_id,
            record.shelf_id,
            record.attention_start_time,
            record.attention_end_time,
            record.total_attention_duration,
            record.attention_percentage
        ])

    output.seek(0)

    filename = (
        f"weekly_attention_summary_{range}_{store}.csv"
    )

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition":
                f"attachment; filename={filename}"
        }
    )
@app.get("/api/reports/shelf-engagement/csv")
def export_shelf_engagement_report(
    range: str = "7d",
    store: str = "all",
    db: Session = Depends(get_db),
    role: str = Depends(require_report_access)
):

    products = db.query(Product).all()

    output = io.StringIO()

    writer = csv.writer(output)

    writer.writerow([
        "Product",
        "Views",
        "Pickups",
        "Purchases",
        "Pickup Rate (%)",
        "Conversion Rate (%)",
        "Attention Duration (sec)",
        "Attractiveness Score"
    ])

    for product in products:

        pickup_rate = (
            (product.pickups / product.views) * 100
            if product.views > 0
            else 0
        )

        conversion_rate = (
            (product.purchases / product.pickups) * 100
            if product.pickups > 0
            else 0
        )

        writer.writerow([
            product.product_name,
            product.views,
            product.pickups,
            product.purchases,
            round(pickup_rate, 2),
            round(conversion_rate, 2),
            product.attention_duration,
            product.attractiveness_score
        ])

    output.seek(0)

    filename = (
        f"shelf_engagement_report_{range}_{store}.csv"
    )

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition":
                f"attachment; filename={filename}"
        }
    )
@app.get("/api/reports/consumer-insights/csv")
def export_consumer_insights_report(
    range: str = "30d",
    store: str = "all",
    db: Session = Depends(get_db),
    role: str = Depends(require_report_access)
):

    output = io.StringIO()
    writer = csv.writer(output)

    # -----------------------------
    # Attention statistics
    # -----------------------------

    total_records = (
        db.query(AttentionRecord).count()
    )

    average_attention = (
        db.query(
            func.avg(
                AttentionRecord.total_attention_duration
            )
        ).scalar() or 0
    )

    maximum_attention = (
        db.query(
            func.max(
                AttentionRecord.total_attention_duration
            )
        ).scalar() or 0
    )

    # -----------------------------
    # Top shopper
    # -----------------------------

    top_shopper = (
        db.query(AttentionRecord)
        .order_by(
            AttentionRecord.total_attention_duration.desc()
        )
        .first()
    )

    # -----------------------------
    # Report header
    # -----------------------------

    writer.writerow([
        "Consumer Attention Mapping System"
    ])

    writer.writerow([
        "Monthly Consumer Insights"
    ])

    writer.writerow([
        "Date Range",
        range
    ])

    writer.writerow([
        "Store",
        store
    ])

    writer.writerow([])

    # -----------------------------
    # Attention summary
    # -----------------------------

    writer.writerow([
        "ATTENTION SUMMARY"
    ])

    writer.writerow([
        "Total Attention Records",
        total_records
    ])

    writer.writerow([
        "Average Attention (sec)",
        round(float(average_attention), 2)
    ])

    writer.writerow([
        "Maximum Attention (sec)",
        round(float(maximum_attention), 2)
    ])

    if top_shopper:

        writer.writerow([
            "Top Shopper ID",
            top_shopper.shopper_id
        ])

        writer.writerow([
            "Top Shopper Attention (sec)",
            top_shopper.total_attention_duration
        ])

    writer.writerow([])

    # -----------------------------
    # Product performance
    # -----------------------------

    writer.writerow([
        "PRODUCT PERFORMANCE"
    ])

    writer.writerow([
        "Product",
        "Views",
        "Pickups",
        "Purchases",
        "Pickup Rate (%)",
        "Conversion Rate (%)",
        "Attention Duration (sec)",
        "Attractiveness Score"
    ])

    products = db.query(Product).all()

    for product in products:

        pickup_rate = (
            (product.pickups / product.views) * 100
            if product.views > 0
            else 0
        )

        conversion_rate = (
            (product.purchases / product.pickups) * 100
            if product.pickups > 0
            else 0
        )

        writer.writerow([
            product.product_name,
            product.views,
            product.pickups,
            product.purchases,
            round(pickup_rate, 2),
            round(conversion_rate, 2),
            product.attention_duration,
            product.attractiveness_score
        ])

    output.seek(0)

    filename = (
        f"monthly_consumer_insights_{range}_{store}.csv"
    )

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition":
                f"attachment; filename={filename}"
        }
    )
@app.get("/api/reports/camera-uptime/csv")
def export_camera_uptime_report(
    range: str = "7d",
    store: str = "all"
):

    output = io.StringIO()

    writer = csv.writer(output)

    writer.writerow([
        "Camera",
        "Location",
        "IP Address",
        "Resolution",
        "Status",
        "Uptime"
    ])

    # Current camera configuration used by the application
    cameras = [
        {
            "name": "Camera 01",
            "location": "Entrance Gate",
            "ip": "192.168.1.101",
            "resolution": "1920 x 1080",
            "status": "Online",
            "uptime": "100%"
        }
    ]

    for camera in cameras:

        writer.writerow([
            camera["name"],
            camera["location"],
            camera["ip"],
            camera["resolution"],
            camera["status"],
            camera["uptime"]
        ])

    output.seek(0)

    filename = (
        f"camera_uptime_report_{range}_{store}.csv"
    )

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition":
                f"attachment; filename={filename}"
        }
    )
@app.get("/api/reports/top-product")
def get_top_product(db: Session = Depends(get_db)):

    product = (
        db.query(Product)
        .order_by(
            Product.attractiveness_score.desc()
        )
        .first()
    )

    if not product:
        return {
            "product_name": "No data",
            "attractiveness_score": 0,
            "views": 0,
            "pickups": 0,
            "purchases": 0
        }

    return {
        "product_name": product.product_name,
        "attractiveness_score": product.attractiveness_score,
        "views": product.views,
        "pickups": product.pickups,
        "purchases": product.purchases
    }
@app.get("/heatmap-image")
def get_heatmap_image():
    heatmap_path = os.path.join(
        os.path.dirname(__file__),
        "heatmap.png"
    )

    if not os.path.exists(heatmap_path):
        raise HTTPException(
            status_code=404,
            detail="Heatmap image not found"
        )

    return FileResponse(
        heatmap_path,
        media_type="image/png"
    )
@app.get("/api/analytics/attention-trend")
def get_attention_trend(
    db: Session = Depends(get_db)
):
    records = (
        db.query(AttentionRecord)
        .order_by(
            AttentionRecord.attention_start_time.asc()
        )
        .all()
    )

    trend = []

    for record in records:
        timestamp = record.attention_start_time

        if timestamp is not None:
            timestamp = str(timestamp)

        trend.append({
            "shopper_id": record.shopper_id,
            "shelf_id": record.shelf_id,
            "attention_duration": (
                record.total_attention_duration or 0
            ),
            "attention_percentage": (
                record.attention_percentage or 0
            ),
            "timestamp": timestamp
        })

    return {
        "total_records": len(trend),
        "trend": trend
    }
@app.get("/api/analytics/attention-summary")
def get_attention_summary(
    db: Session = Depends(get_db)
):
    records = db.query(AttentionRecord).all()

    if not records:
        return {
            "total_records": 0,
            "total_attention": 0,
            "average_attention": 0,
            "maximum_attention": 0,
            "minimum_attention": 0
        }

    durations = [
        float(record.total_attention_duration or 0)
        for record in records
    ]

    total_attention = sum(durations)

    return {
        "total_records": len(records),
        "total_attention": round(total_attention, 2),
        "average_attention": round(
            total_attention / len(durations),
            2
        ),
        "maximum_attention": round(
            max(durations),
            2
        ),
        "minimum_attention": round(
            min(durations),
            2
        )
    }