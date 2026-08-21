from app.models.customer_path import CustomerPath


class PathRepository:

    def __init__(self, db):
        self.db = db

    def save(self, person, store, frame_no, x, y):
        path_point = CustomerPath(
            person_id=person,
            store_id=store,
            frame_no=frame_no,
            x=x,
            y=y,
        )
        self.db.add(path_point)
        self.db.commit()

    def get_all(self):
        return self.db.query(CustomerPath).all()

    def get_by_person(self, person_id):
        return self.db.query(CustomerPath).filter(CustomerPath.person_id == person_id).all()
