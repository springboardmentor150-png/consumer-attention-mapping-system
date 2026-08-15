from datetime import datetime


class ProductInteractionTracker:

    def __init__(self):
        self.interactions = []


    def record_view(self, shopper_id, product_id):
        event = {
            "shopper_id": shopper_id,
            "product_id": product_id,
            "event": "Product Viewed",
            "time": datetime.now()
        }

        self.interactions.append(event)

        print(
            f"Shopper {shopper_id} viewed Product {product_id}"
        )


    def record_pickup(self, shopper_id, product_id):
        event = {
            "shopper_id": shopper_id,
            "product_id": product_id,
            "event": "Product Picked Up",
            "time": datetime.now()
        }

        self.interactions.append(event)

        print(
            f"Shopper {shopper_id} picked Product {product_id}"
        )


    def record_return(self, shopper_id, product_id):
        event = {
            "shopper_id": shopper_id,
            "product_id": product_id,
            "event": "Product Returned",
            "time": datetime.now()
        }

        self.interactions.append(event)

        print(
            f"Shopper {shopper_id} returned Product {product_id}"
        )


    def get_interactions(self):
        return self.interactions