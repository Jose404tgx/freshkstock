const user = getUser();
if (!user) window.location.href = 'login.html';
const userRole = user.rol;
const userName = user.nombre;

let products = [];
let categories = [];
let currentDeleteId = null;

const navConfig = {
    'dueño': [
        { page: 'resumen', icon: '📊', label: 'Resumen' },
        { page: 'vencimientos', icon: '⏰', label: 'Vencimientos' },
        { page: 'stock', icon: '📦', label: 'Stock' },
        { page: 'ganancias', icon: '💰', label: 'Ganancias' }
    ],
    'administrador': [
        { page: 'categorias', icon: '📂', label: 'Categorías' },
        { page: 'ganancias', icon: '💰', label: 'Ganancias' },
        { page: 'reportes', icon: '📄', label: 'Reportes' }
    ],
    'encargado': [
        { page: 'productos', icon: '📦', label: 'Productos' },
        { page: 'vencer', icon: '📅', label: 'Por Vencer' },
        { page: 'vencidos', icon: '⚠️', label: 'Vencidos' },
        { page: 'stock', icon: '📉', label: 'Stock Bajo' }
    ]
};

function initApp() {
    document.getElementById('userAvatar').textContent = userName.substring(0, 2).toUpperCase();
    document.getElementById('userName').textContent = userName;
    document.getElementById('userRole').textContent = userRole.charAt(0).toUpperCase() + userRole.slice(1);
    document.title = `FreshStock - ${userName}`;

    const nav = document.getElementById('navMenu');
    nav.innerHTML = navConfig[userRole].map((item, i) =>
        `<li class="nav-item ${i === 0 ? 'active' : ''}" data-page="${item.page}">
            <span class="nav-icon">${item.icon}</span><span>${item.label}</span>
        </li>`
    ).join('');

    nav.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => navigateTo(item.dataset.page));
    });

    navigateTo(navConfig[userRole][0].page);
}

function navigateTo(page) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (navItem) navItem.classList.add('active');

    loadPage(page);
}

