from datetime import datetime


class AttentionTracker:
    def __init__(self):
        self.attention_data = {}

    def start_attention(self, shopper_id, product_id=None):
        if shopper_id not in self.attention_data:
            self.attention_data[shopper_id] = {
                "product_id": product_id,
                "start_time": datetime.now(),
                "last_seen": datetime.now(),
            }

            print(f"Shopper {shopper_id} attention started")

        else:
            self.attention_data[shopper_id]["last_seen"] = datetime.now()

    def get_attention_duration(self, shopper_id):
        if shopper_id in self.attention_data:
            start = self.attention_data[shopper_id]["start_time"]
            duration = datetime.now() - start

            return duration.total_seconds()

        return 0