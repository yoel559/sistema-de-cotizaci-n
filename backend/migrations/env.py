from __future__ import with_statement
import sys
import os
from alembic import context
from sqlalchemy import engine_from_config, pool

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import Base
from app.models import user, client, quotation, quotation_item, alert, discarded  # noqa
from app.core.config import settings

config = context.config


def get_url():
    return settings.database_url


target_metadata = Base.metadata


def run_migrations_offline():
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    connectable = engine_from_config(
        {"sqlalchemy.url": get_url()},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()


