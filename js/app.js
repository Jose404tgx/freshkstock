let products = [];
let categories = [];
let currentDeleteId = null;

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => navigateTo(item.dataset.page));
});

function navigateTo(page) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (navItem) navItem.classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const section = document.getElementById(page);
    if (section) section.classList.add('active');

    if (page === 'resumen') loadDuenoResumen();
    if (page === 'vencimientos') loadDuenoVencimientos();
    if (page === 'stock' && userRole === 'dueño') loadDuenoStock();
    if (page === 'ganancias' && userRole === 'dueño') loadDuenoGanancias();
    if (page === 'productos') loadEncargadoProductos();
    if (page === 'vencer') loadEncargadoVencer();
    if (page === 'vencidos') loadEncargadoVencidos();
    if (page === 'stock' && userRole === 'encargado') loadEncargadoStock();
    if (page === 'categorias') loadAdminCategorias();
    if (page === 'ganancias' && userRole === 'administrador') loadAdminGanancias();
    if (page === 'reportes') loadReportes();
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

function getDaysRemaining(dateStr) {
    const today = new Date(); today.setHours(0,0,0,0);
    return Math.ceil((new Date(dateStr + 'T00:00:00') - today) / (1000*60*60*24));
}

async function fetchProducts() {
    const res = await fetch('api/products.php');
    const data = await res.json();
    if (data.success) {
        products = data.data;
    } else {
        showToast('Error: ' + (data.message || 'No se pudieron cargar productos'), 'error');
        products = [];
    }
}

// ==========================================
// DUEÑO
// ==========================================
async function loadDuenoResumen() {
    const [kpiRes, prodRes] = await Promise.all([fetch('api/products.php?action=get_kpis'), fetch('api/products.php')]);
    const kpi = (await kpiRes.json()).data;
    const prodData = await prodRes.json();
    document.getElementById('kpi-total').textContent = kpi.total_productos;
    document.getElementById('kpi-expired').textContent = kpi.vencidos;
    document.getElementById('kpi-expiring').textContent = kpi.por_vencer;
    document.getElementById('kpi-low-stock').textContent = kpi.bajo_stock;
    document.getElementById('kpi-inventory').textContent = '$' + kpi.valor_inventario.toLocaleString('en-US', {minimumFractionDigits: 2});
    document.getElementById('kpi-profit').textContent = '$' + kpi.ganancia_estimada.toLocaleString('en-US', {minimumFractionDigits: 2});
    if (prodData.success) products = prodData.data;
}

async function loadDuenoVencimientos() {
    await fetchProducts();
    const expired = products.filter(p => p.estado_vencimiento === 'vencido');
    const expiring = products.filter(p => p.estado_vencimiento === 'por_vencer').sort((a,b) => new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento));
    const vencen7 = products.filter(p => { const d = getDaysRemaining(p.fecha_vencimiento); return d >= 0 && d <= 7; });

    document.getElementById('vencidos-count').textContent = expired.length;
    document.getElementById('vencen-7-count').textContent = vencen7.length;
    document.getElementById('vencen-30-count').textContent = expiring.length;

    document.getElementById('dueno-expired-list').innerHTML = expired.map(p =>
        `<tr><td><strong>${p.nombre}</strong></td><td>${p.stock}</td><td>${formatDate(p.fecha_vencimiento)}</td><td><span class="badge badge-red">$${(p.precio_compra*p.stock).toFixed(2)}</span></td></tr>`
    ).join('') || '<tr><td colspan="4" style="text-align:center;color:#9ca3af;">Sin vencidos</td></tr>';

    document.getElementById('dueno-expiring-list').innerHTML = expiring.map(p => {
        const d = getDaysRemaining(p.fecha_vencimiento);
        return `<tr><td><strong>${p.nombre}</strong></td><td>${p.stock}</td><td>${formatDate(p.fecha_vencimiento)}</td><td><span class="badge ${d<=7?'badge-red':'badge-yellow'}">${d} días</span></td><td>$${(p.precio_compra*p.stock).toFixed(2)}</td></tr>`;
    }).join('') || '<tr><td colspan="5" style="text-align:center;color:#9ca3af;">Sin alertas</td></tr>';
}

