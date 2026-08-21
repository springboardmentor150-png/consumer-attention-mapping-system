import time
import math


class DwellTimeTracker:
    """
    Tracks shopper sessions and collects behavioral features.

    Features:
    - Entry Time
    - Exit Time
    - Dwell Time
    - Path Length
    - Shelf Visits
    - Gaze Shifts
    """

    def __init__(self, timeout=4.0):
        self.timeout = timeout
        self.active_shoppers = {}

    def update(
        self,
        tracked_ids,
        regions=None,
        focuses=None,
        positions=None
    ):
        """
        Update shopper information every frame.

        Args:
            tracked_ids: list[int]
            regions: dict[shopper_id, shelf]
            focuses: dict[shopper_id, attention/focus]
            positions: dict[shopper_id, (x, y)]

        Returns:
            list of completed shopper sessions
        """

        regions = regions or {}
        focuses = focuses or {}
        positions = positions or {}

        current_time = time.time()

        completed_sessions = []

        # --------------------------------------------------
        # Update current shoppers
        # --------------------------------------------------

        for person_id in tracked_ids:

            region = regions.get(person_id)
            focus = focuses.get(person_id)
            position = positions.get(person_id)

            # ----------------------------------------------
            # New shopper
            # ----------------------------------------------

            if person_id not in self.active_shoppers:

                print(f"NEW SHOPPER -> ID {person_id}")

                self.active_shoppers[person_id] = {
                    "entry_time": current_time,
                    "last_seen": current_time,

                    "last_region": region,
                    "last_focus": focus,

                    # Behavioral features
                    "path_length": 0.0,
                    "shelf_visits": 0,
                    "gaze_shifts": 0,

                    "last_position": position,
                }

                # First shelf visit
                if region is not None:
                    self.active_shoppers[person_id]["shelf_visits"] = 1

            # ----------------------------------------------
            # Existing shopper
            # ----------------------------------------------

            else:

                shopper = self.active_shoppers[person_id]

                shopper["last_seen"] = current_time

                # ------------------------------------------
                # Path length
                # ------------------------------------------

                if position is not None:

                    previous_position = shopper["last_position"]

                    if previous_position is not None:

                        x1, y1 = previous_position
                        x2, y2 = position

                        distance = math.sqrt(
                            (x2 - x1) ** 2 +
                            (y2 - y1) ** 2
                        )

                        shopper["path_length"] += distance

                    shopper["last_position"] = position

                # ------------------------------------------
                # Shelf visits
                # ------------------------------------------

                previous_region = shopper["last_region"]

                if (
                    region is not None
                    and region != previous_region
                ):
                    shopper["shelf_visits"] += 1
                    shopper["last_region"] = region

                # ------------------------------------------
                # Gaze shifts
                # ------------------------------------------

                previous_focus = shopper["last_focus"]

                if (
                    focus is not None
                    and previous_focus is not None
                    and focus != previous_focus
                ):
                    shopper["gaze_shifts"] += 1

                if focus is not None:
                    shopper["last_focus"] = focus

        # --------------------------------------------------
        # Check who has left
        # --------------------------------------------------

        for person_id in list(self.active_shoppers.keys()):

            shopper = self.active_shoppers[person_id]

            if current_time - shopper["last_seen"] > self.timeout:

                dwell_time = (
                    shopper["last_seen"]
                    - shopper["entry_time"]
                )

                print(
                    f"SHOPPER LEFT -> ID {person_id}"
                )

                completed_sessions.append({

                    "person_id": person_id,

                    "entry_time": shopper["entry_time"],

                    "exit_time": shopper["last_seen"],

                    "dwell_time": round(
                        dwell_time,
                        2
                    ),

                    "region": (
                        shopper["last_region"]
                        or "Unknown"
                    ),

                    "focus": (
                        shopper["last_focus"]
                        or "Unknown"
                    ),

                    # Milestone 3 features
                    "path_length": round(
                        shopper["path_length"],
                        2
                    ),

                    "shelf_visits": shopper[
                        "shelf_visits"
                    ],

                    "gaze_shifts": shopper[
                        "gaze_shifts"
                    ],
                })

                del self.active_shoppers[person_id]

        return completed_sessions