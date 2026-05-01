<?php
require_once 'config/database.php';
require_once 'config/auth.php';

$navItems = [];

if ($currentUser['rol'] === 'dueño') {
    $navItems = [
        ['page' => 'resumen', 'icon' => '📊', 'label' => 'Resumen'],
        ['page' => 'vencimientos', 'icon' => '⏰', 'label' => 'Vencimientos'],
        ['page' => 'stock', 'icon' => '📦', 'label' => 'Stock'],
        ['page' => 'ganancias', 'icon' => '💰', 'label' => 'Ganancias'],
    ];
} elseif ($currentUser['rol'] === 'administrador') {
    $navItems = [
        ['page' => 'categorias', 'icon' => '📂', 'label' => 'Categorías'],
        ['page' => 'ganancias', 'icon' => '💰', 'label' => 'Ganancias'],
        ['page' => 'reportes', 'icon' => '📄', 'label' => 'Reportes'],
    ];
} elseif ($currentUser['rol'] === 'encargado') {
    $navItems = [
        ['page' => 'productos', 'icon' => '📦', 'label' => 'Productos'],
        ['page' => 'vencer', 'icon' => '📅', 'label' => 'Por Vencer'],
        ['page' => 'vencidos', 'icon' => '⚠️', 'label' => 'Vencidos'],
        ['page' => 'stock', 'icon' => '📉', 'label' => 'Stock Bajo'],
    ];
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FreshStock - <?= ucfirst($currentUser['rol']) ?></title>
    <link rel="stylesheet" href="css/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <nav class="sidebar">
        <div class="sidebar-header">
            <h1>FreshStock</h1>
            <p>Control de Inventario</p>
        </div>
        <div class="user-info">
            <span class="user-avatar"><?= strtoupper(substr($currentUser['nombre'], 0, 2)) ?></span>
            <div class="user-details">
                <span class="user-name"><?= htmlspecialchars($currentUser['nombre']) ?></span>
                <span class="user-role"><?= ucfirst($currentUser['rol']) ?></span>
            </div>
        </div>
        <ul class="nav-menu">
            <?php foreach ($navItems as $i => $item): ?>
            <li class="nav-item <?= $i === 0 ? 'active' : '' ?>" data-page="<?= $item['page'] ?>">
                <span class="nav-icon"><?= $item['icon'] ?></span>
                <span><?= $item['label'] ?></span>
            </li>
            <?php endforeach; ?>
        </ul>
        <div class="sidebar-user">
            <a href="logout.php" class="logout-btn">Cerrar Sesión</a>
        </div>
    </nav>
    <main class="main-content">

<?php if ($currentUser['rol'] === 'dueño'): ?>

<!-- DUEÑO: Resumen KPIs -->
<section id="resumen" class="page active">
    <div class="page-header">
        <div>
            <h2>Resumen General</h2>
            <p class="text-muted">Vista rápida del estado del negocio</p>
        </div>
        <span class="date-badge"><?= date('d M Y') ?></span>
    </div>
    <div class="kpi-grid">
        <div class="kpi-card kpi-total">
            <div class="kpi-icon">📦</div>
            <div class="kpi-info"><h3 id="kpi-total">0</h3><p>Total Productos</p></div>
        </div>
        <div class="kpi-card kpi-danger">
            <div class="kpi-icon">🔴</div>
            <div class="kpi-info"><h3 id="kpi-expired">0</h3><p>Vencidos</p></div>
        </div>
        <div class="kpi-card kpi-warning">
            <div class="kpi-icon">🟡</div>
            <div class="kpi-info"><h3 id="kpi-expiring">0</h3><p>Por Vencer</p></div>
        </div>
        <div class="kpi-card kpi-low">
            <div class="kpi-icon">🟠</div>
            <div class="kpi-info"><h3 id="kpi-low-stock">0</h3><p>Bajo Stock</p></div>
        </div>
        <div class="kpi-card kpi-success">
            <div class="kpi-icon">💵</div>
            <div class="kpi-info"><h3 id="kpi-inventory">$0.00</h3><p>Valor Inventario</p></div>
        </div>
        <div class="kpi-card kpi-profit">
            <div class="kpi-icon">📈</div>
            <div class="kpi-info"><h3 id="kpi-profit">$0.00</h3><p>Ganancia Estimada</p></div>
        </div>
    </div>
</section>

<!-- DUEÑO: Vencimientos -->
<section id="vencimientos" class="page">
    <div class="page-header">
        <div>
            <h2>Alertas de Vencimiento</h2>
            <p class="text-muted">Productos que requieren atención</p>
        </div>
    </div>
    <div class="stats-row">
        <div class="stat-box stat-danger"><div class="stat-number" id="vencidos-count">0</div><div class="stat-label">Vencidos</div></div>
        <div class="stat-box stat-orange"><div class="stat-number" id="vencen-7-count">0</div><div class="stat-label">Vencen en 7 días</div></div>
        <div class="stat-box stat-yellow"><div class="stat-number" id="vencen-30-count">0</div><div class="stat-label">Vencen en 30 días</div></div>
    </div>
    <div class="dashboard-sections">
        <div class="dashboard-section section-danger">
            <h3 class="section-title text-danger">🔴 Productos Vencidos</h3>
            <table class="table"><thead><tr><th>Producto</th><th>Stock</th><th>Vencimiento</th><th>Pérdida</th></tr></thead><tbody id="dueno-expired-list"></tbody></table>
        </div>
        <div class="dashboard-section section-warning">
            <h3 class="section-title text-warning">🟡 Próximos a Vencer</h3>
            <table class="table"><thead><tr><th>Producto</th><th>Stock</th><th>Vencimiento</th><th>Días</th><th>Pérdida Potencial</th></tr></thead><tbody id="dueno-expiring-list"></tbody></table>
        </div>
    </div>
</section>

<!-- DUEÑO: Stock -->
<section id="stock" class="page">
    <div class="page-header">
        <div>
            <h2>Control de Stock</h2>
            <p class="text-muted">Estado del inventario</p>
        </div>
    </div>
    <div class="dashboard-sections">
        <div class="dashboard-section section-orange">
            <h3 class="section-title text-orange">🟠 Bajo Stock</h3>
            <table class="table"><thead><tr><th>Producto</th><th>Categoría</th><th>Actual</th><th>Mínimo</th><th>Faltante</th></tr></thead><tbody id="dueno-stock-list"></tbody></table>
        </div>
        <div class="dashboard-section">
            <h3 class="section-title">📊 Inventario por Categoría</h3>
            <div id="category-bars" class="category-bars"></div>
        </div>
    </div>
</section>

<!-- DUEÑO: Ganancias -->
<section id="ganancias" class="page">
    <div class="page-header">
        <div>
            <h2>Ganancias</h2>
            <p class="text-muted">Análisis de rentabilidad</p>
        </div>
    </div>
    <div class="stats-row">
        <div class="stat-box stat-green"><div class="stat-number" id="ganancia-total">$0</div><div class="stat-label">Ganancia Total</div></div>
        <div class="stat-box stat-blue"><div class="stat-number" id="valor-total">$0</div><div class="stat-label">Valor Inventario</div></div>
        <div class="stat-box stat-green-light"><div class="stat-number" id="margen-prom">0%</div><div class="stat-label">Margen Promedio</div></div>
    </div>
    <div class="dashboard-section section-green">
        <h3 class="section-title text-green">🏆 Ranking de Rentabilidad</h3>
        <table class="table"><thead><tr><th>#</th><th>Producto</th><th>Categoría</th><th>Stock</th><th>Costo</th><th>Venta</th><th>Ganancia/Unidad</th><th>Ganancia Total</th></tr></thead><tbody id="dueno-profit-list"></tbody></table>
    </div>
</section>

<?php elseif ($currentUser['rol'] === 'administrador'): ?>

<!-- ADMIN: Categorías -->
<section id="categorias" class="page active">
    <div class="page-header">
        <div>
            <h2>Gestión de Categorías</h2>
            <p class="text-muted">Administra las categorías de productos</p>
        </div>
        <button class="btn btn-green" onclick="openCategoryModal()">+ Nueva Categoría</button>
    </div>
    <div class="stats-row">
        <div class="stat-box stat-green"><div class="stat-number" id="cat-count">0</div><div class="stat-label">Categorías</div></div>
        <div class="stat-box stat-blue"><div class="stat-number" id="prod-count">0</div><div class="stat-label">Productos</div></div>
        <div class="stat-box stat-orange"><div class="stat-number" id="cat-sin-productos">0</div><div class="stat-label">Sin Productos</div></div>
    </div>
    <div class="dashboard-section">
        <h3 class="section-title">📂 Tabla de Categorías</h3>
        <table class="table">
            <thead><tr><th>ID</th><th>Categoría</th><th>Productos</th><th>Valor</th><th>Ganancia</th><th>Por Vencer</th><th>Vencidos</th><th>Acciones</th></tr></thead>
            <tbody id="categories-table"></tbody>
        </table>
    </div>
</section>

<!-- ADMIN: Ganancias -->
<section id="ganancias" class="page">
    <div class="page-header">
        <div>
            <h2>Análisis de Ganancias</h2>
            <p class="text-muted">Revisión de rentabilidad del negocio</p>
        </div>
    </div>
    <div class="stats-row">
        <div class="stat-box stat-green"><div class="stat-number" id="admin-ganancia-total">$0</div><div class="stat-label">Ganancia Total Estimada</div></div>
        <div class="stat-box stat-blue"><div class="stat-number" id="admin-valor-total">$0</div><div class="stat-label">Valor del Inventario</div></div>
        <div class="stat-box stat-green-light"><div class="stat-number" id="admin-margen-prom">0%</div><div class="stat-label">Margen Promedio</div></div>
    </div>
    <div class="dashboard-sections">
        <div class="dashboard-section section-green">
            <h3 class="section-title text-green">🏆 Ranking de Rentabilidad</h3>
            <table class="table"><thead><tr><th>#</th><th>Producto</th><th>Categoría</th><th>Stock</th><th>Costo</th><th>Venta</th><th>Ganancia/Unidad</th><th>Ganancia Total</th></tr></thead><tbody id="admin-profit-list"></tbody></table>
        </div>
        <div class="dashboard-section">
            <h3 class="section-title">📊 Ganancia por Categoría</h3>
            <div id="admin-category-profit" class="category-bars"></div>
        </div>
    </div>
</section>

<!-- ADMIN: Reportes -->
<section id="reportes" class="page">
    <div class="page-header">
        <h2>Reportes CSV</h2>
    </div>
    <div class="reports-grid">
        <div class="report-card" onclick="downloadReport('export_all')">
            <div class="report-icon">📋</div>
            <h3>Inventario Completo</h3>
            <p>Todos los productos con estados</p>
        </div>
        <div class="report-card" onclick="downloadReport('export_expired')">
            <div class="report-icon">🔴</div>
            <h3>Productos Vencidos</h3>
            <p>Con pérdidas estimadas</p>
        </div>
        <div class="report-card" onclick="downloadReport('export_expiring')">
            <div class="report-icon">🟡</div>
            <h3>Por Vencer (30 días)</h3>
            <p>Productos próximos a vencer</p>
        </div>
        <div class="report-card" onclick="downloadReport('export_low_stock')">
            <div class="report-icon">🟠</div>
            <h3>Bajo Stock</h3>
            <p>Productos a reabastecer</p>
        </div>
        <div class="report-card" onclick="downloadReport('export_profit')">
            <div class="report-icon">💰</div>
            <h3>Ganancias</h3>
            <p>Análisis de ganancias</p>
        </div>
    </div>
</section>

<?php elseif ($currentUser['rol'] === 'encargado'): ?>

<!-- ENCARGADO: Productos (CRUD) -->
<section id="productos" class="page active">
    <div class="page-header">
        <h2>Gestión de Inventario</h2>
        <button class="btn btn-green" onclick="openModal()">+ Nuevo Producto</button>
    </div>
    <div class="filters">
        <input type="text" id="searchInput" placeholder="Buscar producto..." onkeyup="filterProducts()">
        <select id="filterCategory" onchange="filterProducts()">
            <option value="">Todas las categorías</option>
        </select>
    </div>
    <div class="table-container">
        <table class="table">
            <thead><tr><th>Nombre</th><th>Categoría</th><th>Stock</th><th>P. Compra</th><th>P. Venta</th><th>Vencimiento</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody id="productos-table"></tbody>
        </table>
    </div>
</section>

<!-- ENCARGADO: Por Vencer -->
<section id="vencer" class="page">
    <div class="page-header">
        <div>
            <h2>Productos por Vencer</h2>
            <p class="text-muted">Próximos 30 días</p>
        </div>
    </div>
    <div class="alert-summary">
        <div class="alert-card alert-danger"><div class="alert-number" id="encargado-expired-count">0</div><div class="alert-label">Vencidos</div></div>
        <div class="alert-card alert-orange"><div class="alert-number" id="encargado-7-count">0</div><div class="alert-label">Vencen en 7 días</div></div>
        <div class="alert-card alert-yellow"><div class="alert-number" id="encargado-30-count">0</div><div class="alert-label">Vencen en 30 días</div></div>
    </div>
    <div class="table-container">
        <table class="table">
            <thead><tr><th>Producto</th><th>Categoría</th><th>Stock</th><th>Vencimiento</th><th>Días</th><th>Urgencia</th><th>Acción Recomendada</th></tr></thead>
            <tbody id="vencer-table"></tbody>
        </table>
    </div>
</section>

<!-- ENCARGADO: Vencidos -->
<section id="vencidos" class="page">
    <div class="page-header">
        <h2>Productos Vencidos</h2>
    </div>
    <div class="table-container">
        <table class="table">
            <thead><tr><th>Producto</th><th>Categoría</th><th>Stock</th><th>Vencimiento</th><th>Días Vencido</th><th>Pérdida</th></tr></thead>
            <tbody id="vencidos-table"></tbody>
        </table>
    </div>
</section>

<!-- ENCARGADO: Stock Bajo -->
<section id="stock" class="page">
    <div class="page-header">
        <h2>Stock Bajo</h2>
    </div>
    <div class="table-container">
        <table class="table">
            <thead><tr><th>Producto</th><th>Categoría</th><th>Stock Actual</th><th>Stock Mínimo</th><th>Faltante</th></tr></thead>
            <tbody id="stock-bajo-table"></tbody>
        </table>
    </div>
</section>

<?php endif; ?>

    </main>

    <?php if ($currentUser['rol'] === 'encargado'): ?>
    <!-- Modal Encargado: Producto -->
    <div id="productModal" class="modal hidden">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="modalTitle">Registrar Producto</h2>
                <button class="close-btn" onclick="closeModal()">&times;</button>
            </div>
            <form id="productForm">
                <input type="hidden" id="productId">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="nombre">Nombre *</label>
                        <input type="text" id="nombre" required placeholder="Ej: Yogurt Natural 1L">
                    </div>
                    <div class="form-group">
                        <label for="categoria">Categoría *</label>
                        <select id="categoria" required>
                            <option value="">Seleccionar categoría...</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="stock">Stock *</label>
                        <input type="number" id="stock" required min="0" placeholder="0">
                    </div>
                    <div class="form-group">
                        <label for="stock_min">Stock Mínimo *</label>
                        <input type="number" id="stock_min" required min="0" placeholder="5">
                    </div>
                    <div class="form-group">
                        <label for="precio_compra">Precio Compra ($) *</label>
                        <input type="number" id="precio_compra" required min="0" step="0.01" placeholder="0.00">
                    </div>
                    <div class="form-group">
                        <label for="precio_venta">Precio Venta ($) *</label>
                        <input type="number" id="precio_venta" required min="0" step="0.01" placeholder="0.00">
                    </div>
                    <div class="form-group full-width">
                        <label for="fecha_vencimiento">Fecha Vencimiento *</label>
                        <input type="date" id="fecha_vencimiento" required>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-green">Guardar</button>
                </div>
            </form>
        </div>
    </div>
    <div id="deleteModal" class="modal hidden">
        <div class="modal-content modal-small">
            <div class="modal-header">
                <h2>Confirmar Eliminación</h2>
                <button class="close-btn" onclick="closeDeleteModal()">&times;</button>
            </div>
            <div class="modal-body">
                <p>¿Eliminar este producto?</p>
                <div class="form-actions">
                    <button class="btn btn-secondary" onclick="closeDeleteModal()">Cancelar</button>
                    <button class="btn btn-red" id="confirmDeleteBtn">Eliminar</button>
                </div>
            </div>
        </div>
    </div>
    <?php endif; ?>

    <?php if ($currentUser['rol'] === 'administrador'): ?>
    <!-- Modal Admin: Categoría -->
    <div id="categoryModal" class="modal hidden">
        <div class="modal-content modal-small">
            <div class="modal-header">
                <h2>Nueva Categoría</h2>
                <button class="close-btn" onclick="closeCategoryModal()">&times;</button>
            </div>
            <form id="categoryForm">
                <div class="form-group">
                    <label for="catName">Nombre de la categoría *</label>
                    <input type="text" id="catName" required placeholder="Ej: Refrigerados" list="catSuggestions">
                    <datalist id="catSuggestions">
                        <option value="Lácteos">
                        <option value="Carnes">
                        <option value="Bebidas">
                        <option value="Panadería">
                        <option value="Refrigerados">
                    </datalist>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeCategoryModal()">Cancelar</button>
                    <button type="submit" class="btn btn-green">Guardar</button>
                </div>
            </form>
        </div>
    </div>
    <?php endif; ?>

    <div id="toast" class="toast hidden"></div>
    <script>const userRole = '<?= $currentUser['rol'] ?>';</script>
    <script src="js/app.js"></script>
</body>
</html>