async function loadDuenoStock() {
    await fetchProducts();
    const low = products.filter(p => p.estado_stock === 'bajo').sort((a,b) => a.stock - b.stock);
    document.getElementById('dueno-stock-list').innerHTML = low.map(p =>
        `<tr><td><strong>${p.nombre}</strong></td><td>${p.categoria}</td><td>${p.stock}</td><td>${p.stock_min}</td><td><span class="badge badge-orange">${p.stock_min - p.stock} uds</span></td></tr>`
    ).join('') || '<tr><td colspan="5" style="text-align:center;color:#9ca3af;">Stock OK</td></tr>';
    renderCategoryBars('category-bars');
}

async function loadDuenoGanancias() {
    const [kpiRes, prodRes] = await Promise.all([fetch('api/products.php?action=get_kpis'), fetch('api/products.php')]);
    const kpi = (await kpiRes.json()).data;
    const prodData = await prodRes.json();
    document.getElementById('ganancia-total').textContent = '$' + kpi.ganancia_estimada.toLocaleString('en-US', {minimumFractionDigits: 2});
    document.getElementById('valor-total').textContent = '$' + kpi.valor_inventario.toLocaleString('en-US', {minimumFractionDigits: 2});
    if (prodData.success) products = prodData.data;

    const byProfit = products.map(p => ({...p, ganancia_unidad: p.precio_venta - p.precio_compra, ganancia_total: (p.precio_venta - p.precio_compra)*p.stock})).sort((a,b) => b.ganancia_total - a.ganancia_total);
    const margenProm = products.length ? (products.reduce((s,p) => s + ((p.precio_venta - p.precio_compra)/p.precio_venta*100), 0) / products.length).toFixed(0) : 0;
    document.getElementById('margen-prom').textContent = margenProm + '%';

    document.getElementById('dueno-profit-list').innerHTML = byProfit.map((p,i) => {
        const rank = i < 3 ? ['🥇','🥈','🥉'][i] : (i+1);
        return `<tr><td>${rank}</td><td><strong>${p.nombre}</strong></td><td>${p.categoria}</td><td>${p.stock}</td><td>$${parseFloat(p.precio_compra).toFixed(2)}</td><td>$${parseFloat(p.precio_venta).toFixed(2)}</td><td>$${p.ganancia_unidad.toFixed(2)}</td><td><span class="badge badge-green">$${p.ganancia_total.toFixed(2)}</span></td></tr>`;
    }).join('');
}

// ==========================================
// CATEGORÍAS - Desde BD siempre
// ==========================================
async function fetchCategories() {
    const res = await fetch('api/categories.php');
    const data = await res.json();
    if (!data.success) {
        throw new Error(data.message || 'Error al cargar categorías');
    }
    categories = data.data;
    populateCategorySelects();
    return categories;
}

