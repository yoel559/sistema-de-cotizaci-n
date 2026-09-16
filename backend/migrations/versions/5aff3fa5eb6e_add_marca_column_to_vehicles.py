"""add_marca_column_to_vehicles

Revision ID: 5aff3fa5eb6e
Revises: 8c2ff02adad7
Create Date: 2025-11-20 09:54:26.996691

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5aff3fa5eb6e'
down_revision = '8c2ff02adad7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Agregar columna marca a la tabla vehicles
    # Como la columna es NOT NULL, primero la agregamos como nullable,
    # luego actualizamos los valores existentes, y finalmente la hacemos NOT NULL
    op.add_column('vehicles', sa.Column('marca', sa.String(length=50), nullable=True))
    
    # Actualizar los registros existentes con un valor por defecto
    # Si hay vehículos existentes, les asignamos "Sin marca" como valor temporal
    op.execute("UPDATE vehicles SET marca = 'Sin marca' WHERE marca IS NULL")
    
    # Ahora hacer la columna NOT NULL
    op.alter_column('vehicles', 'marca', nullable=False)


def downgrade() -> None:
    # Eliminar la columna marca
    op.drop_column('vehicles', 'marca')
