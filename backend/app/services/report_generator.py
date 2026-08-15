from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment
from openpyxl.utils import get_column_letter

from app.services.analytics_store import AnalyticsStore


def generate_product_report(output_file="product_report.xlsx"):
    store = AnalyticsStore()

    products = store.get_products()
    recommendations = store.get_recommendations()

    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Product Report"

    headers = [
        "Product ID",
        "Views",
        "Pickups",
        "Purchases",
        "Score",
        "Recommendation",
        "Updated At"
    ]

    sheet.append(headers)

    for cell in sheet[1]:
        cell.font = Font(bold=True)
        cell.alignment = Alignment(horizontal="center")

    for product_id, product_data in products.items():

        views = product_data.get("views", 0)
        pickups = product_data.get("pickups", 0)
        purchases = product_data.get("purchases", 0)
        score = product_data.get("score", 0)

        recommendation_data = recommendations.get(product_id, {})

        if isinstance(recommendation_data, dict):
            recommendation = recommendation_data.get(
                "recommendation",
                ""
            )
            updated_at = recommendation_data.get(
                "updated_at",
                ""
            )
        else:
            recommendation = str(recommendation_data)
            updated_at = ""

        sheet.append([
            product_id,
            views,
            pickups,
            purchases,
            score,
            recommendation,
            updated_at
        ])

    for column in sheet.columns:
        max_length = 0

        for cell in column:
            if cell.value is not None:
                max_length = max(
                    max_length,
                    len(str(cell.value))
                )

        column_letter = get_column_letter(
            column[0].column
        )

        sheet.column_dimensions[
            column_letter
        ].width = min(max_length + 2, 40)

    for row in sheet.iter_rows():
        for cell in row:
            cell.alignment = Alignment(
                vertical="center",
                wrap_text=True
            )

    output_path = Path(output_file)

    workbook.save(output_path)

    return str(output_path)