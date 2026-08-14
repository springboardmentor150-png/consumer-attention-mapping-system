import time
from datetime import datetime

from tracking.dwell_db import save_dwell_record

# ============================================================
# SHELF ZONE CONFIGURATION
# Format: (x1, y1, x2, y2)
# Update these coordinates according to your new video
# ============================================================
SHELF_ZONE = (500, 40, 760, 420)


# ============================================================
# DWELL TIME STORAGE
# ============================================================

shopper_entry_times = {}
shopper_dwell_times = {}


# ============================================================
# GET SHELF ZONE
# ============================================================

def get_shelf_zone():
    return SHELF_ZONE


# ============================================================
# CHECK IF SHOPPER IS INSIDE SHELF ZONE
# ============================================================

def is_shopper_in_zone(box, zone=SHELF_ZONE):
    """
    Check whether ANY PART of the shopper overlaps
    with the shelf zone.
    """

    x1, y1, x2, y2 = box
    zx1, zy1, zx2, zy2 = zone

    overlap_x = max(0, min(x2, zx2) - max(x1, zx1))
    overlap_y = max(0, min(y2, zy2) - max(y1, zy1))

    overlap_area = overlap_x * overlap_y

    return overlap_area > 0
 

# ============================================================
# UPDATE DWELL TIME
# ============================================================

def update_dwell_time(shopper_id, box):

    inside_zone = is_shopper_in_zone(box)
    print(f"Shopper {shopper_id}: inside_zone = {inside_zone}")

    # Shopper entered shelf zone
    if inside_zone:

        if shopper_id not in shopper_entry_times:

            shopper_entry_times[shopper_id] = {
                "start_time": time.time(),
                "entry_timestamp": datetime.now()
            }

            print(
                f"Shopper #{shopper_id} entered shelf zone"
            )

        current_dwell = (
            time.time()
            - shopper_entry_times[shopper_id]["start_time"]
        )

        return current_dwell

    # Shopper exited shelf zone
    else:

        if shopper_id in shopper_entry_times:

            exit_timestamp = datetime.now()

            entry_data = shopper_entry_times[shopper_id]

            dwell_duration = (
                time.time()
                - entry_data["start_time"]
            )

            shopper_dwell_times[shopper_id] = {
                "shopper_id": shopper_id,
                "entry_time": entry_data["entry_timestamp"],
                "exit_time": exit_timestamp,
                "total_dwell_duration": round(dwell_duration, 2)
            }

            # Save in database
            save_dwell_record(
                shopper_id=shopper_id,
                shelf_id="Shelf Zone",
                entry_time=entry_data["entry_timestamp"],
                exit_time=exit_timestamp,
                total_dwell_duration=round(dwell_duration, 2)
            )

            print(
                f"Shopper #{shopper_id} exited shelf zone | "
                f"Dwell Time: {dwell_duration:.2f} sec"
            )

            del shopper_entry_times[shopper_id]

            return dwell_duration

    return 0.0