async function loadPage(page) {
    const pagesDiv = document.getElementById('pages');

    if (page === 'resumen') await renderResumen(pagesDiv);
    else if (page === 'vencimientos') await renderVencimientos(pagesDiv);
    else if (page === 'stock' && userRole === 'dueño') await renderDuenoStock(pagesDiv);
    else if (page === 'ganancias' && userRole === 'dueño') await renderDuenoGanancias(pagesDiv);
    else if (page === 'productos') await renderProductosPage(pagesDiv);
    else if (page === 'vencer') await renderVencerPage(pagesDiv);
    else if (page === 'vencidos') await renderVencidosPage(pagesDiv);
    else if (page === 'stock' && userRole === 'encargado') await renderEncargadoStockPage(pagesDiv);
    else if (page === 'categorias') await renderCategoriasPage(pagesDiv);
    else if (page === 'ganancias' && userRole === 'administrador') await renderAdminGanancias(pagesDiv);
    else if (page === 'reportes') renderReportesPage(pagesDiv);
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function formatDate(dateStr) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getStatusBadge(v, s) {
    if (v === 'vencido') return '<span class="badge badge-red">Vencido</span>';
    if (v === 'por_vencer' && s === 'bajo') return '<span class="badge badge-orange">Por vencer + Bajo</span>';
    if (v === 'por_vencer') return '<span class="badge badge-yellow">Por vencer</span>';
    if (s === 'bajo') return '<span class="badge badge-orange">Bajo stock</span>';
    return '<span class="badge badge-green">OK</span>';
}

// ==========================================
// DUEÑO
// ==========================================
async function renderResumen(container) {
    try {
        products = await fetchProducts();
        const kpi = computeKPIs();
        container.innerHTML = `
            <section id="resumen" class="page active">
                <div class="page-header"><div><h2>Resumen General</h2><p class="text-muted">Vista rápida del estado del negocio</p></div><span class="date-badge">${new Date().toLocaleDateString('es-ES')}</span></div>
                <div class="kpi-grid">
                    <div class="kpi-card kpi-total"><div class="kpi-icon">📦</div><div class="kpi-info"><h3>${kpi.total}</h3><p>Total Productos</p></div></div>
                    <div class="kpi-card kpi-danger"><div class="kpi-icon">🔴</div><div class="kpi-info"><h3>${kpi.vencidos}</h3><p>Vencidos</p></div></div>
                    <div class="kpi-card kpi-warning"><div class="kpi-icon">🟡</div><div class="kpi-info"><h3>${kpi.porVencer}</h3><p>Por Vencer</p></div></div>
                    <div class="kpi-card kpi-low"><div class="kpi-icon">🟠</div><div class="kpi-info"><h3>${kpi.bajoStock}</h3><p>Bajo Stock</p></div></div>
                    <div class="kpi-card kpi-success"><div class="kpi-icon">💵</div><div class="kpi-info"><h3>$${kpi.valorInventario.toLocaleString('en-US', {minimumFractionDigits: 2})}</h3><p>Valor Inventario</p></div></div>
                    <div class="kpi-card kpi-profit"><div class="kpi-icon">📈</div><div class="kpi-info"><h3>$${kpi.gananciaEstimada.toLocaleString('en-US', {minimumFractionDigits: 2})}</h3><p>Ganancia Estimada</p></div></div>
                </div>
            </section>`;
    } catch (e) { container.innerHTML = `<p style="color:var(--rojo)">Error: ${e.message}</p>`; }
}

async function renderVencimientos(container) {
    try {
        products = await fetchProducts();
        const expired = products.filter(p => p.estado_vencimiento === 'vencido');
        const expiring = products.filter(p => p.estado_vencimiento === 'por_vencer').sort((a, b) => new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento));

        container.innerHTML = `
            <section id="vencimientos" class="page active">
                <div class="page-header"><div><h2>Alertas de Vencimiento</h2><p class="text-muted">Productos que requieren atención</p></div></div>
                <div class="stats-row">
                    <div class="stat-box stat-danger"><div class="stat-number">${expired.length}</div><div class="stat-label">Vencidos</div></div>
                    <div class="stat-box stat-orange"><div class="stat-number">${products.filter(p => { const d = getDaysRemaining(p.fecha_vencimiento); return d >= 0 && d <= 7; }).length}</div><div class="stat-label">Vencen en 7 días</div></div>
                    <div class="stat-box stat-yellow"><div class="stat-number">${expiring.length}</div><div class="stat-label">Vencen en 30 días</div></div>
                </div>
                <div class="dashboard-sections">
                    <div class="dashboard-section section-danger">
                        <h3 class="section-title text-danger">🔴 Productos Vencidos</h3>
                        <table class="table"><thead><tr><th>Producto</th><th>Stock</th><th>Vencimiento</th><th>Pérdida</th></tr></thead><tbody>
                            ${expired.map(p => `<tr><td><strong>${p.nombre}</strong></td><td>${p.stock}</td><td>${formatDate(p.fecha_vencimiento)}</td><td><span class="badge badge-red">$${(p.precio_compra * p.stock).toFixed(2)}</span></td></tr>`).join('') || '<tr><td colspan="4" style="text-align:center;color:#9ca3af;">Sin vencidos</td></tr>'}
                        </tbody></table>
                    </div>
                    <div class="dashboard-section section-warning">
                        <h3 class="section-title text-warning">🟡 Próximos a Vencer</h3>
                        <table class="table"><thead><tr><th>Producto</th><th>Stock</th><th>Vencimiento</th><th>Días</th><th>Pérdida Potencial</th></tr></thead><tbody>
                            ${expiring.map(p => { const d = getDaysRemaining(p.fecha_vencimiento); return `<tr><td><strong>${p.nombre}</strong></td><td>${p.stock}</td><td>${formatDate(p.fecha_vencimiento)}</td><td><span class="badge ${d <= 7 ? 'badge-red' : 'badge-yellow'}">${d} días</span></td><td>$${(p.precio_compra * p.stock).toFixed(2)}</td></tr>`; }).join('') || '<tr><td colspan="5" style="text-align:center;color:#9ca3af;">Sin alertas</td></tr>'}
                        </tbody></table>
                    </div>
                </div>
            </section>`;
    } catch (e) { container.innerHTML = `<p style="color:var(--rojo)">Error: ${e.message}</p>`; }
}

