"""
Script para verificar las columnas de la tabla vehicles
"""
import sys
sys.path.append('.')

from app.core.database import engine
from sqlalchemy import inspect, text

def check_table_structure():
    """Verificar la estructura de la tabla vehicles"""
    inspector = inspect(engine)
    
    # Verificar si la tabla existe
    if 'vehicles' in inspector.get_table_names():
        print("Tabla 'vehicles' existe")
        print("\nColumnas en la tabla 'vehicles':")
        columns = inspector.get_columns('vehicles')
        for col in columns:
            print(f"  - {col['name']}: {col['type']}")
    else:
        print("Tabla 'vehicles' NO existe")
    
    # También verificar con SQL directo
    print("\nVerificando con SQL directo:")
    with engine.connect() as conn:
        result = conn.execute(text("PRAGMA table_info(vehicles)"))
        print("\nColumnas (SQL directo):")
        for row in result:
            print(f"  - {row[1]}: {row[2]}")

if __name__ == "__main__":
    check_table_structure()
