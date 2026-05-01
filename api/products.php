<?php
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($method) {
        case 'GET':
            if ($action === 'get_product') {
                $id = $_GET['id'] ?? null;
                if (!$id) throw new Exception('ID requerido');
                $stmt = $pdo->prepare("SELECT * FROM productos WHERE id = ?");
                $stmt->execute([$id]);
                $product = $stmt->fetch();
                if (!$product) throw new Exception('Producto no encontrado');
                echo json_encode(['success' => true, 'data' => $product]);
            } elseif ($action === 'get_kpis') {
                $today = date('Y-m-d');
                $thirty_days = date('Y-m-d', strtotime('+30 days'));

                $total = $pdo->query("SELECT COUNT(*) FROM productos")->fetchColumn();
                $low_stock = $pdo->query("SELECT COUNT(*) FROM productos WHERE stock <= stock_min")->fetchColumn();
                $expired = $pdo->query("SELECT COUNT(*) FROM productos WHERE fecha_vencimiento < '$today'")->fetchColumn();
                $expiring = $pdo->query("SELECT COUNT(*) FROM productos WHERE fecha_vencimiento >= '$today' AND fecha_vencimiento <= '$thirty_days'")->fetchColumn();
                $inventory_value = $pdo->query("SELECT COALESCE(SUM(stock * precio_compra), 0) FROM productos")->fetchColumn();
                $estimated_profit = $pdo->query("SELECT COALESCE(SUM((precio_venta - precio_compra) * stock), 0) FROM productos")->fetchColumn();

                echo json_encode([
                    'success' => true,
                    'data' => [
                        'total_productos' => (int)$total,
                        'bajo_stock' => (int)$low_stock,
                        'vencidos' => (int)$expired,
                        'por_vencer' => (int)$expiring,
                        'valor_inventario' => (float)$inventory_value,
                        'ganancia_estimada' => (float)$estimated_profit,
                    ]
                ]);
            } else {
                $stmt = $pdo->query("SELECT *, 
                    CASE 
                        WHEN fecha_vencimiento < CURDATE() THEN 'vencido'
                        WHEN fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'por_vencer'
                        ELSE 'ok'
                    END as estado_vencimiento,
                    CASE 
                        WHEN stock <= stock_min THEN 'bajo'
                        ELSE 'ok'
                    END as estado_stock
                    FROM productos ORDER BY fecha_vencimiento ASC");
                $products = $stmt->fetchAll();
                echo json_encode(['success' => true, 'data' => $products]);
            }
            break;

        case 'POST':
            if (!in_array($_SESSION['user_role'], ['encargado'])) {
                throw new Exception('No autorizado');
            }
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) throw new Exception('Datos inválidos');

            $required = ['nombre', 'categoria', 'stock', 'stock_min', 'precio_compra', 'precio_venta', 'fecha_vencimiento'];
            foreach ($required as $field) {
                if (!isset($input[$field]) || $input[$field] === '') {
                    throw new Exception("El campo '$field' es obligatorio");
                }
            }

            if ($input['precio_venta'] <= $input['precio_compra']) {
                throw new Exception('El precio de venta debe ser mayor al precio de compra');
            }

            $stmt = $pdo->prepare("INSERT INTO productos (nombre, categoria, stock, stock_min, precio_compra, precio_venta, fecha_vencimiento) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $input['nombre'],
                $input['categoria'],
                (int)$input['stock'],
                (int)$input['stock_min'],
                (float)$input['precio_compra'],
                (float)$input['precio_venta'],
                $input['fecha_vencimiento']
            ]);

            echo json_encode(['success' => true, 'message' => 'Producto registrado correctamente', 'id' => $pdo->lastInsertId()]);
            break;

        case 'PUT':
            if (!in_array($_SESSION['user_role'], ['encargado'])) {
                throw new Exception('No autorizado');
            }
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) throw new Exception('Datos inválidos');

            $id = $_GET['id'] ?? null;
            if (!$id) throw new Exception('ID requerido');

            $required = ['nombre', 'categoria', 'stock', 'stock_min', 'precio_compra', 'precio_venta', 'fecha_vencimiento'];
            foreach ($required as $field) {
                if (!isset($input[$field]) || $input[$field] === '') {
                    throw new Exception("El campo '$field' es obligatorio");
                }
            }

            if ($input['precio_venta'] <= $input['precio_compra']) {
                throw new Exception('El precio de venta debe ser mayor al precio de compra');
            }

            $stmt = $pdo->prepare("UPDATE productos SET nombre=?, categoria=?, stock=?, stock_min=?, precio_compra=?, precio_venta=?, fecha_vencimiento=? WHERE id=?");
            $stmt->execute([
                $input['nombre'],
                $input['categoria'],
                (int)$input['stock'],
                (int)$input['stock_min'],
                (float)$input['precio_compra'],
                (float)$input['precio_venta'],
                $input['fecha_vencimiento'],
                $id
            ]);

            echo json_encode(['success' => true, 'message' => 'Producto actualizado correctamente']);
            break;

        case 'DELETE':
            if (!in_array($_SESSION['user_role'], ['encargado'])) {
                throw new Exception('No autorizado');
            }
            $id = $_GET['id'] ?? null;
            if (!$id) throw new Exception('ID requerido');

            $stmt = $pdo->prepare("DELETE FROM productos WHERE id = ?");
            $stmt->execute([$id]);

            echo json_encode(['success' => true, 'message' => 'Producto eliminado correctamente']);
            break;

        default:
            throw new Exception('Método no permitido');
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