async function renderDuenoStock(container) {
    try {
        products = await fetchProducts();
        const low = products.filter(p => p.estado_stock === 'bajo').sort((a, b) => a.stock - b.stock);

        container.innerHTML = `
            <section id="stock" class="page active">
                <div class="page-header"><div><h2>Control de Stock</h2><p class="text-muted">Estado del inventario</p></div></div>
                <div class="dashboard-sections">
                    <div class="dashboard-section section-orange">
                        <h3 class="section-title text-orange">🟠 Bajo Stock</h3>
                        <table class="table"><thead><tr><th>Producto</th><th>Categoría</th><th>Actual</th><th>Mínimo</th><th>Faltante</th></tr></thead><tbody>
                            ${low.map(p => `<tr><td><strong>${p.nombre}</strong></td><td>${p.categoria}</td><td>${p.stock}</td><td>${p.stock_min}</td><td><span class="badge badge-orange">${p.stock_min - p.stock} uds</span></td></tr>`).join('') || '<tr><td colspan="5" style="text-align:center;color:#9ca3af;">Stock OK</td></tr>'}
                        </tbody></table>
                    </div>
                    <div class="dashboard-section"><h3 class="section-title">📊 Inventario por Categoría</h3><div id="category-bars" class="category-bars"></div></div>
                </div>
            </section>`;
        renderCategoryBars('category-bars');
    } catch (e) { container.innerHTML = `<p style="color:var(--rojo)">Error: ${e.message}</p>`; }
}

async function renderDuenoGanancias(container) {
    try {
        products = await fetchProducts();
        const kpi = computeKPIs();
        const byProfit = products.map(p => ({ ...p, ganancia_unidad: p.precio_venta - p.precio_compra, ganancia_total: (p.precio_venta - p.precio_compra) * p.stock })).sort((a, b) => b.ganancia_total - a.ganancia_total);
        const margenProm = products.length ? (products.reduce((s, p) => s + ((p.precio_venta - p.precio_compra) / p.precio_venta * 100), 0) / products.length).toFixed(0) : 0;

        container.innerHTML = `
            <section id="ganancias" class="page active">
                <div class="page-header"><div><h2>Ganancias</h2><p class="text-muted">Análisis de rentabilidad</p></div></div>
                <div class="stats-row">
                    <div class="stat-box stat-green"><div class="stat-number">$${kpi.gananciaEstimada.toLocaleString('en-US', {minimumFractionDigits: 2})}</div><div class="stat-label">Ganancia Total</div></div>
                    <div class="stat-box stat-blue"><div class="stat-number">$${kpi.valorInventario.toLocaleString('en-US', {minimumFractionDigits: 2})}</div><div class="stat-label">Valor Inventario</div></div>
                    <div class="stat-box stat-green-light"><div class="stat-number">${margenProm}%</div><div class="stat-label">Margen Promedio</div></div>
                </div>
                <div class="dashboard-section section-green">
                    <h3 class="section-title text-green">🏆 Ranking de Rentabilidad</h3>
                    <table class="table"><thead><tr><th>#</th><th>Producto</th><th>Categoría</th><th>Stock</th><th>Costo</th><th>Venta</th><th>Ganancia/Unidad</th><th>Ganancia Total</th></tr></thead><tbody>
                        ${byProfit.map((p, i) => { const rank = i < 3 ? ['🥇', '🥈', '🥉'][i] : (i + 1); return `<tr><td>${rank}</td><td><strong>${p.nombre}</strong></td><td>${p.categoria}</td><td>${p.stock}</td><td>$${parseFloat(p.precio_compra).toFixed(2)}</td><td>$${parseFloat(p.precio_venta).toFixed(2)}</td><td>$${p.ganancia_unidad.toFixed(2)}</td><td><span class="badge badge-green">$${p.ganancia_total.toFixed(2)}</span></td></tr>`; }).join('')}
                    </tbody></table>
                </div>
            </section>`;
    } catch (e) { container.innerHTML = `<p style="color:var(--rojo)">Error: ${e.message}</p>`; }
}

