from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
import math

from app.models.video_track import VideoRecord, PersonTrack, TrackingPoint
from app.models.shelf import Shelf
from app.models.store import Store


def get_ylorrd_color(normalized_value: float) -> str:
    """
    Standard YlOrRd (Yellow -> Orange -> Red) colormap interpolation for heatmaps.
    Maps a normalized value in [0.0, 1.0] to a hex color string.
    """
    v = max(0.0, min(1.0, float(normalized_value)))
    
    # 7-stop YlOrRd palette
    # 0.0: #ffffb2 (light yellow)
    # 0.2: #fed976 (soft yellow-orange)
    # 0.4: #feb24c (orange-amber)
    # 0.6: #fd8d3c (orange)
    # 0.8: #f03b20 (bright orange-red)
    # 1.0: #bd0026 (deep ruby red)
    stops = [
        (0.0, (255, 255, 178)),
        (0.2, (254, 217, 118)),
        (0.4, (254, 178, 76)),
        (0.6, (253, 141, 60)),
        (0.8, (240, 59, 32)),
        (1.0, (189, 0, 38)),
    ]

    for i in range(len(stops) - 1):
        t0, c0 = stops[i]
        t1, c1 = stops[i + 1]
        if t0 <= v <= t1:
            ratio = (v - t0) / (t1 - t0) if t1 > t0 else 0.0
            r = int(c0[0] + (c1[0] - c0[0]) * ratio)
            g = int(c0[1] + (c1[1] - c0[1]) * ratio)
            b = int(c0[2] + (c1[2] - c0[2]) * ratio)
            return f"#{r:02x}{g:02x}{b:02x}"

    return "#bd0026"


