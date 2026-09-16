"""Script para agregar la columna image_url a la tabla vehicles"""
from app.core.database import engine
from sqlalchemy import text

def add_image_url_column():
    try:
        with engine.connect() as conn:
            # Verificar si la columna ya existe
            from sqlalchemy import inspect
            inspector = inspect(engine)
            if 'vehicles' in inspector.get_table_names():
                columns = [col['name'] for col in inspector.get_columns('vehicles')]
                if 'image_url' in columns:
                    print("La columna image_url ya existe.")
                    return
            
            # Agregar la columna
            conn.execute(text("ALTER TABLE vehicles ADD COLUMN image_url VARCHAR(500)"))
            conn.commit()
            print("Columna image_url agregada exitosamente a la tabla vehicles")
    except Exception as e:
        print(f"Error: {e}")
        if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
            print("La columna ya existe.")
        else:
            raise

if __name__ == "__main__":
    add_image_url_column()