// ==========================================
// ENCARGADO
// ==========================================
async function renderProductosPage(container) {
    container.innerHTML = `
        <section id="productos" class="page active">
            <div class="page-header"><h2>Gestión de Inventario</h2><button class="btn btn-green" onclick="openModal()">+ Nuevo Producto</button></div>
            <div class="filters">
                <input type="text" id="searchInput" placeholder="Buscar producto..." onkeyup="filterProducts()">
                <select id="filterCategory" onchange="filterProducts()"><option value="">Todas las categorías</option></select>
            </div>
            <div class="table-container">
                <table class="table"><thead><tr><th>Nombre</th><th>Categoría</th><th>Stock</th><th>P. Compra</th><th>P. Venta</th><th>Vencimiento</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody id="productos-table"><tr><td colspan="8" style="text-align:center;">Cargando...</td></tr></tbody></table>
            </div>
        </section>`;

    try {
        await loadProductsAndCategories();
        renderTablaProductos(products);
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function renderVencerPage(container) {
    try {
        products = await fetchProducts();
        const expiring = products.filter(p => p.estado_vencimiento === 'por_vencer').sort((a, b) => new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento));
        const expired = products.filter(p => p.estado_vencimiento === 'vencido');
        const expiring7 = products.filter(p => { const d = getDaysRemaining(p.fecha_vencimiento); return d >= 0 && d <= 7; });

        container.innerHTML = `
            <section id="vencer" class="page active">
                <div class="page-header"><div><h2>Productos por Vencer</h2><p class="text-muted">Próximos 30 días</p></div></div>
                <div class="alert-summary">
                    <div class="alert-card alert-danger"><div class="alert-number">${expired.length}</div><div class="alert-label">Vencidos</div></div>
                    <div class="alert-card alert-orange"><div class="alert-number">${expiring7.length}</div><div class="alert-label">Vencen en 7 días</div></div>
                    <div class="alert-card alert-yellow"><div class="alert-number">${expiring.length}</div><div class="alert-label">Vencen en 30 días</div></div>
                </div>
                <div class="table-container">
                    <table class="table"><thead><tr><th>Producto</th><th>Categoría</th><th>Stock</th><th>Vencimiento</th><th>Días</th><th>Urgencia</th><th>Acción Recomendada</th></tr></thead><tbody>
                        ${expiring.map(p => {
                            const d = getDaysRemaining(p.fecha_vencimiento);
                            let urgencia, accion, cls;
                            if (d <= 3) { urgencia = 'Crítica'; accion = 'Oferta urgente / Donar'; cls = 'badge-red'; }
                            else if (d <= 7) { urgencia = 'Alta'; accion = 'Aplicar descuento 30%'; cls = 'badge-red'; }
                            else if (d <= 15) { urgencia = 'Media'; accion = 'Promocionar en vitrina'; cls = 'badge-yellow'; }
                            else { urgencia = 'Baja'; accion = 'Monitorear'; cls = 'badge-green'; }
                            return `<tr><td><strong>${p.nombre}</strong></td><td>${p.categoria}</td><td>${p.stock}</td><td>${formatDate(p.fecha_vencimiento)}</td><td><span class="badge ${cls}">${d} días</span></td><td><span class="badge ${cls}">${urgencia}</span></td><td>${accion}</td></tr>`;
                        }).join('') || '<tr><td colspan="7" style="text-align:center;color:#9ca3af;">Sin productos por vencer</td></tr>'}
                    </tbody></table>
                </div>
            </section>`;
    } catch (e) { container.innerHTML = `<p style="color:var(--rojo)">Error: ${e.message}</p>`; }
}

async function renderVencidosPage(container) {
    try {
        products = await fetchProducts();
        const expired = products.filter(p => p.estado_vencimiento === 'vencido');

        container.innerHTML = `
            <section id="vencidos" class="page active">
                <div class="page-header"><h2>Productos Vencidos</h2></div>
                <div class="table-container">
                    <table class="table"><thead><tr><th>Producto</th><th>Categoría</th><th>Stock</th><th>Vencimiento</th><th>Días Vencido</th><th>Pérdida</th></tr></thead><tbody>
                        ${expired.map(p => { const d = Math.abs(getDaysRemaining(p.fecha_vencimiento)); return `<tr><td><strong>${p.nombre}</strong></td><td>${p.categoria}</td><td>${p.stock}</td><td>${formatDate(p.fecha_vencimiento)}</td><td><span class="badge badge-red">${d} días</span></td><td><span class="badge badge-red">$${(p.precio_compra * p.stock).toFixed(2)}</span></td></tr>`; }).join('') || '<tr><td colspan="6" style="text-align:center;color:#9ca3af;">Sin vencidos</td></tr>'}
                    </tbody></table>
                </div>
            </section>`;
    } catch (e) { container.innerHTML = `<p style="color:var(--rojo)">Error: ${e.message}</p>`; }
}

async function renderEncargadoStockPage(container) {
    try {
        products = await fetchProducts();
        const low = products.filter(p => p.estado_stock === 'bajo').sort((a, b) => a.stock - b.stock);

        container.innerHTML = `
            <section id="stock" class="page active">
                <div class="page-header"><h2>Stock Bajo</h2></div>
                <div class="table-container">
                    <table class="table"><thead><tr><th>Producto</th><th>Categoría</th><th>Stock Actual</th><th>Stock Mínimo</th><th>Faltante</th></tr></thead><tbody>
                        ${low.map(p => `<tr><td><strong>${p.nombre}</strong></td><td>${p.categoria}</td><td>${p.stock}</td><td>${p.stock_min}</td><td><span class="badge badge-red">${p.stock_min - p.stock} uds</span></td></tr>`).join('') || '<tr><td colspan="5" style="text-align:center;color:#9ca3af;">Stock OK</td></tr>'}
                    </tbody></table>
                </div>
            </section>`;
    } catch (e) { container.innerHTML = `<p style="color:var(--rojo)">Error: ${e.message}</p>`; }
}

// ==========================================
// ADMIN
// ==========================================
async function renderCategoriasPage(container) {
    container.innerHTML = `
        <section id="categorias" class="page active">
            <div class="page-header"><div><h2>Gestión de Categorías</h2><p class="text-muted">Administra las categorías de productos</p></div><button class="btn btn-green" onclick="openCategoryModal()">+ Nueva Categoría</button></div>
            <div class="stats-row">
                <div class="stat-box stat-green"><div class="stat-number" id="cat-count">0</div><div class="stat-label">Categorías</div></div>
                <div class="stat-box stat-blue"><div class="stat-number" id="prod-count">0</div><div class="stat-label">Productos</div></div>
                <div class="stat-box stat-orange"><div class="stat-number" id="cat-sin-productos">0</div><div class="stat-label">Sin Productos</div></div>
            </div>
            <div class="dashboard-section">
                <h3 class="section-title">📂 Tabla de Categorías</h3>
                <table class="table"><thead><tr><th>ID</th><th>Categoría</th><th>Productos</th><th>Valor</th><th>Ganancia</th><th>Por Vencer</th><th>Vencidos</th><th>Acciones</th></tr></thead><tbody id="categories-table"></tbody></table>
            </div>
        </section>`;

    try { await loadAdminCategorias(); } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function renderAdminGanancias(container) {
    try {
        products = await fetchProducts();
        const kpi = computeKPIs();
        const byProfit = products.map(p => ({ ...p, ganancia_unidad: p.precio_venta - p.precio_compra, ganancia_total: (p.precio_venta - p.precio_compra) * p.stock })).sort((a, b) => b.ganancia_total - a.ganancia_total);
        const margenProm = products.length ? (products.reduce((s, p) => s + ((p.precio_venta - p.precio_compra) / p.precio_venta * 100), 0) / products.length).toFixed(0) : 0;

        const catProfit = {};
        products.forEach(p => { catProfit[p.categoria] = (catProfit[p.categoria] || 0) + (p.precio_venta - p.precio_compra) * p.stock; });

        container.innerHTML = `
            <section id="ganancias" class="page active">
                <div class="page-header"><div><h2>Análisis de Ganancias</h2><p class="text-muted">Revisión de rentabilidad del negocio</p></div></div>
                <div class="stats-row">
                    <div class="stat-box stat-green"><div class="stat-number">$${kpi.gananciaEstimada.toLocaleString('en-US', {minimumFractionDigits: 2})}</div><div class="stat-label">Ganancia Total Estimada</div></div>
                    <div class="stat-box stat-blue"><div class="stat-number">$${kpi.valorInventario.toLocaleString('en-US', {minimumFractionDigits: 2})}</div><div class="stat-label">Valor del Inventario</div></div>
                    <div class="stat-box stat-green-light"><div class="stat-number">${margenProm}%</div><div class="stat-label">Margen Promedio</div></div>
                </div>
                <div class="dashboard-sections">
                    <div class="dashboard-section section-green">
                        <h3 class="section-title text-green">🏆 Ranking de Rentabilidad</h3>
                        <table class="table"><thead><tr><th>#</th><th>Producto</th><th>Categoría</th><th>Stock</th><th>Costo</th><th>Venta</th><th>Ganancia/Unidad</th><th>Ganancia Total</th></tr></thead><tbody>
                            ${byProfit.map((p, i) => { const rank = i < 3 ? ['🥇', '🥈', '🥉'][i] : (i + 1); return `<tr><td>${rank}</td><td><strong>${p.nombre}</strong></td><td>${p.categoria}</td><td>${p.stock}</td><td>$${parseFloat(p.precio_compra).toFixed(2)}</td><td>$${parseFloat(p.precio_venta).toFixed(2)}</td><td>$${p.ganancia_unidad.toFixed(2)}</td><td><span class="badge badge-green">$${p.ganancia_total.toFixed(2)}</span></td></tr>`; }).join('') || '<tr><td colspan="8" style="text-align:center;color:#9ca3af;">Sin datos</td></tr>'}
                        </tbody></table>
                    </div>
                    <div class="dashboard-section"><h3 class="section-title">📊 Ganancia por Categoría</h3><div id="admin-category-profit" class="category-bars"></div></div>
                </div>
            </section>`;

        const maxP = Math.max(...Object.values(catProfit), 1);
        document.getElementById('admin-category-profit').innerHTML = Object.entries(catProfit).sort((a, b) => b[1] - a[1]).map(([name, profit]) => {
            const pct = (profit / maxP * 100).toFixed(0);
            return `<div class="category-bar-item"><div class="category-bar-label"><span>${name}</span><span>$${profit.toFixed(2)}</span></div><div class="category-bar-track"><div class="category-bar-fill" style="width:${pct}%"></div></div></div>`;
        }).join('') || '<p style="text-align:center;color:#9ca3af;padding:1rem;">Sin datos</p>';
    } catch (e) { container.innerHTML = `<p style="color:var(--rojo)">Error: ${e.message}</p>`; }
}

function renderReportesPage(container) {
    container.innerHTML = `
        <section id="reportes" class="page active">
            <div class="page-header"><h2>Reportes CSV</h2></div>
            <div class="reports-grid">
                <div class="report-card" onclick="downloadCSV('all')"><div class="report-icon">📋</div><h3>Inventario Completo</h3><p>Todos los productos con estados</p></div>
                <div class="report-card" onclick="downloadCSV('expired')"><div class="report-icon">🔴</div><h3>Productos Vencidos</h3><p>Con pérdidas estimadas</p></div>
                <div class="report-card" onclick="downloadCSV('expiring')"><div class="report-icon">🟡</div><h3>Por Vencer (30 días)</h3><p>Productos próximos a vencer</p></div>
                <div class="report-card" onclick="downloadCSV('low_stock')"><div class="report-icon">🟠</div><h3>Bajo Stock</h3><p>Productos a reabastecer</p></div>
                <div class="report-card" onclick="downloadCSV('profit')"><div class="report-icon">💰</div><h3>Ganancias</h3><p>Análisis de ganancias</p></div>
            </div>
        </section>`;
}

// ==========================================
// DATA LOADERS
// ==========================================
async function loadProductsAndCategories() {
    const [prods, cats] = await Promise.all([fetchProducts(), fetchCategories()]);
    products = prods;
    categories = cats;
    populateCategorySelects();
}

async function loadAdminCategorias() {
    const [cats, prods] = await Promise.all([fetchCategories(), fetchProducts()]);
    categories = cats;
    products = prods;

    document.getElementById('cat-count').textContent = categories.length;
    document.getElementById('prod-count').textContent = products.length;
    const sinProd = categories.filter(c => !products.some(p => p.categoria === c.nombre)).length;
    document.getElementById('cat-sin-productos').textContent = sinProd;

    document.getElementById('categories-table').innerHTML = categories.map(c => {
        const catProducts = products.filter(p => p.categoria === c.nombre);
        const valor = catProducts.reduce((s, p) => s + (p.stock * p.precio_compra), 0);
        const ganancia = catProducts.reduce((s, p) => s + ((p.precio_venta - p.precio_compra) * p.stock), 0);
        const porVencer = catProducts.filter(p => p.estado_vencimiento === 'por_vencer').length;
        const vencidos = catProducts.filter(p => p.estado_vencimiento === 'vencido').length;
        return `<tr>
            <td>${c.id}</td><td><strong>${c.nombre}</strong></td><td>${catProducts.length}</td>
            <td>$${valor.toFixed(2)}</td><td><span class="badge badge-green">$${ganancia.toFixed(2)}</span></td>
            <td>${porVencer > 0 ? `<span class="badge badge-yellow">${porVencer}</span>` : '0'}</td>
            <td>${vencidos > 0 ? `<span class="badge badge-red">${vencidos}</span>` : '0'}</td>
            <td><button class="btn-icon" onclick="confirmDeleteCategory(${c.id}, '${c.nombre}')" title="Eliminar">🗑️</button></td>
        </tr>`;
    }).join('') || '<tr><td colspan="8" style="text-align:center;color:#9ca3af;">No hay categorías</td></tr>';

    populateCategorySelects();
}

function populateCategorySelects() {
    if (!categories.length) return;

    const prodSelect = document.getElementById('categoria');
    if (prodSelect) {
        const currentVal = prodSelect.value;
        prodSelect.innerHTML = '<option value="">Seleccionar categoría...</option>';
        categories.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.nombre;
            opt.textContent = c.nombre;
            prodSelect.appendChild(opt);
        });
        if (currentVal && [...prodSelect.options].some(o => o.value === currentVal)) {
            prodSelect.value = currentVal;
        }
    }

    const filterSelect = document.getElementById('filterCategory');
    if (filterSelect) {
        const currentFilter = filterSelect.value;
        filterSelect.innerHTML = '<option value="">Todas las categorías</option>';
        categories.forEach(c => {
            if (c.nombre) {
                const opt = document.createElement('option');
                opt.value = c.nombre;
                opt.textContent = c.nombre;
                filterSelect.appendChild(opt);
            }
        });
        if (currentFilter && [...filterSelect.options].some(o => o.value === currentFilter)) {
            filterSelect.value = currentFilter;
        }
    }
}

