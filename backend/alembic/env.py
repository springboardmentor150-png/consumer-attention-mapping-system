from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
from app.core.config import DATABASE_URL
from app.core.database import Base

# Every model must be imported here or its table is missing from
# Base.metadata, and autogenerate would then propose dropping it. Analytics
# was absent, which is why the original baseline never described it.
from app.models.role import Role  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.store import Store  # noqa: F401
from app.models.shelf import Shelf  # noqa: F401
from app.models.analytics import Analytics  # noqa: F401
from app.models.notification import Notification  # noqa: F401

target_metadata = Base.metadata

# Reuse the application's own connection string rather than duplicating it in
# alembic.ini. app.core.config loads it from .env via python-dotenv, so
# migrations and the running app can never point at different databases.
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. Alembic reads it from the environment "
        "(backend/.env), the same way the application does."
    )

config.set_main_option("sqlalchemy.url", DATABASE_URL)

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
