from datetime import datetime


class SessionTracker:
    def __init__(self):
        self.sessions = {}

    def shopper_entered(self, shopper_id):
        if shopper_id not in self.sessions:
            self.sessions[shopper_id] = {
                "entry_time": datetime.now(),
                "last_seen": datetime.now()
            }

            print(f"Shopper {shopper_id} entered")

    def shopper_seen(self, shopper_id):
        if shopper_id in self.sessions:
            self.sessions[shopper_id]["last_seen"] = datetime.now()

    def shopper_exit(self, shopper_id):
        if shopper_id in self.sessions:
            entry = self.sessions[shopper_id]["entry_time"]
            exit_time = datetime.now()

            duration = exit_time - entry

            print(
                f"Shopper {shopper_id} session completed"
            )
            print(
                f"Duration: {duration}"
            )

            del self.sessions[shopper_id]