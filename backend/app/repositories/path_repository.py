from app.models.customer_path import CustomerPath


class PathRepository:

    def __init__(self, db):
        self.db = db

    def save(self, person_id, store_id, frame_no, x, y):
        point = CustomerPath(
            person_id=person_id,
            store_id=store_id,
            frame_no=frame_no,
            x=x,
            y=y,
        )
        self.db.add(point)
        self.db.commit()

    def get_person_path(self, person_id):
        return (
            self.db.query(CustomerPath)
            .filter(CustomerPath.person_id == person_id)
            .order_by(CustomerPath.frame_no)
            .all()
        )
