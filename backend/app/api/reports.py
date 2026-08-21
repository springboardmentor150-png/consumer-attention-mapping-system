import csv
import io

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import ALL_ROLES, require_roles
from app.services.reports import build_store_report, report_rows, _stamp


router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
    # A report only re-presents figures these roles can already read from
    # /analytics, /attractiveness and /recommendations, so it sits in the same
    # read-only tier. It exposes nothing new.
    dependencies=[Depends(require_roles(*ALL_ROLES))],
)


StoreParam = Query(
    ...,
    description="Store the report covers. Required — reports are per store.",
)

ShelfParam = Query(
    default=None,
    description="Optionally narrow the report to a single shelf.",
)


def load_report(db: Session, store_id: int, shelf_id: int | None):
    report = build_store_report(db, store_id=store_id, shelf_id=shelf_id)

    if report is None:
        raise HTTPException(
            status_code=404,
            detail=f"Store not found: {store_id}",
        )

    return report


def filename_for(report: dict, extension: str):
    slug = "".join(
        char if char.isalnum() else "_"
        for char in report["store"]["name"]
    ).strip("_") or "store"

    stamp = report["generated_at"].strftime("%Y%m%d_%H%M%S")

    return f"{slug}_report_{stamp}.{extension}"


@router.get("/")
def store_report(
    db: Session = Depends(get_db),
    store_id: int = StoreParam,
    shelf_id: int | None = ShelfParam,
):
    """JSON summary for one store."""

    return load_report(db, store_id, shelf_id)


@router.get("/csv")
def store_report_csv(
    db: Session = Depends(get_db),
    store_id: int = StoreParam,
    shelf_id: int | None = ShelfParam,
):
    """The same report as a flat CSV table."""

    report = load_report(db, store_id, shelf_id)

    buffer = io.StringIO()
    writer = csv.writer(buffer)

    writer.writerow(["Section", "Metric", "Value"])
    writer.writerows(report_rows(report))

    return Response(
        content=buffer.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename_for(report, "csv")}"'
            )
        },
    )


@router.get("/pdf")
def store_report_pdf(
    db: Session = Depends(get_db),
    store_id: int = StoreParam,
    shelf_id: int | None = ShelfParam,
):
    """The same report rendered as a PDF document."""

    report = load_report(db, store_id, shelf_id)

    buffer = io.BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title=f"{report['store']['name']} — Attention Report",
    )

    styles = getSampleStyleSheet()
    story = []

    store = report["store"]
    summary = report["summary"]

    story.append(Paragraph("Consumer Attention Report", styles["Title"]))
    story.append(
        Paragraph(
            f"{store['name']} — {store['location']}",
            styles["Heading2"],
        )
    )
    story.append(
        Paragraph(
            f"Generated {_stamp(report['generated_at'])} · "
            f"Analytics last processed {_stamp(summary['last_processed'])}",
            styles["Normal"],
        )
    )
    story.append(Spacer(1, 8 * mm))

    def section(title, rows, widths):
        story.append(Paragraph(title, styles["Heading3"]))
        table = Table(rows, colWidths=widths, hAlign="LEFT")
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eef2f7")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cbd5e1")),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        story.append(table)
        story.append(Spacer(1, 6 * mm))

    section(
        "Store Overview",
        [
            ["Metric", "Value"],
            ["Total shoppers", str(summary["total_shoppers"])],
            ["Average dwell time", f"{summary['average_dwell_time']} s"],
            ["Shelf A views", str(summary["shelf_a_views"])],
            ["Shelf B views", str(summary["shelf_b_views"])],
        ],
        [70 * mm, 100 * mm],
    )

    section(
        "Shelf Performance",
        [["Shelf", "Score", "Priority", "Sessions", "Avg dwell (s)"]]
        + [
            [
                zone["shelf"],
                str(zone["attractiveness_score"]),
                zone["priority"],
                str(zone["sessions"]),
                str(zone["average_dwell_seconds"]),
            ]
            for zone in report["zones"]
        ],
        [45 * mm, 25 * mm, 30 * mm, 30 * mm, 40 * mm],
    )

    segments = report["segments"] or {"No data": 0}
    section(
        "Shopper Segments",
        [["Segment", "Sessions"]]
        + [[name, str(count)] for name, count in sorted(segments.items())],
        [90 * mm, 80 * mm],
    )

    story.append(Paragraph("Recommendations", styles["Heading3"]))
    for zone in report["zones"]:
        story.append(
            Paragraph(
                f"<b>{zone['shelf']}</b> — {zone['priority']} priority "
                f"(score {zone['attractiveness_score']})",
                styles["Normal"],
            )
        )
        for message in zone["recommendations"]:
            story.append(Paragraph(f"• {message}", styles["Normal"]))
        story.append(Spacer(1, 3 * mm))

    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph("Current Alerts", styles["Heading3"]))

    if report["alerts"]:
        for alert in report["alerts"]:
            story.append(
                Paragraph(
                    f"<b>{alert['shelf']}</b> ({alert['severity']}): "
                    f"{alert['message']}",
                    styles["Normal"],
                )
            )
    else:
        story.append(
            Paragraph("No shelves are currently in the alert band.", styles["Normal"])
        )

    document.build(story)

    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename_for(report, "pdf")}"'
            )
        },
    )
