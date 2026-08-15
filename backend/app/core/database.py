from sqlmodel import create_engine, Session

DATABASE_URL = "postgresql://postgres:honey%4015@localhost:5432/consumer_attention_mapping"

engine = create_engine(
    DATABASE_URL,
    echo=True
)


def get_session():
    with Session(engine) as session:
        yield session