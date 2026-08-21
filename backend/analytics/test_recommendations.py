from database import SessionLocal

from services.recommendation_service import (
    generate_recommendations
)


db = SessionLocal()

try:

    recommendations = generate_recommendations(db)

    for recommendation in recommendations:

        print("\n-----------------------------")

        print(
            f"Product: "
            f"{recommendation['product_name']}"
        )

        print(
            f"Score: "
            f"{recommendation['attractiveness_score']}"
        )

        print(
            f"Priority: "
            f"{recommendation['priority']}"
        )

        print(
            f"Recommendation: "
            f"{recommendation['recommendation']}"
        )

finally:

    db.close()