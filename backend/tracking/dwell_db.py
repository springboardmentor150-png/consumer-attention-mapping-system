from database import SessionLocal
from models import DwellTimeRecord, ShopperSession
from tracking.behavior import classify_shopper


def save_dwell_record(
    shopper_id,
    shelf_id,
    entry_time,
    exit_time,
    total_dwell_duration
):
    print("save_dwell_record() called")
    """
    Save one completed shopper dwell session
    into the database.
    """

    db = SessionLocal()

    try:
        # Save dwell time record
        record = DwellTimeRecord(
            shopper_id=shopper_id,
            shelf_id=shelf_id,
            entry_time=entry_time,
            exit_time=exit_time,
            total_dwell_duration=total_dwell_duration
        )

        db.add(record)
        db.commit()
        db.refresh(record)

        # -------- Milestone 3 --------
        # Temporary values (will become dynamic later)
        path_length = 0
        attention_time = 0

        segment = classify_shopper(
            path_length,
            total_dwell_duration,
            attention_time
        )

        session = ShopperSession(
            shopper_id=shopper_id,
            entry_time=entry_time,
            exit_time=exit_time,
            total_dwell_time=total_dwell_duration,
            path_length=path_length,
            segment=segment
        )

        db.add(session)
        db.commit()
        db.refresh(session)
        # -----------------------------

        print(
            f"Database saved: Shopper #{shopper_id} | "
            f"Shelf: {shelf_id} | "
            f"Dwell: {total_dwell_duration:.2f}s | "
            f"Segment: {segment}"
        )

        return record

    except Exception as error:
        db.rollback()
        print(f"Database save error: {error}")
        return None

    finally:
        db.close()