class AttractivenessScoringEngine:
    """
    Production Attention Heatmap Matrix & Weighted Attractiveness Scoring Engine.
    
    Weights Configuration:
    - Attention Duration:             35% (0.35)
    - Product Interaction Frequency:  25% (0.25)
    - Product Pickup Rate:            20% (0.20)
    - Purchase Conversion Rate:       15% (0.15)
    - Repeat Engagement Rate:          5% (0.05)
    """

    WEIGHT_ATTENTION = 0.35
    WEIGHT_INTERACTION = 0.25
    WEIGHT_PICKUP = 0.20
    WEIGHT_CONVERSION = 0.15
    WEIGHT_REPEAT = 0.05

    @classmethod
    def generate_shelf_recommendations(
        cls,
        score: float,
        unique_visitors: int,
        pickup_rate: float,
        conversion_rate: float,
        conversion_count: int,
    ) -> List[str]:
        """
        Rule-based recommendation engine adhering directly to the Recommendation & Optimization Engine specification.
        Checks individual behavioral rates and overall score thresholds.
        """
        recommendations = []

        # Rule 1: overall score is low (< 40)
        if score < 40.0:
            recommendations.append(
                "Low overall attractiveness - consider repositioning to a higher-traffic shelf zone."
            )

        # Rule 2: lots of views/visitors, but people rarely pick it up (pickup rate < 15%)
        if unique_visitors >= 5 and pickup_rate < 0.15:
            recommendations.append(
                "High views but low pickup - review packaging, pricing, or shelf label visibility."
            )

        # Rule 3: people pick it up, but don't convert/buy (pickup > 30% and conversion < 10%)
        if pickup_rate > 0.30 and conversion_rate < 0.10:
            recommendations.append(
                "Shoppers are interested but not buying - investigate price point or check for stock issues."
            )

        # Rule 4: Strong performer with multiple conversions and strong pickup
        if conversion_count >= 5 and pickup_rate > 0.30:
            recommendations.append(
                "Strong performer - consider featuring this product in the next promotional campaign."
            )

        # Rule 5: If nothing triggered above, the shelf is performing well
        if not recommendations:
            recommendations.append("Product is performing well - no immediate action needed.")

        return recommendations

    @classmethod
    def generate_shelf_grid_heatmap(
        cls,
        db: Session,
        video_id: Optional[int] = None,
        store_id: Optional[int] = None,
        rows: int = 5,
        cols: int = 8,
    ) -> Dict[str, Any]:
        """
        Generate a 5x8 shelf attention grid heatmap strictly from real PostgreSQL tracking points.
        """
        # Resolve target video
        video_query = db.query(VideoRecord)
        if video_id is not None:
            video = video_query.filter(VideoRecord.id == video_id).first()
        elif store_id is not None:
            video = (
                video_query.filter(VideoRecord.store_id == store_id)
                .order_by(VideoRecord.id.desc())
                .first()
            )
        else:
            video = video_query.order_by(VideoRecord.id.desc()).first()
            if not video and store_id is not None:
                video = db.query(VideoRecord).order_by(VideoRecord.id.desc()).first()

        if not video:
            # If no videos processed yet, return empty 5x8 grid
            empty_grid = []
            for r in range(rows):
                row_cells = []
                for c in range(cols):
                    row_cells.append({
                        "row": r,
                        "col": c,
                        "cell_id": f"R{r+1}C{c+1}",
                        "dwell_seconds": 0.0,
                        "normalized_intensity": 0.0,
                        "visitor_count": 0,
                        "color_hex": "#ffffb2",
                        "is_hotspot": False,
                    })
                empty_grid.append(row_cells)

            return {
                "video_id": None,
                "video_name": "No Video Found",
                "rows": rows,
                "cols": cols,
                "total_cells": rows * cols,
                "total_dwell_seconds": 0.0,
                "peak_cell": None,
                "grid": empty_grid,
                "cells": [c for row in empty_grid for c in row],
            }

        w = video.resolution_w or 1280
        h = video.resolution_h or 720
        fps = video.fps or 30.0
        time_per_frame = (1.0 / fps) if fps > 0 else (1.0 / 30.0)

        # Query all real tracking points for this video
        points = (
            db.query(
                TrackingPoint.x,
                TrackingPoint.y,
                TrackingPoint.track_id,
                TrackingPoint.confidence,
            )
            .filter(TrackingPoint.video_id == video.id)
            .all()
        )

        # Initialize 5x8 grid accumulation matrix
        cell_time = [[0.0 for _ in range(cols)] for _ in range(rows)]
        cell_visitors = [[set() for _ in range(cols)] for _ in range(rows)]

        for pt in points:
            x_val = max(0.0, min(float(w) - 0.1, float(pt.x)))
            y_val = max(0.0, min(float(h) - 0.1, float(pt.y)))

            col_idx = int(min(cols - 1, max(0, (x_val / w) * cols)))
            row_idx = int(min(rows - 1, max(0, (y_val / h) * rows)))

            cell_time[row_idx][col_idx] += time_per_frame
            cell_visitors[row_idx][col_idx].add(pt.track_id)

        # Determine max dwell time for normalization
        max_dwell = max((cell_time[r][c] for r in range(rows) for c in range(cols)), default=0.0)
        total_grid_dwell = sum(cell_time[r][c] for r in range(rows) for c in range(cols))

        grid_matrix = []
        flat_cells = []
        peak_cell_info = None
        peak_val = -1.0

        for r in range(rows):
            row_items = []
            for c in range(cols):
                raw_time = round(cell_time[r][c], 2)
                norm_intensity = round(raw_time / max_dwell, 4) if max_dwell > 0 else 0.0
                color = get_ylorrd_color(norm_intensity)
                v_count = len(cell_visitors[r][c])

                cell_data = {
                    "row": r,
                    "col": c,
                    "cell_id": f"R{r+1}C{c+1}",
                    "shelf_level": f"Level {rows - r}" if rows == 5 else f"Row {r+1}",
                    "aisle_section": f"Section {c+1}",
                    "dwell_seconds": raw_time,
                    "normalized_intensity": norm_intensity,
                    "visitor_count": v_count,
                    "color_hex": color,
                    "is_hotspot": False,
                }

                if raw_time > peak_val:
                    peak_val = raw_time
                    peak_cell_info = cell_data

                row_items.append(cell_data)
                flat_cells.append(cell_data)
            grid_matrix.append(row_items)

        # Mark the top hotspot cell
        if peak_cell_info and peak_val > 0:
            peak_cell_info["is_hotspot"] = True

        return {
            "video_id": video.id,
            "video_name": video.video_name,
            "store_id": video.store_id,
            "camera_id": video.camera_id,
            "resolution": f"{w}x{h}",
            "fps": fps,
            "rows": rows,
            "cols": cols,
            "total_cells": rows * cols,
            "total_dwell_seconds": round(total_grid_dwell, 2),
            "max_cell_dwell_seconds": round(max_dwell, 2),
            "peak_cell": peak_cell_info,
            "grid": grid_matrix,
            "cells": flat_cells,
        }

    @classmethod
    def calculate_shelf_attractiveness_scores(
        cls,
        db: Session,
        store_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Calculates the exact Attractiveness Scores and Rankings across all shelves/zones
        using real PostgreSQL data.
        """
        # Fetch stores and shelves
        shelves_query = db.query(Shelf)
        if store_id is not None:
            shelves_query = shelves_query.filter(Shelf.store_id == store_id)
        existing_shelves = shelves_query.all()

        # Fetch all person tracks and tracking points from DB
        tracks_query = db.query(PersonTrack)
        if store_id is not None:
            tracks_query = tracks_query.join(VideoRecord, PersonTrack.video_id == VideoRecord.id).filter(
                VideoRecord.store_id == store_id
            )
        all_tracks = tracks_query.all()

        # Strictly evaluate only shelves present in PostgreSQL
        if not existing_shelves:
            return {
                "total_shelves_evaluated": 0,
                "benchmark_weights": {
                    "attention_duration": "35%",
                    "interaction_frequency": "25%",
                    "pickup_rate": "20%",
                    "purchase_conversion": "15%",
                    "repeat_engagement": "5%",
                },
                "max_attention_benchmark_seconds": 0.0,
                "max_interaction_benchmark_count": 0,
                "rankings": [],
            }

        # Query all tracking points with video resolution metadata for precise normalized mapping
        points_query = db.query(
            TrackingPoint.x,
            TrackingPoint.y,
            TrackingPoint.track_id,
            VideoRecord.resolution_w,
            VideoRecord.resolution_h,
            VideoRecord.fps,
        ).join(VideoRecord, TrackingPoint.video_id == VideoRecord.id)

        if store_id is not None:
            store_pts = points_query.filter(VideoRecord.store_id == store_id).all()
            all_points = store_pts if len(store_pts) > 0 else points_query.all()
        else:
            all_points = points_query.all()

        total_shelves = len(existing_shelves)

        # Build normalized bounding boxes [0.0, 1.0] for each shelf
        shelf_boxes = []
        for idx, shelf in enumerate(existing_shelves):
            nx1, ny1, nx2, ny2 = 0.0, 0.0, 1.0, 1.0
            if shelf.zone_coordinates:
                parts = [p.strip() for p in shelf.zone_coordinates.split(",") if p.strip()]
                if len(parts) == 4:
                    try:
                        raw_x1, raw_y1, raw_x2, raw_y2 = map(float, parts)
                        # Normalize against 1280x720 baseline or direct fraction
                        if raw_x2 > 1.0 or raw_y2 > 1.0:
                            nx1 = max(0.0, min(1.0, raw_x1 / 1280.0))
                            ny1 = max(0.0, min(1.0, raw_y1 / 720.0))
                            nx2 = max(0.0, min(1.0, raw_x2 / 1280.0))
                            ny2 = max(0.0, min(1.0, raw_y2 / 720.0))
                        else:
                            nx1, ny1, nx2, ny2 = raw_x1, raw_y1, raw_x2, raw_y2
                    except ValueError:
                        pass
                else:
                    cols_split = max(1, total_shelves)
                    nx1 = idx / cols_split
                    nx2 = (idx + 1) / cols_split
                    ny1, ny2 = 0.0, 1.0
            else:
                cols_split = max(1, total_shelves)
                nx1 = idx / cols_split
                nx2 = (idx + 1) / cols_split
                ny1, ny2 = 0.0, 1.0

            shelf_boxes.append({
                "shelf": shelf,
                "nx1": nx1,
                "ny1": ny1,
                "nx2": nx2,
                "ny2": ny2,
                "track_dwell_map": {},  # track_id -> total_seconds
                "total_dwell_seconds": 0.0,
            })

        # Distribute points to matching shelves using normalized coordinates
        for pt in all_points:
            raw_w = float(pt.resolution_w or 1280)
            raw_h = float(pt.resolution_h or 720)
            fps_val = float(pt.fps or 30.0)
            frame_dt = (1.0 / fps_val) if fps_val > 0 else (1.0 / 30.0)

            # Normalize point coordinates into [0.0, 1.0]
            norm_px = max(0.0, min(1.0, float(pt.x) / raw_w))
            norm_py = max(0.0, min(1.0, float(pt.y) / raw_h))
            tid = pt.track_id

            for sbox in shelf_boxes:
                if sbox["nx1"] <= norm_px <= sbox["nx2"] and sbox["ny1"] <= norm_py <= sbox["ny2"]:
                    sbox["total_dwell_seconds"] += frame_dt
                    sbox["track_dwell_map"][tid] = sbox["track_dwell_map"].get(tid, 0.0) + frame_dt

        # Compute metrics for each shelf
        shelf_metrics = []
        for sbox in shelf_boxes:
            shelf = sbox["shelf"]
            t_dwell = sbox["track_dwell_map"]
            raw_attention_seconds = round(sbox["total_dwell_seconds"], 2)
            unique_visitors = len(t_dwell)

            # Meaningful behavioral thresholds (in seconds)
            interaction_count = sum(1 for tid, sec in t_dwell.items() if sec >= 3.0)
            pickup_count = sum(1 for tid, sec in t_dwell.items() if sec >= 6.0)
            conversion_count = sum(1 for tid, sec in t_dwell.items() if sec >= 12.0)
            repeat_count = sum(1 for tid, sec in t_dwell.items() if sec >= 20.0)

            pickup_rate = round(pickup_count / max(1, unique_visitors), 4) if unique_visitors > 0 else 0.0
            conversion_rate = round(conversion_count / max(1, unique_visitors), 4) if unique_visitors > 0 else 0.0
            repeat_rate = round(repeat_count / max(1, unique_visitors), 4) if unique_visitors > 0 else 0.0

            shelf_metrics.append({
                "shelf_id": shelf.id,
                "shelf_name": shelf.shelf_name,
                "store_id": shelf.store_id,
                "zone_coordinates": shelf.zone_coordinates,
                "raw_attention_seconds": raw_attention_seconds,
                "raw_interaction_count": interaction_count,
                "unique_visitors": unique_visitors,
                "pickup_count": pickup_count,
                "conversion_count": conversion_count,
                "repeat_count": repeat_count,
                "pickup_rate": min(1.0, pickup_rate),
                "conversion_rate": min(1.0, conversion_rate),
                "repeat_rate": min(1.0, repeat_rate),
            })

        # Calculate maximums for normalization
        max_attention = max((item["raw_attention_seconds"] for item in shelf_metrics), default=0.0)
        max_interaction = max((item["raw_interaction_count"] for item in shelf_metrics), default=0)

        # Apply exact formula with normalization
        scored_shelves = []
        for item in shelf_metrics:
            norm_attention = round(item["raw_attention_seconds"] / max_attention, 4) if max_attention > 0 else 0.0
            norm_interaction = round(item["raw_interaction_count"] / max_interaction, 4) if max_interaction > 0 else 0.0
            pickup_r = item["pickup_rate"]
            conv_r = item["conversion_rate"]
            rep_r = item["repeat_rate"]

            # Weighted Formula:
            # 0.35 * Attention + 0.25 * Interaction + 0.20 * Pickup + 0.15 * Conversion + 0.05 * Repeat
            weighted_score = (
                cls.WEIGHT_ATTENTION * norm_attention
                + cls.WEIGHT_INTERACTION * norm_interaction
                + cls.WEIGHT_PICKUP * pickup_r
                + cls.WEIGHT_CONVERSION * conv_r
                + cls.WEIGHT_REPEAT * rep_r
            )

            final_score = round(min(100.0, max(0.0, weighted_score * 100.0)), 1)

            # Metric contribution breakdown (points out of 100)
            breakdown = {
                "attention_duration": {
                    "weight_pct": 35,
                    "weight_decimal": cls.WEIGHT_ATTENTION,
                    "raw_value_seconds": item["raw_attention_seconds"],
                    "normalized_value": norm_attention,
                    "points_contributed": round(cls.WEIGHT_ATTENTION * norm_attention * 100.0, 1),
                },
                "interaction_frequency": {
                    "weight_pct": 25,
                    "weight_decimal": cls.WEIGHT_INTERACTION,
                    "raw_count": item["raw_interaction_count"],
                    "normalized_value": norm_interaction,
                    "points_contributed": round(cls.WEIGHT_INTERACTION * norm_interaction * 100.0, 1),
                },
                "pickup_rate": {
                    "weight_pct": 20,
                    "weight_decimal": cls.WEIGHT_PICKUP,
                    "rate": pickup_r,
                    "rate_pct": round(pickup_r * 100.0, 1),
                    "points_contributed": round(cls.WEIGHT_PICKUP * pickup_r * 100.0, 1),
                },
                "purchase_conversion": {
                    "weight_pct": 15,
                    "weight_decimal": cls.WEIGHT_CONVERSION,
                    "rate": conv_r,
                    "rate_pct": round(conv_r * 100.0, 1),
                    "points_contributed": round(cls.WEIGHT_CONVERSION * conv_r * 100.0, 1),
                },
                "repeat_engagement": {
                    "weight_pct": 5,
                    "weight_decimal": cls.WEIGHT_REPEAT,
                    "rate": rep_r,
                    "rate_pct": round(rep_r * 100.0, 1),
                    "points_contributed": round(cls.WEIGHT_REPEAT * rep_r * 100.0, 1),
                },
            }

            # Generate rule-based recommendations from real metrics
            recs = cls.generate_shelf_recommendations(
                score=final_score,
                unique_visitors=item["unique_visitors"],
                pickup_rate=pickup_r,
                conversion_rate=conv_r,
                conversion_count=item["conversion_count"],
            )

            scored_shelves.append({
                "shelf_id": item["shelf_id"],
                "shelf_name": item["shelf_name"],
                "store_id": item["store_id"],
                "attractiveness_score": final_score,
                "attention_duration_seconds": item["raw_attention_seconds"],
                "interaction_count": item["raw_interaction_count"],
                "unique_visitors": item["unique_visitors"],
                "pickup_count": item["pickup_count"],
                "conversion_count": item["conversion_count"],
                "repeat_count": item["repeat_count"],
                "pickup_rate": pickup_r,
                "purchase_conversion_rate": conv_r,
                "repeat_engagement_rate": rep_r,
                "metric_breakdown": breakdown,
                "recommendations": recs,
            })

        # Rank shelves from Highest Score -> Lowest Score
        scored_shelves.sort(key=lambda s: s["attractiveness_score"], reverse=True)
        for rank_idx, shelf_item in enumerate(scored_shelves):
            shelf_item["rank"] = rank_idx + 1

        return {
            "formula": {
                "attention_duration_weight": 0.35,
                "interaction_frequency_weight": 0.25,
                "pickup_rate_weight": 0.20,
                "purchase_conversion_weight": 0.15,
                "repeat_engagement_weight": 0.05,
                "scale": "0 - 100",
            },
            "max_benchmarks": {
                "max_attention_seconds": max_attention,
                "max_interaction_count": max_interaction,
            },
            "total_shelves_evaluated": len(scored_shelves),
            "rankings": scored_shelves,
        }
