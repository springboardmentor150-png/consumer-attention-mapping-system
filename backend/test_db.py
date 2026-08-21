from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://cams_user:cams_password@localhost:5432/cams_db"

engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT version();"))
        print("✅ Connected Successfully!")
        print(result.fetchone()[0])
except Exception as e:
    print("❌ Connection Failed")
    print(e)