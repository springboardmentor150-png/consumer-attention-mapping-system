import pandas as pd

from database import SessionLocal
from models import ShelfAnalytics, ShopperSession
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet


def generate_report():

    db = SessionLocal()

    analytics = db.query(ShelfAnalytics).all()
    sessions = db.query(ShopperSession).all()

    session_data = {}

    for session in sessions:

        session_data[session.shopper_id] = {
            "segment": session.segment
        }

    report_data = []

    for item in analytics:

        shopper_info = session_data.get(
            item.shopper_id,
            {}
        )

        report_data.append({

            "Shopper ID": item.shopper_id,

            "Shelf": item.shelf_name,

            "Attention Time (sec)": round(
                item.attention_time or 0,
                2
            ),

            "Attractiveness Score": round(
                item.attractiveness_score or 0,
                2
            ),

            "Recommendation":
                item.recommendation or "None",

            "Behavior Segment":
                shopper_info.get(
                    "segment",
                    "Unknown"
                )

        })

    db.close()

    df = pd.DataFrame(report_data)

    file_name = "consumer_attention_report.xlsx"

    df.to_excel(
        file_name,
        index=False
    )

    print(
        f"Report generated successfully: {file_name}"
    )


def generate_pdf_report(data, file_path):

    styles = getSampleStyleSheet()

    doc = SimpleDocTemplate(
        file_path,
        pagesize=A4
    )

    elements = []

    title = Paragraph(
        "Consumer Attention Analytics Report",
        styles["Title"]
    )

    elements.append(title)
    elements.append(Spacer(1, 20))

    for item in data:

        shelf = item.get("shelf_name", "Unknown")
        attention = item.get("total_attention", 0)

        text = (
            f"<b>Shelf:</b> {shelf}<br/>"
            f"<b>Total Attention:</b> {attention} seconds"
        )

        elements.append(
            Paragraph(text, styles["BodyText"])
        )

        elements.append(
            Spacer(1, 12)
        )

    doc.build(elements)

if __name__ == "__main__":

    generate_report()
    generate_pdf_report()