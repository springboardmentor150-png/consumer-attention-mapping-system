import sys
import os

# Add the parent directory to sys.path so we can import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.database import engine, Base
from backend.app.models import User, Store, StoreZone, Shelf, Product, Camera

def main():
    print("Testing connection to PostgreSQL database...")
    try:
        # Create all tables if they don't exist
        Base.metadata.create_all(bind=engine)
        print("Success! Database connected and tables verified/created successfully.")
    except Exception as e:
        print("Error connecting to database:")
        print(e)
        sys.exit(1)

if __name__ == "__main__":
    main()
