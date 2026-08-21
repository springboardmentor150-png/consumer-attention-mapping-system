from database import SessionLocal
from services.product_scoring_service import calculate_product_scores


db = SessionLocal()

try:

    scores = calculate_product_scores(db)

    for product in scores:
        print(product)

finally:

    db.close()