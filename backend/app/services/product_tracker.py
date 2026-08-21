class ProductTracker:

    def __init__(self):
        self.products = {}

    def update(self, product_boxes):

        self.products = {}

        for idx, (x1, y1, x2, y2, label) in enumerate(product_boxes, start=1):

            self.products[idx] = {
                "bbox": (x1, y1, x2, y2),
                "label": label,
                "attention_time": 0,
                "views": 0,
            }

        return self.products
