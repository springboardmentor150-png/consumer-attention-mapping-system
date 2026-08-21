"""
dwell_time_tracker.py

Maintains dwell time information for each shopper.

Features
--------
✓ Entry Time
✓ Last Seen
✓ Current Dwell Time
✓ Exit Detection
✓ Completed Dwell Records
✓ Active Shopper Count
"""

from datetime import datetime


class DwellTimeTracker:

    def __init__(self, exit_timeout=2.0):

        self.exit_timeout = exit_timeout

        # First appearance
        self.entry_times = {}

        # Last frame seen
        self.last_seen = {}

        # Missing since
        self.missing_since = {}

        # Shelf names
        self.shelf_names = {}

    # -------------------------------------------------
    # Update visible shoppers (call once every frame)
    # -------------------------------------------------

    def update(self, visible_shoppers):
        print("=" * 50)
        print("VISIBLE SHOPPERS:", list(visible_shoppers.keys()))

        current_time = datetime.now()

        # Update all visible shoppers
        for track_id, shopper in visible_shoppers.items():

            if track_id not in self.entry_times:
                self.entry_times[track_id] = current_time

            self.last_seen[track_id] = current_time

            self.shelf_names[track_id] = shopper.get(
                "shelf_name",
                "Unknown"
            )

            # Shopper came back
            if track_id in self.missing_since:
                del self.missing_since[track_id]

        # Detect missing shoppers
        for track_id in list(self.entry_times.keys()):

            if track_id in visible_shoppers:
                continue

            if track_id not in self.missing_since:
                self.missing_since[track_id] = current_time
                print(f"Shopper {track_id} marked as MISSING")
    # -------------------------------------------------
    # Current dwell time
    # -------------------------------------------------

    def get_dwell_time(self, track_id):

        if track_id not in self.entry_times:
            return 0.0

        current_time = datetime.now()

        return (
            current_time -
            self.entry_times[track_id]
        ).total_seconds()

    # -------------------------------------------------
    # Current entry time
    # -------------------------------------------------

    def get_entry_time(self, track_id):

        return self.entry_times.get(track_id)

    # -------------------------------------------------
    # Last seen
    # -------------------------------------------------

    def get_last_seen(self, track_id):

        return self.last_seen.get(track_id)

    # -------------------------------------------------
    # Shopper exited?
    # -------------------------------------------------

    def has_exited(self, track_id):

        if track_id not in self.missing_since:
            return False

        seconds = (
            datetime.now() -
            self.missing_since[track_id]
        ).total_seconds()
        print(
            f"Track {track_id} missing for "
            f"{seconds:.2f}s"
        )
        return seconds >= self.exit_timeout

    # -------------------------------------------------
    # Final dwell time
    # -------------------------------------------------

    def get_final_dwell_time(self, track_id):

        if track_id not in self.entry_times:
            return 0.0

        exit_time = self.last_seen.get(track_id)

        if exit_time is None:
            return 0.0

        return (
            exit_time -
            self.entry_times[track_id]
        ).total_seconds()

    # -------------------------------------------------
    # Completed dwell records
    # -------------------------------------------------

    def get_completed_dwell_times(self):

        completed = []

        for track_id in list(self.missing_since.keys()):

            if not self.has_exited(track_id):
                continue

            completed.append({

                "track_id": track_id,

                "entry_time":
                    self.entry_times[track_id],

                "exit_time":
                    self.last_seen[track_id],

                "dwell_time_seconds":
                    self.get_final_dwell_time(track_id),

                "shelf_name":
                    self.shelf_names.get(
                        track_id,
                        "Unknown"
                    )

            })

            # Cleanup
            del self.entry_times[track_id]
            del self.last_seen[track_id]
            del self.missing_since[track_id]

            if track_id in self.shelf_names:
                del self.shelf_names[track_id]

        return completed

    # -------------------------------------------------
    # Active shopper count
    # -------------------------------------------------

    def active_count(self):

        return len(self.entry_times)

    # -------------------------------------------------
    # Reset tracker
    # -------------------------------------------------

    def reset(self):

        self.entry_times.clear()
        self.last_seen.clear()
        self.missing_since.clear()
        self.shelf_names.clear()