function renderTablaProductos(items) {
    const tbody = document.getElementById('productos-table');
    if (!tbody) return;
    tbody.innerHTML = items.map(p => {
        const badge = getStatusBadge(p.estado_vencimiento, p.estado_stock);
        return `<tr>
            <td><strong>${p.nombre}</strong></td><td>${p.categoria}</td><td>${p.stock}</td>
            <td>$${parseFloat(p.precio_compra).toFixed(2)}</td><td>$${parseFloat(p.precio_venta).toFixed(2)}</td>
            <td>${formatDate(p.fecha_vencimiento)}</td><td>${badge}</td>
            <td><div class="action-btns">
                <button class="btn-icon" onclick="editProduct(${p.id})" title="Editar">✏️</button>
                <button class="btn-icon" onclick="confirmDelete(${p.id})" title="Eliminar">🗑️</button>
            </div></td>
        </tr>`;
    }).join('') || '<tr><td colspan="8" style="text-align:center;color:#9ca3af;">No hay productos</td></tr>';
}

function filterProducts() {
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const category = document.getElementById('filterCategory')?.value || '';
    const filtered = products.filter(p => {
        const matchSearch = p.nombre.toLowerCase().includes(search) || p.categoria.toLowerCase().includes(search);
        const matchCat = !category || p.categoria === category;
        return matchSearch && matchCat;
    });
    renderTablaProductos(filtered);
}

