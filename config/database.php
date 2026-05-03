<?php
// Configuración dual: MySQL (local) y PostgreSQL (Supabase/Render)
$db_type = getenv('DB_TYPE') ?: 'mysql';
$db_host = getenv('DB_HOST') ?: 'localhost';
$db_port = getenv('DB_PORT') ?: ($db_type === 'pgsql' ? '5432' : '3306');
$db_name = getenv('DB_NAME') ?: 'freshstock';
$db_user = getenv('DB_USER') ?: 'root';
$db_pass = getenv('DB_PASS') ?: '';

$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    if ($db_type === 'pgsql') {
        $dsn = "pgsql:host={$db_host};port={$db_port};dbname={$db_name};sslmode=require";
    } else {
        $dsn = "mysql:host={$db_host};port={$db_port};dbname={$db_name};charset=utf8mb4";
    }
    $pdo = new PDO($dsn, $db_user, $db_pass, $options);
} catch (PDOException $e) {
    die("Error de conexión: " . $e->getMessage());
}
?>
