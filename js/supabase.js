const SUPABASE_URL = 'https://isdglbwjlnhgvszlcfjq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZGdsYndqbG5oZ3ZzemxjZmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODQ3ODUsImV4cCI6MjA5MzE2MDc4NX0.K7wg15-mka3Y7-I9FM6kw51YFCz0ZdOXjj68F7Gz0-Q';

const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
};

async function sbGet(table, params = '') {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, { headers });
    if (!res.ok) throw new Error(`Error: ${res.status} ${res.statusText}`);
    return await res.json();
}

async function sbInsert(table, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Error al insertar'); }
    const result = await res.json();
    return result[0] || result;
}

async function sbUpdate(table, id, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data)
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Error al actualizar'); }
    const result = await res.json();
    return result[0] || result;
}

async function sbDelete(table, id) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method: 'DELETE', headers });
    if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Error al eliminar'); }
}

function getEstadoVencimiento(fechaVencimiento) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const venc = new Date(fechaVencimiento + 'T00:00:00');
    const thirty = new Date(today); thirty.setDate(thirty.getDate() + 30);
    if (venc < today) return 'vencido';
    if (venc <= thirty) return 'por_vencer';
    return 'ok';
}

function getEstadoStock(stock, stockMin) {
    return stock <= stockMin ? 'bajo' : 'ok';
}

function getDaysRemaining(fechaVencimiento) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.ceil((new Date(fechaVencimiento + 'T00:00:00') - today) / (1000 * 60 * 60 * 24));
}

async function fetchProducts() {
    const data = await sbGet('productos', 'order=fecha_vencimiento.asc');
    return data.map(p => ({
        ...p,
        estado_vencimiento: getEstadoVencimiento(p.fecha_vencimiento),
        estado_stock: getEstadoStock(p.stock, p.stock_min)
    }));
}

async function fetchCategories() {
    return await sbGet('categorias', 'order=nombre.asc');
}

async function createProduct(product) {
    return await sbInsert('productos', product);
}

async function updateProduct(id, product) {
    return await sbUpdate('productos', id, product);
}

async function deleteProduct(id) {
    await sbDelete('productos', id);
}

async function createCategory(nombre) {
    return await sbInsert('categorias', { nombre });
}

async function deleteCategory(id) {
    await sbDelete('categorias', id);
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

function getUser() {
    return JSON.parse(localStorage.getItem('user') || 'null');
}
