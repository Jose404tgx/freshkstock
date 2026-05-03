<?php
session_start();

if (!isset($_SESSION['user_id'])) {
    die('No autorizado. Inicie sesión primero.');
}

if (!in_array($_SESSION['user_role'], ['administrador', 'encargado'])) {
    die('No autorizado para generar reportes.');
}

require_once '../config/helpers.php';

$cd = curdate();
$da30 = date_add(30);
$dd = datediff('p.fecha_vencimiento', $cd);

$action = $_GET['action'] ?? 'export_all';
$filename = 'freshstock_reporte_' . date('Y-m-d') . '.csv';

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $filename . '"');

$output = fopen('php://output', 'w');

if ($action === 'export_all') {
    fputcsv($output, ['ID', 'Nombre', 'Categoría', 'Stock', 'Stock Mínimo', 'Precio Compra', 'Precio Venta', 'Ganancia/Unidad', 'Fecha Vencimiento', 'Estado']);

    $ev = "CASE WHEN p.fecha_vencimiento < $cd THEN 'VENCIDO' WHEN p.fecha_vencimiento <= $da30 THEN 'POR VENCER' ELSE 'OK' END";
    $stmt = $pdo->query("SELECT p.*, $ev as estado FROM productos p ORDER BY p.nombre");

    while ($row = $stmt->fetch()) {
        fputcsv($output, [
            $row['id'], $row['nombre'], $row['categoria'], $row['stock'], $row['stock_min'],
            '$' . number_format($row['precio_compra'], 2),
            '$' . number_format($row['precio_venta'], 2),
            '$' . number_format($row['precio_venta'] - $row['precio_compra'], 2),
            $row['fecha_vencimiento'], $row['estado']
        ]);
    }
} elseif ($action === 'export_expired') {
    fputcsv($output, ['ID', 'Nombre', 'Categoría', 'Stock', 'Precio Compra', 'Precio Venta', 'Pérdida Estimada', 'Fecha Vencimiento']);

    $stmt = $pdo->query("SELECT *, (precio_compra * stock) as perdida FROM productos WHERE fecha_vencimiento < $cd ORDER BY fecha_vencimiento");

    while ($row = $stmt->fetch()) {
        fputcsv($output, [
            $row['id'], $row['nombre'], $row['categoria'], $row['stock'],
            '$' . number_format($row['precio_compra'], 2),
            '$' . number_format($row['precio_venta'], 2),
            '$' . number_format($row['perdida'], 2),
            $row['fecha_vencimiento']
        ]);
    }
} elseif ($action === 'export_expiring') {
    fputcsv($output, ['ID', 'Nombre', 'Categoría', 'Stock', 'Precio Compra', 'Precio Venta', 'Fecha Vencimiento', 'Días Restantes']);

    $stmt = $pdo->query("SELECT p.*, $dd as dias_restantes FROM productos p WHERE p.fecha_vencimiento >= $cd AND p.fecha_vencimiento <= $da30 ORDER BY p.fecha_vencimiento");

    while ($row = $stmt->fetch()) {
        fputcsv($output, [
            $row['id'], $row['nombre'], $row['categoria'], $row['stock'],
            '$' . number_format($row['precio_compra'], 2),
            '$' . number_format($row['precio_venta'], 2),
            $row['fecha_vencimiento'],
            $row['dias_restantes'] . ' días'
        ]);
    }
} elseif ($action === 'export_low_stock') {
    fputcsv($output, ['ID', 'Nombre', 'Categoría', 'Stock', 'Stock Mínimo', 'Precio Compra', 'Precio Venta', 'Faltante']);

    $stmt = $pdo->query("SELECT *, (stock_min - stock) as faltante FROM productos WHERE stock <= stock_min ORDER BY stock ASC");

    while ($row = $stmt->fetch()) {
        fputcsv($output, [
            $row['id'], $row['nombre'], $row['categoria'], $row['stock'], $row['stock_min'],
            '$' . number_format($row['precio_compra'], 2),
            '$' . number_format($row['precio_venta'], 2),
            $row['faltante']
        ]);
    }
} elseif ($action === 'export_profit') {
    fputcsv($output, ['ID', 'Nombre', 'Categoría', 'Stock', 'Precio Compra', 'Precio Venta', 'Ganancia/Unidad', 'Ganancia Total']);

    $stmt = $pdo->query("SELECT *, (precio_venta - precio_compra) as ganancia_unidad, (precio_venta - precio_compra) * stock as ganancia_total FROM productos ORDER BY ganancia_total DESC");

    while ($row = $stmt->fetch()) {
        fputcsv($output, [
            $row['id'], $row['nombre'], $row['categoria'], $row['stock'],
            '$' . number_format($row['precio_compra'], 2),
            '$' . number_format($row['precio_venta'], 2),
            '$' . number_format($row['ganancia_unidad'], 2),
            '$' . number_format($row['ganancia_total'], 2)
        ]);
    }
}

fclose($output);
?>
