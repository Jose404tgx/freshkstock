<?php
// Run this script once to ensure the database has all tables and data
// Open in browser: http://localhost/FRESHSTOCK/setup.php

require_once 'config/database.php';

echo "<h2>FreshStock - Setup</h2>";

// Check categorias table
try {
    $result = $pdo->query("SHOW TABLES LIKE 'categorias'");
    $exists = $result->rowCount() > 0;
    
    if (!$exists) {
        echo "<p style='color:orange;'>⚠️ Tabla 'categorias' NO existe. Creando...</p>";
        $pdo->exec("CREATE TABLE categorias (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(50) NOT NULL UNIQUE,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");
        
        $pdo->exec("INSERT INTO categorias (nombre) VALUES
            ('Lácteos'), ('Carnes'), ('Bebidas'), ('Panadería'), ('Refrigerados')");
        echo "<p style='color:green;'>✅ Tabla 'categorias' creada con 5 categorías.</p>";
    } else {
        $count = $pdo->query("SELECT COUNT(*) FROM categorias")->fetchColumn();
        echo "<p style='color:green;'>✅ Tabla 'categorias' existe con $count registros.</p>";
        
        if ($count == 0) {
            $pdo->exec("INSERT INTO categorias (nombre) VALUES
                ('Lácteos'), ('Carnes'), ('Bebidas'), ('Panadería'), ('Refrigerados')");
            echo "<p style='color:green;'>✅ 5 categorías por defecto insertadas.</p>";
        }
    }
} catch (Exception $e) {
    echo "<p style='color:red;'>❌ Error: " . $e->getMessage() . "</p>";
}

// Check productos table
try {
    $result = $pdo->query("SHOW TABLES LIKE 'productos'");
    $exists = $result->rowCount() > 0;
    
    if (!$exists) {
        echo "<p style='color:orange;'>⚠️ Tabla 'productos' NO existe. Creando...</p>";
        $pdo->exec("CREATE TABLE productos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            categoria VARCHAR(50) NOT NULL,
            stock INT NOT NULL DEFAULT 0,
            stock_min INT NOT NULL DEFAULT 5,
            precio_compra DECIMAL(10,2) NOT NULL,
            precio_venta DECIMAL(10,2) NOT NULL,
            fecha_vencimiento DATE NOT NULL,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )");
        
        $pdo->exec("INSERT INTO productos (nombre, categoria, stock, stock_min, precio_compra, precio_venta, fecha_vencimiento) VALUES
            ('Yogurt Natural 1L', 'Lácteos', 10, 5, 2.00, 3.50, DATE_ADD(CURDATE(), INTERVAL 10 DAY)),
            ('Leche Entera 1L', 'Lácteos', 25, 10, 1.50, 2.80, DATE_ADD(CURDATE(), INTERVAL 15 DAY)),
            ('Queso Fresco 500g', 'Lácteos', 3, 5, 4.00, 6.50, DATE_ADD(CURDATE(), INTERVAL 5 DAY)),
            ('Pechuga de Pollo 1kg', 'Carnes', 15, 8, 5.50, 8.90, DATE_ADD(CURDATE(), INTERVAL 3 DAY)),
            ('Carne Molida 500g', 'Carnes', 8, 5, 3.80, 6.20, DATE_ADD(CURDATE(), INTERVAL 7 DAY)),
            ('Coca-Cola 2L', 'Bebidas', 50, 20, 1.20, 2.50, DATE_ADD(CURDATE(), INTERVAL 180 DAY)),
            ('Agua Mineral 1L', 'Bebidas', 40, 15, 0.50, 1.20, DATE_ADD(CURDATE(), INTERVAL 365 DAY)),
            ('Jugo de Naranja 1L', 'Bebidas', 12, 8, 2.00, 3.80, DATE_ADD(CURDATE(), INTERVAL 20 DAY)),
            ('Pan Integral', 'Panadería', 20, 10, 1.00, 2.00, DATE_ADD(CURDATE(), INTERVAL 2 DAY)),
            ('Pan de Molde', 'Panadería', 18, 8, 1.50, 2.80, DATE_ADD(CURDATE(), INTERVAL 4 DAY)),
            ('Mantequilla 250g', 'Lácteos', 6, 5, 2.50, 4.20, DATE_ADD(CURDATE(), INTERVAL 25 DAY)),
            ('Cerveza Pack x6', 'Bebidas', 30, 10, 6.00, 10.50, DATE_ADD(CURDATE(), INTERVAL 90 DAY))");
        echo "<p style='color:green;'>✅ Tabla 'productos' creada con 12 productos.</p>";
    } else {
        $count = $pdo->query("SELECT COUNT(*) FROM productos")->fetchColumn();
        echo "<p style='color:green;'>✅ Tabla 'productos' existe con $count registros.</p>";
    }
} catch (Exception $e) {
    echo "<p style='color:red;'>❌ Error: " . $e->getMessage() . "</p>";
}

// Check usuarios table
try {
    $result = $pdo->query("SHOW TABLES LIKE 'usuarios'");
    $exists = $result->rowCount() > 0;
    
    if (!$exists) {
        echo "<p style='color:orange;'>⚠️ Tabla 'usuarios' NO existe. Creando...</p>";
        $pdo->exec("CREATE TABLE usuarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            rol ENUM('dueño', 'administrador', 'encargado') NOT NULL,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");
        
        $pdo->exec("INSERT INTO usuarios (nombre, email, password, rol) VALUES
            ('Carlos Dueño', 'dueno@freshstock.com', '\$2y\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'dueño'),
            ('Ana Admin', 'admin@freshstock.com', '\$2y\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'administrador'),
            ('Luis Encargado', 'encargado@freshstock.com', '\$2y\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'encargado')");
        echo "<p style='color:green;'>✅ Tabla 'usuarios' creada con 3 usuarios.</p>";
    } else {
        $count = $pdo->query("SELECT COUNT(*) FROM usuarios")->fetchColumn();
        echo "<p style='color:green;'>✅ Tabla 'usuarios' existe con $count registros.</p>";
    }
} catch (Exception $e) {
    echo "<p style='color:red;'>❌ Error: " . $e->getMessage() . "</p>";
}

echo "<hr><h3>Resumen de datos:</h3>";
echo "<p>Categorías: " . $pdo->query("SELECT COUNT(*) FROM categorias")->fetchColumn() . "</p>";
echo "<p>Productos: " . $pdo->query("SELECT COUNT(*) FROM productos")->fetchColumn() . "</p>";
echo "<p>Usuarios: " . $pdo->query("SELECT COUNT(*) FROM usuarios")->fetchColumn() . "</p>";
echo "<hr><p><a href='login.php'>Ir al login</a></p>";
?>
