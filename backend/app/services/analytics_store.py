import threading
import json
import os
from datetime import datetime


DATA_FILE = "analytics_data.json"


class AnalyticsStore:

    def __init__(self):
        self.lock = threading.Lock()
        self._initialize_file()

    def _initialize_file(self):
        if not os.path.exists(DATA_FILE):
            data = {
                "shoppers": {},
                "products": {},
                "recommendations": {},
                "heatmap": []
            }
            self._save(data)

    def _load(self):
        with self.lock:
            with open(DATA_FILE, "r") as file:
                return json.load(file)

                         
    def _save(self, data):
        with self.lock:
            with open(DATA_FILE, "w") as file:
                json.dump(data, file, indent=4)
            
            

    def update_shopper(self, shopper_id, attention_time=0, segment=None):
        data = self._load()

        data["shoppers"][str(shopper_id)] = {
            "shopper_id": shopper_id,
            "attention_time": attention_time,
            "segment": segment,
            "updated_at": str(datetime.now())
        }

        self._save(data)

    def update_product(
             self,
             product_id,
             attractiveness_score,
             rating
             ):
            data = self._load()

            if "products" not in data:
                data["products"] ={}

            data["products"][str(product_id)] = {
                "product_id": product_id,
                "attractiveness_score": attractiveness_score,
                 "rating": rating,
                 "updated_at": str(datetime.now())
                  }
            self._save(data)

    def add_heatmap_point(self, x, y):

        data = self._load()

        data["heatmap"].append({
                "x": x,
                "y": y
            })

        if len(data["heatmap"]) > 200:
                data["heatmap"] = data["heatmap"][-200:]

        self._save(data)

    def get_shoppers(self):
        data = self._load()
        return data["shoppers"]

    def get_products(self):
        data = self._load()
        return data["products"]

    def get_heatmap(self):
        data = self._load()
        return data["heatmap"]

    def update_recommendation(
            self,
            product_id,
            recommendation
    ):
        data = self._load()

        if "recommendations" not in data:
            data["recommendations"] = {}

        data["recommendations"][str(product_id)] = {
            "product_id": product_id,
            "recommendation": recommendation,
            "updated_at": str(datetime.now())
        }

        self._save(data)

    def get_recommendations(self):

        data = self._load()

        return data["recommendations"]

analytics_store = AnalyticsStore()