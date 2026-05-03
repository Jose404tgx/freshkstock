-- ============================================================
-- FreshStock - PostgreSQL (Supabase)
-- Ejecuta este script en Supabase → SQL Editor
-- ============================================================

-- Categorías
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usuarios (rol con CHECK en vez de ENUM)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('dueño', 'administrador', 'encargado')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Productos
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    stock_min INT NOT NULL DEFAULT 5,
    precio_compra NUMERIC(10, 2) NOT NULL,
    precio_venta NUMERIC(10, 2) NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para auto-actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_productos_updated ON productos;
CREATE TRIGGER trg_productos_updated
    BEFORE UPDATE ON productos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Desactivar RLS para acceso público (necesario para la API PHP)
ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE productos DISABLE ROW LEVEL SECURITY;

-- Categorías por defecto
INSERT INTO categorias (nombre) VALUES
('Lácteos'),
('Carnes'),
('Bebidas'),
('Panadería'),
('Refrigerados')
ON CONFLICT (nombre) DO NOTHING;

-- Usuarios (contraseña: password)
INSERT INTO usuarios (nombre, email, password, rol) VALUES
('Carlos Dueño', 'dueno@freshstock.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'dueño'),
('Ana Admin', 'admin@freshstock.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'administrador'),
('Luis Encargado', 'encargado@freshstock.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'encargado')
ON CONFLICT (email) DO NOTHING;

-- Productos de ejemplo
INSERT INTO productos (nombre, categoria, stock, stock_min, precio_compra, precio_venta, fecha_vencimiento) VALUES
('Yogurt Natural 1L', 'Lácteos', 10, 5, 2.00, 3.50, CURRENT_DATE + INTERVAL '10 days'),
('Leche Entera 1L', 'Lácteos', 25, 10, 1.50, 2.80, CURRENT_DATE + INTERVAL '15 days'),
('Queso Fresco 500g', 'Lácteos', 3, 5, 4.00, 6.50, CURRENT_DATE + INTERVAL '5 days'),
('Pechuga de Pollo 1kg', 'Carnes', 15, 8, 5.50, 8.90, CURRENT_DATE + INTERVAL '3 days'),
('Carne Molida 500g', 'Carnes', 8, 5, 3.80, 6.20, CURRENT_DATE + INTERVAL '7 days'),
('Coca-Cola 2L', 'Bebidas', 50, 20, 1.20, 2.50, CURRENT_DATE + INTERVAL '180 days'),
('Agua Mineral 1L', 'Bebidas', 40, 15, 0.50, 1.20, CURRENT_DATE + INTERVAL '365 days'),
('Jugo de Naranja 1L', 'Bebidas', 12, 8, 2.00, 3.80, CURRENT_DATE + INTERVAL '20 days'),
('Pan Integral', 'Panadería', 20, 10, 1.00, 2.00, CURRENT_DATE + INTERVAL '2 days'),
('Pan de Molde', 'Panadería', 18, 8, 1.50, 2.80, CURRENT_DATE + INTERVAL '4 days'),
('Mantequilla 250g', 'Lácteos', 6, 5, 2.50, 4.20, CURRENT_DATE + INTERVAL '25 days'),
('Cerveza Pack x6', 'Bebidas', 30, 10, 6.00, 10.50, CURRENT_DATE + INTERVAL '90 days')
ON CONFLICT DO NOTHING;