function populateCategorySelects() {
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

// ==========================================
// ENCARGADO - Inventario (CRUD)
// ==========================================
async function loadEncargadoProductos() {
    try {
        await Promise.all([fetchProducts(), fetchCategories()]);
        renderTablaProductos(products);
    } catch (e) {
        showToast('Error: ' + e.message, 'error');
        console.error(e);
    }
}

function renderTablaProductos(items) {
    const tbody = document.getElementById('productos-table');
    if (!tbody) return;
    tbody.innerHTML = items.map(p => {
        const badge = getStatusBadge(p.estado_vencimiento, p.estado_stock);
        return `<tr>
            <td><strong>${p.nombre}</strong></td>
            <td>${p.categoria}</td>
            <td>${p.stock}</td>
            <td>$${parseFloat(p.precio_compra).toFixed(2)}</td>
            <td>$${parseFloat(p.precio_venta).toFixed(2)}</td>
            <td>${formatDate(p.fecha_vencimiento)}</td>
            <td>${badge}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon" onclick='editProduct(${JSON.stringify(p).replace(/'/g, "&#39;")})' title="Editar">✏️</button>
                    <button class="btn-icon" onclick="confirmDelete(${p.id})" title="Eliminar">🗑️</button>
                </div>
            </td>
        </tr>`;
    }).join('') || '<tr><td colspan="8" style="text-align:center;color:#9ca3af;">No hay productos</td></tr>';
}

function getStatusBadge(v, s) {
    if (v === 'vencido') return '<span class="badge badge-red">Vencido</span>';
    if (v === 'por_vencer' && s === 'bajo') return '<span class="badge badge-orange">Por vencer + Bajo</span>';
    if (v === 'por_vencer') return '<span class="badge badge-yellow">Por vencer</span>';
    if (s === 'bajo') return '<span class="badge badge-orange">Bajo stock</span>';
    return '<span class="badge badge-green">OK</span>';
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

async function loadEncargadoVencer() {
    try {
        await Promise.all([fetchProducts(), fetchCategories()]);
        const expiring = products.filter(p => p.estado_vencimiento === 'por_vencer').sort((a,b) => new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento));
        const expired = products.filter(p => p.estado_vencimiento === 'vencido');
        const expiring7 = products.filter(p => { const d = getDaysRemaining(p.fecha_vencimiento); return d >= 0 && d <= 7; });

        document.getElementById('encargado-expired-count').textContent = expired.length;
        document.getElementById('encargado-7-count').textContent = expiring7.length;
        document.getElementById('encargado-30-count').textContent = expiring.length;

        document.getElementById('vencer-table').innerHTML = expiring.map(p => {
            const d = getDaysRemaining(p.fecha_vencimiento);
            let urgencia, accion, cls;
            if (d <= 3) { urgencia = 'Crítica'; accion = 'Oferta urgente / Donar'; cls = 'badge-red'; }
            else if (d <= 7) { urgencia = 'Alta'; accion = 'Aplicar descuento 30%'; cls = 'badge-red'; }
            else if (d <= 15) { urgencia = 'Media'; accion = 'Promocionar en vitrina'; cls = 'badge-yellow'; }
            else { urgencia = 'Baja'; accion = 'Monitorear'; cls = 'badge-green'; }
            return `<tr><td><strong>${p.nombre}</strong></td><td>${p.categoria}</td><td>${p.stock}</td><td>${formatDate(p.fecha_vencimiento)}</td><td><span class="badge ${cls}">${d} días</span></td><td><span class="badge ${cls}">${urgencia}</span></td><td>${accion}</td></tr>`;
        }).join('') || '<tr><td colspan="7" style="text-align:center;color:#9ca3af;">Sin productos por vencer</td></tr>';
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function loadEncargadoVencidos() {
    try {
        await fetchProducts();
        const expired = products.filter(p => p.estado_vencimiento === 'vencido');
        document.getElementById('vencidos-table').innerHTML = expired.map(p => {
            const d = Math.abs(getDaysRemaining(p.fecha_vencimiento));
            return `<tr><td><strong>${p.nombre}</strong></td><td>${p.categoria}</td><td>${p.stock}</td><td>${formatDate(p.fecha_vencimiento)}</td><td><span class="badge badge-red">${d} días</span></td><td><span class="badge badge-red">$${(p.precio_compra*p.stock).toFixed(2)}</span></td></tr>`;
        }).join('') || '<tr><td colspan="6" style="text-align:center;color:#9ca3af;">Sin vencidos</td></tr>';
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function loadEncargadoStock() {
    try {
        await fetchProducts();
        const low = products.filter(p => p.estado_stock === 'bajo').sort((a,b) => a.stock - b.stock);
        document.getElementById('stock-bajo-table').innerHTML = low.map(p =>
            `<tr><td><strong>${p.nombre}</strong></td><td>${p.categoria}</td><td>${p.stock}</td><td>${p.stock_min}</td><td><span class="badge badge-red">${p.stock_min - p.stock} uds</span></td></tr>`
        ).join('') || '<tr><td colspan="5" style="text-align:center;color:#9ca3af;">Stock OK</td></tr>';
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

// Modal producto
async function openModal(productId = null) {
    const modal = document.getElementById('productModal');
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';

    await fetchCategories();

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
function editProduct(product) { openModal(product.id); }
function confirmDelete(id) { currentDeleteId = id; document.getElementById('deleteModal').classList.remove('hidden'); }
function closeDeleteModal() { document.getElementById('deleteModal').classList.add('hidden'); currentDeleteId = null; }

document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
    if (!currentDeleteId) return;
    try {
        const res = await fetch(`api/products.php?id=${currentDeleteId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) { showToast(data.message, 'success'); closeDeleteModal(); loadEncargadoProductos(); }
        else showToast(data.message, 'error');
    } catch (e) { showToast('Error al eliminar', 'error'); }
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
        const url = id ? `api/products.php?id=${id}` : 'api/products.php';
        const res = await fetch(url, { method: id ? 'PUT' : 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
        const result = await res.json();
        if (result.success) { showToast(result.message, 'success'); closeModal(); loadEncargadoProductos(); }
        else showToast(result.message, 'error');
    } catch (err) { showToast('Error al guardar', 'error'); }
});

// ==========================================
// ADMIN - Categorías y Ganancias
// ==========================================
async function loadAdminCategorias() {
    try {
        const [catRes, prodRes] = await Promise.all([
            fetch('api/categories.php'),
            fetch('api/products.php')
        ]);
        const catData = await catRes.json();
        const prodData = await prodRes.json();

        if (!catData.success) {
            showToast('Error: ' + catData.message, 'error');
            return;
        }

        categories = catData.data;
        if (prodData.success) products = prodData.data;

        document.getElementById('cat-count').textContent = categories.length;
        document.getElementById('prod-count').textContent = products.length;
        const sinProd = categories.filter(c => (c.total_productos || 0) === 0).length;
        document.getElementById('cat-sin-productos').textContent = sinProd;

        document.getElementById('categories-table').innerHTML = categories.map(c =>
            `<tr>
                <td>${c.id}</td>
                <td><strong>${c.nombre}</strong></td>
                <td>${c.total_productos || 0}</td>
                <td>$${parseFloat(c.valor || 0).toFixed(2)}</td>
                <td><span class="badge badge-green">$${parseFloat(c.ganancia || 0).toFixed(2)}</span></td>
                <td>${(c.por_vencer || 0) > 0 ? `<span class="badge badge-yellow">${c.por_vencer}</span>` : '<span style="color:var(--verde)">0</span>'}</td>
                <td>${(c.vencidos || 0) > 0 ? `<span class="badge badge-red">${c.vencidos}</span>` : '<span style="color:var(--verde)">0</span>'}</td>
                <td><button class="btn-icon" onclick="deleteCategory(${c.id}, '${c.nombre}')" title="Eliminar">🗑️</button></td>
            </tr>`
        ).join('') || '<tr><td colspan="8" style="text-align:center;color:#9ca3af;">No hay categorías</td></tr>';

        populateCategorySelects();
    } catch (e) {
        showToast('Error: ' + e.message, 'error');
        console.error(e);
    }
}

async function deleteCategory(id, nombre) {
    if (!confirm(`¿Eliminar categoría "${nombre}"? Solo se puede si no tiene productos.`)) return;
    try {
        const res = await fetch(`api/categories.php?id=${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            showToast(data.message, 'success');
            loadAdminCategorias();
        } else {
            showToast(data.message, 'error');
        }
    } catch (e) { showToast('Error al eliminar', 'error'); }
}

async function loadAdminGanancias() {
    try {
        const [kpiRes, prodRes] = await Promise.all([
            fetch('api/products.php?action=get_kpis'),
            fetch('api/products.php')
        ]);
        const kpiData = await kpiRes.json();
        const prodData = await prodRes.json();

        const kpi = kpiData.data || {};
        if (prodData.success) products = prodData.data;

        const elGananciaTotal = document.getElementById('admin-ganancia-total');
        const elValorTotal = document.getElementById('admin-valor-total');
        const elMargenProm = document.getElementById('admin-margen-prom');
        const elProfitList = document.getElementById('admin-profit-list');
        const elCatProfit = document.getElementById('admin-category-profit');

        if (elGananciaTotal) elGananciaTotal.textContent = '$' + (kpi.ganancia_estimada || 0).toLocaleString('en-US', {minimumFractionDigits: 2});
        if (elValorTotal) elValorTotal.textContent = '$' + (kpi.valor_inventario || 0).toLocaleString('en-US', {minimumFractionDigits: 2});

        const byProfit = products.map(p => ({
            ...p,
            ganancia_unidad: p.precio_venta - p.precio_compra,
            ganancia_total: (p.precio_venta - p.precio_compra) * p.stock
        })).sort((a, b) => b.ganancia_total - a.ganancia_total);

        const margenProm = products.length
            ? (products.reduce((s, p) => s + ((p.precio_venta - p.precio_compra) / p.precio_venta * 100), 0) / products.length).toFixed(0)
            : 0;
        if (elMargenProm) elMargenProm.textContent = margenProm + '%';

        if (elProfitList) {
            elProfitList.innerHTML = byProfit.map((p, i) => {
                const rank = i < 3 ? ['🥇', '🥈', '🥉'][i] : (i + 1);
                return `<tr>
                    <td>${rank}</td>
                    <td><strong>${p.nombre}</strong></td>
                    <td>${p.categoria}</td>
                    <td>${p.stock}</td>
                    <td>$${parseFloat(p.precio_compra).toFixed(2)}</td>
                    <td>$${parseFloat(p.precio_venta).toFixed(2)}</td>
                    <td>$${p.ganancia_unidad.toFixed(2)}</td>
                    <td><span class="badge badge-green">$${p.ganancia_total.toFixed(2)}</span></td>
                </tr>`;
            }).join('') || '<tr><td colspan="8" style="text-align:center;color:#9ca3af;">No hay productos</td></tr>';
        }

        if (elCatProfit) {
            const catProfit = {};
            products.forEach(p => {
                if (!catProfit[p.categoria]) catProfit[p.categoria] = 0;
                catProfit[p.categoria] += (p.precio_venta - p.precio_compra) * p.stock;
            });
            const maxP = Math.max(...Object.values(catProfit), 1);
            elCatProfit.innerHTML = Object.entries(catProfit).sort((a, b) => b[1] - a[1]).map(([name, profit]) => {
                const pct = (profit / maxP * 100).toFixed(0);
                return `<div class="category-bar-item">
                    <div class="category-bar-label"><span>${name}</span><span>$${profit.toFixed(2)}</span></div>
                    <div class="category-bar-track"><div class="category-bar-fill" style="width:${pct}%"></div></div>
                </div>`;
            }).join('') || '<p style="text-align:center;color:#9ca3af;padding:1rem;">Sin datos</p>';
        }
    } catch (e) { console.error('Error cargando ganancias:', e); }
}

// Modal categoría
function openCategoryModal() { document.getElementById('categoryModal').classList.remove('hidden'); }
function closeCategoryModal() { document.getElementById('categoryModal').classList.add('hidden'); }

document.getElementById('categoryForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const catName = document.getElementById('catName').value.trim();
    if (!catName) return;
    try {
        const res = await fetch('api/categories.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: catName })
        });
        const data = await res.json();
        if (data.success) {
            showToast(data.message, 'success');
            closeCategoryModal();
            document.getElementById('catName').value = '';
            await loadAdminCategorias();
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) { showToast('Error al crear categoría', 'error'); }
});

function loadReportes() {}

function downloadReport(action) { window.location.href = `api/reports.php?action=${action}`; }

// Shared
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
    container.innerHTML = Object.entries(cats).sort((a,b) => b[1].value - a[1].value).map(([name, d]) =>
        `<div class="category-bar-item"><div class="category-bar-label"><span>${name}</span><span>${d.count} productos · $${d.value.toFixed(2)}</span></div><div class="category-bar-track"><div class="category-bar-fill" style="width:${(d.value/maxVal*100).toFixed(0)}%"></div></div></div>`
    ).join('');
}

// INIT
document.addEventListener('DOMContentLoaded', () => {
    if (userRole === 'dueño') loadDuenoResumen();
    if (userRole === 'encargado') loadEncargadoProductos();
    if (userRole === 'administrador') loadAdminCategorias();
});
