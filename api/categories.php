<?php
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

header('Content-Type: application/json');
require_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $id = $_GET['id'] ?? null;
            if ($id) {
                $stmt = $pdo->prepare("SELECT c.*, COUNT(p.id) as total_productos,
                    COALESCE(SUM(p.stock * p.precio_compra), 0) as valor,
                    COALESCE(SUM((p.precio_venta - p.precio_compra) * p.stock), 0) as ganancia,
                    SUM(CASE WHEN p.fecha_vencimiento >= CURDATE() AND p.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as por_vencer,
                    SUM(CASE WHEN p.fecha_vencimiento < CURDATE() THEN 1 ELSE 0 END) as vencidos
                    FROM categorias c
                    LEFT JOIN productos p ON c.nombre = p.categoria
                    WHERE c.id = ?
                    GROUP BY c.id");
                $stmt->execute([$id]);
                $cat = $stmt->fetch();
                if (!$cat) throw new Exception('Categoría no encontrada');
                echo json_encode(['success' => true, 'data' => $cat]);
            } else {
                $stmt = $pdo->query("SELECT c.*, COUNT(p.id) as total_productos,
                    COALESCE(SUM(p.stock * p.precio_compra), 0) as valor,
                    COALESCE(SUM((p.precio_venta - p.precio_compra) * p.stock), 0) as ganancia,
                    SUM(CASE WHEN p.fecha_vencimiento >= CURDATE() AND p.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as por_vencer,
                    SUM(CASE WHEN p.fecha_vencimiento < CURDATE() THEN 1 ELSE 0 END) as vencidos
                    FROM categorias c
                    LEFT JOIN productos p ON c.nombre = p.categoria
                    GROUP BY c.id
                    ORDER BY c.nombre");
                $cats = $stmt->fetchAll();
                echo json_encode(['success' => true, 'data' => $cats]);
            }
            break;

        case 'POST':
            if ($_SESSION['user_role'] !== 'administrador') {
                throw new Exception('Solo el administrador puede crear categorías');
            }
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input || empty($input['nombre'])) throw new Exception('Nombre requerido');

            $nombre = trim($input['nombre']);
            $check = $pdo->prepare("SELECT id FROM categorias WHERE nombre = ?");
            $check->execute([$nombre]);
            if ($check->fetch()) throw new Exception("La categoría '$nombre' ya existe");

            $stmt = $pdo->prepare("INSERT INTO categorias (nombre) VALUES (?)");
            $stmt->execute([$nombre]);
            echo json_encode(['success' => true, 'message' => "Categoría '$nombre' creada", 'id' => $pdo->lastInsertId()]);
            break;

        case 'DELETE':
            if ($_SESSION['user_role'] !== 'administrador') {
                throw new Exception('Solo el administrador puede eliminar categorías');
            }
            $id = $_GET['id'] ?? null;
            if (!$id) throw new Exception('ID requerido');

            $stmt = $pdo->prepare("SELECT nombre FROM categorias WHERE id = ?");
            $stmt->execute([$id]);
            $cat = $stmt->fetch();
            if (!$cat) throw new Exception('Categoría no encontrada');

            $check = $pdo->prepare("SELECT COUNT(*) FROM productos WHERE categoria = ?");
            $check->execute([$cat['nombre']]);
            if ($check->fetchColumn() > 0) {
                throw new Exception("No se puede eliminar: hay productos en esta categoría");
            }

            $stmt = $pdo->prepare("DELETE FROM categorias WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'message' => "Categoría eliminada"]);
            break;

        default:
            throw new Exception('Método no permitido');
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