// ==========================================
// MODALS & FORMS
// ==========================================
async function openModal(productId = null) {
    const modal = document.getElementById('productModal');
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';

    await loadProductsAndCategories();

    if (productId) {
        document.getElementById('modalTitle').textContent = 'Editar Producto';
        const p = products.find(x => x.id === productId);
        if (p) {
            document.getElementById('nombre').value = p.nombre;
            document.getElementById('categoria').value = p.categoria;
            document.getElementById('stock').value = p.stock;
            document.getElementById('stock_min').value = p.stock_min;
            document.getElementById('precio_compra').value = p.precio_compra;
            document.getElementById('precio_venta').value = p.precio_venta;
            document.getElementById('fecha_vencimiento').value = p.fecha_vencimiento;
        }
    } else {
        document.getElementById('modalTitle').textContent = 'Registrar Producto';
    }
    modal.classList.remove('hidden');
}

function closeModal() { document.getElementById('productModal').classList.add('hidden'); }
function editProduct(id) { openModal(id); }

function confirmDelete(id) { currentDeleteId = id; document.getElementById('deleteModal').classList.remove('hidden'); }
function closeDeleteModal() { document.getElementById('deleteModal').classList.add('hidden'); currentDeleteId = null; }

document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
    if (!currentDeleteId) return;
    try {
        await deleteProduct(currentDeleteId);
        showToast('Producto eliminado', 'success');
        closeDeleteModal();
        products = await fetchProducts();
        renderTablaProductos(products);
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
});

