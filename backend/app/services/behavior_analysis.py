class BehaviorAnalyzer:

    def __init__(self):
        self.shopper_data = {}


    def update_shopper(
        self,
        shopper_id,
        attention_time=0,
        product_views=0,
        interactions=0
    ):

        self.shopper_data[shopper_id] = {
            "attention_time": attention_time,
            "product_views": product_views,
            "interactions": interactions
        }


    def classify_shopper(self, shopper_id):

        if shopper_id not in self.shopper_data:
            return "Unknown"


        data = self.shopper_data[shopper_id]


        if data["interactions"] >= 3:
            return "Comparison Shopper"


        elif data["attention_time"] > 60:
            return "Explorer"


        elif data["product_views"] <= 2:
            return "Quick Buyer"


        else:
            return "Impulse Buyer"


    def get_behavior_report(self, shopper_id):

        segment = self.classify_shopper(shopper_id)

        return {
            "shopper_id": shopper_id,
            "segment": segment,
            "data": self.shopper_data.get(
                shopper_id,
                {}
            )
        }