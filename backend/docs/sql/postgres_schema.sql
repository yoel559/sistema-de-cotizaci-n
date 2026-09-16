-- 1. Tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    contraseña VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'empleado',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    manager_id INT NULL REFERENCES usuarios(id_usuario)
);

-- 2. Tabla clientes
CREATE TABLE IF NOT EXISTS clientes (
    id_cliente SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100),
    telefono VARCHAR(20),
    preferencias VARCHAR(255),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tipo ENUM estado_cotizacion
DO $$ BEGIN
    CREATE TYPE estado_cotizacion AS ENUM ('frio', 'tibio', 'caliente');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 3. Tabla cotizaciones
CREATE TABLE IF NOT EXISTS cotizaciones (
    id_cotizacion SERIAL PRIMARY KEY,
    numero_cotizacion VARCHAR(20) UNIQUE NOT NULL,
    id_cliente INT NOT NULL,
    id_usuario INT NOT NULL,
    vehiculo VARCHAR(100) NOT NULL,
    estado estado_cotizacion NOT NULL,
    fecha_registro DATE NOT NULL,
    fecha_seguimiento DATE NOT NULL,
    stage VARCHAR(40) DEFAULT 'prospecto',
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

-- Historial de estados de cotización
CREATE TABLE IF NOT EXISTS quotation_status_history (
    id SERIAL PRIMARY KEY,
    id_cotizacion INT NOT NULL REFERENCES cotizaciones(id_cotizacion),
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by INT NULL REFERENCES usuarios(id_usuario),
    note VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quotation_stage_history (
    id SERIAL PRIMARY KEY,
    id_cotizacion INT NOT NULL REFERENCES cotizaciones(id_cotizacion),
    old_stage VARCHAR(40),
    new_stage VARCHAR(40) NOT NULL,
    changed_by INT NULL REFERENCES usuarios(id_usuario),
    note VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tipo ENUM estado_alerta
DO $$ BEGIN
    CREATE TYPE estado_alerta AS ENUM ('pendiente', 'enviado', 'atendido');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 4. Tabla alertas
CREATE TABLE IF NOT EXISTS alertas (
    id_alerta SERIAL PRIMARY KEY,
    id_cotizacion INT NOT NULL,
    fecha_alerta DATE NOT NULL,
    estado_alerta estado_alerta DEFAULT 'pendiente',
    FOREIGN KEY (id_cotizacion) REFERENCES cotizaciones(id_cotizacion)
);

-- 5. Tabla descartados
CREATE TABLE IF NOT EXISTS descartados (
    id_descartado SERIAL PRIMARY KEY,
    id_cliente INT NOT NULL,
    motivo VARCHAR(255),
    fecha_descartado DATE NOT NULL,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
);

-- 6. Tabla event_log (para simulación local de Kafka)
CREATE TABLE IF NOT EXISTS event_log (
    id SERIAL PRIMARY KEY,
    topic VARCHAR(50) NOT NULL,
    key VARCHAR(100),
    event_type VARCHAR(100) NOT NULL,
    payload TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Documentos
CREATE TABLE IF NOT EXISTS document_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255),
    required_in_stage VARCHAR(50),
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    id_cotizacion INT NOT NULL REFERENCES cotizaciones(id_cotizacion),
    document_type_id INT NOT NULL REFERENCES document_types(id),
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(500) NOT NULL,
    mimetype VARCHAR(100),
    uploaded_by INT NULL REFERENCES usuarios(id_usuario),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) DEFAULT 'pendiente',
    note VARCHAR(255)
);

-- 8. Crédito y garantías
CREATE TABLE IF NOT EXISTS credit_applications (
    id SERIAL PRIMARY KEY,
    id_cotizacion INT NOT NULL REFERENCES cotizaciones(id_cotizacion),
    status VARCHAR(30) DEFAULT 'pendiente',
    requested_amount DOUBLE PRECISION,
    approved_amount DOUBLE PRECISION,
    term_months INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credit_approvals (
    id SERIAL PRIMARY KEY,
    application_id INT NOT NULL REFERENCES credit_applications(id),
    approved_amount DOUBLE PRECISION NOT NULL,
    term_months INT NOT NULL,
    letter_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guarantees (
    id SERIAL PRIMARY KEY,
    application_id INT NOT NULL REFERENCES credit_applications(id),
    type VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    value DOUBLE PRECISION,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Pagos y cuotas
CREATE TABLE IF NOT EXISTS payment_schedules (
    id SERIAL PRIMARY KEY,
    id_cotizacion INT NOT NULL REFERENCES cotizaciones(id_cotizacion),
    installment_number INT NOT NULL,
    due_date DATE NOT NULL,
    amount_due DOUBLE PRECISION NOT NULL,
    status VARCHAR(20) DEFAULT 'pendiente'
);

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    schedule_id INT NOT NULL REFERENCES payment_schedules(id),
    paid_amount DOUBLE PRECISION NOT NULL,
    paid_date DATE NOT NULL,
    method VARCHAR(30),
    receipt_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Inventario y entrega
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    vin VARCHAR(50) UNIQUE NOT NULL,
    model VARCHAR(100) NOT NULL,
    color VARCHAR(50),
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicle_assignments (
    id SERIAL PRIMARY KEY,
    id_cotizacion INT NOT NULL REFERENCES cotizaciones(id_cotizacion),
    vehicle_id INT NOT NULL REFERENCES vehicles(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deliveries (
    id SERIAL PRIMARY KEY,
    id_cotizacion INT NOT NULL REFERENCES cotizaciones(id_cotizacion),
    vehicle_id INT NOT NULL REFERENCES vehicles(id),
    delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS delivery_photos (
    id SERIAL PRIMARY KEY,
    delivery_id INT NOT NULL REFERENCES deliveries(id),
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

