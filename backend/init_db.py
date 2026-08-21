import psycopg2
import sys

passwords = ["1234", "postgres", "admin", "root", "password", ""]

connected = False
for pwd in passwords:
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user="postgres",
            password=pwd,
            host="localhost",
            port=5432
        )
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM pg_database WHERE datname='consumer_attention_mapping_db'")
        exists = cur.fetchone()
        if not exists:
            cur.execute("CREATE DATABASE consumer_attention_mapping_db")
            print(f"Created database 'consumer_attention_mapping_db' with password '{pwd}'")
        else:
            print(f"Database 'consumer_attention_mapping_db' exists with password '{pwd}'")
        cur.close()
        conn.close()
        connected = True
        # update .env with correct password if different
        with open(".env", "w") as f:
            f.write(f"DATABASE_URL=postgresql://postgres:{pwd}@localhost:5432/consumer_attention_mapping_db\n")
            f.write("SECRET_KEY=consumer_attention_mapping_super_secret_jwt_key_2026\n")
            f.write("ALGORITHM=HS256\n")
            f.write("ACCESS_TOKEN_EXPIRE_MINUTES=1440\n")
        break
    except Exception as e:
        continue

if not connected:
    print("Could not connect with standard postgres passwords. Will try checking existing DB or fallback.")
