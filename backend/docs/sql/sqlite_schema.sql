-- SQLite schema compatible con las entidades actuales

PRAGMA foreign_keys = ON;

-- 1. Tabla usuarios (sin tipos ENUM)
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    correo TEXT UNIQUE NOT NULL,
    contraseña TEXT NOT NULL,
    rol TEXT DEFAULT 'empleado',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    manager_id INTEGER NULL REFERENCES usuarios(id_usuario)
);

-- 2. Tabla clientes
CREATE TABLE IF NOT EXISTS clientes (
    id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    apellidos TEXT,
    telefono TEXT,
    preferencias TEXT,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla cotizaciones (estado como TEXT con check)
CREATE TABLE IF NOT EXISTS cotizaciones (
    id_cotizacion INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_cotizacion TEXT UNIQUE NOT NULL,
    id_cliente INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL,
    vehiculo TEXT NOT NULL,
    estado TEXT NOT NULL CHECK (estado IN ('frio','tibio','caliente')),
    fecha_registro DATE NOT NULL,
    fecha_seguimiento DATE NOT NULL,
    stage TEXT DEFAULT 'prospecto',
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE IF NOT EXISTS quotation_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cotizacion INTEGER NOT NULL REFERENCES cotizaciones(id_cotizacion),
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by INTEGER NULL REFERENCES usuarios(id_usuario),
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quotation_stage_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cotizacion INTEGER NOT NULL REFERENCES cotizaciones(id_cotizacion),
    old_stage TEXT,
    new_stage TEXT NOT NULL,
    changed_by INTEGER NULL REFERENCES usuarios(id_usuario),
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla alertas (estado_alerta como TEXT con check)
CREATE TABLE IF NOT EXISTS alertas (
    id_alerta INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cotizacion INTEGER NOT NULL,
    fecha_alerta DATE NOT NULL,
    estado_alerta TEXT DEFAULT 'pendiente' CHECK (estado_alerta IN ('pendiente','enviado','atendido')),
    FOREIGN KEY (id_cotizacion) REFERENCES cotizaciones(id_cotizacion)
);

-- 5. Tabla descartados
CREATE TABLE IF NOT EXISTS descartados (
    id_descartado INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cliente INTEGER NOT NULL,
    motivo TEXT,
    fecha_descartado DATE NOT NULL,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
);

-- 6. Tabla event_log (para simulación local de Kafka)
CREATE TABLE IF NOT EXISTS event_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT NOT NULL,
    key TEXT,
    event_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Documentos
CREATE TABLE IF NOT EXISTS document_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    required_in_stage TEXT,
    active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cotizacion INTEGER NOT NULL REFERENCES cotizaciones(id_cotizacion),
    document_type_id INTEGER NOT NULL REFERENCES document_types(id),
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    mimetype TEXT,
    uploaded_by INTEGER NULL REFERENCES usuarios(id_usuario),
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pendiente',
    note TEXT
);

-- 8. Crédito y garantías
CREATE TABLE IF NOT EXISTS credit_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cotizacion INTEGER NOT NULL REFERENCES cotizaciones(id_cotizacion),
    status TEXT DEFAULT 'pendiente',
    requested_amount REAL,
    approved_amount REAL,
    term_months INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credit_approvals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL REFERENCES credit_applications(id),
    approved_amount REAL NOT NULL,
    term_months INTEGER NOT NULL,
    letter_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guarantees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL REFERENCES credit_applications(id),
    type TEXT NOT NULL,
    description TEXT,
    value REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. Pagos y cuotas
CREATE TABLE IF NOT EXISTS payment_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cotizacion INTEGER NOT NULL REFERENCES cotizaciones(id_cotizacion),
    installment_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    amount_due REAL NOT NULL,
    status TEXT DEFAULT 'pendiente'
);

CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_id INTEGER NOT NULL REFERENCES payment_schedules(id),
    paid_amount REAL NOT NULL,
    paid_date DATE NOT NULL,
    method TEXT,
    receipt_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. Inventario y entrega
CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vin TEXT UNIQUE NOT NULL,
    model TEXT NOT NULL,
    color TEXT,
    available INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicle_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cotizacion INTEGER NOT NULL REFERENCES cotizaciones(id_cotizacion),
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    released_at DATETIME
);

CREATE TABLE IF NOT EXISTS deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cotizacion INTEGER NOT NULL REFERENCES cotizaciones(id_cotizacion),
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    delivered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS delivery_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    delivery_id INTEGER NOT NULL REFERENCES deliveries(id),
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