document.getElementById('productForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('productId').value;
    const data = {
        nombre: document.getElementById('nombre').value.trim(),
        categoria: document.getElementById('categoria').value,
        stock: parseInt(document.getElementById('stock').value),
        stock_min: parseInt(document.getElementById('stock_min').value),
        precio_compra: parseFloat(document.getElementById('precio_compra').value),
        precio_venta: parseFloat(document.getElementById('precio_venta').value),
        fecha_vencimiento: document.getElementById('fecha_vencimiento').value
    };
    if (data.precio_venta <= data.precio_compra) { showToast('El precio de venta debe ser mayor', 'error'); return; }
    try {
        if (id) await updateProduct(id, data);
        else await createProduct(data);
        showToast(id ? 'Producto actualizado' : 'Producto registrado', 'success');
        closeModal();
        await loadProductsAndCategories();
        renderTablaProductos(products);
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
});

function openCategoryModal() { document.getElementById('categoryModal').classList.remove('hidden'); }
function closeCategoryModal() { document.getElementById('categoryModal').classList.add('hidden'); }

document.getElementById('categoryForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const catName = document.getElementById('catName').value.trim();
    if (!catName) return;
    try {
        await createCategory(catName);
        showToast('Categoría creada', 'success');
        closeCategoryModal();
        document.getElementById('catName').value = '';
        await loadAdminCategorias();
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
});

