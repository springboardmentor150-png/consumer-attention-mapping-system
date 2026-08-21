from app.core.database import SessionLocal
from app.models.attention_session import AttentionSession


class AnalyticsService:

    def classify_shopper(self, dwell_time, zone_a, zone_b, zone_c):

        total_attention = zone_a + zone_b + zone_c

        zones_visited = sum(
            [
                zone_a > 2,
                zone_b > 2,
                zone_c > 2,
            ]
        )

        # Quick Buyer
        if dwell_time <= 10:
            return "Quick Buyer"

        # Explorer
        if dwell_time >= 20 and zones_visited >= 3:
            return "Explorer"

        # Comparison Shopper
        if total_attention >= 15 and max(zone_a, zone_b, zone_c) >= 8:
            return "Comparison Shopper"

        return "Regular Shopper"

    def save_session(self, shopper_id, dwell_time, zone_times):

        db = SessionLocal()

        try:

            zone_a = round(zone_times.get("Zone A", 0), 2)
            zone_b = round(zone_times.get("Zone B", 0), 2)
            zone_c = round(zone_times.get("Zone C", 0), 2)

            segment = self.classify_shopper(
                dwell_time,
                zone_a,
                zone_b,
                zone_c,
            )

            valid_zones = {
                zone: seconds for zone, seconds in zone_times.items() if zone != "None"
            }

            if valid_zones:
                most_viewed = max(valid_zones, key=valid_zones.get)
            else:
                most_viewed = "No Shelf Viewed"

            session = AttentionSession(
                shopper_id=shopper_id,
                dwell_time=round(dwell_time, 2),
                zone_a_time=zone_a,
                zone_b_time=zone_b,
                zone_c_time=zone_c,
                most_viewed_zone=most_viewed,
                segment=segment,
            )

            db.add(session)
            db.commit()

        finally:
            db.close()
