from fastapi import APIRouter
from fastapi.responses import FileResponse
from pathlib import Path

from app.services.report_generator import generate_product_report


router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


@router.get("/products")
def download_product_report():
    output_file = Path("product_report.xlsx")

    generate_product_report(str(output_file))

    return FileResponse(
        path=output_file,
        filename="product_report.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )