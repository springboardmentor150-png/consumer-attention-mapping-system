from fastapi import APIRouter
from fastapi.responses import FileResponse
import pandas as pd
from reportlab.platypus import SimpleDocTemplate, Table
from reportlab.lib import colors

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/summary")
def summary():
    return {
        "total_customers": 256,
        "average_dwell": 18.6,
        "attention_score": 91,
        "most_viewed_shelf": "Shelf A",
    }

@router.get("/csv")
def export_csv():
    df = pd.DataFrame({
        "Shelf": ["Shelf A", "Shelf B", "Shelf C"],
        "Customers": [120, 80, 60],
        "Average Dwell": [20, 15, 10],
        "Attention": [95, 78, 61],
    })
    filename = "analytics_report.csv"
    df.to_csv(filename, index=False)
    return FileResponse(filename, media_type="text/csv", filename=filename)

@router.get("/pdf")
def export_pdf():
    filename = "analytics_report.pdf"
    pdf = SimpleDocTemplate(filename)
    data = [
        ["Shelf", "Customers", "Dwell", "Attention"],
        ["Shelf A", 120, 20, 95],
        ["Shelf B", 80, 15, 78],
        ["Shelf C", 60, 10, 61],
    ]
    table = Table(data)
    table.setStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 1, colors.black),
    ])
    pdf.build([table])
    return FileResponse(filename, filename=filename)