function confirmDeleteCategory(id, nombre) {
    if (!confirm(`¿Eliminar categoría "${nombre}"? Solo se puede si no tiene productos.`)) return;
    const hasProducts = products.some(p => p.categoria === nombre);
    if (hasProducts) { showToast('No se puede eliminar: hay productos en esta categoría', 'error'); return; }
    deleteCategory(id).then(async () => {
        showToast('Categoría eliminada', 'success');
        await loadAdminCategorias();
    }).catch(e => showToast('Error: ' + e.message, 'error'));
}

// ==========================================
// CSV DOWNLOAD
// ==========================================
function downloadCSV(type) {
    let headers, rows;
    if (type === 'all') {
        headers = ['ID', 'Nombre', 'Categoría', 'Stock', 'Stock Mín', 'P. Compra', 'P. Venta', 'Vencimiento', 'Estado'];
        rows = products.map(p => [p.id, p.nombre, p.categoria, p.stock, p.stock_min, p.precio_compra, p.precio_venta, p.fecha_vencimiento, p.estado_vencimiento]);
    } else if (type === 'expired') {
        headers = ['ID', 'Nombre', 'Categoría', 'Stock', 'Pérdida'];
        rows = products.filter(p => p.estado_vencimiento === 'vencido').map(p => [p.id, p.nombre, p.categoria, p.stock, (p.precio_compra * p.stock).toFixed(2)]);
    } else if (type === 'expiring') {
        headers = ['ID', 'Nombre', 'Categoría', 'Stock', 'Vencimiento', 'Días'];
        rows = products.filter(p => p.estado_vencimiento === 'por_vencer').map(p => [p.id, p.nombre, p.categoria, p.stock, p.fecha_vencimiento, getDaysRemaining(p.fecha_vencimiento)]);
    } else if (type === 'low_stock') {
        headers = ['ID', 'Nombre', 'Categoría', 'Stock', 'Mínimo', 'Faltante'];
        rows = products.filter(p => p.estado_stock === 'bajo').map(p => [p.id, p.nombre, p.categoria, p.stock, p.stock_min, p.stock_min - p.stock]);
    } else if (type === 'profit') {
        headers = ['ID', 'Nombre', 'Categoría', 'Stock', 'P. Compra', 'P. Venta', 'Gan/Und', 'Ganancia Total'];
        rows = products.map(p => [p.id, p.nombre, p.categoria, p.stock, p.precio_compra, p.precio_venta, (p.precio_venta - p.precio_compra).toFixed(2), ((p.precio_venta - p.precio_compra) * p.stock).toFixed(2)]);
    }
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `freshstock_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
}

// ==========================================
// HELPERS
// ==========================================
function computeKPIs() {
    return {
        total: products.length,
        bajoStock: products.filter(p => p.estado_stock === 'bajo').length,
        vencidos: products.filter(p => p.estado_vencimiento === 'vencido').length,
        porVencer: products.filter(p => p.estado_vencimiento === 'por_vencer').length,
        valorInventario: products.reduce((s, p) => s + (p.stock * p.precio_compra), 0),
        gananciaEstimada: products.reduce((s, p) => s + ((p.precio_venta - p.precio_compra) * p.stock), 0)
    };
}

function renderCategoryBars(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const cats = {};
    products.forEach(p => {
        if (!cats[p.categoria]) cats[p.categoria] = { count: 0, value: 0 };
        cats[p.categoria].count++;
        cats[p.categoria].value += p.stock * p.precio_compra;
    });
    const maxVal = Math.max(...Object.values(cats).map(c => c.value), 1);
    container.innerHTML = Object.entries(cats).sort((a, b) => b[1].value - a[1].value).map(([name, d]) =>
        `<div class="category-bar-item"><div class="category-bar-label"><span>${name}</span><span>${d.count} productos · $${d.value.toFixed(2)}</span></div><div class="category-bar-track"><div class="category-bar-fill" style="width:${(d.value / maxVal * 100).toFixed(0)}%"></div></div></div>`
    ).join('');
}

document.addEventListener('DOMContentLoaded', initApp);
