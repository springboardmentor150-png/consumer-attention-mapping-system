"""
Store report aggregation.

This module only reads and arranges what the existing services already
produce — analytics summaries, engagement metrics, the scoring engine and the
recommendation rules. It performs no analytics of its own, and in particular
it never calls run_segmentation(), which writes to the database; segment
figures come from a plain read of the labels already stored.

Every read is scoped by store_id (and shelf_id when supplied) so a report
describes one store, never a blend of all of them.
"""

from datetime import datetime

from sqlalchemy.orm import Session

from app.crud.analytics import (
    get_engagement_metrics,
    get_segment_distribution,
    get_summary,
)
from app.models.store import Store
from app.services.scoring.health import advice_for, alert_for, health_band
from app.services.scoring.attractiveness import (
    calculate_attractiveness_score,
    resolve_scoring_inputs,
)
from app.services.vision.shelf_mapper import LEFT_ZONE, RIGHT_ZONE, zone_label


# The shelf zones a report covers, in the order they are presented.
REPORT_ZONES = (LEFT_ZONE, RIGHT_ZONE)

# Priority the recommendation engine assigns to the lowest-scoring shelves.
# The engine has no alert concept of its own, so this band is what the report
# surfaces as "current alerts" — see the note in build_store_report.
# Which bands escalate to an alert now lives with the band table itself, in
# services/scoring/health.py, so the dashboard and the exports agree on it.


def build_zone_report(db: Session, zone: str, store_id: int, shelf_id=None):
    """
    Score one shelf zone and attach its recommendation.

    Mirrors exactly what /attractiveness/score and /recommendations/ do, so a
    report never disagrees with the dashboard.
    """

    engagement = get_engagement_metrics(
        db,
        zone=zone,
        store_id=store_id,
        shelf_id=shelf_id,
    )

    metrics, sources = resolve_scoring_inputs(
        engagement=engagement,
        identifier=zone,
    )

    score = calculate_attractiveness_score(**metrics)

    label = zone_label(zone)

    # Band, priority and advice all derive from the score and the five inputs
    # that produced it — the same model the dashboard renders, so an exported
    # report and the screen it was exported from cannot disagree.
    _, priority, _ = health_band(score)

    return {
        "zone": zone,
        "shelf": label,
        "attractiveness_score": score,
        "priority": priority,
        "recommendations": advice_for(label, metrics, score),
        "sessions": engagement["session_count"] if engagement else 0,
        "average_dwell_seconds": (
            round(engagement["avg_dwell_time"], 2) if engagement else 0.0
        ),
        "last_updated": engagement["last_updated"] if engagement else None,
        "metrics_used": metrics,
        "metric_sources": sources,
    }


def build_store_report(db: Session, store_id: int, shelf_id=None):
    """
    Assemble the full report for one store.

    Returns None when the store does not exist so the API can answer 404.
    """

    store = db.query(Store).filter(Store.id == store_id).first()

    if store is None:
        return None

    summary = get_summary(db, store_id=store_id, shelf_id=shelf_id)

    zones = [
        build_zone_report(db, zone, store_id=store_id, shelf_id=shelf_id)
        for zone in REPORT_ZONES
    ]

    # Alerts escalate only from the two lowest bands, and each names the input
    # costing that shelf the most rather than repeating a fixed line — so a
    # stored notification says what was actually wrong on the run that wrote
    # it. See services/scoring/health.py.
    alerts = [
        alert
        for alert in (
            alert_for(zone["shelf"], zone["metrics_used"], zone["attractiveness_score"])
            for zone in zones
        )
        if alert is not None
    ]

    return {
        "store": {
            "id": store.id,
            "name": store.name,
            "location": store.location,
        },
        "shelf_id": shelf_id,
        "summary": {
            "total_shoppers": summary["total_shoppers"],
            "average_dwell_time": summary["average_dwell_time"],
            "shelf_a_views": summary["left_display_views"],
            "shelf_b_views": summary["right_display_views"],
            "last_processed": summary["last_processed"],
        },
        "zones": zones,
        "segments": get_segment_distribution(
            db, store_id=store_id, shelf_id=shelf_id
        ),
        "alerts": alerts,
        "generated_at": datetime.now(),
    }


def report_rows(report: dict):
    """
    Flatten a report into (section, metric, value) rows for CSV export.

    One tabular shape keeps the export readable in a spreadsheet without
    inventing a second aggregation of the same data.
    """

    store = report["store"]
    summary = report["summary"]

    rows = [
        ("Store", "Store ID", store["id"]),
        ("Store", "Store Name", store["name"]),
        ("Store", "Location", store["location"]),
        ("Store", "Generated At", _stamp(report["generated_at"])),
        ("Store", "Last Processed", _stamp(summary["last_processed"])),
        ("Summary", "Total Shoppers", summary["total_shoppers"]),
        ("Summary", "Average Dwell Time (s)", summary["average_dwell_time"]),
        ("Summary", "Shelf A Views", summary["shelf_a_views"]),
        ("Summary", "Shelf B Views", summary["shelf_b_views"]),
    ]

    for zone in report["zones"]:
        shelf = zone["shelf"]
        rows.append((shelf, "Attractiveness Score", zone["attractiveness_score"]))
        rows.append((shelf, "Priority", zone["priority"]))
        rows.append((shelf, "Sessions", zone["sessions"]))
        rows.append((shelf, "Average Dwell Time (s)", zone["average_dwell_seconds"]))

        for index, message in enumerate(zone["recommendations"], start=1):
            rows.append((shelf, f"Recommendation {index}", message))

    for segment, count in sorted(report["segments"].items()):
        rows.append(("Segments", segment, count))

    if report["alerts"]:
        for alert in report["alerts"]:
            rows.append(
                ("Alerts", f"{alert['shelf']} ({alert['severity']})", alert["message"])
            )
    else:
        rows.append(("Alerts", "Status", "No shelves in the alert band"))

    return rows


def _stamp(value):
    """Render a timestamp for export, or a placeholder when absent."""

    if value is None:
        return "Not yet processed"

    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M:%S")

    return str(value)
